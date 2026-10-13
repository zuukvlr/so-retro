import { it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ReceiptForm } from './ReceiptForm'
import { UiProvider } from '../UiProvider'
import { repo, resetDbForTests } from '../../db/repo'

beforeEach(async () => {
  await resetDbForTests()
})
afterEach(cleanup)

const type = (el: HTMLElement, v: string) => fireEvent.change(el, { target: { value: v } })
const renderForm = () =>
  render(<MemoryRouter><UiProvider><ReceiptForm /></UiProvider></MemoryRouter>)

async function fill(received: string, total: string) {
  await screen.findByText('Pagador')
  type(screen.getByLabelText('Pagador (nome)'), 'Ana Lima')
  type(screen.getByLabelText('Valor recebido (R$)'), received)
  type(screen.getByLabelText(/Valor total relacionado/), total)
  type(screen.getByLabelText('Referente a'), 'Manutenção da retroescavadeira')
}

it('recibo parcial: extenso, saldo, sem texto de quitação, salvo como rascunho', async () => {
  renderForm()
  await fill('100', '300')
  expect(screen.getByText(/Por extenso: Cem reais/)).toBeTruthy()
  expect(screen.getByText(/R\$\s*200,00/, { selector: 'b' })).toBeTruthy() // saldo
  type(screen.getByLabelText('Tipo de recebimento'), 'partial')
  expect(screen.getByText(/Pagamento parcial; saldo restante/)).toBeTruthy()
  expect(document.body.textContent).not.toMatch(/quitação total do valor/i)

  fireEvent.click(screen.getByText('Salvar rascunho'))
  await waitFor(async () => expect(await repo.listDocs()).toHaveLength(1))
  const [r] = await repo.listDocs()
  expect(r).toMatchObject({ type: 'receipt', number: 'REC-0001', status: 'draft', receivedCents: 10000, totalCents: 30000, kind: 'partial' })
})

it('quitação total exige valor recebido que cubra o total', async () => {
  renderForm()
  await fill('100', '300')
  type(screen.getByLabelText('Tipo de recebimento'), 'settlement')
  fireEvent.click(screen.getByText('Salvar rascunho'))
  expect(await screen.findByText(/Para quitação total/)).toBeTruthy()
  expect(await repo.listDocs()).toHaveLength(0)
})

it('emitir pede confirmação e só então grava como emitido', async () => {
  renderForm()
  await fill('300', '300')
  type(screen.getByLabelText('Tipo de recebimento'), 'settlement')
  fireEvent.click(screen.getByText('Emitir recibo', { selector: 'button.btn-primary' }))
  fireEvent.click(await screen.findByText('Emitir recibo', { selector: '.sheet button' }))
  await waitFor(async () => expect((await repo.listDocs())[0]?.status).toBe('issued'))
})
