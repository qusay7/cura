import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import type { DashboardData } from '../types'
import { ECGAnimation } from '../components/ECGAnimation'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

// ─── Global CSS with Comfortable Colors ──────────────────────────────────────
const globalCss = `
@keyframes fade-up { 
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes soft-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
}
@keyframes pulse-soft {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
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

.dash-shell { animation: fade-up 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) both; }

.stat-card { 
  animation: fade-up 0.4s ease both;
  transition: all 0.2s ease;
}
.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px -8px rgba(0,0,0,0.08);
}
.stat-card:nth-child(1){ animation-delay:0.05s }
.stat-card:nth-child(2){ animation-delay:0.1s  }
.stat-card:nth-child(3){ animation-delay:0.15s }
.stat-card:nth-child(4){ animation-delay:0.2s  }

.dash-shell * { box-sizing:border-box; }

/* Smooth scrolling for better UX */
.dash-shell {
  scroll-behavior: smooth;
}

/* Subtle focus rings for accessibility */
*:focus-visible {
  outline: 2px solid #5B8C8F;
  outline-offset: 2px;
  border-radius: 8px;
}

/* Notification dropdown animation */
.notification-dropdown {
  animation: notification-slide 0.3s ease both;
}

@media(max-width:768px){
  .dash-grid-4     { grid-template-columns:1fr 1fr !important; gap: 12px !important; }
  .dash-grid-4-sub { grid-template-columns:1fr 1fr !important; gap: 12px !important; }
  .dash-title      { font-size:24px !important; }
  .notification-dropdown {
    position: fixed !important;
    top: 60px !important;
    right: 10px !important;
    left: 10px !important;
    width: auto !important;
    max-width: none !important;
  }
}
@media(max-width:480px){
  .dash-grid-4 { grid-template-columns:1fr !important; }
}
`

// Comfortable color palette
const PRIMARY = '#5B8C8F'
const PRIMARY_LIGHT = '#8BAFB1'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const PROGRESS_BG = '#E8F0F0'
const NOTIFICATION_BADGE = '#C4A77D'  // Warm sand for badges

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  ar: {
    title: 'لوحة التحكم', plan: 'الباقة', loading: 'جارٍ التحميل...',
    patients: 'المرضى', doctors: 'الأطباء',
    todayAppts: 'مواعيد اليوم', upcomingAppts: 'القادمة',
    subscription: 'الباقة الحالية', remaining: 'متبقي',
    day: 'يوم', usage: 'نسبة الاستخدام',
    daysLeft: 'الأيام المتبقية', welcome: 'مرحباً بعودتك',
    loadingMessage: 'جاري تحميل لوحة التحكم',
    loadingSub: 'يرجى الانتظار أثناء تحميل بيانات العيادة',
    notifications: 'الإشعارات',
    markAllRead: 'تحديد الكل كمقروء',
    noNotifications: 'لا توجد إشعارات جديدة',
    viewAll: 'عرض الكل',
    appointments: 'مواعيد',
    alerts: 'تنبيهات',
    system: 'النظام',
  },
  en: {
    title: 'Dashboard', plan: 'Plan', loading: 'Loading...',
    patients: 'Patients', doctors: 'Doctors',
    todayAppts: "Today's Appts", upcomingAppts: 'Upcoming',
    subscription: 'Current Plan', remaining: 'Remaining',
    day: 'days', usage: 'Usage',
    daysLeft: 'Days Left', welcome: 'Welcome back',
    loadingMessage: 'Loading Dashboard',
    loadingSub: 'Please wait while we load your clinic data',
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotifications: 'No new notifications',
    viewAll: 'View all',
    appointments: 'Appointments',
    alerts: 'Alerts',
    system: 'System',
  },
}

// ─── Types for Notifications ─────────────────────────────────────────────────
interface Notification {
  id: number
  title: string
  message: string
  time: string
  read: boolean
  type: 'appointment' | 'alert' | 'system'
  icon: string
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

