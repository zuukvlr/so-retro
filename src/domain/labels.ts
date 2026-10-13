import type { DocType, PaymentMethod, QuoteStatus, ReceiptKind, ReceiptStatus } from './types'

export const TYPE_LABEL: Record<DocType, string> = {
  parts_quote: 'Orçamento de peças',
  service_quote: 'Orçamento de serviços',
  receipt: 'Recibo',
}
export const METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: 'Pix',
  cash: 'Dinheiro',
  debit: 'Cartão de débito',
  credit: 'Cartão de crédito',
  transfer: 'Transferência bancária',
  other: 'Outro',
}
export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  awaiting: 'Aguardando aprovação',
  approved: 'Aprovado',
  rejected: 'Recusado',
  expired: 'Expirado',
  cancelled: 'Cancelado',
}
export const RECEIPT_STATUS_LABEL: Record<ReceiptStatus, string> = {
  draft: 'Rascunho',
  issued: 'Emitido',
  cancelled: 'Cancelado',
}
export const KIND_LABEL: Record<ReceiptKind, string> = {
  service: 'Serviço realizado',
  parts: 'Peças vendidas',
  quote_payment: 'Pagamento de orçamento',
  deposit: 'Sinal ou entrada',
  partial: 'Pagamento parcial',
  settlement: 'Quitação total',
}
export const statusLabel = (type: DocType, status: string): string =>
  type === 'receipt' ? RECEIPT_STATUS_LABEL[status as ReceiptStatus] : QUOTE_STATUS_LABEL[status as QuoteStatus]
