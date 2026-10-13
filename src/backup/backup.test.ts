import { it, expect, beforeEach } from 'vitest'
import { repo, resetDbForTests } from '../db/repo'
import { exportBackup, parseBackup, restoreBackup } from './backup'
import type { Doc } from '../domain/types'

beforeEach(async () => {
  await resetDbForTests()
})

const doc = { id: 'd1', type: 'receipt', status: 'issued', number: 'REC-0001' } as unknown as Doc

it('round-trip: exporta, zera e restaura tudo', async () => {
  await repo.saveClient({ id: 'c1', name: 'Maria' })
  await repo.savePart({ id: 'p1', description: 'Filtro', costCents: 10, priceCents: 20 })
  await repo.saveDoc(doc)
  await repo.allocateNumber('receipt')
  const s = await repo.getSettings()
  await repo.saveSettings({ ...s, companyName: 'Só Retro', logo: new Blob(['abc'], { type: 'image/png' }) })

  const blob = await exportBackup()
  await resetDbForTests()
  expect(await repo.listClients()).toHaveLength(0)

  await restoreBackup(parseBackup(await blob.text()))
  expect((await repo.listClients())[0].name).toBe('Maria')
  expect((await repo.listParts())[0].description).toBe('Filtro')
  expect((await repo.getDoc('d1'))?.number).toBe('REC-0001')
  const s2 = await repo.getSettings()
  expect(s2.companyName).toBe('Só Retro')
  expect(await s2.logo!.text()).toBe('abc')
  expect((await repo.allocateNumber('receipt')).number).toBe('REC-0002')
})

it('recusa arquivos inválidos', () => {
  expect(() => parseBackup('não é json')).toThrow()
  expect(() => parseBackup('{"foo":1}')).toThrow()
  expect(() => parseBackup(JSON.stringify({ app: 'so-retro', version: 99 }))).toThrow(/vers/i)
})

it('restore com documento malformado não altera os dados atuais', async () => {
  await repo.saveClient({ id: 'keep', name: 'Mantido' })
  const bad = { app: 'so-retro', version: 1, exportedAt: 'x', clients: [], parts: [], documents: [{ number: 'sem id' }], settings: null, counters: [] }
  await expect(async () => restoreBackup(parseBackup(JSON.stringify(bad)))).rejects.toThrow()
  expect((await repo.listClients())[0].name).toBe('Mantido')
})
