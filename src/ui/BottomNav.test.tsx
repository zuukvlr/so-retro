import { it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BottomNav } from './BottomNav'

afterEach(cleanup)

it('mostra os 5 destinos e o botão de novo documento', () => {
  render(<MemoryRouter><BottomNav /></MemoryRouter>)
  for (const t of ['Início', 'Orçamentos', 'Recibos', 'Clientes', 'Config.']) expect(screen.getByText(t)).toBeTruthy()
  expect(screen.getByLabelText('Novo documento')).toBeTruthy()
})

it('botão + abre as 3 opções de criação', () => {
  render(<MemoryRouter><BottomNav /></MemoryRouter>)
  fireEvent.click(screen.getByLabelText('Novo documento'))
  for (const t of ['Orçamento de peças', 'Orçamento de serviços', 'Recibo']) expect(screen.getAllByText(t).length).toBeGreaterThan(0)
})

it('esconde o botão + nas telas de formulário (não cobre o total)', () => {
  for (const path of ['/new/service', '/new/parts', '/new/receipt', '/edit/abc']) {
    render(<MemoryRouter initialEntries={[path]}><BottomNav /></MemoryRouter>)
    expect(screen.queryByLabelText('Novo documento')).toBeNull()
    expect(screen.getByText('Início')).toBeTruthy() // o menu continua
    cleanup()
  }
})
