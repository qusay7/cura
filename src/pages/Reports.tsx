import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const SUCCESS = '#4A7679'
const WARNING = '#C4A77D'

const T = {
  ar: {
    title: 'التقارير والإحصائيات',
    subtitle: 'نظرة شاملة على أداء العيادة',
    totalPatients: 'إجمالي المرضى',
    totalAppointments: 'إجمالي المواعيد',
    totalDoctors: 'إجمالي الأطباء',
    totalRevenue: 'إجمالي الإيرادات',
    completedAppointments: 'مواعيد مكتملة',
    cancelledAppointments: 'مواعيد ملغية',
    scheduledAppointments: 'مواعيد مجدولة',
    newPatientsThisMonth: 'مرضى جدد هذا الشهر',
    appointmentsThisMonth: 'مواعيد هذا الشهر',
    revenueThisMonth: 'إيرادات هذا الشهر',
    topDoctors: 'أكثر الأطباء مواعيد',
    appointmentsByStatus: 'المواعيد حسب الحالة',
    appointmentsByMonth: 'المواعيد الشهرية',
    riyal: 'د.أ',
    loading: 'جاري تحميل التقارير...',
    noData: 'لا توجد بيانات',
    appointments: 'موعد',
    patients: 'مريض',
    months: ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
             'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
  },
  en: {
    title: 'Reports & Analytics',
    subtitle: 'Comprehensive overview of clinic performance',
    totalPatients: 'Total Patients',
    totalAppointments: 'Total Appointments',
    totalDoctors: 'Total Doctors',
    totalRevenue: 'Total Revenue',
    completedAppointments: 'Completed',
    cancelledAppointments: 'Cancelled',
    scheduledAppointments: 'Scheduled',
    newPatientsThisMonth: 'New Patients This Month',
    appointmentsThisMonth: 'Appointments This Month',
    revenueThisMonth: 'Revenue This Month',
    topDoctors: 'Top Doctors by Appointments',
    appointmentsByStatus: 'Appointments by Status',
    appointmentsByMonth: 'Monthly Appointments',
    riyal: 'JD',
    loading: 'Loading reports...',
    noData: 'No data available',
    appointments: 'appointments',
    patients: 'patients',
    months: ['Jan','Feb','Mar','Apr','May','Jun',
             'Jul','Aug','Sep','Oct','Nov','Dec'],
  },
}

interface ReportData {
  totalPatients: number
  totalAppointments: number
  totalDoctors: number
  totalRevenue: number
  completedAppointments: number
  cancelledAppointments: number
  scheduledAppointments: number
  newPatientsThisMonth: number
  appointmentsThisMonth: number
  revenueThisMonth: number
  topDoctors: { doctorName: string; appointmentCount: number }[]
  appointmentsByMonth: { month: number; year: number; count: number; revenue: number }[]
}

// ─── Stat Card ────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color }: {
  icon: string
  label: string
  value: string | number
  sub?: string
  color?: string
}) => (
  <div style={{
    background: CARD_BG, border: `1px solid ${BORDER}`,
    borderRadius: 16, padding: '20px',
    display: 'flex', flexDirection: 'column', gap: 12,
    transition: 'all 0.2s ease',
  }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 8px 20px -8px rgba(0,0,0,0.08)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: PRIMARY_SOFT, display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 22,
      }}>
        {icon}
      </div>
      {sub && (
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 100,
          background: `${SUCCESS}15`, color: SUCCESS, fontWeight: 500,
        }}>
          {sub}
        </span>
      )}
    </div>
    <div>
      <p style={{ fontSize: 24, fontWeight: 700, color: color || TEXT_DARK, margin: 0 }}>
        {value}
      </p>
      <p style={{ fontSize: 12, color: TEXT_MUTED, margin: '4px 0 0' }}>{label}</p>
    </div>
  </div>
)

