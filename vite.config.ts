import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// base './' → funktioniert auf GitHub Pages unabhängig vom Repository-Namen
export default defineConfig({
  base: './',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['icons/*.png', 'vocab.enc.json', 'robots.txt'],
      manifest: {
        name: 'Latein lernen',
        short_name: 'Latein',
        description: 'Vokabeln und Formen üben – Lektionen 1–11',
        lang: 'de',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        background_color: '#f2f2f7',
        theme_color: '#f2f2f7',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,json,svg,txt}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true
      }
    })
  ],
  test: { include: ['tests/**/*.test.ts'] }
});
