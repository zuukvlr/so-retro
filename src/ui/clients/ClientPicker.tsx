import { repo } from '../../db/repo'
import type { ClientSnapshot } from '../../domain/types'
import { SelectField, TextField } from '../fields/TextField'
import { useLoad } from '../util'

type Props = {
  label?: string
  value: ClientSnapshot
  clientId?: string
  onChange: (snapshot: ClientSnapshot, clientId?: string) => void
  disabled?: boolean
}

/** Escolhe um cliente cadastrado ou digita os dados manualmente (o documento guarda uma cópia). */
export function ClientPicker({ label = 'Cliente', value, clientId, onChange, disabled }: Props) {
  const { data: clients = [] } = useLoad(() => repo.listClients())
  const set = (patch: Partial<ClientSnapshot>) => onChange({ ...value, ...patch }, clientId)
  return (
    <fieldset disabled={disabled} style={{ border: 0, padding: 0, margin: 0 }} className="stack">
      <SelectField
        label={`${label} cadastrado`}
        value={clientId ?? ''}
        options={[{ value: '', label: '— digitar manualmente —' }, ...clients.map((c) => ({ value: c.id, label: c.name }))]}
        onChange={(id) => {
          const c = clients.find((x) => x.id === id)
          if (!c) return onChange(value, undefined)
          const { id: _id, notes: _n, ...snap } = c
          void _id
          void _n
          onChange(snap, c.id)
        }}
      />
      <TextField label={`${label} (nome)`} value={value.name} onChange={(v) => set({ name: v })} autoComplete="name" />
      <div className="stack">
          <TextField label="CPF ou CNPJ" value={value.cpfCnpj} inputMode="numeric" onChange={(v) => set({ cpfCnpj: v })} />
          <div className="grid2">
        <TextField label="Telefone" value={value.phone} type="tel" inputMode="tel" onChange={(v) => set({ phone: v })} />
        <TextField label="WhatsApp" value={value.whatsapp} type="tel" inputMode="tel" onChange={(v) => set({ whatsapp: v })} />
      </div>
      <TextField label="E-mail" value={value.email} type="email" inputMode="email" onChange={(v) => set({ email: v })} />
      <TextField label="Endereço" value={value.address} onChange={(v) => set({ address: v })} />
  </div>
</fieldset>
  )
}
