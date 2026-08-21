import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'logo.png',
      ],

      manifest: {
        name: 'CURA — Clinic Management',
        short_name: 'CURA',
        description: 'نظام إدارة العيادات الذكي',
        lang: 'ar',
        dir: 'rtl',
        theme_color: '#5B8C8F',
        background_color: '#F5F7F8',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',

        icons: [
          { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
          { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },

          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],

  // Development only
  server: {
    host: '0.0.0.0',
    port: 5173,

    proxy: {
      '/api': {
        target: 'http://localhost:5192',
        changeOrigin: true,
        secure: false,
      },
    },

    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'aqil.tailbc17de.ts.net',
      'cura100.com',
      'www.cura100.com',
    ],
  },

  // Production preview
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,

    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'aqil.tailbc17de.ts.net',
      'cura100.com',
      'www.cura100.com',
    ],
  },
})