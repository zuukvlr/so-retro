// Gera logo otimizada e ícones do PWA a partir de assets-src/logo-original.png
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const SRC = 'assets-src/logo-original.png'
mkdirSync('public/icons', { recursive: true })

const trimmed = await sharp(SRC).trim().toBuffer() // remove margem transparente

async function icon(file, size, fill) {
  const inner = Math.round(size * fill)
  const logo = await sharp(trimmed).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: '#ffffff' } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(file)
}

await sharp(trimmed).resize(800, 800, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile('public/logo.png')
await icon('public/icons/apple-touch-icon.png', 180, 0.86)
await icon('public/icons/icon-192.png', 192, 0.9)
await icon('public/icons/icon-512.png', 512, 0.9)
await icon('public/icons/icon-maskable-512.png', 512, 0.62) // zona segura do ícone "maskable"
console.log('ícones gerados')
