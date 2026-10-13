import { effectiveStatus } from './status'
import type { Doc } from './types'

export type DashboardStats = {
  quotesCount: number
  pendingCount: number
  approvedCount: number
  totalQuotedCents: number
  receiptsCount: number
}

export function dashboardStats(docs: Doc[], today: string): DashboardStats {
  const out: DashboardStats = { quotesCount: 0, pendingCount: 0, approvedCount: 0, totalQuotedCents: 0, receiptsCount: 0 }
  for (const d of docs) {
    if (d.type === 'receipt') {
      if (d.status === 'issued') out.receiptsCount++
      continue
    }
    if (d.status === 'cancelled') continue
    out.quotesCount++
    out.totalQuotedCents += d.totals.totalCents
    const st = effectiveStatus(d, today)
    if (st === 'sent' || st === 'awaiting') out.pendingCount++
    if (st === 'approved') out.approvedCount++
  }
  return out
}
