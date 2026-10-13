const MAP: Record<string, string> = {
  '‘': "'", '’': "'", '“': '"', '”': '"', '–': '-', '—': '-', '•': '-', '…': '...', ' ': ' ',
}

/** Caracteres de controle e invisíveis que não devem ir para o PDF. */
function isInvisible(cp: number): boolean {
  return cp <= 0x1f || (cp >= 0x7f && cp <= 0x9f) || (cp >= 0x200b && cp <= 0x200f) || cp === 0x2028 || cp === 0x2029 || cp === 0xfeff
}

/** Deixa só o que a fonte padrão do PDF (Latin-1) desenha: acentos pt-BR ficam, o resto vira "?". */
export function sanitize(input: string | undefined | null): string {
  if (!input) return ''
  let out = ''
  for (const ch of input.normalize('NFC')) {
    const cp = ch.codePointAt(0)!
    if (MAP[ch] !== undefined) out += MAP[ch]
    else if (ch === '\n') out += ch
    else if (isInvisible(cp)) continue
    else if (cp <= 0xff) out += ch
    else out += '?'
  }
  return out
}
