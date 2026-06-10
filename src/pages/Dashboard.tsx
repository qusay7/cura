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

/* Focus rings */
*:focus-visible {
  outline: 2px solid #5B8C8F;
  outline-offset: 2px;
  border-radius: 8px;
}

/* Notification dropdown */
.notification-dropdown {
  animation: notification-slide 0.3s ease both;
}

/* ============================================
   TOP BAR STYLES
   ============================================ */
.dashboard-top-bar {
  background: #FFFFFF;
  border-radius: 24px;
  padding: 16px 24px;
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid #DCE5E5;
}

.top-bar-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #E8F0F0;
  border-radius: 100px;
  padding: 4px 14px;
  width: fit-content;
  font-size: 11px;
  font-weight: 600;
  color: #5B8C8F;
}

.brand-badge span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #5B8C8F;
  animation: soft-pulse 2s infinite;
}

.top-bar-left h1 {
  font-size: 24px;
  font-weight: 600;
  color: #2C3E3F;
  margin: 0;
  letter-spacing: -0.3px;
}

.top-bar-left p {
  font-size: 13px;
  color: #6B8A8C;
  margin: 0;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.datetime-card {
  background: #F8FAFA;
  border-radius: 16px;
  padding: 8px 16px;
  min-width: 180px;
  border: 1px solid #DCE5E5;
  text-align: center;
}

.datetime-card .date {
  font-size: 12px;
  font-weight: 500;
  color: #2C3E3F;
  margin-bottom: 2px;
}

.datetime-card .time {
  font-size: 14px;
  font-weight: 600;
  color: #5B8C8F;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  background: #F8FAFA;
  border: 1px solid #DCE5E5;
  border-radius: 12px;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.icon-btn:hover {
  background: #E8F0F0;
  transform: translateY(-2px);
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #F8FAFA;
  border: 1px solid #DCE5E5;
  border-radius: 30px;
  padding: 5px 16px 5px 5px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-btn:hover {
  background: #E8F0F0;
  transform: translateY(-2px);
}

.user-avatar-small {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5B8C8F 0%, #8BAFB1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.user-info-small {
  text-align: left;
}

.user-name-small {
  font-size: 13px;
  font-weight: 600;
  color: #2C3E3F;
  margin: 0;
}

.user-role-small {
  font-size: 10px;
  color: #6B8A8C;
  margin: 0;
}

.notification-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #C4A77D;
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-btn-icon {
  background: none;
  border: 1px solid #DCE5E5;
  border-radius: 12px;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #C4A77D;
}

.logout-btn-icon:hover {
  background: #FDF5F5;
  border-color: #C4A77D;
  color: #C4A77D;
}

/* Stats Grid */
.dash-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.dash-grid-4-sub {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* Doctors Today Appointments Section */
.doctors-today-section {
  background: #FFFFFF;
  border: 1px solid #DCE5E5;
  border-radius: 24px;
  padding: 24px;
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #E8F0F0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #2C3E3F;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title span {
  font-size: 24px;
}

.view-all-link {
  font-size: 12px;
  color: #5B8C8F;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;
}

.view-all-link:hover {
  color: #4A7679;
  text-decoration: underline;
}

.doctors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.doctor-today-card {
  background: #F8FAFA;
  border: 1px solid #DCE5E5;
  border-radius: 16px;
  padding: 16px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.doctor-today-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: #5B8C8F;
}

.doctor-today-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.doctor-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5B8C8F 0%, #8BAFB1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.doctor-info {
  flex: 1;
}

.doctor-name {
  font-size: 15px;
  font-weight: 600;
  color: #2C3E3F;
  margin: 0 0 4px 0;
}

.doctor-specialty {
  font-size: 11px;
  color: #6B8A8C;
  margin: 0;
}

.appointment-count {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #DCE5E5;
}

.count-badge {
  background: #E8F0F0;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 18px;
  font-weight: 700;
  color: #5B8C8F;
}

.count-label {
  font-size: 12px;
  color: #6B8A8C;
}

.empty-doctors {
  text-align: center;
  padding: 40px;
  color: #6B8A8C;
  background: #F8FAFA;
  border-radius: 16px;
}

/* Responsive */
@media(max-width: 1024px) {
  .dash-grid-4 { gap: 16px; }
  .dash-grid-4-sub { gap: 16px; }
  .doctors-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
}

@media(max-width: 768px) {
  .dashboard-top-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
  }
  
  .top-bar-right {
    justify-content: space-between;
  }
  
  .datetime-card {
    flex: 1;
    text-align: center;
    min-width: auto;
  }
  
  .user-info-small {
    display: none;
  }
  
  .user-btn {
    padding: 5px;
  }
  
  .dash-grid-4 { 
    grid-template-columns: repeat(2, 1fr) !important; 
    gap: 12px !important; 
  }
  
  .dash-grid-4-sub { 
    grid-template-columns: repeat(2, 1fr) !important; 
    gap: 12px !important; 
  }
  
  .doctors-grid {
    grid-template-columns: 1fr !important;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

@media(max-width: 480px) {
  .dash-grid-4 { grid-template-columns: 1fr !important; }
  .dash-grid-4-sub { grid-template-columns: 1fr !important; }
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
const NOTIFICATION_BADGE = '#C4A77D'

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
    localDateTime: 'التاريخ والوقت المحلي',
    logout: 'تسجيل الخروج',
    doctorsTodayTitle: 'مواعيد اليوم حسب الطبيب',
    viewAllAppointments: 'عرض جميع المواعيد',
    totalAppointments: 'إجمالي المواعيد',
    noAppointmentsToday: 'لا توجد مواعيد اليوم',
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
    localDateTime: 'Local Date & Time',
    logout: 'Sign Out',
    doctorsTodayTitle: "Today's Appointments by Doctor",
    viewAllAppointments: 'View all appointments',
    totalAppointments: 'Total appointments',
    noAppointmentsToday: 'No appointments today',
  },
}

// ─── Types ─────────────────────────────────────────────────────────────────
interface Notification {
  id: number
  title: string
  message: string
  time: string
  read: boolean
  type: 'appointment' | 'alert' | 'system'
}

interface DoctorTodayAppointment {
  doctorId: string
  doctorName: string
  doctorSpecialty: string
  appointmentCount: number
  appointments: Array<{
    id: number
    patientName: string
    time: string
  }>
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
      padding: '20px',
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

// ─── Notification Bell Component ─────────────────────────────────────────────
const NotificationBell = ({ 
  notifications, 
  onMarkAsRead, 
  onViewAll,
  lang,
  unreadCount
}: { 
  notifications: Notification[]
  onMarkAsRead: (id: number) => void
  onViewAll: () => void
  lang: 'ar' | 'en'
  unreadCount: number
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isRinging, setIsRinging] = useState(false)
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
        className="icon-btn"
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
        <div className="notification-dropdown" style={{ 
          position: 'absolute',
          top: '50px',
          [isAr ? 'left' : 'right']: 0,
          width: 360,
          maxWidth: 'calc(100vw - 20px)',
          background: CARD_BG,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${BORDER}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: PRIMARY_SOFT,
          }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, margin: 0 }}>{t.notifications}</h4>
            {unreadCount > 0 && (
              <button
                onClick={() => notifications.forEach(n => !n.read && onMarkAsRead(n.id))}
                style={{ background: 'transparent', border: 'none', fontSize: 11, color: PRIMARY, cursor: 'pointer' }}
              >
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
                  style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${BORDER}`,
                    display: 'flex',
                    gap: 12,
                    cursor: 'pointer',
                    background: notif.read ? 'transparent' : PRIMARY_SOFT,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: `${PRIMARY}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: notif.read ? 500 : 600, color: TEXT_DARK }}>{notif.title}</span>
                      <span style={{ fontSize: 10, color: TEXT_MUTED }}>{notif.time}</span>
                    </div>
                    <p style={{ fontSize: 11, color: TEXT_MUTED, margin: 0 }}>{notif.message}</p>
                  </div>
                  {!notif.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: NOTIFICATION_BADGE, alignSelf: 'center' }} />}
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

// ─── Main Dashboard Component ─────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [doctorsToday, setDoctorsToday] = useState<DoctorTodayAppointment[]>([])
  
  // التاريخ والوقت المحلي
  const getLocalDateTime = () => {
    const now = new Date()
    const dateOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }
    const date = now.toLocaleDateString(lang === 'ar' ? 'ar-SA' : undefined, dateOptions)
    const time = now.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : undefined, timeOptions)
    return { date, time }
  }
  
  const [currentDateTime, setCurrentDateTime] = useState(getLocalDateTime())
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: 'موعد جديد', message: 'تم إضافة موعد جديد مع د. أحمد السيد', time: 'منذ 5 دقائق', read: false, type: 'appointment' },
    { id: 2, title: 'تنبيه الحصة', message: 'اقتربت من الحد الأقصى لعدد المرضى (85%)', time: 'منذ ساعة', read: false, type: 'alert' },
    { id: 3, title: 'تحديث النظام', message: 'تم تحديث النظام إلى الإصدار الأحدث', time: 'منذ 3 ساعات', read: true, type: 'system' },
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') }
    catch { return {} }
  })()

  // جلب بيانات مواعيد اليوم لكل طبيب
  const fetchDoctorsTodayAppointments = async () => {
    try {
      const response = await api.get('/appointments/today-by-doctor')
      setDoctorsToday(response.data)
    } catch (error) {
      console.error('Error fetching doctors appointments:', error)
      
    }
  }

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

    Promise.all([
      api.get('/dashboard'),
      fetchDoctorsTodayAppointments()
    ])
      .then(([dashboardRes]) => {
        setData(dashboardRes.data)
      })
      .catch(() => navigate('/login'))
      .finally(() => {
        const elapsed = Date.now() - startTime
        if (elapsed < minLoadingTime) {
          setTimeout(() => setLoading(false), minLoadingTime - elapsed)
        } else {
          setLoading(false)
        }
      })
      
    const timer = setInterval(() => {
      setCurrentDateTime(getLocalDateTime())
    }, 1000)

    return () => {
      window.removeEventListener('cura-lang-change', handleLangChange)
      clearInterval(timer)
    }
  }, [navigate, lang])

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const handleViewAllNotifications = () => {
    navigate('/appointments')
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

  const t = T[lang]
  const isAr = lang === 'ar'
  const font = isAr ? "'Cairo', 'Tajawal', sans-serif" : "'Inter', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"

  if (loading) {
    return <DashboardLoadingScreen msg={t.loadingMessage} subMsg={t.loadingSub} />
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


        {/* ── Top Bar ── */}
        <div className="dashboard-top-bar">
          <div className="top-bar-left">
            <div className="brand-badge">
              <span />
              CURA
            </div>
            <h1>{t.title}</h1>
            <p>{t.welcome} 👋</p>
          </div>

          <div className="top-bar-right">
            <div className="datetime-card">
              <div className="date">{currentDateTime.date}</div>
              <div className="time">{currentDateTime.time}</div>
            </div>

            <div className="action-buttons">
              <NotificationBell
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onViewAll={handleViewAllNotifications}
                lang={lang}
                unreadCount={unreadCount}
              />

              <button className="user-btn" onClick={() => navigate('/profile')}>
                <div className="user-avatar-small">
                  {(user.fullName || 'U')[0].toUpperCase()}
                </div>
                <div className="user-info-small">
                  <p className="user-name-small">{user.fullName || '---'}</p>
                  <p className="user-role-small">{user.role || ''}</p>
                </div>
              </button>

              <button className="logout-btn-icon" onClick={handleLogout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

       {/* ── Stats Grid with Quick Actions ── */}
<div className="dash-grid-4">
  {/* بطاقة المرضى */}
  <div className="stat-card" style={{
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: 20,
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    animationDelay: '0.05s',
    cursor: 'pointer',
  }} onClick={() => navigate('/patients')}>
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
      }}>👥</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: TEXT_DARK }}>
        {data?.totalPatients?.toLocaleString() || 0}
      </div>
    </div>
    <p style={{ fontSize: 13, fontWeight: 500, color: TEXT_MUTED, margin: '16px 0 0' }}>{t.patients}</p>
    
    {/* زر الإضافة السريع */}
    <button
      onClick={(e) => {
        e.stopPropagation()
        navigate('/patients/add')
      }}
      style={{
        marginTop: '12px',
        padding: '8px 12px',
        background: '#F8FAFA',
        border: `1px solid ${BORDER}`,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        color: PRIMARY,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        width: '100%',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = PRIMARY
        e.currentTarget.style.color = 'white'
        e.currentTarget.style.borderColor = PRIMARY
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#F8FAFA'
        e.currentTarget.style.color = PRIMARY
        e.currentTarget.style.borderColor = BORDER
      }}
    >
      <span>+</span> {isAr ? 'إضافة مريض' : 'Add Patient'}
    </button>
  </div>

  {/* بطاقة الأطباء */}
  <div className="stat-card" style={{
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: 20,
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    animationDelay: '0.1s',
    cursor: 'pointer',
  }} onClick={() => navigate('/doctors')}>
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
      }}>⚕️</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: TEXT_DARK }}>
        {data?.totalDoctors?.toLocaleString() || 0}
      </div>
    </div>
    <p style={{ fontSize: 13, fontWeight: 500, color: TEXT_MUTED, margin: '16px 0 0' }}>{t.doctors}</p>
    
    {/* زر الإضافة السريع */}
    <button
  onClick={(e) => {
    e.stopPropagation()
    navigate('/doctors/add', { replace: true })
  }}
      style={{
        marginTop: '12px',
        padding: '8px 12px',
        background: '#F8FAFA',
        border: `1px solid ${BORDER}`,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        color: PRIMARY,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        width: '100%',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = PRIMARY
        e.currentTarget.style.color = 'white'
        e.currentTarget.style.borderColor = PRIMARY
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#F8FAFA'
        e.currentTarget.style.color = PRIMARY
        e.currentTarget.style.borderColor = BORDER
      }}
    >
      <span>+</span> {isAr ? 'إضافة طبيب' : 'Add Doctor'}
    </button>
  </div>

  {/* بطاقة مواعيد اليوم */}
  <div className="stat-card" style={{
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: 20,
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    animationDelay: '0.15s',
    cursor: 'pointer',
  }} onClick={() => navigate('/appointments?filter=today')}>
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
      }}>📅</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: TEXT_DARK }}>
        {data?.todayAppointments?.toLocaleString() || 0}
      </div>
    </div>
    <p style={{ fontSize: 13, fontWeight: 500, color: TEXT_MUTED, margin: '16px 0 0' }}>{t.todayAppts}</p>
    
    {/* زر الإضافة السريع */}
    <button
      onClick={(e) => {
        e.stopPropagation()
        navigate('/quick-visit')
      }}
      style={{
        marginTop: '12px',
        padding: '8px 12px',
        background: '#F8FAFA',
        border: `1px solid ${BORDER}`,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        color: PRIMARY,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        width: '100%',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = PRIMARY
        e.currentTarget.style.color = 'white'
        e.currentTarget.style.borderColor = PRIMARY
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#F8FAFA'
        e.currentTarget.style.color = PRIMARY
        e.currentTarget.style.borderColor = BORDER
      }}
    >
      <span>+</span> {isAr ? 'زيارة سريعة' : 'quick-visit'}
    </button>
  </div>

  {/* بطاقة مواعيد القادمة */}
  <div className="stat-card" style={{
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: 20,
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    animationDelay: '0.2s',
    cursor: 'pointer',
  }} onClick={() => navigate('/appointments?filter=upcoming')}>
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
      }}>⏰</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: TEXT_DARK }}>
        {data?.upcomingAppointments?.toLocaleString() || 0}
      </div>
    </div>
    <p style={{ fontSize: 13, fontWeight: 500, color: TEXT_MUTED, margin: '16px 0 0' }}>{t.upcomingAppts}</p>
    
    {/* زر الإضافة السريع - نفس زر مواعيد اليوم */}
    <button
      onClick={(e) => {
        e.stopPropagation()
        navigate('/appointments/add')
      }}
      style={{
        marginTop: '12px',
        padding: '8px 12px',
        background: '#F8FAFA',
        border: `1px solid ${BORDER}`,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        color: PRIMARY,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        width: '100%',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = PRIMARY
        e.currentTarget.style.color = 'white'
        e.currentTarget.style.borderColor = PRIMARY
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#F8FAFA'
        e.currentTarget.style.color = PRIMARY
        e.currentTarget.style.borderColor = BORDER
      }}
    >
      <span>+</span> {isAr ? 'حجز موعد' : 'Book Appointment'}
    </button>
  </div>
