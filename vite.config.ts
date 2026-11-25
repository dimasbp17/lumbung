import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // A new version waits until the user taps "Muat ulang" (see PwaUpdatePrompt),
      // so a half-filled form is never lost to an automatic reload.
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        id: '/',
        name: 'Lumbung — Keuangan Keluarga',
        short_name: 'Lumbung',
        description: 'Catatan keuangan keluarga: transaksi, dompet, anggaran, tabungan, dan tagihan.',
        lang: 'id',
        dir: 'ltr',
        start_url: '/beranda',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f3f8f6',
        theme_color: '#007f51',
        categories: ['finance', 'productivity'],
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/images/logo-lumbung.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
        shortcuts: [
          { name: 'Transaksi', url: '/transaksi', icons: [{ src: '/icons/pwa-192.png', sizes: '192x192' }] },
          { name: 'Tagihan rutin', url: '/tagihan', icons: [{ src: '/icons/pwa-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // App shell: every route is served index.html, React Router takes it from there.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/downloads\//],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Only the Latin font subset is needed for Indonesian text.
        globIgnores: ['**/inter-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // The user guide PDF is large and rarely used: cache it after the first download.
            urlPattern: ({ url }) => url.pathname.startsWith('/downloads/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'downloads', expiration: { maxEntries: 5 } },
          },
        ],
        // Supabase requests are cross-origin and are never cached: data is always live.
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
