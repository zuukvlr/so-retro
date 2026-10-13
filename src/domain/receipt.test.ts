import { it, expect } from 'vitest'
import { balanceCents, receiptConfirmationText } from './receipt'
import type { ReceiptDoc } from './types'

const r = (o: Partial<ReceiptDoc>) =>
  ({ kind: 'partial', receivedCents: 10000, totalCents: 30000, payer: { name: 'João' }, reference: 'serviço', ...o }) as ReceiptDoc

it('saldo', () => {
  expect(balanceCents(r({}))).toBe(20000)
  expect(balanceCents(r({ totalCents: undefined }))).toBeNull()
  expect(balanceCents(r({ receivedCents: 40000 }))).toBe(0)
})
it('parcial nunca declara quitação', () => {
  const t = receiptConfirmationText(r({}), 'cem reais')
  expect(t).toMatch(/pagamento parcial/i)
  expect(t).not.toMatch(/quita/i)
})
it('quitação só se settlement e saldo zero', () => {
  expect(receiptConfirmationText(r({ kind: 'settlement', receivedCents: 30000 }), 'trezentos reais')).toMatch(/quitação total/i)
  const parcial = receiptConfirmationText(r({ kind: 'settlement', receivedCents: 10000 }), 'cem reais')
  expect(parcial).not.toMatch(/quita/i)
  expect(parcial).toMatch(/saldo restante/i)
})
it('sinal/entrada é identificado e não quita', () => {
  const t = receiptConfirmationText(r({ kind: 'deposit' }), 'cem reais')
  expect(t).toMatch(/sinal/i)
  expect(t).not.toMatch(/quita/i)
})
