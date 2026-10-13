import { formatBRL } from './money'
import type { ReceiptDoc } from './types'

export const balanceCents = (r: ReceiptDoc): number | null =>
  r.totalCents == null ? null : Math.max(0, r.totalCents - r.receivedCents)

/** Texto de confirmação. Só declara quitação quando for "quitação" E o saldo for zero. */
export function receiptConfirmationText(r: ReceiptDoc, extenso: string): string {
  const base = `Recebi de ${r.payer.name} a quantia de ${formatBRL(r.receivedCents)} (${extenso}), referente a ${r.reference}.`
  const bal = balanceCents(r)
  if (r.kind === 'settlement' && bal === 0) return `${base} Com este pagamento, declaro quitação total do valor relacionado.`
  if (r.kind === 'deposit') return `${base} Valor recebido a título de sinal/entrada.`
  if (bal !== null && bal > 0) return `${base} Pagamento parcial; saldo restante de ${formatBRL(bal)}.`
  return `${base} Pagamento parcial do valor relacionado.`
}
