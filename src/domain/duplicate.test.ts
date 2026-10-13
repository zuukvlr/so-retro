import { it, expect } from 'vitest'
import { makeNewVersion, duplicateDoc } from './duplicate'
import type { QuoteDoc, ReceiptDoc } from './types'

const quote = {
  id: 'q1', type: 'service_quote', number: 'ORC-S-0007', seq: 7, version: 1, status: 'approved',
  createdAt: '2026-10-01T10:00:00Z', issuedAt: '2026-10-01', client: { name: 'Ana' }, history: [{ at: 'x', event: 'criado' }],
  parts: [], services: [{ id: 's', description: 'm', qty: 1, unitCents: 100, discountCents: 0 }],
  totals: { servicesCents: 100, partsCents: 0, subtotalCents: 100, discountCents: 0, totalCents: 100 },
} as unknown as QuoteDoc
const alloc = { seq: 8, number: 'ORC-S-0008' }

it('nova versão: rascunho, versão+1, aponta para o original, não altera o original', () => {
  const before = JSON.stringify(quote)
  const v = makeNewVersion(quote, alloc, '2026-10-13T09:00:00Z')
  expect(v).toMatchObject({ status: 'draft', version: 2, parentId: 'q1', number: 'ORC-S-0008', seq: 8 })
  expect(v.id).not.toBe('q1')
  expect(v.history.at(-1)!.event).toMatch(/ORC-S-0007/)
  expect(JSON.stringify(quote)).toBe(before)
  v.services[0].qty = 9
  expect(quote.services[0].qty).toBe(1)
})
it('duplicar recibo gera rascunho novo sem herdar vínculo de emissão', () => {
  const r = { id: 'r1', type: 'receipt', number: 'REC-0001', seq: 1, version: 1, status: 'issued', createdAt: 'x', issuedAt: '2026-10-01',
    client: { name: 'A' }, payer: { name: 'A' }, issuer: { name: 'E' }, receivedCents: 100, kind: 'partial', method: 'pix', reference: 'x', history: [] } as unknown as ReceiptDoc
  const d = duplicateDoc(r, { seq: 2, number: 'REC-0002' }, '2026-10-13T09:00:00Z')
  expect(d).toMatchObject({ status: 'draft', number: 'REC-0002', version: 1 })
  expect(d.parentId).toBeUndefined()
})
