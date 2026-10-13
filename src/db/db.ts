import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Client, Doc, Part } from '../domain/types'

export type StoredSettings = Record<string, unknown> & { key: 'main' }
export type Counter = { type: string; next: number }

export interface SoRetroDB extends DBSchema {
  clients: { key: string; value: Client }
  parts: { key: string; value: Part }
  documents: { key: string; value: Doc; indexes: { byType: string; byClient: string } }
  settings: { key: string; value: StoredSettings }
  counters: { key: string; value: Counter }
}

export const DB_NAME = 'so-retro'
let dbPromise: Promise<IDBPDatabase<SoRetroDB>> | null = null

export function getDb(): Promise<IDBPDatabase<SoRetroDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SoRetroDB>(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore('clients', { keyPath: 'id' })
        db.createObjectStore('parts', { keyPath: 'id' })
        const docs = db.createObjectStore('documents', { keyPath: 'id' })
        docs.createIndex('byType', 'type')
        docs.createIndex('byClient', 'clientId')
        db.createObjectStore('settings', { keyPath: 'key' })
        db.createObjectStore('counters', { keyPath: 'type' })
      },
    })
  }
  return dbPromise
}

export async function closeDb(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise
    db.close()
    dbPromise = null
  }
}
