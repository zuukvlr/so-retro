import { it, expect } from 'vitest'
import { applyTheme } from './theme'

it('aplica e remove o tema no elemento raiz', () => {
  applyTheme('dark')
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  applyTheme('light')
  expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  applyTheme('auto')
  expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
})
