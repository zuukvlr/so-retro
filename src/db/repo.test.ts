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

it('dados padrão da Só Retro', async () => {
  const s = await repo.getSettings()
  expect(s).toMatchObject({
    companyName: 'SO RETRO COMERCIO E SERVIÇOS DE PEÇAS LTDA',
    cpfCnpj: '45.948.459/0001-50',
    phone: '92 99912-8548 / 92 98597-5792',
    address: 'Tv. Campos, 21 Jorge Teixeira 4 Manaus-AM',
    instagram: '@soretro2021so',
  })
})

it('configurações salvas antes (nome antigo "Só Retro", campos vazios) recebem os novos padrões', async () => {
  const db = await (await import('./db')).getDb()
  await db.put('settings', { key: 'main', companyName: 'Só Retro', cpfCnpj: undefined, phone: undefined, defaultValidityDays: 30 })
  const s = await repo.getSettings()
  expect(s.companyName).toBe('SO RETRO COMERCIO E SERVIÇOS DE PEÇAS LTDA')
  expect(s.cpfCnpj).toBe('45.948.459/0001-50')
  expect(s.defaultValidityDays).toBe(30) // o que o usuário mudou é mantido
})

it('nome e telefone que o usuário personalizou não são sobrescritos', async () => {
  const s = await repo.getSettings()
  await repo.saveSettings({ ...s, companyName: 'Outra Oficina', phone: '11 1111-1111', instagram: '' })
  const s2 = await repo.getSettings()
  expect(s2).toMatchObject({ companyName: 'Outra Oficina', phone: '11 1111-1111', instagram: '' })
})
