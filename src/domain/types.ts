import type { GeneralDiscount, LineItem, Totals } from './totals'

export type DocType = 'parts_quote' | 'service_quote' | 'receipt'
export type QuoteStatus = 'draft' | 'sent' | 'awaiting' | 'approved' | 'rejected' | 'expired' | 'cancelled'
export type ReceiptStatus = 'draft' | 'issued' | 'cancelled'
export type ReceiptKind = 'service' | 'parts' | 'quote_payment' | 'deposit' | 'partial' | 'settlement'
export type PaymentMethod = 'pix' | 'cash' | 'debit' | 'credit' | 'transfer' | 'other'

export type ClientSnapshot = {
  name: string
  cpfCnpj?: string
  phone?: string
  whatsapp?: string
  email?: string
  address?: string
}
export type Client = ClientSnapshot & { id: string; notes?: string }
export type Part = { id: string; description: string; code?: string; costCents: number; priceCents: number }

export type Settings = {
  companyName: string
  legalName?: string
  cpfCnpj?: string
  phone?: string
  whatsapp?: string
  email?: string
  address?: string
  paymentInfo?: string
  defaultPaymentTerms?: string
  defaultValidityDays: number
  defaultNotes?: string
  prefixes: Record<DocType, string>
  pad: number
  startAt: Record<DocType, number>
  theme: 'auto' | 'light' | 'dark'
  showCostInPdf: boolean
  lastBackupAt?: string
  logo?: Blob
}

export type HistoryEntry = { at: string; event: string }

type DocBase = {
  id: string
  number: string
  seq: number
  version: number
  parentId?: string
  createdAt: string
  issuedAt: string // YYYY-MM-DD
  clientId?: string
  client: ClientSnapshot
  notes?: string
  privateNotes?: string
  history: HistoryEntry[]
}

export type QuoteDoc = DocBase & {
  type: 'parts_quote' | 'service_quote'
  status: QuoteStatus
  validUntil?: string
  deliveryTerm?: string
  paymentTerms?: string
  parts: LineItem[]
  services: LineItem[]
  discount?: GeneralDiscount
  totals: Totals
  /** Veículo, equipamento ou produto atendido (oficina) */
  equipment?: { item?: string; horimeter?: string }
  problem?: string
  diagnosis?: string
}

export type ReceiptDoc = DocBase & {
  type: 'receipt'
  status: ReceiptStatus
  kind: ReceiptKind
  receivedCents: number
  totalCents?: number
  payer: ClientSnapshot
  issuer: ClientSnapshot
  method: PaymentMethod
  reference: string
  linkedQuoteId?: string
}

export type Doc = QuoteDoc | ReceiptDoc