</div>

        {/* ── Doctors Today Appointments Section ── */}
        <div className="doctors-today-section">
          <div className="section-header">
            <div className="section-title">
              <span>👨‍⚕️</span>
              {t.doctorsTodayTitle}
            </div>
            <div className="view-all-link" onClick={() => navigate('/appointments?filter=today')}>
              {t.viewAllAppointments} →
            </div>
          </div>

          {doctorsToday.length === 0 ? (
            <div className="empty-doctors">
              <span style={{ fontSize: 32, opacity: 0.5 }}>📅</span>
              <p style={{ marginTop: 12 }}>{t.noAppointmentsToday}</p>
            </div>
          ) : (
            <div className="doctors-grid">
              {doctorsToday.map((doctor) => (
                <div 
                  key={doctor.doctorId} 
                  className="doctor-today-card"
                  onClick={() => navigate(`/appointments?doctorId=${doctor.doctorId}&filter=today`)}
                >
                  <div className="doctor-today-header">
                    <div className="doctor-avatar">
                      👨‍⚕️
                    </div>
                    <div className="doctor-info">
                      <h4 className="doctor-name">{doctor.doctorName}</h4>
                      <p className="doctor-specialty">{doctor.doctorSpecialty || (isAr ? 'طبيب عام' : 'General Physician')}</p>
                    </div>
                  </div>
                  <div className="appointment-count">
                    <span className="count-badge">{doctor.appointmentCount}</span>
                    <span className="count-label">{t.totalAppointments}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Subscription Card ── */}
        {sub && (
          <div style={{
            background: CARD_BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 24,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px 28px',
              borderBottom: `1px solid ${BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: TEXT_DARK, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>💎</span> {t.subscription}
              </h3>
              <div style={{
                background: PRIMARY_SOFT,
                border: `1px solid ${BORDER}`,
                borderRadius: 40,
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: daysColor,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span>📅</span> {t.remaining} {sub.daysRemaining} {t.day}
              </div>
            </div>

            <div style={{ padding: '24px 28px' }}>
              <div className="dash-grid-4-sub">
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

              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 20, marginTop: 8 }}>
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