import { useEffect } from 'react'

interface PageMetaOptions {
  title: string
  description?: string
  canonical?: string
  robots?: string
}

// ✅ index.html already ships static <title>/<meta name="description">/
// <link rel="canonical">/<meta name="robots"> for the homepage. A page that
// needs its own values must MUTATE those existing tags (and restore them on
// unmount), never APPEND a second one — two canonical links or two robots
// meta tags on the same page is exactly the kind of thing Google's own docs
// warn confuses crawlers about which directive to trust.
export function usePageMeta({ title, description, canonical, robots }: PageMetaOptions) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    const restores: Array<() => void> = []

    const setMeta = (selector: string, make: () => HTMLElement, apply: (el: HTMLElement) => void, value: string | undefined) => {
      if (value === undefined) return
      const existing = document.head.querySelector<HTMLElement>(selector)
      if (existing) {
        const prev = existing.getAttribute(selector.includes('canonical') ? 'href' : 'content')
        apply(existing)
        restores.push(() => existing.setAttribute(selector.includes('canonical') ? 'href' : 'content', prev ?? ''))
      } else {
        const el = make()
        apply(el)
        document.head.appendChild(el)
        restores.push(() => el.remove())
      }
    }

    setMeta('meta[name="description"]', () => {
      const m = document.createElement('meta'); m.setAttribute('name', 'description'); return m
    }, el => el.setAttribute('content', description ?? ''), description)

    setMeta('link[rel="canonical"]', () => {
      const l = document.createElement('link'); l.setAttribute('rel', 'canonical'); return l
    }, el => el.setAttribute('href', canonical ?? ''), canonical)

    setMeta('meta[name="robots"]', () => {
      const m = document.createElement('meta'); m.setAttribute('name', 'robots'); return m
    }, el => el.setAttribute('content', robots ?? ''), robots)

    return () => {
      document.title = prevTitle
      restores.forEach(r => r())
    }
  }, [title, description, canonical, robots])
}
