import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false,
      includeAssets: ['icons/synaxis-icon-v4-64.png', 'icons/synaxis-icon-v4-180.png', 'icons/synaxis-icon-v4-192.png', 'icons/synaxis-splash-v4-512.png', 'icons/synaxis-icon-v4-maskable-512.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/rest\//, /^\/auth\//, /^\/storage\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})