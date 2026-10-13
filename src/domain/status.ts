import type { Doc, QuoteDoc, QuoteStatus } from './types'

/** Enviado/aguardando com validade vencida aparece como "expirado". */
export function effectiveStatus(q: QuoteDoc, todayISO: string): QuoteStatus {
  if ((q.status === 'sent' || q.status === 'awaiting') && q.validUntil && q.validUntil < todayISO) return 'expired'
  return q.status
}

export const isEditable = (d: Doc): boolean => d.status === 'draft'
