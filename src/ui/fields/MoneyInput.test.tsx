import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MoneyInput } from './MoneyInput'

afterEach(cleanup)

describe('MoneyInput', () => {
  it('converte texto em centavos', () => {
    const onChange = vi.fn()
    render(<MoneyInput value={0} onChange={onChange} label="Valor" />)
    fireEvent.change(screen.getByLabelText('Valor'), { target: { value: '1.234,56' } })
    expect(onChange).toHaveBeenLastCalledWith(123456)
  })
  it('texto inválido mostra erro e não propaga NaN', () => {
    const onChange = vi.fn()
    render(<MoneyInput value={0} onChange={onChange} label="Valor" />)
    fireEvent.change(screen.getByLabelText('Valor'), { target: { value: 'abc' } })
    expect(screen.getByText('Valor inválido')).toBeTruthy()
    expect(onChange).not.toHaveBeenCalled()
  })
  it('vazio vira zero', () => {
    const onChange = vi.fn()
    render(<MoneyInput value={500} onChange={onChange} label="Valor" />)
    fireEvent.change(screen.getByLabelText('Valor'), { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith(0)
  })
  it('usa teclado decimal no iPhone', () => {
    render(<MoneyInput value={0} onChange={() => {}} label="Valor" />)
    expect(screen.getByLabelText('Valor').getAttribute('inputmode')).toBe('decimal')
  })
})
