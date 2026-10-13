import autoTable from 'jspdf-autotable'
import type jsPDF from 'jspdf'
import { formatDateBR } from '../domain/dates'
import { TYPE_LABEL } from '../domain/labels'
import { formatBRL } from '../domain/money'
import { lineTotal, type LineItem } from '../domain/totals'
import type { QuoteDoc, Settings } from '../domain/types'
import { loadLogo } from './logo'
import {
  BOTTOM, BRAND, INK, LINE, M, W, drawFooters, drawHeader, ensureSpace, infoBlock, lastY, newDoc, paragraph,
  sectionTitle, signatureLine,
} from './pdfCommon'
import { publicQuoteView, type PublicQuote } from './publicView'
import { sanitize as S } from './sanitize'

const qtyText = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 3 })

function itemsTable(doc: jsPDF, y: number, items: LineItem[], withCost: boolean, title: string): number {
  const hasDiscount = items.some((i) => i.discountCents > 0)
  const head = ['Descrição', 'Qtd', 'Valor unit.', ...(hasDiscount ? ['Desconto'] : []), ...(withCost ? ['Custo'] : []), 'Total']
  const body = items.map((i) => [
    S(i.description) + (i.code ? `\nCód.: ${S(i.code)}` : ''),
    qtyText(i.qty),
    formatBRL(i.unitCents),
    ...(hasDiscount ? [i.discountCents ? `- ${formatBRL(i.discountCents)}` : '-'] : []),
    ...(withCost ? [i.costCents !== undefined ? formatBRL(i.costCents) : '-'] : []),
    formatBRL(lineTotal(i)),
  ])
  const right = { halign: 'right' as const }
  const columnStyles: Record<number, object> = { 0: { cellWidth: 'auto' } }
  for (let c = 1; c < head.length; c++) columnStyles[c] = { ...right, cellWidth: c === 1 ? 16 : 28 }
  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    margin: { left: M, right: M, top: 22, bottom: 297 - BOTTOM },
    theme: 'grid',
    rowPageBreak: 'avoid',
    showHead: 'everyPage',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2, overflow: 'linebreak', lineColor: LINE, lineWidth: 0.1, textColor: INK },
    headStyles: { fillColor: INK, textColor: BRAND, fontStyle: 'bold' },
    columnStyles,
    didDrawPage: (d) => {
      if (d.pageNumber > 1) {
        doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(105, 105, 105)
        doc.text(S(title), M, 12)
        doc.setDrawColor(...BRAND).setLineWidth(0.6).line(M, 14, 210 - M, 14)
      }
    },
  })
  return lastY(doc) + 6
}

export async function buildQuotePdf(q: QuoteDoc, s: Settings): Promise<Blob> {
  const v: PublicQuote = publicQuoteView(q, s)
  const logo = await loadLogo(s)
  const doc = newDoc()
  const title = `${TYPE_LABEL[v.type]} ${v.number}`
  let y = drawHeader(doc, s, logo, TYPE_LABEL[v.type], `Nº ${v.number}`)

  // Cliente e dados do documento
  const half = W / 2 - 4
  const yClient = infoBlock(doc, M, y, half, 'Cliente', [
    v.client.name,
    v.client.cpfCnpj ? `CPF/CNPJ: ${v.client.cpfCnpj}` : '',
    [v.client.phone && `Tel: ${v.client.phone}`, v.client.whatsapp && `WhatsApp: ${v.client.whatsapp}`].filter(Boolean).join('  '),
    v.client.email ?? '',
    v.client.address ?? '',
  ])
  const yDoc = infoBlock(doc, M + W / 2 + 4, y, half, 'Documento', [
    `Número: ${v.number}${v.version > 1 ? ` (versão ${v.version})` : ''}`,
    `Emissão: ${formatDateBR(v.issuedAt)}`,
    v.validUntil ? `Válido até: ${formatDateBR(v.validUntil)}` : '',
    v.deliveryTerm ? `Prazo: ${v.deliveryTerm}` : '',
  ])
  y = Math.max(yClient, yDoc) + 3

  if (v.type === 'service_quote') {
    const eq = v.equipment
    const eqLines = [eq?.item && `Veículo/Equipamento/Produto: ${eq.item}`, eq?.brand && `Marca: ${eq.brand}`, eq?.model && `Modelo: ${eq.model}`].filter(Boolean) as string[]
    if (eqLines.length) y = infoBlock(doc, M, ensureSpace(doc, y, 25, title), W, 'Veículo / Equipamento / Produto', eqLines) + 3
    y = paragraph(doc, y, 'Problema / solicitação', v.problem, title)
    y = paragraph(doc, y, 'Diagnóstico técnico', v.diagnosis, title)
  }

  if (v.services.length) {
    y = ensureSpace(doc, y, 30, title)
    y = itemsTable(doc, sectionTitle(doc, y, 'Serviços e mão de obra') + 1, v.services, false, title)
  }
  if (v.parts.length) {
    y = ensureSpace(doc, y, 30, title)
    const label = v.type === 'parts_quote' ? 'Peças e produtos' : 'Peças e materiais'
    y = itemsTable(doc, sectionTitle(doc, y, label) + 1, v.parts, s.showCostInPdf, title)
  }

  // Totais
  const t = v.totals
  const rows: [string, string][] = []
  if (v.services.length) rows.push(['Serviços e mão de obra', formatBRL(t.servicesCents)])
  if (v.parts.length) rows.push([v.type === 'parts_quote' ? 'Peças e produtos' : 'Peças e materiais', formatBRL(t.partsCents)])
  if (t.discountCents > 0) rows.push(['Descontos', `- ${formatBRL(t.discountCents)}`])
  y = ensureSpace(doc, y, rows.length * 6 + 16, title)
  const bx = M + W - 90
  doc.setFontSize(9.5)
  for (const [k, val] of rows) {
    doc.setFont('helvetica', 'normal').setTextColor(...INK)
    doc.text(k, bx, y)
    doc.text(val, M + W, y, { align: 'right' })
    y += 6
  }
  doc.setFillColor(...INK).rect(bx - 3, y - 1, 93, 11, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(255, 255, 255)
  doc.text('TOTAL', bx, y + 6.3)
  doc.setTextColor(...BRAND).setFontSize(13)
  doc.text(formatBRL(t.totalCents), M + W - 2, y + 6.5, { align: 'right' })
  doc.setTextColor(...INK)
  y += 18

  // Condições
  y = paragraph(doc, y, 'Condições de pagamento', v.paymentTerms, title)
  y = paragraph(doc, y, 'Observações', v.notes, title)
  y = paragraph(doc, y, 'Informações de pagamento', s.paymentInfo, title)

  // Assinaturas
  y = ensureSpace(doc, y, 15, title, 285) + 10
  signatureLine(doc, y, M, 78, 'Aceite do cliente')
  signatureLine(doc, y, M + W - 78, 78, S(s.companyName))

  drawFooters(doc, s)
  return doc.output('blob') as Blob
}
