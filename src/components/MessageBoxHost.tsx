import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MessageBoxType } from '../utils/messageBox'
import { TEXT_DARK, CARD_BG } from '../styles/theme'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'ar'

const CONFIG: Record<MessageBoxType, { icon: string; color: string }> = {
  error:   { icon: '⛔', color: '#EF4444' },
  warning: { icon: '⚠️', color: '#B8892A' },
  success: { icon: '✅', color: '#22C55E' },
  info:    { icon: 'ℹ️', color: '#497072' },
}

/**
 * ✅ مُركّب مرة واحدة بـ Layout.tsx — يستمع لحدث cura-messagebox من أي مكان
 * بالتطبيق ويعرضه كنافذة واضحة بمنتصف الشاشة، بدل بانر نصي بالصفحة سهل يُفوَّت.
 * الاستخدام: showMessageBox('نص الرسالة', 'error') من utils/messageBox.
 */
export default function MessageBoxHost() {
  const [state, setState] = useState<{ message: string; type: MessageBoxType } | null>(null)
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())

  useEffect(() => {
    const onMessage = (e: Event) => setState((e as CustomEvent).detail)
    const onLang = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-messagebox', onMessage)
    window.addEventListener('cura-lang-change', onLang)
    return () => {
      window.removeEventListener('cura-messagebox', onMessage)
      window.removeEventListener('cura-lang-change', onLang)
    }
  }, [])

  useEffect(() => {
    if (!state) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setState(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [state])

  if (!state) return null
  const isAr = lang === 'ar'
  const cfg = CONFIG[state.type]

  return createPortal(
    <div onClick={() => setState(null)}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,30,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} role="alertdialog" aria-modal="true" dir={isAr ? 'rtl' : 'ltr'}
        style={{ background: CARD_BG, borderRadius: 18, padding: '30px 26px', maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
        <div style={{ fontSize: 42, marginBottom: 14 }}>{cfg.icon}</div>
        <p style={{ fontSize: 14.5, color: TEXT_DARK, lineHeight: 1.65, margin: '0 0 24px', whiteSpace: 'pre-wrap' }}>{state.message}</p>
        <button onClick={() => setState(null)} autoFocus
          style={{ background: cfg.color, color: '#FFF', border: 'none', borderRadius: 10, padding: '10px 36px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
          {isAr ? 'حسناً' : 'OK'}
        </button>
      </div>
    </div>,
    document.body
  )
}
