import { jsPDF } from 'jspdf'
import type { Settings } from '../domain/types'
import type { PreparedLogo } from './logo'
import { sanitize as S } from './sanitize'

export type RGB = [number, number, number]
export const INK: RGB = [11, 11, 11]
export const BRAND: RGB = [235, 175, 41]
export const GREY: RGB = [105, 105, 105]
export const LINE: RGB = [220, 216, 205]
export const M = 15 // margem lateral (mm)
export const W = 210 - 2 * M // largura útil
export const BOTTOM = 297 - 24 // limite inferior do conteúdo

export const newDoc = () => new jsPDF({ unit: 'mm', format: 'a4' })
export const lastY = (doc: jsPDF): number => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY

export function companyLines(s: Settings): string[] {
  return [
    s.legalName && s.legalName !== s.companyName ? s.legalName : '',
    s.cpfCnpj ? `CPF/CNPJ: ${s.cpfCnpj}` : '',
    [s.phone && `Tel: ${s.phone}`, s.whatsapp && `WhatsApp: ${s.whatsapp}`].filter(Boolean).join('  '),
    s.email ?? '',
    s.address ?? '',
  ]
    .filter(Boolean)
    .map(S)
}

/** Cabeçalho da 1ª página. Devolve o Y livre abaixo dele. */
export function drawHeader(doc: jsPDF, s: Settings, logo: PreparedLogo | null, title: string, number: string): number {
  const size = 28
  if (logo) {
    const k = logo.w / logo.h
    const w = k >= 1 ? size : size * k
    const h = k >= 1 ? size / k : size
    doc.addImage(logo.dataUrl, 'JPEG', M, 8 + (size - h) / 2, w, h)
  }
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold').setFontSize(15)
  doc.text(S(s.companyName), 210 - M, 14, { align: 'right' })
  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...GREY)
  let y = 19
  for (const l of companyLines(s)) {
    for (const part of doc.splitTextToSize(l, 100) as string[]) {
      doc.text(part, 210 - M, y, { align: 'right' })
      y += 4
    }
  }
  const barY = Math.max(40, y + 2)
  doc.setFillColor(...INK).rect(M, barY, W, 11, 'F')
  doc.setFillColor(...BRAND).rect(M, barY + 11, W, 1.2, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(255, 255, 255)
  doc.text(S(title).toUpperCase(), M + 4, barY + 7.3)
  doc.setTextColor(...BRAND)
  doc.text(S(number), 210 - M - 4, barY + 7.3, { align: 'right' })
  doc.setTextColor(...INK)
  return barY + 18
}

/** Garante h mm livres; se não couber, abre nova página (com mini-cabeçalho). */
export function ensureSpace(doc: jsPDF, y: number, h: number, runningTitle: string, limit: number = BOTTOM): number {
  if (y + h <= limit) return y
  doc.addPage()
  doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(...GREY)
  doc.text(S(runningTitle), M, 12)
  doc.setDrawColor(...BRAND).setLineWidth(0.6).line(M, 14, 210 - M, 14)
  doc.setTextColor(...INK)
  return 20
}

export function sectionTitle(doc: jsPDF, y: number, text: string): number {
  doc.setFillColor(...BRAND).rect(M, y - 4, 1.6, 5.5, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(...INK)
  doc.text(S(text).toUpperCase(), M + 4, y)
  return y + 3
}

/** Parágrafo com quebra de linha e de página (nunca corta texto). */
export function paragraph(doc: jsPDF, y: number, label: string, text: string | undefined, title: string): number {
  const t = S(text).trim()
  if (!t) return y
  doc.setFontSize(9)
  const lines = doc.splitTextToSize(t, W) as string[]
  y = ensureSpace(doc, y, 10, title)
  doc.setFont('helvetica', 'bold').setTextColor(...GREY).text(S(label).toUpperCase(), M, y)
  y += 4.2
  doc.setFont('helvetica', 'normal').setTextColor(...INK)
  for (const l of lines) {
    y = ensureSpace(doc, y, 5, title)
    doc.text(l, M, y)
    y += 4.4
  }
  return y + 2
}

/** Bloco rótulo/valores em uma coluna. Devolve o Y final. */
export function infoBlock(doc: jsPDF, x: number, y: number, w: number, heading: string, lines: string[]): number {
  doc.setFont('helvetica', 'bold').setFontSize(8.5).setTextColor(...GREY)
  doc.text(S(heading).toUpperCase(), x, y)
  y += 4.5
  doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...INK)
  for (const raw of lines.map(S).filter(Boolean)) {
    for (const l of doc.splitTextToSize(raw, w) as string[]) {
      doc.text(l, x, y)
      y += 4.5
    }
  }
  return y
}

/** Rodapé com contatos e "Página X de Y" em todas as páginas. */
export function drawFooters(doc: jsPDF, s: Settings): void {
  const n = doc.getNumberOfPages()
  const contact = S(
    [s.companyName, s.phone && `Tel: ${s.phone}`, s.whatsapp && `WhatsApp: ${s.whatsapp}`, s.email].filter(Boolean).join('  |  '),
  )
  for (let i = 1; i <= n; i++) {
    doc.setPage(i)
    doc.setDrawColor(...BRAND).setLineWidth(0.6).line(M, 286, 210 - M, 286)
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...GREY)
    doc.text(contact, M, 291)
    doc.text(`Página ${i} de ${n}`, 210 - M, 291, { align: 'right' })
  }
}

export function signatureLine(doc: jsPDF, y: number, x: number, w: number, label: string): void {
  doc.setDrawColor(...INK).setLineWidth(0.3).line(x, y, x + w, y)
  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...GREY)
  doc.text(S(label), x + w / 2, y + 4.5, { align: 'center' })
}
