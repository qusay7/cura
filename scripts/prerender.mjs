// ✅ يُشغَّل بعد "vite build" (الكلاينت) و"vite build --ssr" (دخل SSR) — يولّد
// HTML ثابت ومُصيَّر مسبقاً لكل صفحة تسويقية عامة، بعنوان/وصف/canonical خاص بها
// محقون بالـHTML الخام نفسه، لا بجافاسكريبت لاحقاً. هذا يحل مشكلتين عرفها
// Google Search Console: الصفحات تظهر فاضية بالـHTML للزاحف، وكل الصفحات
// تتشارك نفس العنوان/الوصف/canonical (صفحة الرئيسية) لأنها كانت كلها تُخدَّم من
// نفس ملف index.html الثابت الوحيد.
import { readFile, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const ssrDir = path.join(root, 'dist-ssr')

// ✅ كل صفحة تسويقية تقرأ لغتها من localStorage.getItem('cura-lang') ضمن
// useState نفسه (لتذكّر اختيار المستخدم بين الصفحات) — Node ما عنده
// localStorage أصلاً، فنموّهها هنا؛ وترجع 'ar' خصيصاً لهذا المفتاح حتى يطابق
// محتوى الـHTML المُصيَّر لغة <html lang="ar"> الأساسية بالقالب والعنوان/الوصف
// (معرّفان بالعربي دائماً بـentry-server.tsx) — بدونها كان العنوان يظهر عربياً
// والعنوان الرئيسي H1 بالمحتوى يظهر إنجليزياً (قيمة useState الافتراضية 'en')
globalThis.localStorage = {
  getItem: (key) => (key === 'cura-lang' ? 'ar' : null),
  setItem: () => {},
  removeItem: () => {},
}

// ✅ يحدّد اسم الملف الذي يخدمه "vite preview" (المستخدَم أيضاً بالإنتاج —
// انظر deploy.ps1) فعلياً لكل مسار: فحص مباشر لمصدر Vite أكّد أن طلب بدون
// شرطة مائلة زائدة مثل "/features" يُحوَّل إلى "features.html" بجذر dist (لا
// "features/index.html")، وaddFallback لـ"/" يبقى "index.html" كالعادة
function outputFileFor(routePath) {
  if (routePath === '/') return 'index.html'
  return `${routePath.slice(1)}.html`
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function replaceTag(html, regex, replacement) {
  if (!regex.test(html)) throw new Error(`prerender: expected tag not found in template (pattern: ${regex})`)
  return html.replace(regex, replacement)
}

function applyMeta(html, meta) {
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
  const canonical = escapeHtml(meta.canonical)

  html = replaceTag(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`)
  html = replaceTag(html, /<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${description}" />`)
  html = replaceTag(html, /<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
  html = replaceTag(html, /<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
  html = replaceTag(html, /<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${title}" />`)
  html = replaceTag(html, /<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${description}" />`)
  html = replaceTag(html, /<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${title}" />`)
  html = replaceTag(html, /<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${description}" />`)
  return html
}

function injectRenderedRoot(html, renderedHtml) {
  return replaceTag(html, /<div id="root"><\/div>/, `<div id="root">${renderedHtml}</div>`)
}

async function main() {
  const { ROUTES, renderPage } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')))
  const template = await readFile(path.join(distDir, 'index.html'), 'utf-8')

  for (const { path: routePath } of ROUTES) {
    const { html: renderedHtml, meta } = renderPage(routePath)
    const page = injectRenderedRoot(applyMeta(template, meta), renderedHtml)
    const outFile = path.join(distDir, outputFileFor(routePath))
    await writeFile(outFile, page, 'utf-8')
    console.log(`prerendered ${routePath} -> dist/${outputFileFor(routePath)}`)
  }

  await rm(ssrDir, { recursive: true, force: true })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
