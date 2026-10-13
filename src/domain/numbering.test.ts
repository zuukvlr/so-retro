import { it, expect } from 'vitest'
import { formatNumber } from './numbering'

it('formata prefixo + zeros', () => {
  expect(formatNumber('ORC-', 7, 4)).toBe('ORC-0007')
  expect(formatNumber('REC-', 12345, 4)).toBe('REC-12345')
})
