import { describe, it, expect } from 'vitest'
import { publicQuoteView, buildQuotePdf, buildReceiptPdf } from './index'
import { sanitize } from './sanitize'
import { defaultSettings } from '../db/repo'
import { blobToBuffer } from '../db/blob'
import { calcTotals, type LineItem } from '../domain/totals'
import type { QuoteDoc, ReceiptDoc } from '../domain/types'

const item = (i: number, extra: Partial<LineItem> = {}): LineItem => ({
  id: `i${i}`, description: `Peça número ${i} com descrição acentuada ção`, code: `C${i}`, qty: 2, unitCents: 1990, discountCents: 0, costCents: 777, ...extra,
})

function quote(nParts = 3, nServices = 2): QuoteDoc {
  const parts = Array.from({ length: nParts }, (_, i) => item(i))
  const services = Array.from({ length: nServices }, (_, i) => item(1000 + i, { costCents: undefined }))
  return {
    id: 'q1', type: 'service_quote', number: 'ORC-S-0001', seq: 1, version: 1, status: 'sent',
    createdAt: '2026-10-13T10:00:00Z', issuedAt: '2026-10-13', validUntil: '2026-10-28',
    client: { name: 'Cliente Teste' }, parts, services, totals: calcTotals(parts, services),
    notes: 'Obs pública', privateNotes: 'SEGREDO123', history: [{ at: 'x', event: 'EVENTOINTERNO' }],
    paymentTerms: 'Pix à vista',
  }
}

const rawText = async (b: Blob) => new TextDecoder('latin1').decode(await blobToBuffer(b))

describe('publicQuoteView', () => {
  it('remove custo, observações privadas e histórico', () => {
    const json = JSON.stringify(publicQuoteView(quote(), defaultSettings()))
    expect(json).not.toContain('SEGREDO123')
    expect(json).not.toContain('EVENTOINTERNO')
    expect(json).not.toContain('costCents')
    expect(json).not.toContain('777')
  })
  it('mantém custo só com opção explícita', () => {
    const json = JSON.stringify(publicQuoteView(quote(), { ...defaultSettings(), showCostInPdf: true }))
    expect(json).toContain('777')
    expect(json).not.toContain('SEGREDO123')
  })
})

describe('sanitize', () => {
  it('troca caracteres que a fonte não suporta e preserva acentos', () => {
    expect(sanitize('ação ç ã é — “ok”\u0000​😀…')).toBe('ação ç ã é - "ok"?...')
  })
})

describe('buildQuotePdf', () => {
  it('gera PDF válido e sem dados internos', async () => {
    const b = await buildQuotePdf(quote(), defaultSettings())
    expect(b.type).toBe('application/pdf')
    expect(b.size).toBeGreaterThan(1000)
    const t = await rawText(b)
    expect(t.startsWith('%PDF')).toBe(true)
    expect(t).not.toContain('SEGREDO123')
    expect(t).not.toContain('EVENTOINTERNO')
  })
  it('80 itens quebram em várias páginas', async () => {
    const b = await buildQuotePdf(quote(80, 5), defaultSettings())
    const t = await rawText(b)
    const pages = (t.match(/\/Type\s*\/Page[^s]/g) ?? []).length
    expect(pages).toBeGreaterThan(2)
  })
  it('só serviços (sem peças) funciona', async () => {
    const b = await buildQuotePdf(quote(0, 2), defaultSettings())
    expect(b.size).toBeGreaterThan(1000)
  })
})

describe('buildReceiptPdf', () => {
  it('gera recibo parcial com saldo', async () => {
    const r = {
      id: 'r1', type: 'receipt', number: 'REC-0001', seq: 1, version: 1, status: 'issued', createdAt: 'x', issuedAt: '2026-10-13',
      client: { name: 'Ana' }, payer: { name: 'Ana', cpfCnpj: '123' }, issuer: { name: 'Só Retro' }, kind: 'partial',
      receivedCents: 10000, totalCents: 30000, method: 'pix', reference: 'Serviço de manutenção', history: [], privateNotes: 'SEGREDO123',
    } as unknown as ReceiptDoc
    const b = await buildReceiptPdf(r, defaultSettings())
    const t = await rawText(b)
    expect(t.startsWith('%PDF')).toBe(true)
    expect(t).toContain('RECIBO')
    expect(t).not.toContain('SEGREDO123')
    expect(t).not.toMatch(/quita/i)
  })
})
