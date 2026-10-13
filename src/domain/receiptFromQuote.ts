import type { QuoteDoc, ReceiptDoc } from './types'

/** Dados importáveis de um orçamento para um recibo (sem custo interno nem observações privadas). */
export function receiptFromQuote(q: QuoteDoc): Partial<ReceiptDoc> {
  const names = [...q.services, ...q.parts].map((i) => i.description).filter(Boolean)
  const resumo = names.slice(0, 3).join(', ') + (names.length > 3 ? ` e mais ${names.length - 3} item(ns)` : '')
  return {
    clientId: q.clientId,
    client: { ...q.client },
    payer: { ...q.client },
    totalCents: q.totals.totalCents,
    reference: `Orçamento ${q.number}${resumo ? `: ${resumo}` : ''}`,
    linkedQuoteId: q.id,
    kind: 'quote_payment',
  }
}
