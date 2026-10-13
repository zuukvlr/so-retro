import { it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QuoteForm } from './QuoteForm'
import { UiProvider } from '../UiProvider'
import { repo, resetDbForTests } from '../../db/repo'

beforeEach(async () => {
  await resetDbForTests()
})
afterEach(cleanup)

const type = (el: HTMLElement, v: string) => fireEvent.change(el, { target: { value: v } })

function renderForm() {
  return render(
    <MemoryRouter>
      <UiProvider>
        <QuoteForm type="service_quote" />
      </UiProvider>
    </MemoryRouter>,
  )
}

it('orçamento de serviços com peças: totais do briefing e persistência', async () => {
  renderForm()
  await screen.findByText('Cliente')
  type(screen.getByLabelText('Cliente (nome)'), 'Maria Souza')

  for (let i = 0; i < 2; i++) fireEvent.click(screen.getByText('+ Adicionar serviço'))
  for (let i = 0; i < 2; i++) fireEvent.click(screen.getByText('+ Adicionar peça avulsa'))

  const desc = screen.getAllByLabelText(/Descrição do item/)
  const unit = screen.getAllByLabelText('Valor unitário (R$)')
  expect(desc).toHaveLength(4)
  const rows: [string, string][] = [['Diagnóstico técnico', '50'], ['Mão de obra', '100'], ['Rolo de alimentação', '35'], ['Kit de manutenção', '80']]
  rows.forEach(([d, v], i) => {
    type(desc[i], d)
    type(unit[i], v)
  })

  await waitFor(() => expect(screen.getByText(/R\$\s*265,00/, { selector: 'b' })).toBeTruthy())

  fireEvent.click(screen.getByText('Salvar orçamento'))
  await waitFor(async () => expect(await repo.listDocs()).toHaveLength(1))
  const [doc] = await repo.listDocs()
  expect(doc.number).toBe('ORC-S-0001')
  expect(doc.type).toBe('service_quote')
  if (doc.type === 'receipt') throw new Error('tipo inesperado')
  expect(doc.totals).toMatchObject({ servicesCents: 15000, partsCents: 11500, totalCents: 26500 })
  expect(doc.client.name).toBe('Maria Souza')
  expect(doc.status).toBe('draft')
})

it('sem cliente e sem itens: mostra erros e não salva', async () => {
  renderForm()
  await screen.findByText('Cliente')
  fireEvent.click(screen.getByText('Salvar orçamento'))
  expect(await screen.findByText('Informe o cliente.')).toBeTruthy()
  expect(screen.getByText('Adicione pelo menos um item.')).toBeTruthy()
  expect(await repo.listDocs()).toHaveLength(0)
})

it('desconto maior que o subtotal nunca gera total negativo', async () => {
  renderForm()
  await screen.findByText('Cliente')
  fireEvent.click(screen.getByText('+ Adicionar serviço'))
  type(screen.getByLabelText('Valor unitário (R$)'), '10')
  type(screen.getByLabelText('Tipo de desconto geral'), 'amount')
  type(screen.getByLabelText('Desconto geral (R$)'), '999')
  await waitFor(() => expect(screen.getByText(/R\$\s*0,00/, { selector: 'b' })).toBeTruthy())
})

it('CNPJ, telefone e e-mail digitados direto no orçamento, sem cadastrar o cliente', async () => {
  renderForm()
  await screen.findByText('Cliente')
  type(screen.getByLabelText('Cliente (nome)'), 'Oficina do Zé')
  // campos visíveis de cara, sem precisar abrir "mais dados"
  type(screen.getByLabelText('CPF ou CNPJ'), '12.345.678/0001-90')
  type(screen.getByLabelText('Telefone'), '(11) 3333-4444')
  type(screen.getByLabelText('E-mail'), 'ze@oficina.com')
  fireEvent.click(screen.getByText('+ Adicionar serviço'))
  type(screen.getByLabelText(/Descrição do item/), 'Revisão')
  type(screen.getByLabelText('Valor unitário (R$)'), '100')
  fireEvent.click(screen.getByText('Salvar orçamento'))
  await waitFor(async () => expect(await repo.listDocs()).toHaveLength(1))
  const [doc] = await repo.listDocs()
  expect(doc.client).toMatchObject({ name: 'Oficina do Zé', cpfCnpj: '12.345.678/0001-90', phone: '(11) 3333-4444', email: 'ze@oficina.com' })
  expect(doc.clientId).toBeUndefined() // não precisou cadastrar
  expect(await repo.listClients()).toHaveLength(0)
})
