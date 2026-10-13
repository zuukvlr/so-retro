import { it, expect } from 'vitest'
import { calcTotals, lineTotal } from './totals'

const L = (q: number, u: number, d = 0) => ({ id: 'x', description: 'x', qty: q, unitCents: u, discountCents: d })

it('exemplo do briefing (serviços 50+100, peças 35+80)', () => {
  const t = calcTotals([L(1, 3500), L(1, 8000)], [L(1, 5000), L(1, 10000)])
  expect(t).toEqual({ servicesCents: 15000, partsCents: 11500, subtotalCents: 26500, discountCents: 0, totalCents: 26500 })
})
it('desconto por item e geral percentual', () => {
  expect(lineTotal(L(3, 1000, 500))).toBe(2500)
  const t = calcTotals([L(2, 10000)], [], { kind: 'percent', value: 1000 })
  expect(t.discountCents).toBe(2000)
  expect(t.totalCents).toBe(18000)
})
it('desconto nunca deixa total negativo', () => {
  expect(lineTotal(L(1, 1000, 5000))).toBe(0)
  const t = calcTotals([L(1, 1000)], [], { kind: 'amount', value: 99999 })
  expect(t.totalCents).toBe(0)
  expect(t.discountCents).toBe(1000)
})
it('quantidade fracionada arredonda em centavos', () => {
  expect(lineTotal(L(1.5, 333))).toBe(500)
})
