import type { LineItem } from '../domain/totals'
import type { QuoteDoc, ReceiptDoc, Settings } from '../domain/types'

export type PublicQuote = Omit<QuoteDoc, 'privateNotes' | 'history' | 'parts' | 'services'> & {
  parts: LineItem[]
  services: LineItem[]
}
export type PublicReceipt = Omit<ReceiptDoc, 'privateNotes' | 'history'>

const stripItem = (i: LineItem, showCost: boolean): LineItem => {
  const { costCents, ...rest } = i
  return showCost && costCents !== undefined ? { ...rest, costCents } : rest
}

/** Única fonte de dados do PDF: nada de custo, observação privada ou histórico (salvo opção explícita de custo). */
export function publicQuoteView(q: QuoteDoc, s: Pick<Settings, 'showCostInPdf'>): PublicQuote {
  const { privateNotes: _p, history: _h, ...rest } = q
  void _p
  void _h
  return {
    ...rest,
    parts: q.parts.map((i) => stripItem(i, s.showCostInPdf)),
    services: q.services.map((i) => stripItem(i, false)), // custo de serviço não existe
  }
}

export function publicReceiptView(r: ReceiptDoc): PublicReceipt {
  const { privateNotes: _p, history: _h, ...rest } = r
  void _p
  void _h
  return rest
}
