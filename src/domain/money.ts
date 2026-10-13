/** Converte texto digitado ("1.234,56") em centavos. Vazio = 0; inválido = null. */
export function parseBRL(input: string): number | null {
  const s = input.replace(/R\$|\s/g, '')
  if (s === '') return 0
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(s)) return null
  const [int, dec = ''] = s.replace(/\./g, '').split(',')
  return parseInt(int, 10) * 100 + parseInt((dec + '00').slice(0, 2), 10)
}

export const formatBRL = (cents: number): string =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Centavos -> texto editável "1234,56" (sem símbolo). */
export const centsToInput = (cents: number): string =>
  cents === 0 ? '' : (cents / 100).toFixed(2).replace('.', ',')
