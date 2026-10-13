export type ShareResult = 'shared' | 'cancelled' | 'unsupported'

/** Compartilha o arquivo pela folha nativa (Web Share API com arquivos). */
export async function shareFile(file: File, title: string): Promise<ShareResult> {
  const nav = typeof navigator === 'undefined' ? undefined : navigator
  if (!nav || typeof nav.share !== 'function' || typeof nav.canShare !== 'function' || !nav.canShare({ files: [file] }))
    return 'unsupported'
  try {
    await nav.share({ files: [file], title })
    return 'shared'
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return 'cancelled'
    throw e
  }
}

/** Nome de arquivo seguro: "ORC-S-0003-Joao-da-Silva.pdf". */
export function pdfFileName(number: string, clientName: string): string {
  const slug = clientName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return `${number}${slug ? `-${slug}` : ''}.pdf`
}

export function toFile(blob: Blob, name: string): File {
  return new File([blob], name, { type: blob.type || 'application/pdf' })
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** Deve ser chamado direto de um toque (iOS bloqueia pop-ups fora de gestos do usuário). */
export function previewBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 120_000)
}

export function printBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden'
  frame.src = url
  frame.onload = () => {
    try {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    } catch {
      window.open(url, '_blank') // fallback: abre o PDF e o usuário imprime pelo visualizador
    }
    setTimeout(() => {
      frame.remove()
      URL.revokeObjectURL(url)
    }, 60_000)
  }
  document.body.appendChild(frame)
}
