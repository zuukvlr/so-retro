import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// base './' faz o app funcionar em qualquer subcaminho de hospedagem estática (ex.: GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Só Retro – Peças e Serviços',
        short_name: 'Só Retro',
        description: 'Orçamentos de peças, orçamentos de serviços e recibos em PDF.',
        lang: 'pt-BR',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        background_color: '#ffffff',
        theme_color: '#0b0b0b',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff,woff2,ttf}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'] },
})
