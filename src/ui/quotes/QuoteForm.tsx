import { useReducer, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { repo } from '../../db/repo'
import { todayISO, uid } from '../../domain/dates'
import { QUOTE_STATUS_LABEL, TYPE_LABEL } from '../../domain/labels'
import { formatBRL } from '../../domain/money'
import { emptyQuoteDraft, quoteReducer, validateQuote, type QuoteDraft } from '../../domain/quoteDraft'
import type { Part, QuoteDoc, QuoteStatus, Settings } from '../../domain/types'
import { ClientPicker } from '../clients/ClientPicker'
import { MoneyInput } from '../fields/MoneyInput'
import { SelectField, TextField } from '../fields/TextField'
import { useUi } from '../UiProvider'
import { errMsg, useLoad } from '../util'
import { ItemsEditor } from './ItemsEditor'

type Props = { type?: 'parts_quote' | 'service_quote'; existing?: QuoteDoc }

export function QuoteForm({ type = 'parts_quote', existing }: Props) {
  const { data, error } = useLoad(async () => ({ settings: await repo.getSettings(), parts: await repo.listParts() }))
  if (error) return <div className="page error-text">{error}</div>
  if (!data) return <div className="page muted">Carregando…</div>
  return <Inner settings={data.settings} catalog={data.parts} type={existing?.type ?? type} existing={existing} />
}

const STATUS_OPTIONS: QuoteStatus[] = ['draft', 'sent', 'awaiting', 'approved', 'rejected']

function toDraft(q: QuoteDoc): QuoteDraft {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, number, seq, version, parentId, createdAt, history, status, ...draft } = q
  void [id, number, seq, version, parentId, createdAt, history, status]
  return draft
}

