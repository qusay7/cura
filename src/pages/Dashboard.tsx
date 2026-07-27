import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import type { DashboardData } from '../types'
import { ECGAnimation } from '../components/ECGAnimation'
import { hasPermission } from '../utils/permissions'

const formatPrice = (price: number, lang: 'ar' | 'en') => {
  if (!price && price !== 0) return '—'
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-JO' : 'en-JO', {
    style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 2
  }).format(price)
}

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const globalCss = `
@keyframes fade-up { 
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes soft-pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
@keyframes pulse-soft { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes notification-slide { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes bell-ring { 0%{transform:rotate(0)} 25%{transform:rotate(15deg)} 50%{transform:rotate(-15deg)} 75%{transform:rotate(5deg)} 100%{transform:rotate(0)} }

.dash-shell { animation: fade-up 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) both; }
.dash-shell * { box-sizing: border-box; }
*:focus-visible { outline: 2px solid #5B8C8F; outline-offset: 2px; border-radius: 8px; }

.stat-card { transition: all 0.2s ease; }
.stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px -8px rgba(0,0,0,0.08); }

.notification-dropdown { animation: notification-slide 0.3s ease both; }

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

/* Doctors Grid */
.doctors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

/* Subscription Grid */
.sub-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

/* SuperAdmin grids */
.sa-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.sa-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* ── Tablet ── */
@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .sub-grid { grid-template-columns: repeat(2, 1fr); }
  .sa-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .sa-two-col { grid-template-columns: 1fr; }
}

/* ── Mobile ── */
@media (max-width: 640px) {
  .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .sub-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .sa-stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .sa-two-col { grid-template-columns: 1fr; }
  .doctors-grid { grid-template-columns: 1fr; }
  .top-bar-inner { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
  .sa-header-inner { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
  .sa-header-btns { flex-wrap: wrap !important; }
  .section-header-inner { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
  .sub-header-inner { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
}

/* ── Small Mobile ── */
@media (max-width: 400px) {
  .stats-grid { grid-template-columns: 1fr; }
  .sub-grid { grid-template-columns: 1fr; }
}
`

const PRIMARY = '#5B8C8F'
const PRIMARY_LIGHT = '#8BAFB1'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const PROGRESS_BG = '#E8F0F0'

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
    notifications: 'الإشعارات', markAllRead: 'تحديد الكل كمقروء',
    noNotifications: 'لا توجد إشعارات جديدة', viewAll: 'عرض الكل',
    localDateTime: 'التاريخ والوقت المحلي', logout: 'تسجيل الخروج',
    doctorsTodayTitle: 'مواعيد اليوم حسب الطبيب',
    viewAllAppointments: 'عرض جميع المواعيد',
    totalAppointments: 'إجمالي المواعيد',
    noAppointmentsToday: 'لا توجد مواعيد اليوم',
    addPatient: 'إضافة مريض', addDoctor: 'إضافة طبيب',
    quickVisit: 'زيارة سريعة', bookAppointment: 'حجز موعد',
  },
  en: {
    title: 'Dashboard', plan: 'Plan', loading: 'Loading...',
    patients: 'Patients', doctors: 'Doctors',
    todayAppts: "Today's Appts", upcomingAppts: 'Upcoming',
    subscription: 'Current Plan', remaining: 'Remaining',
    day: 'days', usage: 'Usage', daysLeft: 'Days Left', welcome: 'Welcome back',
    loadingMessage: 'Loading Dashboard',
    loadingSub: 'Please wait while we load your clinic data',
    notifications: 'Notifications', markAllRead: 'Mark all as read',
    noNotifications: 'No new notifications', viewAll: 'View all',
    localDateTime: 'Local Date & Time', logout: 'Sign Out',
    doctorsTodayTitle: "Today's Appointments by Doctor",
    viewAllAppointments: 'View all appointments',
    totalAppointments: 'Total appointments',
    noAppointmentsToday: 'No appointments today',
    addPatient: 'Add Patient', addDoctor: 'Add Doctor',
    quickVisit: 'Quick Visit', bookAppointment: 'Book Appointment',
  },
}

