import { useState } from 'react'
import { Link } from 'react-router-dom'
import { repo } from '../../db/repo'
import { uid } from '../../domain/dates'
import { formatBRL } from '../../domain/money'
import { TYPE_LABEL } from '../../domain/labels'
import type { Client } from '../../domain/types'
import { TextField } from '../fields/TextField'
import { Icon } from '../Icon'
import { useUi } from '../UiProvider'
import { errMsg, useLoad } from '../util'

const blank = (): Client => ({ id: uid(), name: '' })

export function ClientsPage() {
  const ui = useUi()
  const { data: clients = [], reload } = useLoad(() => repo.listClients())
  const { data: docs = [] } = useLoad(() => repo.listDocs())
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Client | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [nameErr, setNameErr] = useState('')

  const filtered = clients.filter((c) =>
    [c.name, c.cpfCnpj, c.phone, c.whatsapp, c.email].filter(Boolean).join(' ').toLowerCase().includes(q.toLowerCase()),
  )

  async function save() {
    if (!editing) return
    if (!editing.name.trim()) return setNameErr('Informe o nome do cliente.')
    try {
      await repo.saveClient({ ...editing, name: editing.name.trim() })
      ui.ok(isNew ? 'Cliente cadastrado' : 'Cliente atualizado')
      setEditing(null)
      reload()
    } catch (e) {
      ui.err(`Não foi possível salvar: ${errMsg(e)}`)
    }
  }

  async function remove(c: Client) {
    const used = docs.filter((d) => d.clientId === c.id).length
    const msg = used
      ? `Excluir "${c.name}"? Os ${used} documento(s) dele continuam salvos com os dados da época.`
      : `Excluir "${c.name}"?`
    if (!(await ui.confirm(msg, { danger: true, confirmLabel: 'Excluir' }))) return
    try {
      await repo.deleteClient(c.id)
      ui.ok('Cliente excluído')
      setEditing(null)
      reload()
    } catch (e) {
      ui.err(`Não foi possível excluir: ${errMsg(e)}`)
    }
  }

  if (editing) {
    const set = (patch: Partial<Client>) => setEditing({ ...editing, ...patch })
    const history = docs.filter((d) => d.clientId === editing.id)
    return (
      <div className="page stack">
        <div className="page-head">
          <button className="btn btn-sm" onClick={() => setEditing(null)} aria-label="Voltar"><Icon name="back" /> Voltar</button>
          <h1 style={{ margin: 0 }}>{isNew ? 'Novo cliente' : 'Editar cliente'}</h1>
        </div>
        <div className="card stack">
          <TextField label="Nome completo ou razão social" value={editing.name} error={nameErr} onChange={(v) => { set({ name: v }); setNameErr('') }} autoComplete="name" />
          <TextField label="CPF ou CNPJ" value={editing.cpfCnpj} inputMode="numeric" onChange={(v) => set({ cpfCnpj: v })} />
          <div className="grid2">
            <TextField label="Telefone" value={editing.phone} type="tel" inputMode="tel" onChange={(v) => set({ phone: v })} />
            <TextField label="WhatsApp" value={editing.whatsapp} type="tel" inputMode="tel" onChange={(v) => set({ whatsapp: v })} />
          </div>
          <TextField label="E-mail" value={editing.email} type="email" inputMode="email" onChange={(v) => set({ email: v })} />
          <TextField label="Endereço completo" value={editing.address} onChange={(v) => set({ address: v })} />
          <TextField label="Observações" value={editing.notes} multiline onChange={(v) => set({ notes: v })} />
          <button className="btn btn-primary btn-block" onClick={save}>Salvar cliente</button>
          {!isNew && <button className="btn btn-danger btn-block" onClick={() => remove(editing)}><Icon name="trash" /> Excluir cliente</button>}
        </div>
        {!isNew && (
          <div className="card">
            <h2>Histórico de documentos</h2>
            {history.length === 0 && <p className="muted">Nenhum documento para este cliente.</p>}
            {history.map((d) => (
              <Link key={d.id} to={`/doc/${d.id}`} className="list-item">
                <span><b>{d.number}</b><br /><span className="muted">{TYPE_LABEL[d.type]}</span></span>
                <b>{formatBRL(d.type === 'receipt' ? d.receivedCents : d.totals.totalCents)}</b>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1 style={{ margin: 0 }}>Clientes</h1>
        <button className="btn btn-primary" style={{ flex: 'none' }} onClick={() => { setNameErr(''); setIsNew(true); setEditing(blank()) }}>+ Novo</button>
      </div>
      <input className="input" placeholder="Buscar cliente" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar cliente" />
      <div className="card" style={{ marginTop: 12 }}>
        {filtered.length === 0 && <p className="muted">{clients.length ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</p>}
        {filtered.map((c) => (
          <a key={c.id} href="#" className="list-item" onClick={(e) => { e.preventDefault(); setNameErr(''); setIsNew(false); setEditing(c) }}>
            <span><b>{c.name}</b><br /><span className="muted">{c.whatsapp || c.phone || c.email || 'Sem contato'}</span></span>
            <span className="muted">{docs.filter((d) => d.clientId === c.id).length} doc.</span>
          </a>
        ))}
      </div>
    </div>
  )
}
