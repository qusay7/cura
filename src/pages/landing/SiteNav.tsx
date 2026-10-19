import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { C, T, type Lang } from './shared'

// ✅ نفس الـ nav على الصفحات التسويقية الأربعة (الرئيسية + الميزات + الأسعار +
// الأسئلة) — دائماً تنتقل بين المسارات (routes)، لا تمرير داخلي (scroll) أبداً،
// حتى يكون السلوك متّسقاً من أي صفحة
export default function SiteNav({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const navigate = useNavigate()
  const t = T[lang]
  const isAr = lang === 'ar'
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const WHATSAPP = 'https://wa.me/962796139705'
  const contactSales = () => {
    setMobileOpen(false)
    window.open(
      `${WHATSAPP}?text=${encodeURIComponent(
        isAr ? 'مرحباً، أرغب بتجربة نظام Cura لعيادتي' : 'Hello, I would like to try Cura for my clinic'
      )}`,
      '_blank'
    )
  }

  const go = (path: string) => { setMobileOpen(false); navigate(path) }

  const LangBtn = () => (
    <button onClick={() => setLang(isAr ? 'en' : 'ar')}
      style={{ background:C.tealSoft, border:`1px solid ${C.border}`, borderRadius:8,
        padding:'5px 13px', fontSize:12, fontWeight:700, color:C.teal, cursor:'pointer',
        fontFamily:"'Inter', sans-serif", letterSpacing:'0.3px' }}>
      {isAr ? 'EN' : 'ع'}
    </button>
  )

  const links = [
    { label:t.nav.features, path:'/features' },
    { label:t.nav.pricing,  path:'/pricing'  },
    { label:t.nav.faq,      path:'/faq'      },
  ]

  return (
    <nav style={{
      position:'fixed', inset:'0 0 auto 0', zIndex:200,
      background: scrolled || mobileOpen ? 'rgba(247,249,249,0.95)' : 'transparent',
      backdropFilter: scrolled || mobileOpen ? 'blur(16px)' : 'none',
      borderBottom: scrolled || mobileOpen ? `1px solid ${C.border}` : 'none',
      transition:'all 0.3s ease', padding:'0 24px',
    }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:70 }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => go('/')}>
            <div style={{ width:38, height:38, borderRadius:11, background:`linear-gradient(135deg,${C.teal},${C.tealLight})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 14px ${C.teal}40` }}>
              <span style={{ color:'#FFF', fontSize:17, fontWeight:800, fontFamily:"'DM Serif Display',serif", lineHeight:1 }}>C</span>
            </div>
            <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:23, color:C.dark, letterSpacing:'-0.4px', fontWeight:400 }}>Cura</span>
          </div>

          {/* Desktop links */}
          <div className="nav-links" style={{ display:'flex', alignItems:'center', gap:36 }}>
            {links.map(l => (
              <span key={l.path} className="nav-item" onClick={() => go(l.path)}>{l.label}</span>
            ))}
            <LangBtn />
            <div style={{ width:1, height:20, background:C.border }} />
            <span className="nav-item" onClick={() => go('/login')}>{t.nav.login}</span>
            <button className="btn-primary" onClick={contactSales} style={{ padding:'9px 22px', fontSize:13, borderRadius:10 }}>{t.nav.cta}</button>
          </div>

          {/* Mobile controls */}
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <div className="mobile-menu-btn" style={{ display:'none' }}>
              <LangBtn />
            </div>
            <button
              className="mobile-menu-btn"
              aria-label={mobileOpen ? (isAr ? 'إغلاق القائمة' : 'Close menu') : (isAr ? 'فتح القائمة' : 'Open menu')}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(v => !v)}
              style={{
                alignItems:'center', justifyContent:'center',
                width:38, height:38, borderRadius:10,
                background:C.tealSoft, border:`1px solid ${C.border}`,
                color:C.teal, cursor:'pointer', marginInlineStart:8,
              }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-panel" style={{
          borderTop:`1px solid ${C.border}`,
          background:'rgba(247,249,249,0.98)',
          padding:'16px 24px 22px',
        }}>
          <div style={{ display:'flex', flexDirection:'column', gap:4, maxWidth:1200, margin:'0 auto' }}>
            {links.map(l => (
              <button key={l.path} onClick={() => go(l.path)}
                style={{ textAlign:isAr ? 'right' : 'left', background:'none', border:'none', padding:'12px 4px',
                  fontSize:15, fontWeight:600, color:C.dark, cursor:'pointer', fontFamily:t.font,
                  borderBottom:`1px solid ${C.border}` }}>
                {l.label}
              </button>
            ))}
            <button onClick={() => go('/login')}
              style={{ textAlign:isAr ? 'right' : 'left', background:'none', border:'none', padding:'12px 4px',
                fontSize:15, fontWeight:600, color:C.dark, cursor:'pointer', fontFamily:t.font,
                borderBottom:`1px solid ${C.border}` }}>
              {t.nav.login}
            </button>

            <button className="btn-primary" onClick={contactSales}
              style={{ marginTop:12, justifyContent:'center' }}>
              {t.nav.cta}
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
