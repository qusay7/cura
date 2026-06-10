import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import logo from '../assets/logo.png'
import api from '../api/axios'

import { hasPermission } from '../utils/permissions'


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

@keyframes notification-slide {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes bell-ring {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(15deg); }
  50% { transform: rotate(-15deg); }
  75% { transform: rotate(5deg); }
  100% { transform: rotate(0deg); }
}

.layout-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #F5F7F8;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Top Bar */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #FFFFFF;
  border-bottom: 1px solid rgba(91, 140, 143, 0.12);
  padding: 10px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.datetime-card {
  background: #E8F0F0;
  border-radius: 12px;
  padding: 6px 12px;
  min-width: 200px;
}

.notification-btn {
  position: relative;
  background: #E8F0F0;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notification-btn:hover {
  background: #DCE5E5;
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #C4A77D;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 600;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-dropdown {
  position: absolute;
  top: 50px;
  right: 0;
  width: 360px;
  max-width: calc(100vw - 20px);
  background: #FFFFFF;
  border: 1px solid #DCE5E5;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  z-index: 1000;
  overflow: hidden;
  animation: notification-slide 0.3s ease;
}

.plan-badge {
  background: #FFFFFF;
  border: 1px solid #DCE5E5;
  border-radius: 100px;
  padding: 6px 16px 6px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 100px;
  transition: background 0.2s ease;
}

.user-menu:hover {
  background: #E8F0F0;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5B8C8F 0%, #8BAFB1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #FFFFFF;
}

.user-info {
  text-align: right;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #2C3E3F;
  margin: 0;
}

.user-role {
  font-size: 10px;
  color: #6B8A8C;
  margin: 0;
}

.logout-top-btn {
  background: none;
  border: 1px solid rgba(91,140,143,0.25);
  border-radius: 40px;
  padding: 8px 16px;
  font-size: 12px;
  color: #5B8C8F;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-top-btn:hover {
  background: rgba(91,140,143,0.1);
  border-color: #5B8C8F;
}

.main-wrapper {
  display: flex;
  flex: 1;
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
  min-height: calc(100dvh - 65px);
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: sticky;
  top: 65px;
  height: calc(100dvh - 65px);
  overflow-y: auto;
  transition: all 0.3s ease;
}

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

