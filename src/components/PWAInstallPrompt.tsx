import { useEffect, useState } from 'react'

const PRIMARY = '#5B8C8F'
const BORDER = '#DCE5E5'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [lang] = useState(localStorage.getItem('cura-lang') || 'en')
  const isAr = lang === 'ar'

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // أظهر الـ prompt بعد 3 ثواني
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  if (!showPrompt) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      [isAr ? 'right' : 'left']: 24,
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
          🏥
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#2C3E3F', margin: 0 }}>
            {isAr ? 'تثبيت التطبيق' : 'Install App'}
          </p>
          <p style={{ fontSize: 11, color: '#6B8A8C', margin: '2px 0 0' }}>
            {isAr ? 'أضف CURA لشاشتك الرئيسية' : 'Add CURA to your home screen'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleInstall}
          style={{
            flex: 1, background: PRIMARY, color: '#FFFFFF',
            border: 'none', borderRadius: 10, padding: '8px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {isAr ? '📲 تثبيت' : '📲 Install'}
        </button>
        <button
          onClick={() => setShowPrompt(false)}
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