import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import LandingPage, { getPageMeta as landingMeta } from './pages/LandingPage'
import FeaturesPage, { getPageMeta as featuresMeta } from './pages/FeaturesPage'
import PricingPage, { getPageMeta as pricingMeta } from './pages/PricingPage'
import FaqPage, { getPageMeta as faqMeta } from './pages/FaqPage'
import AboutPage, { getPageMeta as aboutMeta } from './pages/AboutPage'

// ✅ صفحات التسويق العامة الخمس المؤهلة للتصيير المسبق (prerender) — صفحات
// ثابتة المحتوى بالكامل (بدون جلسة دخول)، فتصييرها هنا لمحرّكات البحث أمان
// تماماً. باقي صفحات التطبيق (لوحة التحكم...) تتطلب جلسة مستخدم فلا تُصيَّر هنا.
export const ROUTES = [
  { path: '/', Page: LandingPage, getMeta: landingMeta },
  { path: '/features', Page: FeaturesPage, getMeta: featuresMeta },
  { path: '/pricing', Page: PricingPage, getMeta: pricingMeta },
  { path: '/faq', Page: FaqPage, getMeta: faqMeta },
  { path: '/about', Page: AboutPage, getMeta: aboutMeta },
] as const

// ✅ نفس الصفحة التي تراها واجهة المستخدم فعلياً، لكن بدون أي أثر تفاعلي
// (onClick وما شابه لا قيمة له بتصيير ثابت) — renderToString يُهمله بأمان
export function renderPage(path: string) {
  const route = ROUTES.find((r) => r.path === path)
  if (!route) throw new Error(`No prerender route registered for "${path}"`)

  const html = renderToString(
    <StrictMode>
      <StaticRouter location={path}>
        <route.Page />
      </StaticRouter>
    </StrictMode>
  )

  // ✅ النسخة الثابتة المعروضة للزوّار بدون جافاسكريبت (ومحركات البحث) هي
  // دائماً بالعربية — نفس لغة <html lang="ar"> الأساسية بالقالب؛ المستخدم
  // الحقيقي بعد تحميل الصفحة يقدر يبدّل للإنجليزية بزر اللغة بالنافبار كالمعتاد
  return { html, meta: route.getMeta(true) }
}
