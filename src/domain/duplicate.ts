import { uid } from './dates'
import type { Doc, QuoteDoc } from './types'

type Alloc = { seq: number; number: string }

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

/** Nova versão de um orçamento já enviado: o original permanece intacto. */
export function makeNewVersion(d: QuoteDoc, alloc: Alloc, nowISO: string): QuoteDoc {
  return {
    ...clone(d),
    id: uid(),
    number: alloc.number,
    seq: alloc.seq,
    version: d.version + 1,
    parentId: d.id,
    status: 'draft',
    createdAt: nowISO,
    history: [{ at: nowISO, event: `Nova versão de ${d.number} (v${d.version})` }],
  }
}

/** Cópia independente (rascunho) de qualquer documento. */
export function duplicateDoc<T extends Doc>(d: T, alloc: Alloc, nowISO: string): T {
  const c = clone(d)
  delete c.parentId
  return {
    ...c,
    id: uid(),
    number: alloc.number,
    seq: alloc.seq,
    version: 1,
    status: 'draft',
    createdAt: nowISO,
    history: [{ at: nowISO, event: `Cópia de ${d.number}` }],
  }
}
