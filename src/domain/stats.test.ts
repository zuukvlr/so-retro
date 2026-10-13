import { it, expect } from 'vitest'
import { dashboardStats } from './stats'
import type { Doc } from './types'

const q = (status: string, total: number, validUntil = '2099-01-01') =>
  ({ type: 'parts_quote', status, validUntil, totals: { totalCents: total } }) as unknown as Doc
const r = (status: string) => ({ type: 'receipt', status }) as unknown as Doc

it('conta orçamentos, pendentes, aprovados, total e recibos', () => {
  const s = dashboardStats(
    [q('draft', 1000), q('sent', 2000), q('awaiting', 3000), q('approved', 4000), q('cancelled', 9999), q('sent', 500, '2020-01-01'), r('issued'), r('draft'), r('cancelled')],
    '2026-10-13',
  )
  expect(s.quotesCount).toBe(5) // rascunho, enviado, aguardando, aprovado, expirado; cancelado fora
  expect(s.pendingCount).toBe(2) // expirado não conta como pendente
  expect(s.approvedCount).toBe(1)
  expect(s.totalQuotedCents).toBe(1000 + 2000 + 3000 + 4000 + 500)
  expect(s.receiptsCount).toBe(1) // só emitidos
})
