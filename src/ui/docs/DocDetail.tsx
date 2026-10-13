import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { repo } from '../../db/repo'
import { formatDateBR } from '../../domain/dates'
import { duplicateDoc, makeNewVersion } from '../../domain/duplicate'
import { valorPorExtenso } from '../../domain/extenso'
import { KIND_LABEL, METHOD_LABEL, QUOTE_STATUS_LABEL, TYPE_LABEL, statusLabel } from '../../domain/labels'
import { formatBRL } from '../../domain/money'
import { balanceCents } from '../../domain/receipt'
import { lineTotal, type LineItem } from '../../domain/totals'
import type { Doc, QuoteDoc, QuoteStatus, ReceiptDoc, Settings } from '../../domain/types'
import { downloadBlob, pdfFileName, previewBlob, printBlob, shareFile, toFile } from '../../share/share'
import { Icon } from '../Icon'
import { useUi } from '../UiProvider'
import { errMsg, useLoad } from '../util'
import { shownStatus } from './DocRow'

const CHANGEABLE: QuoteStatus[] = ['sent', 'awaiting', 'approved', 'rejected']

function Items({ title, items }: { title: string; items: LineItem[] }) {
  if (!items.length) return null
  return (
    <div className="card">
      <h3>{title}</h3>
      {items.map((i) => (
        <div className="list-item" key={i.id}>
          <span>{i.description}<br /><span className="muted">{i.qty} × {formatBRL(i.unitCents)}{i.discountCents ? ` − ${formatBRL(i.discountCents)}` : ''}{i.costCents != null ? ` · custo ${formatBRL(i.costCents)} (interno)` : ''}</span></span>
          <b>{formatBRL(lineTotal(i))}</b>
        </div>
      ))}
    </div>
  )
}

