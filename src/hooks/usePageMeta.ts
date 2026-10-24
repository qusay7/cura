import { useEffect } from 'react'

interface PageMetaOptions {
  title: string
  description?: string
  canonical?: string
  robots?: string
  // ✅ اختياري — لصفحة تُشارَك مباشرة (مثل /card) وتحتاج صورة معاينة مختلفة
  // عن صورة الصفحة الرئيسية بواتساب/فيسبوك
  ogImage?: string
}

type Target =
  | { kind: 'meta-name'; name: string; value: string | undefined }
  | { kind: 'meta-property'; property: string; value: string | undefined }
  | { kind: 'link-rel'; rel: string; value: string | undefined }

// ✅ index.html already ships static <title>/description/canonical/robots/
// og:*/twitter:* for the homepage. A page needing its own values must
// MUTATE those existing tags (and restore them on unmount), never APPEND a
// second one - duplicate canonical links or robots tags on one page is
// exactly what Google's own docs warn confuses crawlers about which
// directive to trust. A page meant to be shared directly (like /card) also
// needs its own og:image instead of inheriting the homepage's.
export function usePageMeta({ title, description, canonical, robots, ogImage }: PageMetaOptions) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    const restores: Array<() => void> = []

    const apply = (target: Target) => {
      if (target.value === undefined) return
      const selector =
        target.kind === 'meta-name' ? `meta[name="${target.name}"]`
        : target.kind === 'meta-property' ? `meta[property="${target.property}"]`
        : `link[rel="${target.rel}"]`
      const attr = target.kind === 'link-rel' ? 'href' : 'content'

      const existing = document.head.querySelector<HTMLElement>(selector)
      if (existing) {
        const prev = existing.getAttribute(attr)
        existing.setAttribute(attr, target.value)
        restores.push(() => existing.setAttribute(attr, prev ?? ''))
      } else {
        const el = document.createElement(target.kind === 'link-rel' ? 'link' : 'meta')
        if (target.kind === 'meta-name') el.setAttribute('name', target.name)
        else if (target.kind === 'meta-property') el.setAttribute('property', target.property)
        else el.setAttribute('rel', target.rel)
        el.setAttribute(attr, target.value)
        document.head.appendChild(el)
        restores.push(() => el.remove())
      }
    }

    apply({ kind: 'meta-name', name: 'description', value: description })
    apply({ kind: 'meta-name', name: 'robots', value: robots })
    apply({ kind: 'link-rel', rel: 'canonical', value: canonical })
    apply({ kind: 'meta-property', property: 'og:url', value: canonical })
    apply({ kind: 'meta-property', property: 'og:title', value: title })
    apply({ kind: 'meta-name', name: 'twitter:title', value: title })
    apply({ kind: 'meta-property', property: 'og:description', value: description })
    apply({ kind: 'meta-name', name: 'twitter:description', value: description })
    apply({ kind: 'meta-property', property: 'og:image', value: ogImage })
    apply({ kind: 'meta-name', name: 'twitter:image', value: ogImage })

    return () => {
      document.title = prevTitle
      restores.forEach(r => r())
    }
  }, [title, description, canonical, robots, ogImage])
}
