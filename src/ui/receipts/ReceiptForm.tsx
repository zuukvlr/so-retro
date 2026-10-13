import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { repo } from '../../db/repo'
import { todayISO, uid } from '../../domain/dates'
import { valorPorExtenso } from '../../domain/extenso'
import { KIND_LABEL, METHOD_LABEL } from '../../domain/labels'
import { formatBRL } from '../../domain/money'
import { balanceCents, receiptConfirmationText } from '../../domain/receipt'
import { receiptFromQuote } from '../../domain/receiptFromQuote'
import type { ClientSnapshot, PaymentMethod, QuoteDoc, ReceiptDoc, ReceiptKind, Settings } from '../../domain/types'
import { ClientPicker } from '../clients/ClientPicker'
import { MoneyInput } from '../fields/MoneyInput'
import { SelectField, TextField } from '../fields/TextField'
import { useUi } from '../UiProvider'
import { errMsg, useLoad } from '../util'

type Fields = Omit<ReceiptDoc, 'id' | 'number' | 'seq' | 'version' | 'parentId' | 'createdAt' | 'history' | 'status' | 'type'>

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

export function ReceiptForm({ existing }: { existing?: ReceiptDoc }) {
  const { data, error } = useLoad(async () => ({
    settings: await repo.getSettings(),
    quotes: (await repo.listDocs()).filter((d): d is QuoteDoc => d.type !== 'receipt' && d.status !== 'cancelled' && d.status !== 'draft'),
  }))
  if (error) return <div className="page error-text">{error}</div>
  if (!data) return <div className="page muted">Carregando…</div>
  return <Inner settings={data.settings} quotes={data.quotes} existing={existing} />
}

function issuerFrom(s: Settings): ClientSnapshot {
  return { name: s.legalName || s.companyName, cpfCnpj: s.cpfCnpj, phone: s.phone || s.whatsapp, address: s.address }
}

