import { useEffect, useState, useRef } from 'react'
import { registerSW } from 'virtual:pwa-register'

const PRIMARY = '#5B8C8F'
const BORDER = '#DCE5E5'

// ✅ نص دقيقة — كافي عشان أي نشر جديد يوصل أي تاب مفتوح بسرعة معقولة، بدون
// ما نضرب السيرفر بطلبات كثيرة
const UPDATE_CHECK_INTERVAL_MS = 60_000

export default function UpdatePrompt() {
  const [lang] = useState(localStorage.getItem('cura-lang') || 'en')
  const isAr = lang === 'ar'
  const [needRefresh, setNeedRefresh] = useState(false)
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onRegisteredSW(_url, registration) {
        if (!registration) return
        // ✅ المتصفح لوحده بيتحقق من تحديث الـ service worker بس عند تحميل
        // الصفحة فعلياً (navigation) — لو التاب ضل مفتوح بدون إعادة تحميل،
        // ما بيلاحظ أي نشر جديد. هذا الفحص الدوري يضمن اكتشاف أي تحديث
        // خلال دقيقة واحدة كحد أقصى، حتى لو المستخدم ما سكّر التاب.
        setInterval(() => { registration.update() }, UPDATE_CHECK_INTERVAL_MS)
      },
      onNeedRefresh() {
        setNeedRefresh(true)
      },
    })
    updateSWRef.current = updateSW
  }, [])

  const handleReload = () => {
    updateSWRef.current?.(true)
  }

  if (!needRefresh) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      [isAr ? 'left' : 'right']: 24,
      zIndex: 9999,
      background: '#FFFFFF',
      border: `1px solid ${BORDER}`,
      borderRadius: 16,
      padding: '16px 20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      maxWidth: 320,
      animation: 'slide-up 0.3s ease',
      direction: isAr ? 'rtl' : 'ltr',
    }}>
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: PRIMARY, display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 22,
          flexShrink: 0,
        }}>
          ✨
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#2C3E3F', margin: 0 }}>
            {isAr ? 'تحديث جديد متوفر' : 'New version available'}
          </p>
          <p style={{ fontSize: 11, color: '#6B8A8C', margin: '2px 0 0' }}>
            {isAr ? 'أعد تحميل الصفحة لتفعيل آخر التحديثات' : 'Reload to get the latest updates'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleReload}
          style={{
            flex: 1, background: PRIMARY, color: '#FFFFFF',
            border: 'none', borderRadius: 10, padding: '8px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {isAr ? '🔄 إعادة التحميل' : '🔄 Reload'}
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          style={{
            padding: '8px 14px', background: 'transparent',
            border: `1px solid ${BORDER}`, borderRadius: 10,
            fontSize: 12, color: '#6B8A8C', cursor: 'pointer',
          }}
        >
          {isAr ? 'لاحقاً' : 'Later'}
        </button>
      </div>
    </div>
  )
}
