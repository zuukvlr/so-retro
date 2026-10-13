const U = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
const T = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
const H = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

function below1000(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'cem'
  const h = Math.floor(n / 100)
  const r = n % 100
  const out: string[] = []
  if (h) out.push(H[h])
  if (r) {
    if (r < 20) out.push(U[r])
    else {
      const t = Math.floor(r / 10)
      const u = r % 10
      out.push(u ? `${T[t]} e ${U[u]}` : T[t])
    }
  }
  return out.join(' e ')
}

export function integerToWords(n: number): string {
  if (n === 0) return 'zero'
  const g = [Math.floor(n / 1e9) % 1000, Math.floor(n / 1e6) % 1000, Math.floor(n / 1e3) % 1000, n % 1000]
  const names = [['bilhão', 'bilhões'], ['milhão', 'milhões']]
  const parts: { t: string; v: number }[] = []
  g.forEach((v, i) => {
    if (!v) return
    let t: string
    if (i === 2) t = v === 1 ? 'mil' : `${below1000(v)} mil`
    else if (i === 3) t = below1000(v)
    else t = `${below1000(v)} ${v === 1 ? names[i][0] : names[i][1]}`
    parts.push({ t, v })
  })
  return parts
    .map((p, i) => {
      if (i === 0) return p.t
      const last = i === parts.length - 1
      return (last && (p.v < 100 || p.v % 100 === 0) ? ' e ' : ' ') + p.t
    })
    .join('')
}

/** 12345 -> "cento e vinte e três reais e quarenta e cinco centavos" */
export function valorPorExtenso(cents: number): string {
  const r = Math.floor(cents / 100)
  const c = cents % 100
  const reais =
    r === 0 && c > 0 ? '' : `${integerToWords(r)}${r > 0 && r % 1_000_000 === 0 ? ' de' : ''} ${r === 1 ? 'real' : 'reais'}`
  const cent = c ? `${integerToWords(c)} ${c === 1 ? 'centavo' : 'centavos'}` : ''
  return [reais, cent].filter(Boolean).join(' e ')
}
