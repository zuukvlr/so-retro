export type LineItem = {
  id: string
  description: string
  code?: string
  qty: number
  unitCents: number
  discountCents: number
  /** custo interno de aquisição — nunca vai para o PDF (salvo opção explícita) */
  costCents?: number
}
export type GeneralDiscount = { kind: 'amount' | 'percent'; value: number } // amount: centavos; percent: bps
export type Totals = {
  servicesCents: number
  partsCents: number
  subtotalCents: number
  discountCents: number
  totalCents: number
}

export const lineTotal = (i: LineItem): number => Math.max(0, Math.round(i.qty * i.unitCents) - i.discountCents)
const sum = (l: LineItem[]) => l.reduce((a, i) => a + lineTotal(i), 0)

export function calcTotals(parts: LineItem[], services: LineItem[], d?: GeneralDiscount): Totals {
  const partsCents = sum(parts)
  const servicesCents = sum(services)
  const subtotalCents = partsCents + servicesCents
  let discountCents = !d ? 0 : d.kind === 'amount' ? d.value : Math.round((subtotalCents * d.value) / 10000)
  discountCents = Math.min(Math.max(0, discountCents), subtotalCents)
  return { servicesCents, partsCents, subtotalCents, discountCents, totalCents: subtotalCents - discountCents }
}