  // Trigger bell ring when new notification arrives
  useEffect(() => {
    if (unreadCount > 0) {
      setIsRinging(true)
      const timer = setTimeout(() => setIsRinging(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [unreadCount])

  // Close dropdown when clicking outside
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

  const getTimeAgo = (timeStr: string) => {
    // Simple time formatter - you can enhance this
    return timeStr
  }

  return (
    <div className="notification-container" style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: PRIMARY_SOFT,
          border: `1px solid ${BORDER}`,
          borderRadius: '50%',
          width: 42,
          height: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          animation: isRinging ? 'bell-ring 0.5s ease-in-out' : 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#E0EBEB'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = PRIMARY_SOFT
        }}
      >
        <span style={{ fontSize: 20 }}>🔔</span>
        
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: NOTIFICATION_BADGE,
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 600,
            borderRadius: '50%',
            width: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className="notification-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            [isAr ? 'left' : 'right']: 0,
            width: 360,
            maxWidth: 'calc(100vw - 20px)',
            background: CARD_BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: `1px solid ${BORDER}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: PRIMARY_SOFT,
          }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, margin: 0 }}>
              {t.notifications}
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={() => notifications.forEach(n => !n.read && onMarkAsRead(n.id))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 11,
                  color: PRIMARY,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {t.markAllRead}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: TEXT_MUTED,
              }}>
                <span style={{ fontSize: 32, opacity: 0.5 }}>🔕</span>
                <p style={{ fontSize: 13, marginTop: 8 }}>{t.noNotifications}</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => onMarkAsRead(notif.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${BORDER}`,
                    display: 'flex',
                    gap: 12,
                    cursor: 'pointer',
                    background: notif.read ? 'transparent' : PRIMARY_SOFT,
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F0F5F5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.read ? 'transparent' : PRIMARY_SOFT
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: `${PRIMARY}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 4,
                    }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: notif.read ? 500 : 600,
                        color: TEXT_DARK,
                      }}>
                        {notif.title}
                      </span>
                      <span style={{
                        fontSize: 10,
                        color: TEXT_MUTED,
                      }}>
                        {getTimeAgo(notif.time)}
                      </span>
                    </div>
                    <p style={{
                      fontSize: 11,
                      color: TEXT_MUTED,
                      margin: 0,
                      lineHeight: 1.4,
                    }}>
                      {notif.message}
                    </p>
                  </div>
                  {!notif.read && (
                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: NOTIFICATION_BADGE,
                      alignSelf: 'center',
                    }} />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '10px 16px',
              borderTop: `1px solid ${BORDER}`,
              textAlign: 'center',
            }}>
              <button
                onClick={onViewAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 12,
                  color: PRIMARY,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {t.viewAll} →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Counter hook ─────────────────────────────────────────────────────────
function useAnimatedCount(target: number, dur = 800) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === undefined) return
    let start = 0
    const step = target / 40
    const interval = setInterval(() => {
      start = Math.min(start + step, target)
      setVal(Math.floor(start))
      if (start >= target) clearInterval(interval)
    }, dur / 40)
    return () => clearInterval(interval)
  }, [target, dur])
  return val
}

// ─── Stat Card ───────────────────────────────────────────────────
const StatCard = ({ label, value, icon, delay = 0 }: {
  label: string; value: number; icon: string; delay?: number
}) => {
  const count = useAnimatedCount(value)
  return (
    <div className="stat-card" style={{
      background: CARD_BG,
      border: `1px solid ${BORDER}`,
      borderRadius: 20,
      padding: '20px 20px',
      position: 'relative',
      overflow: 'hidden',
      animationDelay: `${delay}s`,
    }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, ${PRIMARY}, ${PRIMARY_LIGHT}, ${PRIMARY})`,
        backgroundSize: '200% auto',
        animation: 'shimmer 3s linear infinite',
      }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 16,
          background: PRIMARY_SOFT,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
          transition: 'transform 0.2s ease',
        }}>{icon}</div>
        <div style={{
          fontSize: 32, fontWeight: 700,
          color: TEXT_DARK,
          lineHeight: 1,
        }}>{count.toLocaleString()}</div>
      </div>

      <p style={{
        fontSize: 13, fontWeight: 500, 
        color: TEXT_MUTED,
        margin: '16px 0 0',
      }}>{label}</p>
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────
const ProgressBar = ({ label, current, max }: { label: string; current: number; max: number }) => {
  const isUnlimited = max === -1
  const pct = isUnlimited ? 100 : Math.min((current / max) * 100, 100)
  const isHigh = pct > 85
  const isMedium = pct > 70 && pct <= 85
  
  let barColor = PRIMARY
  if (isHigh) barColor = '#C4A77D'
  if (isMedium) barColor = '#8BAFB1'
  
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: TEXT_MUTED }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: TEXT_DARK }}>
          {current} <span style={{ fontWeight: 400, color: TEXT_MUTED }}>/ {isUnlimited ? '∞' : max}</span>
        </span>
      </div>
      <div style={{ background: PROGRESS_BG, borderRadius: 12, height: 8, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 12,
          background: barColor,
          width: `${pct}%`,
          transition: 'width 0.8s cubic-bezier(0.22, 0.97, 0.36, 1)',
        }}/>
      </div>
    </div>
  )
}

