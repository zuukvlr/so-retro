import { it, expect } from 'vitest'
import { receiptFromQuote } from './receiptFromQuote'
import type { QuoteDoc } from './types'

const quote = {
  id: 'q1', number: 'ORC-S-0003', type: 'service_quote', clientId: 'c1',
  client: { name: 'Ana', cpfCnpj: '123' },
  parts: [{ id: 'p', description: 'Rolo de alimentação', qty: 1, unitCents: 3500, discountCents: 0, costCents: 1000 }],
  services: [{ id: 's', description: 'Mão de obra', qty: 1, unitCents: 10000, discountCents: 0 }],
  totals: { totalCents: 13500 }, privateNotes: 'segredo',
} as unknown as QuoteDoc

it('importa cliente, total e referência', () => {
  const r = receiptFromQuote(quote)
  expect(r.payer?.name).toBe('Ana')
  expect(r.totalCents).toBe(13500)
  expect(r.linkedQuoteId).toBe('q1')
  expect(r.reference).toContain('ORC-S-0003')
  expect(r.reference).toContain('Mão de obra')
})
it('não copia custo nem observações privadas', () => {
  const s = JSON.stringify(receiptFromQuote(quote))
  expect(s).not.toContain('segredo')
  expect(s).not.toContain('costCents')
})
