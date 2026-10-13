import { it, expect } from 'vitest'
import { valorPorExtenso as v } from './extenso'

it('casos obrigatórios', () => {
  expect(v(1)).toBe('um centavo')
  expect(v(100)).toBe('um real')
  expect(v(100000)).toBe('mil reais')
  expect(v(210101)).toBe('dois mil cento e um reais e um centavo')
  expect(v(100000000)).toBe('um milhão de reais')
  expect(v(12345)).toBe('cento e vinte e três reais e quarenta e cinco centavos')
  expect(v(0)).toBe('zero reais')
  expect(v(250000)).toBe('dois mil e quinhentos reais')
  expect(v(10000)).toBe('cem reais')
})