interface DoctorTodayAppointment {
  doctorId: string; doctorName: string; doctorSpecialty: string
  appointmentCount: number
  appointments: Array<{ id: number; patientName: string; time: string }>
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ label, current, max }: { label: string; current: number; max: number }) => {
  const isUnlimited = max === -1
  const pct = isUnlimited ? 100 : Math.min((current / max) * 100, 100)
  const barColor = pct > 85 ? '#C4A77D' : pct > 70 ? '#8BAFB1' : PRIMARY
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: TEXT_MUTED }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: TEXT_DARK }}>
          {current} <span style={{ fontWeight: 400, color: TEXT_MUTED }}>/ {isUnlimited ? '∞' : max}</span>
        </span>
      </div>
      <div style={{ background: PROGRESS_BG, borderRadius: 12, height: 8, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 12, background: barColor, width: `${pct}%`, transition: 'width 0.8s cubic-bezier(0.22, 0.97, 0.36, 1)' }} />
      </div>
    </div>
  )
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
const DashboardLoadingScreen = ({ msg, subMsg }: { msg: string; subMsg: string }) => (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', zIndex: 9999 }}>
    <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 400, width: '100%' }}>
      <div style={{ background: PRIMARY_SOFT, borderRadius: 20, padding: '20px 24px', marginBottom: '1.5rem', border: `1px solid ${BORDER}` }}>
        <ECGAnimation height={100} showLetters={true} speed={0.7} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 9, color: TEXT_MUTED }}>
          <span>❤️ FETCHING DATA</span><span>⚡ LOADING</span><span>📊 SECURE</span>
        </div>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: TEXT_DARK, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>{msg}</h3>
      <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 24 }}>{subMsg}</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, animation: `pulse-soft 1.5s ${i * 0.2}s infinite` }} />)}
      </div>
    </div>
  </div>
)

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, value, label, btnLabel, onBtnClick, onClick, showBtn }: {
  icon: string; value: number; label: string; btnLabel: string
  onBtnClick: () => void; onClick: () => void; showBtn: boolean
}) => (
  <div className="stat-card" onClick={onClick}
    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 20, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${PRIMARY}, ${PRIMARY_LIGHT}, ${PRIMARY})`, backgroundSize: '200% auto', animation: 'shimmer 3s linear infinite' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ width: 48, height: 48, borderRadius: 16, background: PRIMARY_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: TEXT_DARK }}>{value?.toLocaleString() || 0}</div>
    </div>
    <p style={{ fontSize: 13, fontWeight: 500, color: TEXT_MUTED, margin: '16px 0 0' }}>{label}</p>
    {showBtn && (
      <button onClick={e => { e.stopPropagation(); onBtnClick() }}
        style={{ marginTop: 12, padding: '8px 12px', background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 12, fontWeight: 500, color: PRIMARY, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', transition: 'all 0.2s ease' }}
        onMouseEnter={e => { e.currentTarget.style.background = PRIMARY; e.currentTarget.style.color = 'white' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFA'; e.currentTarget.style.color = PRIMARY }}>
        <span>+</span> {btnLabel}
      </button>
    )}
  </div>
)

// ─── SuperAdmin Dashboard ─────────────────────────────────────────────────────
const SuperAdminDashboard = ({ lang, navigate }: { lang: 'ar' | 'en'; navigate: (p: string) => void }) => {
  const isAr = lang === 'ar'
  const [clinics, setClinics] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} } })()

  useEffect(() => {
    Promise.all([api.get('/clinics'), api.get('/plans')])
      .then(([c, p]) => { setClinics(c.data); setPlans(p.data) })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try { await api.post('/auth/logout', { refreshToken }) } finally { localStorage.clear(); navigate('/login') }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><p style={{ color: TEXT_MUTED }}>جاري التحميل...</p></div>

  const activeClinics = clinics.filter(c => c.isActive).length

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ background: '#F8FAFA', minHeight: '100vh', padding: '16px 20px', fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ background: CARD_BG, borderRadius: 20, padding: '16px 20px', marginBottom: 24, border: `1px solid ${BORDER}` }}>
          <div className="sa-header-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_SOFT, borderRadius: 100, padding: '4px 14px', fontSize: 11, fontWeight: 600, color: PRIMARY, marginBottom: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY }} />SuperAdmin
              </div>
              <h2 style={{ fontFamily: "'DM Serif Display','Georgia',serif", fontSize: 24, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>
                🏥 {isAr ? 'لوحة تحكم المنصة' : 'Platform Dashboard'}
              </h2>
              <p style={{ fontSize: 13, color: TEXT_MUTED, margin: '4px 0 0' }}>{isAr ? `مرحباً ${user.fullName || ''} 👋` : `Welcome ${user.fullName || ''} 👋`}</p>
            </div>
            <div className="sa-header-btns" style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate('/superadmin/clinics')} style={{ background: PRIMARY, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🏥 {isAr ? 'العيادات' : 'Clinics'}</button>
              <button onClick={() => navigate('/superadmin/plans')} style={{ background: PRIMARY_SOFT, color: PRIMARY, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>💎 {isAr ? 'الخطط' : 'Plans'}</button>
              <button onClick={handleLogout} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 12, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#C4A77D', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="sa-stats-grid">
          {[
            { icon: '🏥', label: isAr ? 'إجمالي العيادات' : 'Total Clinics', value: clinics.length, color: PRIMARY },
            { icon: '✅', label: isAr ? 'عيادات نشطة' : 'Active Clinics', value: activeClinics, color: '#4A7679' },
            { icon: '⏸️', label: isAr ? 'عيادات موقوفة' : 'Inactive', value: clinics.length - activeClinics, color: '#C4A77D' },
            { icon: '💎', label: isAr ? 'الخطط المتاحة' : 'Plans', value: plans.length, color: PRIMARY },
          ].map((s, i) => (
            <div key={i} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <p style={{ fontSize: 12, color: TEXT_MUTED, margin: '4px 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Clinics & Plans */}
        <div className="sa-two-col">
          {/* Clinics */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: PRIMARY_SOFT }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, margin: 0 }}>🏥 {isAr ? 'العيادات' : 'Clinics'}</h3>
              <button onClick={() => navigate('/superadmin/clinics')} style={{ background: PRIMARY, color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>{isAr ? 'عرض الكل' : 'View All'}</button>
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {clinics.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 20px', color: TEXT_MUTED }}>
                  <p style={{ fontSize: 13 }}>{isAr ? 'لا توجد عيادات بعد' : 'No clinics yet'}</p>
                </div>
              ) : clinics.map((clinic: any) => (
                <div key={clinic.id} style={{ padding: '12px 18px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clinic.name}</p>
                    <p style={{ fontSize: 11, color: TEXT_MUTED, margin: '2px 0 0' }}>{clinic.ownerName || '—'} · {clinic.phone || '—'}</p>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, flexShrink: 0, background: clinic.isActive ? '#4A767915' : '#C4A77D15', color: clinic.isActive ? '#4A7679' : '#C4A77D' }}>
                    {clinic.isActive ? (isAr ? '✅ نشطة' : '✅ Active') : (isAr ? '⏸️ موقوفة' : '⏸️ Inactive')}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 18px', borderTop: `1px solid ${BORDER}`, textAlign: 'center' }}>
              <button onClick={() => navigate('/superadmin/clinics')} style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '6px 16px', fontSize: 12, color: PRIMARY, cursor: 'pointer' }}>+ {isAr ? 'إضافة عيادة' : 'Add Clinic'}</button>
            </div>
          </div>

          {/* Plans */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: PRIMARY_SOFT }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, margin: 0 }}>💎 {isAr ? 'الخطط' : 'Plans'}</h3>
              <button onClick={() => navigate('/superadmin/plans')} style={{ background: PRIMARY, color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>{isAr ? 'إدارة' : 'Manage'}</button>
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: TEXT_MUTED }}>
                  <p style={{ fontSize: 32, margin: 0 }}>💎</p>
                  <p style={{ fontSize: 13, marginTop: 8 }}>{isAr ? 'لا توجد خطط بعد' : 'No plans yet'}</p>
                  <button onClick={() => navigate('/superadmin/plans')} style={{ background: PRIMARY, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 12, cursor: 'pointer', marginTop: 8 }}>🚀 {isAr ? 'إنشاء الخطط' : 'Create Plans'}</button>
                </div>
              ) : plans.map((plan: any) => (
                <div key={plan.id} style={{ background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>
                      {plan.name === 'Basic' ? '🥉' : plan.name === 'Standard' ? '🥈' : '🥇'} {plan.name}
                    </p>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: plan.isActive ? '#4A767915' : '#C4A77D15', color: plan.isActive ? '#4A7679' : '#C4A77D' }}>
                      {plan.isActive ? (isAr ? 'نشطة' : 'Active') : (isAr ? 'موقوفة' : 'Inactive')}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {[
                      { label: isAr ? 'شهري' : 'Monthly', value: `${plan.monthlyPrice} ${isAr ? 'د.أ' : 'JD'}` },
                      { label: isAr ? 'سنوي' : 'Yearly', value: `${plan.yearlyPrice} ${isAr ? 'د.أ' : 'JD'}` },
                      { label: isAr ? 'أطباء' : 'Doctors', value: plan.maxDoctors === -1 ? '∞' : plan.maxDoctors },
                      { label: isAr ? 'مرضى' : 'Patients', value: plan.maxPatients === -1 ? '∞' : plan.maxPatients },
                    ].map(item => (
                      <div key={item.label} style={{ background: CARD_BG, borderRadius: 8, padding: '5px 6px', textAlign: 'center' }}>
                        <p style={{ fontSize: 9, color: TEXT_MUTED, margin: 0, textTransform: 'uppercase' }}>{item.label}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: TEXT_DARK, margin: '2px 0 0' }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [doctorsToday, setDoctorsToday] = useState<DoctorTodayAppointment[]>([])

  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} } })()
  const isSuperAdmin = user.role === 'SuperAdmin'

  useEffect(() => {
    const styleId = 'cura-dash-css'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style'); style.id = styleId; style.textContent = globalCss; document.head.appendChild(style)
    }
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)

    if (isSuperAdmin) { setLoading(false); return () => window.removeEventListener('cura-lang-change', handleLangChange) }

    const startTime = Date.now()
    Promise.all([
      api.get('/dashboard'),
      api.get('/appointments/today-by-doctor').then(r => setDoctorsToday(r.data)).catch(() => {}),
    ])
      .then(([r]) => setData(r.data))
      .catch(() => navigate('/login'))
      .finally(() => { const e = Date.now() - startTime; setTimeout(() => setLoading(false), Math.max(0, 1200 - e)) })

    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [navigate, lang])

  const t = T[lang]
  const isAr = lang === 'ar'
  const font = isAr ? "'Cairo','Tajawal',sans-serif" : "'Inter','DM Sans',sans-serif"

  if (loading) return <DashboardLoadingScreen msg={t.loadingMessage} subMsg={t.loadingSub} />
  if (isSuperAdmin) return <SuperAdminDashboard lang={lang} navigate={navigate} />

  const sub = data?.subscription
  const daysColor = sub ? (sub.daysRemaining <= 3 ? '#C4A77D' : sub.daysRemaining <= 7 ? '#8BAFB1' : PRIMARY) : PRIMARY

  return (
    <div className="dash-shell" style={{ fontFamily: font, direction: isAr ? 'rtl' : 'ltr', background: '#F8FAFA', minHeight: '100vh', padding: '16px 20px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Top Bar — ترحيب مختصر بس. الإشعارات وتسجيل الخروج وقائمة المستخدم
            موجودين أصلاً بالشريط العلوي لـ Layout.tsx اللي يغلّف هذي الصفحة،
            فما نكررهم هنا. */}
        <div style={{ background: CARD_BG, borderRadius: 20, padding: '14px 20px', marginBottom: 24, border: `1px solid ${BORDER}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_SOFT, borderRadius: 100, padding: '4px 14px', fontSize: 11, fontWeight: 600, color: PRIMARY, marginBottom: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, animation: 'soft-pulse 2s infinite' }} />CURA
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: TEXT_DARK, margin: 0, letterSpacing: '-0.3px' }}>{t.title}</h1>
          <p style={{ fontSize: 13, color: TEXT_MUTED, margin: '2px 0 0' }}>{t.welcome} {user.fullName ? `${user.fullName} 👋` : '👋'}</p>
        </div>

        {/* عنوان قسم واضح يفصل "الأرقام السريعة" عن باقي الشاشة */}
        <p style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 10px 4px' }}>
          {isAr ? 'نظرة سريعة' : 'Quick Overview'}
        </p>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard icon="👥" value={data?.totalPatients || 0} label={t.patients}
            btnLabel={t.addPatient} showBtn={hasPermission('patients.create')}
            onClick={() => navigate('/patients')} onBtnClick={() => navigate('/patients/add')} />
          {hasPermission('doctors.view') && (
            <StatCard icon="⚕️" value={data?.totalDoctors || 0} label={t.doctors}
              btnLabel={t.addDoctor} showBtn={hasPermission('doctors.create')}
              onClick={() => navigate('/doctors')} onBtnClick={() => navigate('/doctors/add')} />
          )}
          <StatCard icon="📅" value={data?.todayAppointments || 0} label={t.todayAppts}
            btnLabel={t.quickVisit} showBtn={hasPermission('appointments.create')}
            onClick={() => navigate('/appointments')} onBtnClick={() => navigate('/quick-visit')} />
          <StatCard icon="⏰" value={data?.upcomingAppointments || 0} label={t.upcomingAppts}
            btnLabel={t.bookAppointment} showBtn={hasPermission('appointments.create')}
            onClick={() => navigate('/appointments')} onBtnClick={() => navigate('/appointments/add')} />
        </div>

        {/* Doctors Today */}
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 20, marginBottom: 24 }}>
          <div className="section-header-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: `2px solid ${PRIMARY_SOFT}`, gap: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: TEXT_DARK, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>👨‍⚕️</span>{t.doctorsTodayTitle}
            </div>
            <span onClick={() => navigate('/appointments')} style={{ fontSize: 12, color: PRIMARY, cursor: 'pointer', whiteSpace: 'nowrap' }}>{t.viewAllAppointments} →</span>
          </div>
          {doctorsToday.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: TEXT_MUTED, background: '#F8FAFA', borderRadius: 14 }}>
              <span style={{ fontSize: 32, opacity: 0.5 }}>📅</span>
              <p style={{ marginTop: 10, fontSize: 13 }}>{t.noAppointmentsToday}</p>
            </div>
          ) : (
            <div className="doctors-grid">
              {doctorsToday.map(doctor => (
                <div key={doctor.doctorId} onClick={() => navigate('/appointments')}
                  style={{ background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 16, padding: 14, cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = PRIMARY }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = BORDER }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'white', flexShrink: 0 }}>👨‍⚕️</div>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doctor.doctorName}</h4>
                      <p style={{ fontSize: 11, color: TEXT_MUTED, margin: 0 }}>{doctor.doctorSpecialty || (isAr ? 'طبيب عام' : 'General')}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
                    <span style={{ background: PRIMARY_SOFT, borderRadius: 20, padding: '3px 12px', fontSize: 18, fontWeight: 700, color: PRIMARY }}>{doctor.appointmentCount}</span>
                    <span style={{ fontSize: 12, color: TEXT_MUTED }}>{t.totalAppointments}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subscription */}
        {sub && (
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden' }}>
            <div className="sub-header-inner" style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: TEXT_DARK, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>💎</span> {t.subscription}
              </h3>
              <div style={{ background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 40, padding: '5px 14px', fontSize: 12, fontWeight: 500, color: daysColor, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span>📅</span> {t.remaining} {sub.daysRemaining} {t.day}
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              <div className="sub-grid" style={{ marginBottom: 20 }}>
                {[
                  { label: t.plan, value: sub.planName, suffix: '', isText: true },
                  { label: t.daysLeft, value: `${sub.daysRemaining}`, suffix: t.day, isText: false },
                  { label: t.patients, value: `${sub.currentPatients}`, suffix: `/ ${sub.maxPatients === -1 ? '∞' : sub.maxPatients}`, isText: false },
                  { label: t.doctors, value: `${sub.currentDoctors}`, suffix: `/ ${sub.maxDoctors === -1 ? '∞' : sub.maxDoctors}`, isText: false },
                ].map((item, i) => (
                  <div key={i} style={{ background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '12px 14px' }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</p>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: item.isText ? 14 : 22, fontWeight: 600, color: TEXT_DARK }}>{item.value}</span>
                      {item.suffix && <span style={{ fontSize: 12, color: TEXT_MUTED }}>{item.suffix}</span>}
                    </p>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 14 }}>📊 {t.usage}</p>
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