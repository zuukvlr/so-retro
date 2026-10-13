import { useState } from 'react'
import { repo } from '../../db/repo'
import { uid } from '../../domain/dates'
import { formatBRL } from '../../domain/money'
import type { Part } from '../../domain/types'
import { MoneyInput } from '../fields/MoneyInput'
import { TextField } from '../fields/TextField'
import { Icon } from '../Icon'
import { useUi } from '../UiProvider'
import { errMsg, useLoad } from '../util'

export function PartsPage() {
  const ui = useUi()
  const { data: parts = [], reload } = useLoad(() => repo.listParts())
  const [editing, setEditing] = useState<Part | null>(null)
  const [err, setErr] = useState('')

  async function save() {
    if (!editing) return
    if (!editing.description.trim()) return setErr('Informe a descrição da peça.')
    try {
      await repo.savePart({ ...editing, description: editing.description.trim() })
      ui.ok('Peça salva')
      setEditing(null)
      reload()
    } catch (e) {
      ui.err(`Não foi possível salvar: ${errMsg(e)}`)
    }
  }
  async function remove(p: Part) {
    if (!(await ui.confirm(`Excluir "${p.description}" do catálogo? Orçamentos já criados não são afetados.`, { danger: true, confirmLabel: 'Excluir' }))) return
    await repo.deletePart(p.id)
    ui.ok('Peça excluída')
    setEditing(null)
    reload()
  }

  if (editing) {
    const set = (patch: Partial<Part>) => setEditing({ ...editing, ...patch })
    return (
      <div className="card stack">
        <h2>{parts.some((p) => p.id === editing.id) ? 'Editar peça' : 'Nova peça'}</h2>
        <TextField label="Descrição" value={editing.description} error={err} onChange={(v) => { set({ description: v }); setErr('') }} />
        <TextField label="Código ou referência (opcional)" value={editing.code} onChange={(v) => set({ code: v })} />
        <div className="grid2">
          <MoneyInput label="Preço de venda (R$)" value={editing.priceCents} onChange={(c) => set({ priceCents: c })} />
          <MoneyInput label="Custo interno (R$)" value={editing.costCents} onChange={(c) => set({ costCents: c })} />
        </div>
        <p className="muted" style={{ margin: 0 }}>O custo é só seu: não aparece no PDF enviado ao cliente.</p>
        <div className="row">
          <button className="btn" onClick={() => setEditing(null)}>Cancelar</button>
          <button className="btn btn-primary" onClick={save}>Salvar</button>
        </div>
        {parts.some((p) => p.id === editing.id) && <button className="btn btn-danger btn-block" onClick={() => remove(editing)}><Icon name="trash" /> Excluir peça</button>}
      </div>
    )
  }

  return (
    <div className="card">
      <div className="page-head">
        <h2 style={{ margin: 0 }}>Catálogo de peças</h2>
        <button className="btn btn-sm btn-primary" style={{ flex: 'none' }} onClick={() => { setErr(''); setEditing({ id: uid(), description: '', costCents: 0, priceCents: 0 }) }}>+ Peça</button>
      </div>
      {parts.length === 0 && <p className="muted">Opcional: cadastre peças para reaproveitar nos orçamentos.</p>}
      {parts.map((p) => (
        <a key={p.id} href="#" className="list-item" onClick={(e) => { e.preventDefault(); setErr(''); setEditing(p) }}>
          <span><b>{p.description}</b><br /><span className="muted">{p.code || 'sem código'}</span></span>
          <b>{formatBRL(p.priceCents)}</b>
        </a>
      ))}
    </div>
  )
}