// ─── Bar Chart ────────────────────────────────────────────────────────────
const BarChart = ({ data, lang }: {
  data: { month: number; year: number; count: number; revenue: number }[]
  lang: 'ar' | 'en'
}) => {
  const t = T[lang]
  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        gap: 8, height: 140, paddingBottom: 4,
      }}>
        {data.map((d, i) => (
          <div key={i} style={{
            flex: 1, display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: 500 }}>
              {d.count}
            </span>
            <div style={{
              width: '100%', borderRadius: '4px 4px 0 0',
              background: i === data.length - 1 ? PRIMARY : `${PRIMARY}50`,
              height: `${(d.count / maxCount) * 100}%`,
              minHeight: d.count > 0 ? 4 : 0,
              transition: 'height 0.8s ease',
            }} />
            <span style={{ fontSize: 9, color: TEXT_MUTED }}>
              {t.months[d.month - 1]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Donut Chart (CSS) ────────────────────────────────────────────────────
const StatusChart = ({ completed, cancelled, scheduled, lang }: {
  completed: number
  cancelled: number
  scheduled: number
  lang: 'ar' | 'en'
}) => {
  const t = T[lang]
  const total = completed + cancelled + scheduled || 1

  const items = [
    { label: t.completedAppointments, value: completed, color: SUCCESS },
    { label: t.scheduledAppointments, value: scheduled, color: PRIMARY },
    { label: t.cancelledAppointments, value: cancelled, color: WARNING },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginBottom: 4,
            }}>
              <span style={{ fontSize: 12, color: TEXT_DARK }}>{item.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: item.color }}>
                {item.value} ({Math.round((item.value / total) * 100)}%)
              </span>
            </div>
            <div style={{
              height: 8, borderRadius: 100, background: `${item.color}20`, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 100,
                background: item.color,
                width: `${(item.value / total) * 100}%`,
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function Reports() {
  const navigate = useNavigate()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())

  const t = T[lang]
  const isAr = lang === 'ar'

  useEffect(() => {
    const handleLang = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLang)
    return () => window.removeEventListener('cura-lang-change', handleLang)
  }, [])

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports')
        setData(res.data)
      } catch {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh',
        flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 40 }}>📊</div>
        <p style={{ color: TEXT_MUTED, fontSize: 14 }}>{t.loading}</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{
      background: '#F8FAFA', minHeight: '100vh', padding: 24,
      fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif",
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: PRIMARY_SOFT, border: `1px solid ${BORDER}`,
            borderRadius: 100, padding: '4px 16px', fontSize: 11,
            fontWeight: 600, color: PRIMARY, marginBottom: 12,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY }} />
            {isAr ? 'لوحة الإحصائيات' : 'Analytics Dashboard'}
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display','Georgia',serif",
            fontSize: 32, fontWeight: 500, color: TEXT_DARK, margin: 0,
          }}>
            {t.title}
          </h2>
          <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 8 }}>
            {t.subtitle}
          </p>
        </div>

        {/* ── Stats Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16, marginBottom: 24,
        }}>
          <StatCard
            icon="👥" label={t.totalPatients}
            value={data.totalPatients.toLocaleString()}
            sub={`+${data.newPatientsThisMonth} ${isAr ? 'هذا الشهر' : 'this month'}`}
          />
          <StatCard
            icon="📅" label={t.totalAppointments}
            value={data.totalAppointments.toLocaleString()}
            sub={`${data.appointmentsThisMonth} ${isAr ? 'هذا الشهر' : 'this month'}`}
          />
          <StatCard
            icon="👨‍⚕️" label={t.totalDoctors}
            value={data.totalDoctors}
          />
          <StatCard
            icon="💰" label={t.totalRevenue}
            value={`${data.totalRevenue.toLocaleString()} ${t.riyal}`}
            sub={`${data.revenueThisMonth.toLocaleString()} ${isAr ? 'هذا الشهر' : 'this month'}`}
            color={SUCCESS}
          />
        </div>

        {/* ── Charts Row ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20, marginBottom: 24,
        }}>

          {/* Monthly Appointments */}
          <div style={{
            background: CARD_BG, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: 20,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: TEXT_DARK, margin: '0 0 20px' }}>
              📈 {t.appointmentsByMonth}
            </h3>
            {data.appointmentsByMonth.length > 0 ? (
              <BarChart data={data.appointmentsByMonth} lang={lang} />
            ) : (
              <p style={{ color: TEXT_MUTED, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
                {t.noData}
              </p>
            )}
          </div>

          {/* Appointments by Status */}
          <div style={{
            background: CARD_BG, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: 20,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: TEXT_DARK, margin: '0 0 20px' }}>
              📊 {t.appointmentsByStatus}
            </h3>
            <StatusChart
              completed={data.completedAppointments}
              cancelled={data.cancelledAppointments}
              scheduled={data.scheduledAppointments}
              lang={lang}
            />
          </div>
        </div>

        {/* ── Top Doctors ── */}
        <div style={{
          background: CARD_BG, border: `1px solid ${BORDER}`,
          borderRadius: 16, padding: 20,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: TEXT_DARK, margin: '0 0 20px' }}>
            🏆 {t.topDoctors}
          </h3>

          {data.topDoctors.length === 0 ? (
            <p style={{ color: TEXT_MUTED, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              {t.noData}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.topDoctors.map((doc, i) => {
                const max = data.topDoctors[0]?.appointmentCount || 1
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : PRIMARY_SOFT,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      color: i < 3 ? '#FFFFFF' : TEXT_MUTED,
                    }}>
                      {i + 1}
                    </span>

                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', marginBottom: 4,
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_DARK }}>
                          {doc.doctorName}
                        </span>
                        <span style={{ fontSize: 12, color: PRIMARY, fontWeight: 600 }}>
                          {doc.appointmentCount} {t.appointments}
                        </span>
                      </div>
                      <div style={{
                        height: 6, borderRadius: 100,
                        background: `${PRIMARY}15`, overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: 100, background: PRIMARY,
                          width: `${(doc.appointmentCount / max) * 100}%`,
                          transition: 'width 1s ease',
                        }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}