import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      workbox: {
        // Solo cachear los assets estáticos del frontend (JS, CSS, HTML, imágenes).
        // NUNCA cachear respuestas del backend API: precios e inventario deben ser siempre en tiempo real.
        globPatterns: process.env.NODE_ENV === 'production' ? ['**/*.{js,css,html,ico,png,svg,woff2}'] : [],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // CONSTITUTION §5 — Single Source of Truth:
        // La API del backend es la fuente de verdad para datos financieros.
        // El SW debe actuar como un mensajero transparente para estas rutas.
        runtimeCaching: [
          {
            // Todo lo que vaya al backend: NetworkOnly (nunca servir desde caché)
            urlPattern: new RegExp(`^https?://${new URL(process.env.VITE_API_URL || 'http://localhost:8000').hostname.replace(/\./g, '\\.')}(:\\d+)?/.*`),
            handler: 'NetworkOnly',
          },
        ],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'DIROGSA Mobile',
        short_name: 'DIROGSA',
        description: 'DIROGSA Filtros - Experiencia Móvil',
        theme_color: '#0f172a',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 5175,
  }
})
