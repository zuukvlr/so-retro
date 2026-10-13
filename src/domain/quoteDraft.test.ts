import { describe, it, expect } from 'vitest'
import { emptyQuoteDraft, quoteReducer, validateQuote } from './quoteDraft'
import { defaultSettings } from '../db/repo'
import type { LineItem } from './totals'

const item = (id: string, qty: number, unitCents: number, extra: Partial<LineItem> = {}): LineItem => ({
  id, description: `item ${id}`, qty, unitCents, discountCents: 0, ...extra,
})
const base = () => emptyQuoteDraft('service_quote', defaultSettings(), '2026-10-13')

describe('quoteReducer', () => {
  it('exemplo do briefing: 2 serviços + 2 peças = R$ 265,00', () => {
    let s = base()
    s = quoteReducer(s, { type: 'addItem', list: 'services', item: item('s1', 1, 5000) })
    s = quoteReducer(s, { type: 'addItem', list: 'services', item: item('s2', 1, 10000) })
    s = quoteReducer(s, { type: 'addItem', list: 'parts', item: item('p1', 1, 3500) })
    s = quoteReducer(s, { type: 'addItem', list: 'parts', item: item('p2', 1, 8000) })
    expect(s.totals).toMatchObject({ servicesCents: 15000, partsCents: 11500, totalCents: 26500 })
  })
  it('editar e remover itens recalcula', () => {
    let s = quoteReducer(base(), { type: 'addItem', list: 'parts', item: item('p1', 1, 1000) })
    s = quoteReducer(s, { type: 'updateItem', list: 'parts', id: 'p1', patch: { qty: 3 } })
    expect(s.totals.totalCents).toBe(3000)
    s = quoteReducer(s, { type: 'removeItem', list: 'parts', id: 'p1' })
    expect(s.totals.totalCents).toBe(0)
  })
  it('desconto geral percentual', () => {
    let s = quoteReducer(base(), { type: 'addItem', list: 'services', item: item('s1', 1, 20000) })
    s = quoteReducer(s, { type: 'setDiscount', discount: { kind: 'percent', value: 1000 } })
    expect(s.totals).toMatchObject({ discountCents: 2000, totalCents: 18000 })
  })
})

describe('emptyQuoteDraft', () => {
  it('usa padrões das configurações (validade em dias)', () => {
    expect(base().validUntil).toBe('2026-10-28')
  })
})

describe('validateQuote', () => {
  const valid = () => {
    let s = base()
    s = quoteReducer(s, { type: 'setField', patch: { client: { name: 'João' } } })
    return quoteReducer(s, { type: 'addItem', list: 'services', item: item('s1', 1, 5000) })
  }
  it('aceita só serviços (sem peças)', () => expect(validateQuote(valid())).toEqual([]))
  it('exige cliente, ao menos um item e descrição/quantidade', () => {
    expect(validateQuote(base()).join(' ')).toMatch(/cliente/i)
    expect(validateQuote(base()).join(' ')).toMatch(/item/i)
    const bad = quoteReducer(valid(), { type: 'addItem', list: 'parts', item: { ...item('p', 0, 100), description: '' } })
    expect(validateQuote(bad).join(' ')).toMatch(/descrição|quantidade/i)
  })
  it('validade não pode ser antes da emissão', () => {
    const s = quoteReducer(valid(), { type: 'setField', patch: { validUntil: '2020-01-01' } })
    expect(validateQuote(s).join(' ')).toMatch(/validade/i)
  })
})
