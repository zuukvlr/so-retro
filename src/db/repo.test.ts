import { it, expect, beforeEach } from 'vitest'
import { repo, resetDbForTests } from './repo'
import type { Doc } from '../domain/types'

beforeEach(async () => {
  await resetDbForTests()
})

it('numeração sequencial por tipo', async () => {
  expect((await repo.allocateNumber('parts_quote')).number).toBe('ORC-P-0001')
  expect((await repo.allocateNumber('parts_quote')).number).toBe('ORC-P-0002')
  expect((await repo.allocateNumber('receipt')).number).toBe('REC-0001')
})

it('numeração concorrente não repete', async () => {
  const r = await Promise.all([1, 2, 3, 4, 5].map(() => repo.allocateNumber('service_quote')))
  expect(new Set(r.map((x) => x.seq)).size).toBe(5)
})

it('respeita startAt configurado', async () => {
  const s = await repo.getSettings()
  await repo.saveSettings({ ...s, startAt: { ...s.startAt, receipt: 100 } })
  expect((await repo.allocateNumber('receipt')).seq).toBe(100)
})

it('persiste cliente e peça', async () => {
  await repo.saveClient({ id: 'c1', name: 'João' })
  await repo.savePart({ id: 'p1', description: 'Rolo', costCents: 100, priceCents: 300 })
  expect((await repo.listClients())[0].name).toBe('João')
  expect((await repo.listParts())[0].costCents).toBe(100)
  await repo.deleteClient('c1')
  expect(await repo.listClients()).toHaveLength(0)
})

it('impede excluir documento emitido, mas exclui rascunho', async () => {
  await repo.saveDoc({ id: 'd1', type: 'receipt', status: 'issued' } as unknown as Doc)
  await repo.saveDoc({ id: 'd2', type: 'receipt', status: 'draft' } as unknown as Doc)
  await expect(repo.deleteDoc('d1')).rejects.toThrow(/cancele/)
  await repo.deleteDoc('d2')
  expect(await repo.getDoc('d2')).toBeUndefined()
})

it('settings padrão quando vazio', async () => {
  const s = await repo.getSettings()
  expect(s.pad).toBe(4)
  expect(s.showCostInPdf).toBe(false)
  expect(s.defaultValidityDays).toBe(15)
})
