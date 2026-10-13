import { describe, it, expect, afterEach, vi } from 'vitest'
import { shareFile, pdfFileName } from './share'

const file = () => new File(['%PDF'], 'a.pdf', { type: 'application/pdf' })
const setNav = (v: Partial<Navigator>) => Object.defineProperty(globalThis, 'navigator', { value: v, configurable: true })
const original = globalThis.navigator

afterEach(() => Object.defineProperty(globalThis, 'navigator', { value: original, configurable: true }))

describe('shareFile', () => {
  it('compartilha o arquivo quando suportado', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    setNav({ canShare: () => true, share } as unknown as Navigator)
    expect(await shareFile(file(), 'Orçamento')).toBe('shared')
    expect(share).toHaveBeenCalledOnce()
    expect(share.mock.calls[0][0].files).toHaveLength(1)
  })
  it('cancelamento pelo usuário não é erro', async () => {
    const err = Object.assign(new Error('x'), { name: 'AbortError' })
    setNav({ canShare: () => true, share: vi.fn().mockRejectedValue(err) } as unknown as Navigator)
    expect(await shareFile(file(), 't')).toBe('cancelled')
  })
  it('sem suporte a arquivos devolve unsupported', async () => {
    setNav({} as Navigator)
    expect(await shareFile(file(), 't')).toBe('unsupported')
    setNav({ canShare: () => false, share: vi.fn() } as unknown as Navigator)
    expect(await shareFile(file(), 't')).toBe('unsupported')
  })
  it('outros erros são propagados', async () => {
    setNav({ canShare: () => true, share: vi.fn().mockRejectedValue(new Error('boom')) } as unknown as Navigator)
    await expect(shareFile(file(), 't')).rejects.toThrow('boom')
  })
})

describe('pdfFileName', () => {
  it('monta nome seguro', () => {
    expect(pdfFileName('ORC-S-0003', 'João da Silva/Cia: "X"')).toBe('ORC-S-0003-Joao-da-Silva-Cia-X.pdf')
    expect(pdfFileName('REC-0001', '')).toBe('REC-0001.pdf')
  })
})
