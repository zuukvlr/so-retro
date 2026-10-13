import { it, expect } from 'vitest'
import { backupIsStale } from './storage'

const now = new Date('2026-10-30T12:00:00Z')

it('sem backup ou data inválida é considerado desatualizado', () => {
  expect(backupIsStale(undefined, now)).toBe(true)
  expect(backupIsStale('lixo', now)).toBe(true)
})
it('respeita o limite de 14 dias', () => {
  expect(backupIsStale('2026-10-20T12:00:00Z', now)).toBe(false)
  expect(backupIsStale('2026-10-10T12:00:00Z', now)).toBe(true)
})
