import { it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { Logo } from './Logo'
import { applyTheme } from './theme'
import { resetDbForTests } from '../db/repo'

beforeEach(async () => {
  await resetDbForTests()
})
afterEach(() => {
  cleanup()
  applyTheme('auto')
})

const src = () => screen.getByAltText('Só Retro').getAttribute('src')

it('tema claro usa a logo escura', () => {
  applyTheme('light')
  render(<Logo />)
  expect(src()).toBe('./logo.png')
})

it('tema escuro usa a logo branca', () => {
  applyTheme('dark')
  render(<Logo />)
  expect(src()).toBe('./logo-white.png')
})

it('troca a logo ao mudar o tema sem recarregar', () => {
  applyTheme('light')
  render(<Logo />)
  expect(src()).toBe('./logo.png')
  act(() => applyTheme('dark'))
  expect(src()).toBe('./logo-white.png')
  act(() => applyTheme('light'))
  expect(src()).toBe('./logo.png')
})
