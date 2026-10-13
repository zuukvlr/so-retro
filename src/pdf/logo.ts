import type { Settings } from '../domain/types'

export type PreparedLogo = { dataUrl: string; w: number; h: number }

/** Reduz a logo (máx. 400px, fundo branco) e devolve JPEG leve; em ambientes sem canvas devolve null (PDF sai sem logo). */
export async function prepareLogo(blob: Blob): Promise<PreparedLogo | null> {
  try {
    const bmp = await createImageBitmap(blob)
    const k = Math.min(1, 400 / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * k)
    const h = Math.round(bmp.height * k)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(bmp, 0, 0, w, h)
    return { dataUrl: canvas.toDataURL('image/jpeg', 0.92), w, h }
  } catch {
    return null
  }
}

let defaultLogo: Promise<PreparedLogo | null> | null = null

/** Logo das configurações ou, se não houver, a logo padrão empacotada no app. */
export async function loadLogo(s: Pick<Settings, 'logo'>): Promise<PreparedLogo | null> {
  if (s.logo) return prepareLogo(s.logo)
  if (!defaultLogo) {
    defaultLogo = (async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}logo.png`)
        if (!res.ok) return null
        return await prepareLogo(await res.blob())
      } catch {
        return null
      }
    })()
  }
  return defaultLogo
}
