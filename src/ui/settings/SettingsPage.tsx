import { useEffect, useState } from 'react'
import { exportBackup, parseBackup, restoreBackup } from '../../backup/backup'
import { repo } from '../../db/repo'
import { todayISO } from '../../domain/dates'
import { TYPE_LABEL } from '../../domain/labels'
import type { DocType, Settings } from '../../domain/types'
import { backupIsStale, isPersisted, requestPersistence } from '../../pwa/storage'
import { downloadBlob, shareFile, toFile } from '../../share/share'
import { SelectField, TextField } from '../fields/TextField'
import { PartsPage } from '../parts/PartsPage'
import { useUi } from '../UiProvider'
import { errMsg, useLoad } from '../util'

const TYPES: DocType[] = ['parts_quote', 'service_quote', 'receipt']

export function SettingsPage() {
  const ui = useUi()
  const { data, reload } = useLoad(() => repo.getSettings())
  const [s, setS] = useState<Settings>()
  const [logoUrl, setLogoUrl] = useState<string>()
  const [persisted, setPersisted] = useState<boolean>()
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (data) setS(data) }, [data])
  useEffect(() => { isPersisted().then(setPersisted) }, [])
  useEffect(() => {
    if (!s?.logo) return setLogoUrl(undefined)
    const u = URL.createObjectURL(s.logo)
    setLogoUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [s?.logo])

  if (!s) return <div className="page muted">Carregando…</div>
  const set = (patch: Partial<Settings>) => setS({ ...s, ...patch })

  async function save(next: Settings = s!) {
    if (!next.companyName.trim()) return ui.err('Informe o nome da empresa ou profissional.')
    if (!(next.defaultValidityDays >= 0)) return ui.err('A validade padrão deve ser um número de dias.')
    try {
      await repo.saveSettings({ ...next, companyName: next.companyName.trim() })
      ui.ok('Configurações salvas')
      reload()
    } catch (e) {
      ui.err(`Não foi possível salvar: ${errMsg(e)}`)
    }
  }

  async function backup() {
    setBusy(true)
    try {
      const blob = await exportBackup()
      const name = `so-retro-backup-${todayISO()}.json`
      const res = await shareFile(toFile(blob, name), 'Backup Só Retro').catch(() => 'unsupported' as const)
      if (res === 'unsupported') downloadBlob(blob, name)
      if (res !== 'cancelled') {
        await repo.saveSettings({ ...s!, lastBackupAt: new Date().toISOString() })
        ui.ok(res === 'shared' ? 'Backup enviado. Guarde-o em Arquivos ou iCloud.' : 'Backup baixado')
        reload()
      }
    } catch (e) {
      ui.err(`Falha ao gerar o backup: ${errMsg(e)}`)
    } finally {
      setBusy(false)
    }
  }

  async function restore(file: File) {
    try {
      const b = parseBackup(await file.text())
      const ok = await ui.confirm(
        `Restaurar o backup de ${b.exportedAt.slice(0, 10) || 'data desconhecida'}? Isso SUBSTITUI todos os dados atuais (${b.documents.length} documento(s), ${b.clients.length} cliente(s)).`,
        { danger: true, confirmLabel: 'Restaurar', title: 'Restaurar backup' },
      )
      if (!ok) return
      await restoreBackup(b)
      ui.ok('Backup restaurado')
      setTimeout(() => window.location.reload(), 600)
    } catch (e) {
      ui.err(`Não foi possível restaurar: ${errMsg(e)}`)
    }
  }

  return (
    <div className="page">
      <h1>Configurações</h1>

      {backupIsStale(s.lastBackupAt) && (
        <div className="card" style={{ borderColor: 'var(--brand)' }}>
          <b>Faça um backup.</b>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Seus dados ficam só neste aparelho. {s.lastBackupAt ? `Último backup: ${s.lastBackupAt.slice(0, 10)}.` : 'Você ainda não fez nenhum backup.'}
          </p>
        </div>
      )}

      <div className="section-title"><h2 style={{ margin: 0 }}>Empresa ou profissional</h2></div>
      <div className="card stack">
        <div className="row" style={{ alignItems: 'center' }}>
          <img className="logo" style={{ flex: 'none', width: 72, height: 72 }} src={logoUrl ?? './logo.png'} alt="Logo" />
          <div className="stack">
            <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
              Trocar logo
              <input type="file" accept="image/png,image/jpeg" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) set({ logo: f }) }} />
            </label>
            {s.logo && <button className="btn btn-sm" onClick={() => set({ logo: undefined })}>Usar logo padrão</button>}
          </div>
        </div>
        <TextField label="Nome fantasia" value={s.companyName} onChange={(v) => set({ companyName: v })} />
        <TextField label="Razão social (opcional)" value={s.legalName} onChange={(v) => set({ legalName: v })} />
        <TextField label="CPF ou CNPJ" value={s.cpfCnpj} inputMode="numeric" onChange={(v) => set({ cpfCnpj: v })} />
        <div className="grid2">
          <TextField label="Telefone" value={s.phone} type="tel" inputMode="tel" onChange={(v) => set({ phone: v })} />
          <TextField label="WhatsApp" value={s.whatsapp} type="tel" inputMode="tel" onChange={(v) => set({ whatsapp: v })} />
        </div>
        <TextField label="E-mail" value={s.email} type="email" inputMode="email" onChange={(v) => set({ email: v })} />
        <TextField label="Endereço" value={s.address} onChange={(v) => set({ address: v })} />
      </div>

      <div className="section-title"><h2 style={{ margin: 0 }}>Padrões dos documentos</h2></div>
      <div className="card stack">
        <TextField label="Informações de pagamento (Pix, banco…)" value={s.paymentInfo} multiline onChange={(v) => set({ paymentInfo: v })} />
        <TextField label="Condições de pagamento padrão" value={s.defaultPaymentTerms} onChange={(v) => set({ defaultPaymentTerms: v })} />
        <TextField label="Validade padrão dos orçamentos (dias)" value={String(s.defaultValidityDays)} inputMode="numeric" onChange={(v) => set({ defaultValidityDays: v === '' ? 0 : Number(v.replace(/\D/g, '')) })} />
        <TextField label="Observações padrão" value={s.defaultNotes} multiline onChange={(v) => set({ defaultNotes: v })} />
        <label className="row" style={{ alignItems: 'center' }}>
          <input type="checkbox" style={{ flex: 'none', width: 24, height: 24 }} checked={s.showCostInPdf} onChange={(e) => set({ showCostInPdf: e.target.checked })} />
          <span>Mostrar custo de aquisição das peças no PDF (não recomendado: o cliente verá seu custo)</span>
        </label>
      </div>

      <div className="section-title"><h2 style={{ margin: 0 }}>Numeração</h2></div>
      <div className="card stack">
        {TYPES.map((t) => (
          <div className="grid2" key={t}>
            <TextField label={`Prefixo – ${TYPE_LABEL[t]}`} value={s.prefixes[t]} onChange={(v) => set({ prefixes: { ...s.prefixes, [t]: v } })} />
            <TextField label="Começar em" value={String(s.startAt[t])} inputMode="numeric" onChange={(v) => set({ startAt: { ...s.startAt, [t]: Math.max(1, Number(v.replace(/\D/g, '')) || 1) } })} />
          </div>
        ))}
        <TextField label="Dígitos do número (zeros à esquerda)" value={String(s.pad)} inputMode="numeric" onChange={(v) => set({ pad: Math.min(8, Math.max(1, Number(v.replace(/\D/g, '')) || 1)) })} />
        <p className="muted" style={{ margin: 0 }}>“Começar em” só vale se for maior que o último número já emitido; números emitidos nunca se repetem.</p>
        <SelectField label="Tema" value={s.theme} onChange={(v) => set({ theme: v })} options={[{ value: 'auto', label: 'Automático (segue o aparelho)' }, { value: 'light', label: 'Claro' }, { value: 'dark', label: 'Escuro' }]} />
      </div>
      <button className="btn btn-primary btn-block" onClick={() => save()}>Salvar configurações</button>

      <div className="section-title"><h2 style={{ margin: 0 }}>Backup e dados</h2></div>
      <div className="card stack">
        <p className="muted" style={{ margin: 0 }}>
          Armazenamento protegido contra limpeza automática: {persisted === undefined ? '…' : persisted ? 'sim' : 'não'}.{' '}
          {!persisted && <button className="btn btn-sm" onClick={async () => setPersisted(await requestPersistence())}>Solicitar</button>}
        </p>
        <button className="btn btn-dark btn-block" disabled={busy} onClick={backup}>Exportar backup</button>
        <label className="btn btn-block" style={{ cursor: 'pointer' }}>
          Restaurar backup
          <input type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) restore(f) }} />
        </label>
      </div>

      <div className="section-title"><h2 style={{ margin: 0 }}>Catálogo</h2></div>
      <PartsPage />
    </div>
  )
}