function Inner({ settings, quotes, existing }: { settings: Settings; quotes: QuoteDoc[]; existing?: ReceiptDoc }) {
  const ui = useUi()
  const nav = useNavigate()
  const [f, setF] = useState<Fields>(() => {
    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, number, seq, version, parentId, createdAt, history, status, type, ...rest } = existing
      void [id, number, seq, version, parentId, createdAt, history, status, type]
      return rest
    }
    return {
      issuedAt: todayISO(), kind: 'service', receivedCents: 0, payer: { name: '' }, client: { name: '' },
      issuer: issuerFrom(settings), method: 'pix', reference: '', notes: settings.defaultNotes,
    }
  })
  const [errors, setErrors] = useState<string[]>([])
  const [pick, setPick] = useState(false)
  const [saving, setSaving] = useState(false)
  const set = (patch: Partial<Fields>) => setF((p) => ({ ...p, ...patch }))

  if (existing && existing.status !== 'draft') {
    return (
      <div className="page stack">
        <h1>Recibo já emitido</h1>
        <p>O {existing.number} não pode ser alterado depois de emitido. Abra o documento para cancelar ou substituir.</p>
        <Link className="btn btn-primary" to={`/doc/${existing.id}`}>Abrir documento</Link>
      </div>
    )
  }

  const extenso = cap(valorPorExtenso(f.receivedCents))
  const preview = receiptConfirmationText({ ...f } as ReceiptDoc, valorPorExtenso(f.receivedCents))
  const bal = balanceCents(f as ReceiptDoc)

  function validate(): string[] {
    const e: string[] = []
    if (!f.payer.name.trim()) e.push('Informe o nome do pagador.')
    if (!(f.receivedCents > 0)) e.push('Informe o valor recebido.')
    if (!f.reference.trim()) e.push('Informe a que se refere o pagamento.')
    if (!f.issuer.name.trim()) e.push('Informe o nome de quem recebeu (Configurações → Empresa).')
    if (f.kind === 'settlement' && f.totalCents != null && f.receivedCents < f.totalCents)
      e.push('Para quitação total, o valor recebido deve cobrir o valor total. Use “Pagamento parcial” se for o caso.')
    return e
  }

  async function save(issue: boolean) {
    const errs = validate()
    setErrors(errs)
    if (errs.length) return window.scrollTo({ top: 0, behavior: 'smooth' })
    if (issue && !(await ui.confirm('Depois de emitido, o recibo não pode mais ser editado (só cancelado ou substituído). Emitir agora?', { confirmLabel: 'Emitir recibo', title: 'Emitir recibo' }))) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const status = issue ? 'issued' : 'draft'
      const event = issue ? 'Emitido' : 'Rascunho salvo'
      const base = { ...f, client: f.payer }
      let doc: ReceiptDoc
      if (existing) doc = { ...existing, ...base, status, history: [...existing.history, { at: now, event }] }
      else {
        const a = await repo.allocateNumber('receipt')
        doc = { id: uid(), type: 'receipt', number: a.number, seq: a.seq, version: 1, createdAt: now, history: [{ at: now, event: `Criado (${event.toLowerCase()})` }], status, ...base }
      }
      await repo.saveDoc(doc)
      ui.ok(`${doc.number} ${issue ? 'emitido' : 'salvo'}`)
      nav(`/doc/${doc.id}`, { replace: true })
    } catch (e) {
      ui.err(`Não foi possível salvar: ${errMsg(e)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <h1>{existing ? `Editar ${existing.number}` : 'Novo recibo'}</h1>
      {errors.length > 0 && (
        <div className="card" role="alert" style={{ borderColor: 'var(--danger)' }}>
          {errors.map((e) => <div className="error-text" key={e}>{e}</div>)}
        </div>
      )}

      <button className="btn btn-block" onClick={() => setPick(true)}>Importar de um orçamento</button>
      {pick && (
        <div className="sheet-back" onClick={() => setPick(false)}>
          <div className="sheet stack" style={{ maxHeight: '70vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2>Escolha o orçamento</h2>
            {quotes.length === 0 && <p className="muted">Nenhum orçamento enviado ou aprovado.</p>}
            {quotes.map((q) => (
              <button key={q.id} className="btn btn-block" style={{ justifyContent: 'space-between' }} onClick={() => { setF((p) => ({ ...p, ...receiptFromQuote(q) })); setPick(false) }}>
                <span>{q.number} · {q.client.name}</span><b>{formatBRL(q.totals.totalCents)}</b>
              </button>
            ))}
            <button className="btn btn-block" onClick={() => setPick(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="section-title"><h2 style={{ margin: 0 }}>Pagador</h2></div>
      <div className="card">
        <ClientPicker label="Pagador" value={f.payer} clientId={f.clientId} onChange={(payer, clientId) => set({ payer, clientId, client: payer })} />
      </div>

      <div className="section-title"><h2 style={{ margin: 0 }}>Pagamento</h2></div>
      <div className="card stack">
        <TextField label="Data de emissão" type="date" value={f.issuedAt} onChange={(v) => set({ issuedAt: v })} />
        <SelectField<ReceiptKind> label="Tipo de recebimento" value={f.kind} onChange={(kind) => set({ kind })} options={(Object.keys(KIND_LABEL) as ReceiptKind[]).map((k) => ({ value: k, label: KIND_LABEL[k] }))} />
        <MoneyInput label="Valor recebido (R$)" value={f.receivedCents} onChange={(c) => set({ receivedCents: c })} />
        <div className="muted" aria-live="polite">{f.receivedCents > 0 ? `Por extenso: ${extenso}` : 'Por extenso: —'}</div>
        <MoneyInput label="Valor total relacionado (opcional, para mostrar o saldo)" value={f.totalCents ?? 0} onChange={(c) => set({ totalCents: c > 0 ? c : undefined })} />
        {bal !== null && <div className="muted">Saldo restante: <b>{formatBRL(bal)}</b></div>}
        <SelectField<PaymentMethod> label="Forma de pagamento" value={f.method} onChange={(method) => set({ method })} options={(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((k) => ({ value: k, label: METHOD_LABEL[k] }))} />
        <TextField label="Referente a" value={f.reference} multiline onChange={(v) => set({ reference: v })} />
        <TextField label="Observações (aparecem no PDF)" value={f.notes} multiline onChange={(v) => set({ notes: v })} />
        <TextField label="Observações internas (NÃO aparecem no PDF)" value={f.privateNotes} multiline onChange={(v) => set({ privateNotes: v })} />
      </div>

      <div className="section-title"><h2 style={{ margin: 0 }}>Quem recebeu</h2></div>
      <div className="card stack">
        <TextField label="Nome da empresa ou profissional" value={f.issuer.name} onChange={(v) => set({ issuer: { ...f.issuer, name: v } })} />
        <TextField label="CPF ou CNPJ" value={f.issuer.cpfCnpj} inputMode="numeric" onChange={(v) => set({ issuer: { ...f.issuer, cpfCnpj: v } })} />
        <TextField label="Endereço" value={f.issuer.address} onChange={(v) => set({ issuer: { ...f.issuer, address: v } })} />
        <TextField label="Telefone" value={f.issuer.phone} type="tel" inputMode="tel" onChange={(v) => set({ issuer: { ...f.issuer, phone: v } })} />
      </div>

      <div className="card">
        <b>Texto do recibo</b>
        <p className="muted" style={{ marginBottom: 0 }}>{f.receivedCents > 0 && f.payer.name ? preview : 'Preencha pagador e valor para ver o texto.'}</p>
      </div>

      <div className="stack">
        <button className="btn btn-primary btn-block" disabled={saving} onClick={() => save(true)}>Emitir recibo</button>
        <button className="btn btn-block" disabled={saving} onClick={() => save(false)}>Salvar rascunho</button>
      </div>
    </div>
  )
}