export function DocDetail() {
  const { id = '' } = useParams()
  const ui = useUi()
  const nav = useNavigate()
  const { data, loading, reload } = useLoad(async () => ({ doc: await repo.getDoc(id), settings: await repo.getSettings(), all: await repo.listDocs() }), [id])
  const doc = data?.doc
  const settings = data?.settings
  const [pdf, setPdf] = useState<{ blob: Blob; name: string } | null>(null)
  const [pdfErr, setPdfErr] = useState('')
  const [fallback, setFallback] = useState(false)

  // O PDF é gerado antes do toque: o iOS só abre a folha de compartilhamento se share() rodar direto do gesto.
  useEffect(() => {
    if (!doc || !settings) return
    let alive = true
    setPdf(null)
    setPdfErr('')
    import('../../pdf')
      .then((m) => (doc.type === 'receipt' ? m.buildReceiptPdf(doc, settings as Settings) : m.buildQuotePdf(doc, settings as Settings)))
      .then((blob) => alive && setPdf({ blob, name: pdfFileName(doc.number, doc.client.name) }))
      .catch((e) => alive && setPdfErr(errMsg(e)))
    return () => { alive = false }
  }, [doc, settings])

  if (loading) return <div className="page muted">Carregando…</div>
  if (!doc || !settings) return <div className="page stack"><h1>Documento não encontrado</h1><Link className="btn" to="/">Voltar ao início</Link></div>

  const d: Doc = doc
  const status = shownStatus(d)
  const related = data!.all.filter((x) => x.id !== d.id && (x.id === d.parentId || x.parentId === d.id))

  async function persist(next: Doc, event: string, toast?: string) {
    try {
      await repo.saveDoc({ ...next, history: [...next.history, { at: new Date().toISOString(), event }] } as Doc)
      if (toast) ui.ok(toast)
      reload()
    } catch (e) {
      ui.err(`Não foi possível salvar: ${errMsg(e)}`)
    }
  }

  async function share() {
    if (!pdf) return
    try {
      const r = await shareFile(toFile(pdf.blob, pdf.name), `${TYPE_LABEL[d.type]} ${d.number}`)
      if (r === 'unsupported') {
        setFallback(true)
        ui.err('Este navegador não compartilha arquivos direto. Use as opções abaixo.')
      } else if (r === 'shared') ui.ok('PDF compartilhado')
    } catch (e) {
      setFallback(true)
      ui.err(`Não foi possível compartilhar: ${errMsg(e)}`)
    }
  }

  async function changeStatus(s: QuoteStatus) {
    const q = d as QuoteDoc
    await persist({ ...q, status: s }, `Situação alterada para ${QUOTE_STATUS_LABEL[s].toLowerCase()}`, 'Situação atualizada')
  }

  async function cancel() {
    if (!(await ui.confirm(`Cancelar ${d.number}? O registro continua no histórico.`, { danger: true, confirmLabel: 'Cancelar documento' }))) return
    await persist({ ...d, status: 'cancelled' } as Doc, 'Cancelado', 'Documento cancelado')
  }

  async function remove() {
    if (!(await ui.confirm(`Excluir o rascunho ${d.number}? Não dá para desfazer.`, { danger: true, confirmLabel: 'Excluir' }))) return
    try {
      await repo.deleteDoc(d.id)
      ui.ok('Rascunho excluído')
      nav('/', { replace: true })
    } catch (e) {
      ui.err(errMsg(e))
    }
  }

  async function copy(kind: 'version' | 'copy') {
    const a = await repo.allocateNumber(d.type)
    const now = new Date().toISOString()
    const next = kind === 'version' && d.type !== 'receipt' ? makeNewVersion(d, a, now) : duplicateDoc(d, a, now)
    await repo.saveDoc(next)
    ui.ok(`${next.number} criado como rascunho`)
    nav(`/edit/${next.id}`)
  }

  async function issue() {
    if (!(await ui.confirm('Depois de emitido, o recibo não pode mais ser editado. Emitir agora?', { confirmLabel: 'Emitir recibo' }))) return
    await persist({ ...d, status: 'issued' } as Doc, 'Emitido', 'Recibo emitido')
  }

  async function replace() {
    if (!(await ui.confirm(`Substituir ${d.number}? Será criado um novo recibo em rascunho e este será marcado como cancelado.`, { confirmLabel: 'Substituir' }))) return
    const a = await repo.allocateNumber('receipt')
    const now = new Date().toISOString()
    const next = duplicateDoc(d as ReceiptDoc, a, now)
    next.history = [{ at: now, event: `Substitui ${d.number}` }]
    await repo.saveDoc(next)
    await repo.saveDoc({ ...d, status: 'cancelled', history: [...d.history, { at: now, event: `Substituído por ${next.number}` }] } as Doc)
    ui.ok(`${next.number} criado`)
    nav(`/edit/${next.id}`)
  }

  const isReceipt = d.type === 'receipt'
  const q = isReceipt ? undefined : (d as QuoteDoc)
  const r = isReceipt ? (d as ReceiptDoc) : undefined
  const bal = r ? balanceCents(r) : null

  return (
    <div className="page">
      <div className="page-head">
        <button className="btn btn-sm" style={{ flex: 'none' }} onClick={() => nav(-1)} aria-label="Voltar"><Icon name="back" /> Voltar</button>
        <span className={`badge ${status}`}>{statusLabel(d.type, status)}</span>
      </div>
      <h1>{d.number}{d.version > 1 ? ` · v${d.version}` : ''}</h1>
      <p className="muted" style={{ marginTop: -4 }}>{TYPE_LABEL[d.type]} · {formatDateBR(d.issuedAt)}</p>

      <div className="stack" style={{ marginBottom: 12 }}>
        <button className="btn btn-primary btn-block" disabled={!pdf} onClick={share}>
          <Icon name="share" size={20} /> {pdf ? 'Compartilhar PDF' : pdfErr ? 'Erro ao gerar PDF' : 'Preparando PDF…'}
        </button>
        {pdfErr && <div className="error-text">Falha ao gerar o PDF: {pdfErr}</div>}
        <div className="grid2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <button className="btn btn-sm" disabled={!pdf} onClick={() => pdf && previewBlob(pdf.blob)}>Visualizar</button>
          <button className="btn btn-sm" disabled={!pdf} onClick={() => pdf && (downloadBlob(pdf.blob, pdf.name), ui.ok('PDF baixado'))}>Baixar</button>
          <button className="btn btn-sm" disabled={!pdf} onClick={() => pdf && printBlob(pdf.blob)}>Imprimir</button>
        </div>
        {fallback && <p className="muted">Compartilhamento direto indisponível aqui: baixe o PDF, visualize ou imprima.</p>}
      </div>

      <div className="card">
        <h3>Cliente</h3>
        <div>{d.client.name}</div>
        <div className="muted">{[d.client.cpfCnpj, d.client.phone, d.client.whatsapp, d.client.email, d.client.address].filter(Boolean).join(' · ')}</div>
      </div>

      {q && (
        <>
          {q.problem && <div className="card"><h3>Problema</h3>{q.problem}</div>}
          <Items title="Serviços e mão de obra" items={q.services} />
          <Items title="Peças e materiais" items={q.parts} />
          <div className="card">
            {q.services.length > 0 && <div className="list-item"><span>Serviços</span><b>{formatBRL(q.totals.servicesCents)}</b></div>}
            {q.parts.length > 0 && <div className="list-item"><span>Peças</span><b>{formatBRL(q.totals.partsCents)}</b></div>}
            {q.totals.discountCents > 0 && <div className="list-item"><span>Descontos</span><b>- {formatBRL(q.totals.discountCents)}</b></div>}
            <div className="list-item"><span><b>Total</b></span><b style={{ fontSize: 20 }}>{formatBRL(q.totals.totalCents)}</b></div>
            {q.validUntil && <div className="muted">Válido até {formatDateBR(q.validUntil)}</div>}
          </div>
        </>
      )}

      {r && (
        <div className="card">
          <div className="list-item"><span>Valor recebido</span><b>{formatBRL(r.receivedCents)}</b></div>
          <div className="muted">{valorPorExtenso(r.receivedCents)}</div>
          <div className="list-item"><span>Tipo</span><span>{KIND_LABEL[r.kind]}</span></div>
          <div className="list-item"><span>Forma</span><span>{METHOD_LABEL[r.method]}</span></div>
          {r.totalCents != null && <div className="list-item"><span>Total relacionado</span><span>{formatBRL(r.totalCents)}</span></div>}
          {bal !== null && <div className="list-item"><span>Saldo restante</span><b>{formatBRL(bal)}</b></div>}
          <div className="muted">Referente a: {r.reference}</div>
        </div>
      )}

      {d.notes && <div className="card"><h3>Observações</h3>{d.notes}</div>}
      {d.privateNotes && <div className="card"><h3>Observações internas</h3><span className="muted">Não aparecem no PDF.</span><br />{d.privateNotes}</div>}

      <div className="stack" style={{ margin: '12px 0' }}>
        {q && d.status !== 'draft' && d.status !== 'cancelled' && (
          <label className="field">
            <span>Situação do orçamento</span>
            <select className="input" value={CHANGEABLE.includes(q.status) ? q.status : ''} onChange={(e) => changeStatus(e.target.value as QuoteStatus)}>
              {!CHANGEABLE.includes(q.status) && <option value="">{QUOTE_STATUS_LABEL[q.status]}</option>}
              {CHANGEABLE.map((s) => <option key={s} value={s}>{QUOTE_STATUS_LABEL[s]}</option>)}
            </select>
          </label>
        )}
        {d.status === 'draft' && <Link className="btn btn-block" to={`/edit/${d.id}`}>Editar rascunho</Link>}
        {d.status === 'draft' && isReceipt && <button className="btn btn-primary btn-block" onClick={issue}>Emitir recibo</button>}
        {q && d.status !== 'draft' && <button className="btn btn-block" onClick={() => copy('version')}>Criar nova versão para alterar</button>}
        <button className="btn btn-block" onClick={() => copy('copy')}>Duplicar</button>
        {isReceipt && d.status === 'issued' && <button className="btn btn-block" onClick={replace}>Substituir recibo</button>}
        {d.status !== 'cancelled' && d.status !== 'draft' && <button className="btn btn-danger btn-block" onClick={cancel}>Cancelar documento</button>}
        {d.status === 'draft' && <button className="btn btn-danger btn-block" onClick={remove}><Icon name="trash" size={18} /> Excluir rascunho</button>}
      </div>

      {related.length > 0 && (
        <div className="card">
          <h3>Versões relacionadas</h3>
          {related.map((x) => <Link className="list-item" to={`/doc/${x.id}`} key={x.id}><span>{x.number} · v{x.version}</span><span className="muted">{statusLabel(x.type, x.status)}</span></Link>)}
        </div>
      )}
      <div className="card">
        <h3>Histórico</h3>
        {d.history.map((h, i) => <div key={i} className="muted">{h.at.slice(0, 16).replace('T', ' ')} — {h.event}</div>)}
      </div>
    </div>
  )
}