function Inner({ settings, catalog, type, existing }: { settings: Settings; catalog: Part[]; type: QuoteDoc['type']; existing?: QuoteDoc }) {
  const ui = useUi()
  const nav = useNavigate()
  const [d, dispatch] = useReducer(quoteReducer, undefined, () => (existing ? toDraft(existing) : emptyQuoteDraft(type, settings, todayISO())))
  const [status, setStatus] = useState<QuoteStatus>(existing?.status ?? 'draft')
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const set = (patch: Partial<Omit<QuoteDraft, 'totals'>>) => dispatch({ type: 'setField', patch })
  const isService = type === 'service_quote'

  if (existing && existing.status !== 'draft') {
    return (
      <div className="page stack">
        <h1>Orçamento já enviado</h1>
        <p>O {existing.number} não pode ser alterado depois de enviado. Abra o documento e use “Criar nova versão”.</p>
        <Link className="btn btn-primary" to={`/doc/${existing.id}`}>Abrir documento</Link>
      </div>
    )
  }

  async function save() {
    const errs = validateQuote(d)
    setErrors(errs)
    if (errs.length) return window.scrollTo({ top: 0, behavior: 'smooth' })
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const event = status === 'draft' ? 'Rascunho salvo' : `Salvo como ${QUOTE_STATUS_LABEL[status].toLowerCase()}`
      let doc: QuoteDoc
      if (existing) {
        doc = { ...existing, ...d, status, history: [...existing.history, { at: now, event }] }
      } else {
        const a = await repo.allocateNumber(d.type)
        doc = { id: uid(), number: a.number, seq: a.seq, version: 1, createdAt: now, history: [{ at: now, event: `Criado (${event.toLowerCase()})` }], status, ...d }
      }
      await repo.saveDoc(doc)
      ui.ok(`${doc.number} salvo`)
      nav(`/doc/${doc.id}`, { replace: true })
    } catch (e) {
      ui.err(`Não foi possível salvar: ${errMsg(e)}`)
    } finally {
      setSaving(false)
    }
  }

  const disc = d.discount
  return (
    <div className="page">
      <h1>{existing ? `Editar ${existing.number}` : `Novo ${TYPE_LABEL[type].toLowerCase()}`}</h1>
      {errors.length > 0 && (
        <div className="card" role="alert" style={{ borderColor: 'var(--danger)' }}>
          {errors.map((e) => <div className="error-text" key={e}>{e}</div>)}
        </div>
      )}

      <div className="section-title"><h2 style={{ margin: 0 }}>Cliente</h2></div>
      <div className="card">
        <ClientPicker value={d.client} clientId={d.clientId} onChange={(client, clientId) => set({ client, clientId })} />
      </div>

      <div className="section-title"><h2 style={{ margin: 0 }}>Documento</h2></div>
      <div className="card stack">
        <div className="stack">
          <TextField label="Data de emissão" type="date" value={d.issuedAt} onChange={(v) => set({ issuedAt: v })} />
          <TextField label="Válido até" type="date" value={d.validUntil} onChange={(v) => set({ validUntil: v })} />
        </div>
        <SelectField label="Situação" value={status} onChange={setStatus} options={STATUS_OPTIONS.map((s) => ({ value: s, label: QUOTE_STATUS_LABEL[s] }))} />
        {!isService && <TextField label="Prazo de entrega (opcional)" value={d.deliveryTerm} onChange={(v) => set({ deliveryTerm: v })} />}
      </div>

      {isService && (
        <>
          <div className="section-title"><h2 style={{ margin: 0 }}>Equipamento e problema</h2></div>
          <div className="card stack">
            <TextField label="Equipamento ou produto (opcional)" value={d.equipment?.item} onChange={(v) => set({ equipment: { ...d.equipment, item: v } })} />
            <div className="grid2">
              <TextField label="Marca" value={d.equipment?.brand} onChange={(v) => set({ equipment: { ...d.equipment, brand: v } })} />
              <TextField label="Modelo" value={d.equipment?.model} onChange={(v) => set({ equipment: { ...d.equipment, model: v } })} />
            </div>
            <TextField label="Número de série" value={d.equipment?.serial} onChange={(v) => set({ equipment: { ...d.equipment, serial: v } })} />
            <TextField label="Descrição do problema ou solicitação" value={d.problem} multiline onChange={(v) => set({ problem: v })} />
            <TextField label="Diagnóstico técnico (opcional)" value={d.diagnosis} multiline onChange={(v) => set({ diagnosis: v })} />
          </div>
          <ItemsEditor
            title="Serviços e mão de obra"
            addLabel="+ Adicionar serviço"
            items={d.services}
            onAdd={(item) => dispatch({ type: 'addItem', list: 'services', item })}
            onUpdate={(id, patch) => dispatch({ type: 'updateItem', list: 'services', id, patch })}
            onRemove={(id) => dispatch({ type: 'removeItem', list: 'services', id })}
          />
        </>
      )}

      <ItemsEditor
        title={isService ? 'Peças e materiais (opcional)' : 'Peças e produtos'}
        addLabel="+ Adicionar peça avulsa"
        items={d.parts}
        catalog={catalog}
        withCode
        onAdd={(item) => dispatch({ type: 'addItem', list: 'parts', item })}
        onUpdate={(id, patch) => dispatch({ type: 'updateItem', list: 'parts', id, patch })}
        onRemove={(id) => dispatch({ type: 'removeItem', list: 'parts', id })}
      />

      <div className="section-title"><h2 style={{ margin: 0 }}>Descontos</h2></div>
      <div className="card stack">
        <SelectField
          label="Tipo de desconto geral"
          value={disc?.kind ?? 'none'}
          onChange={(k) => dispatch({ type: 'setDiscount', discount: k === 'none' ? undefined : { kind: k, value: 0 } })}
          options={[{ value: 'none', label: 'Sem desconto geral' }, { value: 'amount', label: 'Valor em R$' }, { value: 'percent', label: 'Porcentagem (%)' }]}
        />
        {disc && (
          <MoneyInput
            label={disc.kind === 'amount' ? 'Desconto geral (R$)' : 'Desconto geral (%)'}
            value={disc.value}
            onChange={(v) => dispatch({ type: 'setDiscount', discount: { ...disc, value: v } })}
          />
        )}
      </div>

      <div className="section-title"><h2 style={{ margin: 0 }}>Pagamento e observações</h2></div>
      <div className="card stack">
        <TextField label="Condições de pagamento" value={d.paymentTerms} onChange={(v) => set({ paymentTerms: v })} />
        <TextField label="Observações (aparecem no PDF)" value={d.notes} multiline onChange={(v) => set({ notes: v })} />
        <TextField label="Observações internas (NÃO aparecem no PDF)" value={d.privateNotes} multiline onChange={(v) => set({ privateNotes: v })} />
      </div>

      <div className="sticky-total" aria-live="polite">
        <span>
          Total
          {d.totals.discountCents > 0 && <small className="muted" style={{ display: 'block', color: '#bdbdbd' }}>desc. {formatBRL(d.totals.discountCents)}</small>}
        </span>
        <b>{formatBRL(d.totals.totalCents)}</b>
      </div>
      <p className="muted">Rascunhos podem ser editados. Depois de enviado, alterações geram uma nova versão.</p>
      <button className="btn btn-primary btn-block" disabled={saving} onClick={save}>{saving ? 'Salvando…' : 'Salvar orçamento'}</button>
    </div>
  )
}
