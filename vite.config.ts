/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'child_process'

// ✅ نأخذ رقم النسخة من الـ commit الحقيقي وقت البناء — مش رقم يدوي بينسى تحديثه،
// هيك بنعرف بالضبط شو الكود المنشور فعلياً بأي بيئة (تفادياً لالتباس صار سابقاً)
const commitHash = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim() }
  catch { return 'unknown' }
})()
const buildTime = new Date().toISOString()

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(commitHash),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },

  plugins: [
    react(),

    VitePWA({
      // ✅ 'prompt' (الافتراضي) — السيرفس وركر الجديد يبقى "بالانتظار" لحد ما
      // المستخدم يوافق على إعادة التحميل (UpdatePrompt.tsx)، بدل تفعيل فوري
      // صامت ممكن يقاطع نموذج مفتوح وسط التعبئة (حجز موعد، فاتورة...)
      // ✅ نسجّل الـ service worker بأنفسنا (src/components/UpdatePrompt.tsx)
      // بدل السكربت الافتراضي المحقون تلقائياً — ذاك يسجّل مرة وحدة بس عند
      // تحميل الصفحة وما يتحقق من تحديثات بعدها أبداً، فأي نشر جديد ما يوصل
      // المستخدم إلا لو مسح بيانات المتصفح يدوياً أو أغلق كل التابات وفتحها
      injectRegister: false,

      // بدونها لا يُسجَّل service worker ولا manifest أثناء "vite dev"،
      // فلا يُطلق المتصفح beforeinstallprompt إطلاقاً — يمنع اختبار PWAInstallPrompt محلياً
      devOptions: {
        enabled: true,
      },

      includeAssets: [
        'icons/icon-72x72.png',
        'icons/icon-192x192.png',
      ],

      manifest: {
        name: 'CURA — Clinic Management',
        short_name: 'CURA',
        description: 'نظّم مواعيد المرضى وملفاتهم وفواتير العيادة مع CURA، نظام إدارة عيادات بواجهة عربية وإنجليزية.',
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
        // ✅ بدون skipWaiting — السيرفس وركر الجديد يضل "ينتظر" (waiting) لحد
        // ما المستخدم يضغط تحديث (UpdatePrompt.tsx)، بدل ما يُفعّل نفسه فوراً
        // ويحدّث كل التابات المفتوحة بصمت وسط أي نموذج مفتوح
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/api/],
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
      // ✅ الشعارات (وأي ملف ثابت آخر) تُخدَّم من wwwroot الباك اند مباشرة، لا من
      // الفرونت اند — بدونها أي مسار نسبي مثل "/logos/x.png" يضرب سيرفر Vite
      // نفسه (404) بدل الباك اند
      '/logos': {
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
    proxy: {
      '/api': {
        target: 'http://localhost:5192',
        changeOrigin: true,
        secure: false,
      },
      '/logos': {
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
})