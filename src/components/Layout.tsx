import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import logo from '../assets/logo.png'

// ─── Global CSS ──────────────────────────────────────────────────────────────
const layoutCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&family=Playfair+Display:wght@500;600;700&family=Cairo:wght@400;500;600;700&display=swap');

@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-in {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slide-overlay {
  from { opacity: 0; }
  to { opacity: 1; }
}

.layout-shell {
  min-height: 100dvh;
  display: flex;
  background: #F5F7F8;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.layout-shell[dir=rtl] .sidebar {
  border-left: 1px solid rgba(91, 140, 143, 0.12);
  border-right: none;
}
.layout-shell[dir=ltr] .sidebar {
  border-right: 1px solid rgba(91, 140, 143, 0.12);
  border-left: none;
}

.layout-shell * { box-sizing: border-box; }

.sidebar {
  width: 260px;
  min-height: 100dvh;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100dvh;
  overflow-y: auto;
  transition: all 0.3s ease;
}

/* Mobile sidebar overlay */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
  animation: slide-overlay 0.3s ease;
}

/* Mobile sidebar */
.sidebar-mobile {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background: #FFFFFF;
  z-index: 999;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  overflow-y: auto;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar-mobile.open {
  transform: translateX(0);
}

.layout-shell[dir=rtl] .sidebar-mobile {
  left: auto;
  right: 0;
  transform: translateX(100%);
}

.layout-shell[dir=rtl] .sidebar-mobile.open {
  transform: translateX(0);
}

/* Hamburger button */
.hamburger-btn {
  display: none;
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 1000;
  background: #FFFFFF;
  border: 1px solid rgba(91, 140, 143, 0.2);
  border-radius: 12px;
  width: 44px;
  height: 44px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.hamburger-btn:hover {
  background: #E8F0F0;
}

.nav-btn {
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  color: #5C6F73;
  position: relative;
}

.nav-btn:hover {
  background: #E8F0F0;
  color: #5B8C8F;
}

.nav-btn.active {
  background: #E8F0F0;
  color: #5B8C8F;
  font-weight: 600;
}

.nav-btn.active .nav-indicator {
  opacity: 1;
}

.nav-indicator {
  width: 3px;
  height: 24px;
  background: #5B8C8F;
  border-radius: 100px;
  opacity: 0;
  transition: opacity 0.2s ease;
  margin-inline-start: auto;
  flex-shrink: 0;
}

.lang-toggle {
  display: flex;
  gap: 4px;
  background: #E8EDEE;
  border-radius: 100px;
  padding: 3px;
}

.lang-btn {
  border: none;
  border-radius: 100px;
  padding: 5px 14px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  color: #8BAFB1;
  letter-spacing: 0.5px;
}

.lang-btn.active {
  background: #5B8C8F;
  color: #FFFFFF;
  box-shadow: 0 2px 4px rgba(91, 140, 143, 0.2);
}

.logout-btn {
  width: 100%;
  border: 1px solid rgba(91, 140, 143, 0.25);
  background: rgba(91, 140, 143, 0.05);
  color: #5B8C8F;
  border-radius: 12px;
  padding: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.logout-btn:hover {
  background: rgba(91, 140, 143, 0.12);
  border-color: rgba(91, 140, 143, 0.4);
  transform: translateY(-1px);
}

.main-content {
  flex: 1;
  padding: 2rem 2rem 3rem;
  overflow: auto;
  animation: fade-in 0.4s ease both;
}

/* Responsive Design */
@media(max-width: 768px) {
  .sidebar {
    display: none;
  }
  
  .hamburger-btn {
    display: flex;
  }
  
  .main-content {
    padding: 80px 1rem 1.5rem;
  }
}

@media(min-width: 769px) {
  .sidebar-mobile, .sidebar-overlay {
    display: none;
  }
}
`

// Comfortable color palette
const PRIMARY = '#5B8C8F'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'

const menuItems = [
  { path: '/dashboard',    labelAr: 'الرئيسية',  labelEn: 'Home',          icon: 'ti-layout-dashboard' },
  { path: '/patients',     labelAr: 'المرضى',    labelEn: 'Patients',      icon: 'ti-users' },
  { path: '/doctors',      labelAr: 'الأطباء',   labelEn: 'Doctors',       icon: 'ti-stethoscope' },
  { path: '/appointments', labelAr: 'المواعيد',  labelEn: 'Appointments',  icon: 'ti-calendar' },
]

// ─── Lang stored globally ─────────────────────────────────────────────────────
const LANG_KEY = 'cura-lang'
export function getStoredLang(): 'ar' | 'en' {
  return (localStorage.getItem(LANG_KEY) as 'ar' | 'en') || 'en'
}

// ─── Sidebar Content Component (للإعادة الاستخدام) ───────────────────────────
const SidebarContent = ({ lang, isAr, onNavigate }: { 
  lang: 'ar' | 'en'; 
  isAr: boolean; 
  onNavigate?: () => void 
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') }
    catch { return {} }
  })()

  const handleNavigation = (path: string) => {
    navigate(path)
    if (onNavigate) onNavigate()
  }

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      const { default: api } = await import('../api/axios')
      await api.post('/auth/logout', { refreshToken })
    } finally {
      localStorage.clear()
      navigate('/login')
    }
  }

  const t = {
    logout:  isAr ? 'تسجيل الخروج' : 'Sign Out',
  }

  return (
    <>
      {/* Logo */}
      <div style={{ 
        padding: '24px 20px 20px', 
        borderBottom: '1px solid rgba(91, 140, 143, 0.1)', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 10 
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${PRIMARY} 0%, #8BAFB1 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(91, 140, 143, 0.2)',
        }}>
          <img 
            src={logo} 
            alt="CURA" 
            style={{ 
              width: 40, 
              height: 40, 
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
            }} 
          />
        </div>
        {user.clinicName && (
          <p style={{ 
            fontSize: 18, 
            color: TEXT_DARK, 
            textAlign: 'center', 
            margin: 0, 
            fontWeight: 600,
            letterSpacing: '-0.3px',
          }}>
            {user.clinicName}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ 
        flex: 1, 
        padding: '16px 12px', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        {menuItems.map(item => (
          <button
            key={item.path}
            className={`nav-btn${location.pathname === item.path ? ' active' : ''}`}
            onClick={() => handleNavigation(item.path)}
            style={{ 
              textAlign: isAr ? 'right' : 'left',
              justifyContent: isAr ? 'flex-end' : 'flex-start',
            }}
          >
            <i className={`ti ${item.icon}`} style={{ fontSize: 18, flexShrink: 0 }} aria-hidden="true" />
            <span>{isAr ? item.labelAr : item.labelEn}</span>
            <span className="nav-indicator" />
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ 
        padding: '16px 12px 20px', 
        borderTop: '1px solid rgba(91, 140, 143, 0.08)', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 12 
      }}>
        {/* User Info */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10, 
          padding: '8px 6px',
          background: '#F8FAFA',
          borderRadius: 12,
        }}>
          <div style={{
            width: 36, 
            height: 36, 
            borderRadius: '50%', 
            flexShrink: 0,
            background: `linear-gradient(135deg, ${PRIMARY} 0%, #8BAFB1 100%)`,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: 14, 
            fontWeight: 600, 
            color: '#FFFFFF',
            boxShadow: '0 2px 6px rgba(91, 140, 143, 0.2)',
          }}>
            {(user.fullName || 'U')[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ 
              fontSize: 13, 
              fontWeight: 600, 
              color: TEXT_DARK, 
              margin: 0, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}>
              {user.fullName || '---'}
            </p>
            <p style={{ 
              fontSize: 10, 
              color: TEXT_MUTED, 
              margin: 0,
              textTransform: 'capitalize',
            }}>
              {user.role || ''}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button className="logout-btn" onClick={handleLogout}>
          <i className="ti ti-logout" style={{ fontSize: 14, verticalAlign: 'middle' }} aria-hidden="true" />
          {t.logout}
        </button>
      </div>
    </>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [lang, setLangState] = useState<'ar' | 'en'>(getStoredLang)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') }
    catch { return {} }
  })()

  useEffect(() => {
    const id = 'cura-layout-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style')
      s.id = id
      s.textContent = layoutCss
      document.head.appendChild(s)
    }
  }, [])

  const setLang = (l: 'ar' | 'en') => {
    localStorage.setItem(LANG_KEY, l)
    setLangState(l)
    window.dispatchEvent(new CustomEvent('cura-lang-change', { detail: l }))
  }

  const isAr = lang === 'ar'
  const t = {
    clinic:  isAr ? 'العيادة' : 'Clinic',
    quota:   isAr ? 'استخدام الحصة' : 'Usage',
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <div className="layout-shell" dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif" }}>

      {/* Hamburger Button - يظهر فقط على الهاتف */}
      <button 
        className="hamburger-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {mobileMenuOpen ? (
            <line x1="18" y1="6" x2="6" y2="18" />
          ) : (
            <line x1="3" y1="12" x2="21" y2="12" />
          )}
          {mobileMenuOpen ? (
            <line x1="6" y1="6" x2="18" y2="18" />
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar (يظهر فقط على الهاتف) */}
      <div className={`sidebar-mobile ${mobileMenuOpen ? 'open' : ''}`}>
        <SidebarContent lang={lang} isAr={isAr} onNavigate={() => setMobileMenuOpen(false)} />
      </div>

      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <SidebarContent lang={lang} isAr={isAr} />
      </aside>

      {/* Language Toggle for Mobile (في أعلى الصفحة) */}
      <div style={{
        position: 'fixed',
        top: 16,
        right: isAr ? 'auto' : 16,
        left: isAr ? 16 : 'auto',
        zIndex: 1000,
        display: 'none',
      }} className="mobile-lang-toggle">
        <div className="lang-toggle" style={{ background: '#FFFFFF', border: `1px solid ${'#DCE5E5'}`, padding: 3 }}>
          <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>EN</button>
          <button className={`lang-btn${lang === 'ar' ? ' active' : ''}`} onClick={() => setLang('ar')} style={{ fontFamily: "'Cairo',sans-serif" }}>ع</button>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      <style>
        {`
          @media(max-width: 768px) {
            .mobile-lang-toggle {
              display: block !important;
            }
          }
        `}
      </style>
    </div>
  )
}