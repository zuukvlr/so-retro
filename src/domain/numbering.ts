export const formatNumber = (prefix: string, seq: number, pad: number): string =>
  `${prefix}${String(seq).padStart(pad, '0')}`
