import { addDaysISO } from './dates'
import { calcTotals, type GeneralDiscount, type LineItem, type Totals } from './totals'
import type { ClientSnapshot, QuoteDoc, Settings } from './types'

export type QuoteDraft = Pick<
  QuoteDoc,
  | 'type' | 'issuedAt' | 'validUntil' | 'deliveryTerm' | 'paymentTerms' | 'notes' | 'privateNotes'
  | 'clientId' | 'equipment' | 'problem' | 'diagnosis'
> & {
  client: ClientSnapshot
  parts: LineItem[]
  services: LineItem[]
  discount?: GeneralDiscount
  totals: Totals
}

export type QuoteAction =
  | { type: 'addItem'; list: 'parts' | 'services'; item: LineItem }
  | { type: 'updateItem'; list: 'parts' | 'services'; id: string; patch: Partial<LineItem> }
  | { type: 'removeItem'; list: 'parts' | 'services'; id: string }
  | { type: 'setDiscount'; discount?: GeneralDiscount }
  | { type: 'setField'; patch: Partial<Omit<QuoteDraft, 'totals'>> }

export function emptyQuoteDraft(type: QuoteDraft['type'], s: Settings, today: string): QuoteDraft {
  return {
    type,
    issuedAt: today,
    validUntil: addDaysISO(today, s.defaultValidityDays),
    paymentTerms: s.defaultPaymentTerms,
    notes: s.defaultNotes,
    client: { name: '' },
    parts: [],
    services: [],
    totals: calcTotals([], []),
  }
}

const recalc = (d: QuoteDraft): QuoteDraft => ({ ...d, totals: calcTotals(d.parts, d.services, d.discount) })

export function quoteReducer(d: QuoteDraft, a: QuoteAction): QuoteDraft {
  switch (a.type) {
    case 'addItem':
      return recalc({ ...d, [a.list]: [...d[a.list], a.item] })
    case 'updateItem':
      return recalc({ ...d, [a.list]: d[a.list].map((i) => (i.id === a.id ? { ...i, ...a.patch } : i)) })
    case 'removeItem':
      return recalc({ ...d, [a.list]: d[a.list].filter((i) => i.id !== a.id) })
    case 'setDiscount':
      return recalc({ ...d, discount: a.discount })
    case 'setField':
      return recalc({ ...d, ...a.patch })
  }
}

/** Lista de erros legíveis; vazia = válido. */
export function validateQuote(d: QuoteDraft): string[] {
  const errs: string[] = []
  if (!d.client.name.trim()) errs.push('Informe o cliente.')
  if (d.parts.length + d.services.length === 0) errs.push('Adicione pelo menos um item.')
  const all = [...d.services, ...d.parts]
  if (all.some((i) => !i.description.trim())) errs.push('Todo item precisa de descrição.')
  if (all.some((i) => !(i.qty > 0))) errs.push('A quantidade de cada item deve ser maior que zero.')
  if (all.some((i) => i.unitCents < 0 || i.discountCents < 0)) errs.push('Valores não podem ser negativos.')
  if (d.validUntil && d.validUntil < d.issuedAt) errs.push('A validade não pode ser anterior à emissão.')
  return errs
}
