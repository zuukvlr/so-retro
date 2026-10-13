import { it, expect } from 'vitest'
import { effectiveStatus, isEditable } from './status'
import type { Doc, QuoteDoc } from './types'

const q = (status: string, validUntil?: string) => ({ status, validUntil, type: 'parts_quote' }) as unknown as QuoteDoc

it('expira só enviado/aguardando vencidos', () => {
  expect(effectiveStatus(q('sent', '2026-01-01'), '2026-01-02')).toBe('expired')
  expect(effectiveStatus(q('sent', '2026-01-02'), '2026-01-02')).toBe('sent')
  expect(effectiveStatus(q('approved', '2026-01-01'), '2026-06-01')).toBe('approved')
  expect(effectiveStatus(q('draft', '2026-01-01'), '2026-06-01')).toBe('draft')
})
it('só rascunho é editável', () => {
  expect(isEditable(q('draft') as Doc)).toBe(true)
  expect(isEditable(q('sent') as Doc)).toBe(false)
  expect(isEditable({ type: 'receipt', status: 'issued' } as unknown as Doc)).toBe(false)
})
