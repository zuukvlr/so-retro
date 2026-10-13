import { blobToDataUrl, dataUrlToBlob } from '../db/blob'
import { getDb } from '../db/db'
import { packSettings, repo, unpackSettings } from '../db/repo'
import type { Client, Doc, Part, Settings } from '../domain/types'

export const BACKUP_VERSION = 1

export type Backup = {
  app: 'so-retro'
  version: number
  exportedAt: string
  clients: Client[]
  parts: Part[]
  documents: Doc[]
  settings: (Omit<Settings, 'logo'> & { logoDataUrl?: string }) | null
  counters: { type: string; next: number }[]
}

export async function exportBackup(): Promise<Blob> {
  const db = await getDb()
  const settings = await repo.getSettings()
  const { logo, ...rest } = settings
  const data: Backup = {
    app: 'so-retro',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    clients: await db.getAll('clients'),
    parts: await db.getAll('parts'),
    documents: await db.getAll('documents'),
    settings: { ...rest, ...(logo ? { logoDataUrl: await blobToDataUrl(logo) } : {}) },
    counters: await db.getAll('counters'),
  }
  return new Blob([JSON.stringify(data)], { type: 'application/json' })
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

export function parseBackup(text: string): Backup {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('Arquivo inválido: não é um backup do Só Retro')
  }
  if (!isObj(raw) || raw.app !== 'so-retro') throw new Error('Arquivo inválido: não é um backup do Só Retro')
  if (typeof raw.version !== 'number' || raw.version > BACKUP_VERSION)
    throw new Error('Versão de backup não suportada. Atualize o aplicativo.')
  const list = (k: string, key: string): unknown[] => {
    const v = raw[k]
    if (!Array.isArray(v)) throw new Error(`Backup corrompido: lista "${k}" ausente`)
    for (const it of v) if (!isObj(it) || typeof it[key] !== 'string') throw new Error(`Backup corrompido em "${k}"`)
    return v
  }
  const clients = list('clients', 'id') as Client[]
  const parts = list('parts', 'id') as Part[]
  const documents = list('documents', 'id') as Doc[]
  const counters = list('counters', 'type') as Backup['counters']
  const settings = raw.settings === null || isObj(raw.settings) ? (raw.settings as Backup['settings']) : null
  return { app: 'so-retro', version: raw.version, exportedAt: String(raw.exportedAt ?? ''), clients, parts, documents, settings, counters }
}

/** Substitui todos os dados numa única transação: se algo falhar, nada muda. */
export async function restoreBackup(b: Backup): Promise<void> {
  let packed = null
  if (b.settings) {
    const { logoDataUrl, ...rest } = b.settings
    const s: Settings = { ...unpackSettings(undefined), ...(rest as Partial<Settings>) }
    if (logoDataUrl) s.logo = dataUrlToBlob(logoDataUrl)
    packed = await packSettings(s)
  }
  const db = await getDb()
  const tx = db.transaction(['clients', 'parts', 'documents', 'settings', 'counters'], 'readwrite')
  try {
    for (const name of ['clients', 'parts', 'documents', 'settings', 'counters'] as const) await tx.objectStore(name).clear()
    for (const c of b.clients) await tx.objectStore('clients').put(c)
    for (const p of b.parts) await tx.objectStore('parts').put(p)
    for (const d of b.documents) await tx.objectStore('documents').put(d)
    for (const c of b.counters) await tx.objectStore('counters').put(c)
    if (packed) await tx.objectStore('settings').put(packed)
    await tx.done
  } catch (e) {
    try {
      tx.abort()
    } catch {
      /* já finalizada */
    }
    throw e
  }
}
