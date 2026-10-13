import { formatNumber } from '../domain/numbering'
import type { Client, Doc, DocType, Part, Settings } from '../domain/types'
import { blobToBuffer } from './blob'
import { closeDb, DB_NAME, getDb, type StoredSettings } from './db'

export const defaultSettings = (): Settings => ({
  companyName: 'Só Retro',
  defaultValidityDays: 15,
  prefixes: { parts_quote: 'ORC-P-', service_quote: 'ORC-S-', receipt: 'REC-' },
  pad: 4,
  startAt: { parts_quote: 1, service_quote: 1, receipt: 1 },
  theme: 'auto',
  showCostInPdf: false,
})

/** Logo é guardado como bytes + tipo (Blob direto no IndexedDB é instável em alguns Safari). */
type LogoBytes = { buf: ArrayBuffer; type: string }

export async function packSettings(s: Settings): Promise<StoredSettings> {
  const { logo, ...rest } = s
  const out: StoredSettings = { key: 'main', ...rest }
  if (logo) out.logoBytes = { buf: await blobToBuffer(logo), type: logo.type } satisfies LogoBytes
  return out
}

export function unpackSettings(raw: StoredSettings | undefined): Settings {
  const base = defaultSettings()
  if (!raw) return base
  const { key: _key, logoBytes, ...rest } = raw
  void _key
  const s = { ...base, ...(rest as Partial<Settings>) }
  s.prefixes = { ...base.prefixes, ...(rest.prefixes as Settings['prefixes'] | undefined) }
  s.startAt = { ...base.startAt, ...(rest.startAt as Settings['startAt'] | undefined) }
  if (logoBytes) {
    const l = logoBytes as LogoBytes
    s.logo = new Blob([l.buf], { type: l.type })
  }
  return s
}

export const repo = {
  async listClients(): Promise<Client[]> {
    return (await (await getDb()).getAll('clients')).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  },
  async saveClient(c: Client) {
    await (await getDb()).put('clients', c)
  },
  async deleteClient(id: string) {
    await (await getDb()).delete('clients', id)
  },

  async listParts(): Promise<Part[]> {
    return (await (await getDb()).getAll('parts')).sort((a, b) => a.description.localeCompare(b.description, 'pt-BR'))
  },
  async savePart(p: Part) {
    await (await getDb()).put('parts', p)
  },
  async deletePart(id: string) {
    await (await getDb()).delete('parts', id)
  },

  async listDocs(): Promise<Doc[]> {
    return (await (await getDb()).getAll('documents')).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async getDoc(id: string): Promise<Doc | undefined> {
    return (await getDb()).get('documents', id)
  },
  async saveDoc(d: Doc) {
    await (await getDb()).put('documents', d)
  },
  async deleteDoc(id: string) {
    const db = await getDb()
    const d = await db.get('documents', id)
    if (d && d.status !== 'draft') throw new Error('Documento emitido não pode ser excluído; cancele-o')
    await db.delete('documents', id)
  },

  async getSettings(): Promise<Settings> {
    return unpackSettings(await (await getDb()).get('settings', 'main'))
  },
  async saveSettings(s: Settings) {
    const packed = await packSettings(s) // leitura do Blob ANTES de abrir a transação
    await (await getDb()).put('settings', packed)
  },

  /** Lê settings + contador e incrementa na mesma transação (sem repetir números). */
  async allocateNumber(type: DocType): Promise<{ seq: number; number: string }> {
    const db = await getDb()
    const tx = db.transaction(['settings', 'counters'], 'readwrite')
    const s = unpackSettings(await tx.objectStore('settings').get('main'))
    const counters = tx.objectStore('counters')
    const c = await counters.get(type)
    const seq = Math.max(c?.next ?? 0, s.startAt[type])
    await counters.put({ type, next: seq + 1 })
    await tx.done
    return { seq, number: formatNumber(s.prefixes[type], seq, s.pad) }
  },
}

export async function resetDbForTests() {
  await closeDb()
  await new Promise<void>((resolve, reject) => {
    const r = indexedDB.deleteDatabase(DB_NAME)
    r.onsuccess = () => resolve()
    r.onerror = () => reject(r.error)
    r.onblocked = () => resolve()
  })
}