// ─── Loading Screen ───────────────────────────────────────────────────
const DashboardLoadingScreen = ({ msg, subMsg }: { msg: string; subMsg: string }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(8px)',
    zIndex: 9999,
  }}>
    <div style={{
      textAlign: 'center',
      padding: '2rem',
      maxWidth: 400,
      width: '100%',
    }}>
      <div style={{
        background: PRIMARY_SOFT,
        borderRadius: 20,
        padding: '20px 24px',
        marginBottom: '1.5rem',
        border: `1px solid ${BORDER}`,
      }}>
        <ECGAnimation height={100} showLetters={true} speed={0.7} />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 12,
          fontSize: 9,
          color: TEXT_MUTED,
          letterSpacing: '0.5px',
        }}>
          <span>❤️ FETCHING DATA</span>
          <span>⚡ LOADING</span>
          <span>📊 SECURE</span>
        </div>
      </div>

      <h3 style={{
        fontSize: 18,
        fontWeight: 600,
        color: TEXT_DARK,
        marginBottom: 8,
        fontFamily: "'Playfair Display', serif",
      }}>
        {msg}
      </h3>
      <p style={{
        fontSize: 13,
        color: TEXT_MUTED,
        marginBottom: 24,
      }}>
        {subMsg}
      </p>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
      }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: PRIMARY,
              animation: `pulse-soft 1.5s ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  </div>
)

// ─── Main Dashboard Component ─────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'موعد جديد',
      message: 'تم إضافة موعد جديد مع د. أحمد السيد',
      time: 'منذ 5 دقائق',
      read: false,
      type: 'appointment',
      icon: '📅',
    },
    {
      id: 2,
      title: 'تنبيه الحصة',
      message: 'اقتربت من الحد الأقصى لعدد المرضى (85%)',
      time: 'منذ ساعة',
      read: false,
      type: 'alert',
      icon: '⚠️',
    },
    {
      id: 3,
      title: 'تحديث النظام',
      message: 'تم تحديث النظام إلى الإصدار الأحدث',
      time: 'منذ 3 ساعات',
      read: true,
      type: 'system',
      icon: '🔔',
    },
    {
      id: 4,
      title: 'تذكير',
      message: 'لديك 3 مواعيد اليوم في الساعة 2:00 م',
      time: 'منذ 5 ساعات',
      read: false,
      type: 'appointment',
      icon: '📅',
    },
  ])

  useEffect(() => {
    const styleId = 'cura-dash-css'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = globalCss + `
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `
      document.head.appendChild(style)
    }

    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)

    const startTime = Date.now()
    const minLoadingTime = 1500

    api.get('/dashboard')
      .then(res => setData(res.data))
      .catch(() => navigate('/login'))
      .finally(() => {
        const elapsed = Date.now() - startTime
        if (elapsed < minLoadingTime) {
          setTimeout(() => setLoading(false), minLoadingTime - elapsed)
        } else {
          setLoading(false)
        }
      })

    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [navigate])

  // Notification handlers
  const handleMarkAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const handleViewAllNotifications = () => {
    // يمكنك توجيه المستخدم إلى صفحة الإشعارات
    console.log('View all notifications')
    // navigate('/notifications')
  }

  const t = T[lang]
  const isAr = lang === 'ar'
  const font = isAr ? "'Cairo', 'Tajawal', sans-serif" : "'Inter', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"

  if (loading) {
    return (
      <DashboardLoadingScreen 
        msg={t.loadingMessage} 
        subMsg={t.loadingSub}
      />
    )
  }

  const sub = data?.subscription
  
  const getDaysColor = (days: number) => {
    if (days <= 3) return '#C4A77D'
    if (days <= 7) return '#8BAFB1'
    return '#5B8C8F'
  }
  
  const daysColor = sub ? getDaysColor(sub.daysRemaining) : PRIMARY

  return (
    <div className="dash-shell" style={{ 
      fontFamily: font, 
      direction: isAr ? 'rtl' : 'ltr',
      background: '#F8FAFA',
      minHeight: '100vh',
      padding: '24px',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* ── Header with Notifications ── */}
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: PRIMARY_SOFT,
              border: `1px solid ${BORDER}`,
              borderRadius: 100, padding: '4px 16px',
              fontSize: 11, fontWeight: 600, 
              color: PRIMARY,
              letterSpacing: '0.3px',
              marginBottom: 12,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, animation: 'soft-pulse 2s infinite' }} />
              CURA
            </div>
            <h2 className="dash-title" style={{
              fontFamily: "'DM Serif Display', 'Georgia', serif",
              fontSize: 32, fontWeight: 500,
              color: TEXT_DARK,
              margin: 0, letterSpacing: '-0.3px',
            }}>{t.title}</h2>
            <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 8 }}>{t.welcome} 👋</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Notification Bell */}
            <NotificationBell
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onViewAll={handleViewAllNotifications}
              lang={lang}
            />

            {/* Plan Badge */}
            {sub && (
              <div style={{
                background: CARD_BG,
                border: `1px solid ${BORDER}`,
                borderRadius: 100, 
                padding: '6px 20px 6px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                fontSize: 13,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: PRIMARY_SOFT,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>📋</div>
                <div>
                  <div style={{ fontSize: 10, color: TEXT_MUTED, letterSpacing: '0.3px' }}>{t.plan}</div>
                  <div style={{ fontWeight: 600, color: TEXT_DARK }}>{sub.planName}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="dash-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: '32px' }}>
          <StatCard label={t.patients} value={data?.totalPatients ?? 0} icon="👥" delay={0.05} />
          <StatCard label={t.doctors} value={data?.totalDoctors ?? 0} icon="⚕️" delay={0.1} />
          <StatCard label={t.todayAppts} value={data?.todayAppointments ?? 0} icon="📅" delay={0.15} />
          <StatCard label={t.upcomingAppts} value={data?.upcomingAppointments ?? 0} icon="⏰" delay={0.2} />
        </div>

        {/* ── Subscription Card ── */}
        {sub && (
          <div style={{
            background: CARD_BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 24,
            overflow: 'hidden',
            transition: 'box-shadow 0.2s ease',
          }}>
            <div style={{
              padding: '20px 28px',
              borderBottom: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: TEXT_DARK, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>💎</span> {t.subscription}
              </h3>
              <div style={{
                background: PRIMARY_SOFT,
                border: `1px solid ${BORDER}`,
                borderRadius: 40, 
                padding: '6px 16px',
                fontSize: 13, fontWeight: 500, 
                color: daysColor,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>📅</span> {t.remaining} {sub.daysRemaining} {t.day}
              </div>
            </div>

            <div style={{ padding: '24px 28px' }}>
              <div className="dash-grid-4-sub" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 28 }}>
                {[
                  { label: t.plan, value: sub.planName, suffix: '', isText: true },
                  { label: t.daysLeft, value: `${sub.daysRemaining}`, suffix: t.day, isText: false },
                  { label: t.patients, value: `${sub.currentPatients}`, suffix: `/ ${sub.maxPatients === -1 ? '∞' : sub.maxPatients}`, isText: false },
                  { label: t.doctors, value: `${sub.currentDoctors}`, suffix: `/ ${sub.maxDoctors === -1 ? '∞' : sub.maxDoctors}`, isText: false },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: PRIMARY_SOFT,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 16, 
                    padding: '14px 16px',
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 8 }}>
                      {item.label}
                    </p>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ 
                        fontSize: item.isText ? 15 : 24, 
                        fontWeight: 600, 
                        color: TEXT_DARK, 
                        lineHeight: 1.2 
                      }}>{item.value}</span>
                      {item.suffix && <span style={{ fontSize: 13, color: TEXT_MUTED }}>{item.suffix}</span>}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <span style={{ fontSize: 18 }}>📊</span>
                  <p style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '0.6px', textTransform: 'uppercase', margin: 0 }}>
                    {t.usage}
                  </p>
                </div>
                <ProgressBar label={t.patients} current={sub.currentPatients} max={sub.maxPatients} />
                <ProgressBar label={t.doctors} current={sub.currentDoctors} max={sub.maxDoctors} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}