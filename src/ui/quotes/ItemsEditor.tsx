import { useState } from 'react'
import { uid } from '../../domain/dates'
import { formatBRL } from '../../domain/money'
import { lineTotal, type LineItem } from '../../domain/totals'
import type { Part } from '../../domain/types'
import { MoneyInput } from '../fields/MoneyInput'
import { Icon } from '../Icon'

function QtyInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [text, setText] = useState(String(value).replace('.', ','))
  const bad = text !== '' && !Number.isFinite(Number(text.replace(',', '.')))
  return (
    <label className="field">
      <span>Qtd</span>
      <input
        className={`input${bad ? ' invalid' : ''}`}
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          const n = Number(e.target.value.replace(',', '.'))
          if (e.target.value === '') onChange(0)
          else if (Number.isFinite(n)) onChange(n)
        }}
      />
    </label>
  )
}

type Props = {
  title: string
  addLabel: string
  items: LineItem[]
  catalog?: Part[]
  withCode?: boolean
  disabled?: boolean
  onAdd: (i: LineItem) => void
  onUpdate: (id: string, patch: Partial<LineItem>) => void
  onRemove: (id: string) => void
}

export function ItemsEditor({ title, addLabel, items, catalog = [], withCode, disabled, onAdd, onUpdate, onRemove }: Props) {
  const blank = (): LineItem => ({ id: uid(), description: '', qty: 1, unitCents: 0, discountCents: 0 })
  return (
    <div>
      <div className="section-title"><h2 style={{ margin: 0 }}>{title}</h2></div>
      {items.length === 0 && <p className="muted">Nenhum item ainda.</p>}
      {items.map((i, idx) => (
        <div className="card stack" key={i.id}>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <label className="field">
              <span>{`Descrição do item ${idx + 1}`}</span>
              <input className="input" value={i.description} disabled={disabled} onChange={(e) => onUpdate(i.id, { description: e.target.value })} />
            </label>
            <button className="btn btn-sm btn-danger" style={{ flex: 'none', marginTop: 20 }} aria-label={`Remover item ${idx + 1}`} disabled={disabled} onClick={() => onRemove(i.id)}>
              <Icon name="trash" size={18} />
            </button>
          </div>
          {withCode && (
            <label className="field">
              <span>Código ou referência (opcional)</span>
              <input className="input" value={i.code ?? ''} disabled={disabled} onChange={(e) => onUpdate(i.id, { code: e.target.value })} />
            </label>
          )}
          <div className="grid2">
            <QtyInput value={i.qty} onChange={(n) => onUpdate(i.id, { qty: n })} />
            <MoneyInput label="Valor unitário (R$)" value={i.unitCents} onChange={(c) => onUpdate(i.id, { unitCents: c })} />
          </div>
          <div className="grid2">
            <MoneyInput label="Desconto do item (R$)" value={i.discountCents} onChange={(c) => onUpdate(i.id, { discountCents: c })} />
            <div className="field"><span>Subtotal</span><b style={{ display: 'block', paddingTop: 12 }}>{formatBRL(lineTotal(i))}</b></div>
          </div>
        </div>
      ))}
      <div className="stack">
        {catalog.length > 0 && (
          <select
            className="input"
            aria-label="Adicionar peça do catálogo"
            disabled={disabled}
            value=""
            onChange={(e) => {
              const p = catalog.find((x) => x.id === e.target.value)
              if (p) onAdd({ id: uid(), description: p.description, code: p.code, qty: 1, unitCents: p.priceCents, discountCents: 0, costCents: p.costCents })
            }}
          >
            <option value="">+ Do catálogo…</option>
            {catalog.map((p) => (
              <option key={p.id} value={p.id}>{p.description} — {formatBRL(p.priceCents)}</option>
            ))}
          </select>
        )}
        <button type="button" className="btn btn-block" disabled={disabled} onClick={() => onAdd(blank())}>{addLabel}</button>
      </div>
    </div>
  )
}
