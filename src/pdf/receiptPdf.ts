import { formatDateBR } from '../domain/dates'
import { valorPorExtenso } from '../domain/extenso'
import { KIND_LABEL, METHOD_LABEL } from '../domain/labels'
import { formatBRL } from '../domain/money'
import { balanceCents, receiptConfirmationText } from '../domain/receipt'
import type { ReceiptDoc, Settings } from '../domain/types'
import { loadLogo } from './logo'
import {
  BRAND, INK, LINE, M, W, drawFooters, drawHeader, ensureSpace, infoBlock, newDoc, paragraph, signatureLine,
} from './pdfCommon'
import { publicReceiptView } from './publicView'

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

export async function buildReceiptPdf(r: ReceiptDoc, s: Settings): Promise<Blob> {
  const v = publicReceiptView(r)
  const logo = await loadLogo(s)
  const doc = newDoc()
  const title = `Recibo ${v.number}`
  let y = drawHeader(doc, s, logo, 'Recibo', `Nº ${v.number}`)

  // Valor em destaque
  doc.setFillColor(...BRAND).roundedRect(M, y, W, 24, 2, 2, 'F')
  doc.setTextColor(...INK).setFont('helvetica', 'bold').setFontSize(9)
  doc.text('VALOR RECEBIDO', M + 5, y + 7)
  doc.setFontSize(22)
  doc.text(formatBRL(v.receivedCents), M + 5, y + 18)
  doc.setFont('helvetica', 'normal').setFontSize(9)
  doc.text(`Emitido em ${formatDateBR(v.issuedAt)}`, M + W - 5, y + 7, { align: 'right' })
  doc.text(KIND_LABEL[v.kind], M + W - 5, y + 18, { align: 'right' })
  y += 32

  const extenso = valorPorExtenso(v.receivedCents)
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(105, 105, 105)
  doc.text(`(${cap(extenso)})`, M, y)
  y += 8

  y = paragraph(doc, y, 'Declaração', receiptConfirmationText(r, extenso), title)

  // Partes
  const half = W / 2 - 4
  const yPayer = infoBlock(doc, M, ensureSpace(doc, y, 30, title), half, 'Pagador', [
    v.payer.name, v.payer.cpfCnpj ? `CPF/CNPJ: ${v.payer.cpfCnpj}` : '', v.payer.address ?? '',
  ])
  const yIssuer = infoBlock(doc, M + W / 2 + 4, y, half, 'Recebedor', [
    v.issuer.name, v.issuer.cpfCnpj ? `CPF/CNPJ: ${v.issuer.cpfCnpj}` : '', v.issuer.address ?? '', v.issuer.phone ? `Tel: ${v.issuer.phone}` : '',
  ])
  y = Math.max(yPayer, yIssuer) + 4

  // Valores
  const bal = balanceCents(r)
  const lines: [string, string][] = [['Forma de pagamento', METHOD_LABEL[v.method]], ['Valor recebido', formatBRL(v.receivedCents)]]
  if (v.totalCents != null) lines.splice(1, 0, ['Valor total relacionado', formatBRL(v.totalCents)])
  if (bal !== null) lines.push(['Saldo restante', formatBRL(bal)])
  y = ensureSpace(doc, y, lines.length * 7 + 6, title)
  doc.setDrawColor(...LINE).setLineWidth(0.2)
  for (const [k, val] of lines) {
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(105, 105, 105).text(k, M, y)
    doc.setFont('helvetica', 'bold').setTextColor(...INK).text(val, M + W, y, { align: 'right' })
    doc.line(M, y + 2, M + W, y + 2)
    y += 7
  }
  y += 3
  y = paragraph(doc, y, 'Referente a', v.reference, title)
  y = paragraph(doc, y, 'Observações', v.notes, title)

  y = ensureSpace(doc, y, 30, title) + 16
  signatureLine(doc, y, M + W / 2 - 40, 80, v.issuer.name || s.companyName)

  drawFooters(doc, s)
  return doc.output('blob') as Blob
}
