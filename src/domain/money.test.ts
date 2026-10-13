import { describe, it, expect } from 'vitest'
import { parseBRL, formatBRL } from './money'

describe('parseBRL', () => {
  it('aceita formatos comuns', () => {
    expect(parseBRL('1.234,56')).toBe(123456)
    expect(parseBRL('1234,5')).toBe(123450)
    expect(parseBRL('35')).toBe(3500)
    expect(parseBRL('R$ 80,00')).toBe(8000)
  })
  it('vazio é 0 e inválido é null', () => {
    expect(parseBRL('')).toBe(0)
    expect(parseBRL('abc')).toBeNull()
    expect(parseBRL('1,2,3')).toBeNull()
  })
})

describe('formatBRL', () => {
  it('formata', () => {
    expect(formatBRL(123456).replace(/\s/g, ' ')).toBe('R$ 1.234,56')
    expect(formatBRL(5)).toContain('0,05')
  })
})