.hamburger-btn {
  display: none;
  background: #FFFFFF;
  border: 1px solid rgba(91, 140, 143, 0.2);
  border-radius: 12px;
  width: 40px;
  height: 40px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.hamburger-btn:hover {
  background: #E8F0F0;
}

.mobile-lang-toggle {
  display: none;
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

@media(max-width: 768px) {
  .sidebar {
    display: none;
  }
  
  .hamburger-btn {
    display: flex;
  }
  
  .mobile-lang-toggle {
    display: block !important;
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 1000;
    background: #FFFFFF;
    border-radius: 100px;
    padding: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  
  .top-bar {
    padding: 10px 16px;
  }
  
  .datetime-card {
    display: none;
  }
  
  .user-info {
    display: none;
  }
  
  .plan-badge {
    display: none;
  }
  
  .main-content {
    padding: 80px 1rem 1.5rem;
  }
}

.layout-shell[dir=rtl] .mobile-lang-toggle {
  right: auto;
  left: 16px;
}

@media(min-width: 769px) {
  .sidebar-mobile, .sidebar-overlay {
    display: none;
  }
}
`


const PRIMARY = '#5B8C8F'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'




const LANG_KEY = 'cura-lang'
export function getStoredLang(): 'ar' | 'en' {
  return (localStorage.getItem(LANG_KEY) as 'ar' | 'en') || 'en'
}

interface Notification {
  id: number
  title: string
  message: string
  time: string
  read: boolean
  type: 'appointment' | 'alert' | 'system'
}

const T = {
  ar: {
    notifications: 'الإشعارات',
    markAllRead: 'تحديد الكل كمقروء',
    noNotifications: 'لا توجد إشعارات جديدة',
    viewAll: 'عرض الكل',
    plan: 'الباقة',
    logout: 'تسجيل الخروج',
    localDateTime: 'التاريخ والوقت المحلي',
  },
  en: {
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotifications: 'No new notifications',
    viewAll: 'View all',
    plan: 'Plan',
    logout: 'Sign Out',
    localDateTime: 'Local Date & Time',
  },
}

// ─── Sidebar Component (مدمج بالكامل مع اللغة) ─────────────────────────────
const Sidebar = ({ lang, isAr, onNavigate}: { 
  lang: 'ar' | 'en'; 
  isAr: boolean; 
  onNavigate?: () => void;
  isMobile?: boolean;
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [_, setLang] = useState(lang)
  
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') }
    catch { return {} }
  })()
const allMenuItems = [
  { path: '/dashboard',    labelAr: 'الرئيسية',     labelEn: 'Home',        icon: 'ti-layout-dashboard', permission: null },
  { path: '/patients',     labelAr: 'المرضى',       labelEn: 'Patients',    icon: 'ti-users',            permission: 'patients.view' },
  { path: '/doctors',      labelAr: 'الأطباء',      labelEn: 'Doctors',     icon: 'ti-stethoscope',      permission: 'doctors.view' },
  { path: '/appointments', labelAr: 'المواعيد',     labelEn: 'Appointments',icon: 'ti-calendar',         permission: 'appointments.view' },
  { path: '/schedules',    labelAr: 'جداول الدوام', labelEn: 'Schedules',   icon: 'ti-calendar-time',    permission: 'schedules.view' },
  { path: '/settings',     labelAr: 'الإعدادات',    labelEn: 'Settings',    icon: 'ti-settings',         permission: 'settings.view' },
  { path: '/users/add', labelAr: 'إضافة مستخدم', labelEn: 'Add User', icon: 'ti-user-plus', permission: 'users.create' },
  { path: '/users', labelAr: 'المستخدمون', labelEn: 'Users', icon: 'ti-users-group', permission: 'users.view' },
  { path: '/departments', labelAr: 'الأقسام', labelEn: 'Departments', icon: 'ti-building-hospital', permission: 'departments.manage' },
  { path: '/permissions', labelAr: 'الصلاحيات', labelEn: 'Permissions',icon: 'ti-shield-lock', permission: 'settings.view' },
  { path: '/reports', labelAr: 'التقارير', labelEn: 'Reports', icon: 'ti-chart-bar', permission: 'reports.view' },
  // Layout.tsx — في allMenuItems
{ path: '/superadmin/clinics', labelAr: 'العيادات', labelEn: 'Clinics', icon: 'ti-building-hospital', permission: null, superAdminOnly: true },
]

// في Sidebar Component أضف هذا الفلتر
const menuItems = allMenuItems.filter(item =>
  item.permission === null || hasPermission(item.permission)
)
  const handleNavigation = (path: string) => {
    navigate(path)
    if (onNavigate) onNavigate()
  }

  const handleLangChange = (l: 'ar' | 'en') => {
    localStorage.setItem(LANG_KEY, l)
    setLang(l)
    window.dispatchEvent(new CustomEvent('cura-lang-change', { detail: l }))
    // إعادة تحميل الصفحة لتحديث كل شيء
    window.location.reload()
  }

  return (
    <>
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
          <img src={logo} alt="CURA" style={{ width: 40, height: 40, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        </div>
        {user.clinicName && (
          <p style={{ fontSize: 18, color: TEXT_DARK, textAlign: 'center', margin: 0, fontWeight: 600 }}>
            {user.clinicName}
          </p>
        )}
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column' }}>
        {menuItems.map(item => (
          <button
            key={item.path}
            className={`nav-btn${location.pathname === item.path ? ' active' : ''}`}
            onClick={() => handleNavigation(item.path)}
            style={{ textAlign: isAr ? 'right' : 'left', justifyContent: isAr ? 'flex-end' : 'flex-start' }}
          >
            <i className={`ti ${item.icon}`} style={{ fontSize: 18, flexShrink: 0 }} />
            <span>{isAr ? item.labelAr : item.labelEn}</span>
            <span className="nav-indicator" />
          </button>
        ))}
      </nav>

      <div style={{ padding: '16px 12px 20px', borderTop: '1px solid rgba(91, 140, 143, 0.08)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <div className="lang-toggle">
            <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => handleLangChange('en')}>EN</button>
            <button className={`lang-btn${lang === 'ar' ? ' active' : ''}`} onClick={() => handleLangChange('ar')} style={{ fontFamily: "'Cairo',sans-serif" }}>ع</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', background: '#F8FAFA', borderRadius: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${PRIMARY} 0%, #8BAFB1 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>
            {(user.fullName || 'U')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: TEXT_DARK, margin: 0 }}>{user.fullName || '---'}</p>
            <p style={{ fontSize: 10, color: TEXT_MUTED, margin: 0 }}>{user.role || ''}</p>
          </div>
        </div>

        <button className="logout-btn" onClick={async () => {
          const refreshToken = localStorage.getItem('refreshToken')
          try {
            const { default: api } = await import('../api/axios')
            await api.post('/auth/logout', { refreshToken })
          } finally {
            localStorage.clear()
            window.location.href = '/login'
          }
        }}>
          <i className="ti ti-logout" style={{ fontSize: 14 }} />
          {isAr ? 'تسجيل الخروج' : 'Sign Out'}
        </button>
      </div>
    </>
  )
}

// ─── Notification Bell Component ─────────────────────────────────────────────
const NotificationBell = ({ 
  notifications, 
  onMarkAsRead, 
  onViewAll,
  lang 
}: { 
  notifications: Notification[]
  onMarkAsRead: (id: number) => void
  onViewAll: () => void
  lang: 'ar' | 'en'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isRinging, setIsRinging] = useState(false)
  const unreadCount = notifications.filter(n => !n.read).length
  const t = T[lang]
  const isAr = lang === 'ar'

  useEffect(() => {
    if (unreadCount > 0) {
      setIsRinging(true)
      const timer = setTimeout(() => setIsRinging(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [unreadCount])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.notification-container')) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return '📅'
      case 'alert': return '⚠️'
      case 'system': return '🔔'
      default: return '📋'
    }
  }

  return (
    <div className="notification-container" style={{ position: 'relative' }}>
      <button
        className="notification-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{ animation: isRinging ? 'bell-ring 0.5s ease-in-out' : 'none' }}
      >
        <span style={{ fontSize: 18 }}>🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown" style={{ [isAr ? 'left' : 'right']: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#E8F0F0' }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, margin: 0 }}>{t.notifications}</h4>
            {unreadCount > 0 && (
              <button onClick={() => notifications.forEach(n => !n.read && onMarkAsRead(n.id))} style={{ background: 'transparent', border: 'none', fontSize: 11, color: PRIMARY, cursor: 'pointer' }}>
                {t.markAllRead}
              </button>
            )}
          </div>

          <div style={{ maxHeight: 350, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: TEXT_MUTED }}>
                <span style={{ fontSize: 32, opacity: 0.5 }}>🔕</span>
                <p style={{ fontSize: 13, marginTop: 8 }}>{t.noNotifications}</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => onMarkAsRead(notif.id)}
                  style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 12, cursor: 'pointer', background: notif.read ? 'transparent' : '#E8F0F0' }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${PRIMARY}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: notif.read ? 500 : 600, color: TEXT_DARK }}>{notif.title}</span>
                      <span style={{ fontSize: 10, color: TEXT_MUTED }}>{notif.time}</span>
                    </div>
                    <p style={{ fontSize: 11, color: TEXT_MUTED, margin: 0 }}>{notif.message}</p>
                  </div>
                  {!notif.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C4A77D', alignSelf: 'center' }} />}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: `1px solid ${BORDER}`, textAlign: 'center' }}>
              <button onClick={onViewAll} style={{ background: 'transparent', border: 'none', fontSize: 12, color: PRIMARY, cursor: 'pointer' }}>
                {t.viewAll} →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [lang, setLangState] = useState<'ar' | 'en'>(getStoredLang)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [subscription, setSubscription] = useState<{ planName: string } | null>(null)
  
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: 'موعد جديد', message: 'تم إضافة موعد جديد مع د. أحمد السيد', time: 'منذ 5 دقائق', read: false, type: 'appointment' },
    { id: 2, title: 'تنبيه الحصة', message: 'اقتربت من الحد الأقصى لعدد المرضى (85%)', time: 'منذ ساعة', read: false, type: 'alert' },
    { id: 3, title: 'تحديث النظام', message: 'تم تحديث النظام إلى الإصدار الأحدث', time: 'منذ 3 ساعات', read: true, type: 'system' },
  ])

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') }
    catch { return {} }
  })()

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await api.get('/dashboard')
        if (response.data?.subscription) {
          setSubscription(response.data.subscription)
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      }
    }
    fetchSubscription()
  }, [])

  const getLocalDateTime = () => {
    const now = new Date()
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' }
    const date = now.toLocaleDateString(lang === 'ar' ? 'ar-SA' : undefined, dateOptions)
    const time = now.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : undefined, timeOptions)
    return { date, time }
  }

  const [currentDateTime, setCurrentDateTime] = useState(getLocalDateTime())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(getLocalDateTime())
    }, 1000)
    return () => clearInterval(timer)
  }, [lang])

  useEffect(() => {
    const id = 'cura-layout-css'
    if (!document.getElementById(id)) {
      const style = document.createElement('style')
      style.id = id
      style.textContent = layoutCss
      document.head.appendChild(style)
    }
  }, [])

  const setLang = (l: 'ar' | 'en') => {
    localStorage.setItem(LANG_KEY, l)
    setLangState(l)
    window.dispatchEvent(new CustomEvent('cura-lang-change', { detail: l }))
  }

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const handleViewAllNotifications = () => {
    console.log('View all notifications')
  }

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      await api.post('/auth/logout', { refreshToken })
    } finally {
      localStorage.clear()
      navigate('/login')
    }
  }

  const isAr = lang === 'ar'
  const t = T[lang]

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  return (
    <div className="layout-shell" dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif" }}>

      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-left">
          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

        <div className="top-bar-right">
          <div className="datetime-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 12 }}>📅</span>
              <span style={{ fontSize: 10, color: TEXT_MUTED }}>{t.localDateTime}</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_DARK }}>{currentDateTime.date}</div>
            <div style={{ fontSize: 10, color: PRIMARY }}>{currentDateTime.time}</div>
          </div>

          <NotificationBell
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onViewAll={handleViewAllNotifications}
            lang={lang}
          />

          {subscription && (
            <div className="plan-badge">
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E8F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span>📋</span>
              </div>
              <div>
                <div style={{ fontSize: 9, color: TEXT_MUTED }}>{t.plan}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_DARK }}>{subscription.planName}</div>
              </div>
            </div>
          )}

          <div className="user-menu" onClick={() => navigate('/profile')}>
            <div className="user-avatar">{(user.fullName || 'U')[0].toUpperCase()}</div>
            <div className="user-info">
              <p className="user-name">{user.fullName || '---'}</p>
              <p className="user-role">{user.role || ''}</p>
            </div>
          </div>

          <button className="logout-top-btn" onClick={handleLogout}>
            {t.logout}
          </button>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="main-wrapper">
        <div className="mobile-lang-toggle">
          <div className="lang-toggle" style={{ background: 'transparent', padding: 0 }}>
            <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>EN</button>
            <button className={`lang-btn${lang === 'ar' ? ' active' : ''}`} onClick={() => setLang('ar')} style={{ fontFamily: "'Cairo',sans-serif" }}>ع</button>
          </div>
        </div>

        {mobileMenuOpen && <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />}

        <div className={`sidebar-mobile ${mobileMenuOpen ? 'open' : ''}`}>
          <Sidebar lang={lang} isAr={isAr} onNavigate={() => setMobileMenuOpen(false)} />
        </div>

        <aside className="sidebar">
          <Sidebar lang={lang} isAr={isAr} />
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}