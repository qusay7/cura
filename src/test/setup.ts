import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// ✅ "virtual:pwa-register" وهمي — موجود بس وقت vite build/dev الحقيقي عبر
// vite-plugin-pwa، فما يقدر vitest يحلّه أبداً. أي صفحة تستورده (UpdatePrompt
// عبر App.tsx) كانت تفشل الملف كامل (0 اختبارات) بدون هذا الـ stub
vi.mock('virtual:pwa-register', () => ({
  registerSW: () => () => Promise.resolve(),
}))
