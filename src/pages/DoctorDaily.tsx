import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import SearchableSelect from '../components/SearchableSelect'
import { getRole } from '../utils/permissions'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const globalCss = `
@keyframes fade-up { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
.daily-shell { animation: fade-up 0.35s ease both; }
.daily-card { animation: fade-up 0.3s ease both; }
`

const SUCCESS = '#22C55E'
const SUCCESS_BG = '#E8F5E9'
const WARNING = '#F59E0B'
const WARNING_BG = '#FFF8E1'

const T = {
  ar: {
    title: 'جدول اليوم', subtitle: 'مواعيدك اليوم وتقدّمك خلال اليوم',
    selectDoctor: 'اختر طبيباً', loading: 'جاري التحميل...', noAppointments: 'لا توجد مواعيد اليوم 🎉',
    total: 'إجمالي اليوم', completed: 'مكتملة', remaining: 'متبقية', inProgress: 'جاري الآن',
    scheduled: 'مجدول', confirmed: 'مؤكد', checkIn: 'دخول', checkOut: 'خروج', done: 'مكتمل', cancelled: 'ملغي',
    patient: 'المريض', time: 'الوقت', type: 'نوع الزيارة', status: 'الحالة', actions: 'إجراء',
    viewDetails: 'التفاصيل', refresh: 'تحديث', notADoctor: 'اختر طبيباً لعرض جدوله',
    weeklyCalendar: '📅 التقويم الأسبوعي',
    loadError: 'تعذّر تحميل جدول اليوم', retry: 'إعادة المحاولة',
  },
  en: {
    title: "Today's Schedule", subtitle: "Your appointments and progress for today",
    selectDoctor: 'Select a doctor', loading: 'Loading...', noAppointments: 'No appointments today 🎉',
    total: "Today's Total", completed: 'Completed', remaining: 'Remaining', inProgress: 'In Progress',
    scheduled: 'Scheduled', confirmed: 'Confirmed', checkIn: 'Check In', checkOut: 'Check Out', done: 'Done', cancelled: 'Cancelled',
    patient: 'Patient', time: 'Time', type: 'Visit Type', status: 'Status', actions: 'Action',
    viewDetails: 'Details', refresh: 'Refresh', notADoctor: 'Select a doctor to view their schedule',
    weeklyCalendar: '📅 Weekly Calendar',
    loadError: 'Failed to load today\'s schedule', retry: 'Retry',
  },
}

interface Doctor { id: string; fullName: string }
interface Appointment {
  id: string
  patientName: string
  doctorId?: string
  appointmentDate: string
  type?: string
  status: string
  checkInTime?: string
  checkOutTime?: string
  price?: number
}

const StatusPill = ({ status, checkInTime, checkOutTime, t }: { status: string; checkInTime?: string; checkOutTime?: string; t: typeof T['ar'] }) => {
  if (status === 'completed') return <span style={{ background: SUCCESS_BG, color: '#166534', padding: '4px 11px', borderRadius: 100, fontSize: 11.5, fontWeight: 700 }}>✅ {t.done}</span>
  if (status === 'cancelled') return <span style={{ background: '#FFF5F5', color: '#EF4444', padding: '4px 11px', borderRadius: 100, fontSize: 11.5, fontWeight: 700 }}>✕ {t.cancelled}</span>
  if (checkInTime && !checkOutTime) return <span style={{ background: WARNING_BG, color: '#92400E', padding: '4px 11px', borderRadius: 100, fontSize: 11.5, fontWeight: 700 }}>🟡 {t.inProgress}</span>
  return <span style={{ background: PRIMARY_SOFT, color: PRIMARY, padding: '4px 11px', borderRadius: 100, fontSize: 11.5, fontWeight: 700 }}>⏰ {t.scheduled}</span>
}

export default function DoctorDaily() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [isDoctorUser, setIsDoctorUser] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  // ✅ يقبل ?doctorId= قادم من رابط التقويم الأسبوعي عشان يفتح نفس الطبيب مباشرة
  const [doctorId, setDoctorId] = useState(searchParams.get('doctorId') || '')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const t = T[lang]
  const isAr = lang === 'ar'

  useEffect(() => {
    const id = 'cura-daily-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = globalCss; document.head.appendChild(s)
    }
    const onLang = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', onLang)
    return () => window.removeEventListener('cura-lang-change', onLang)
  }, [])

  useEffect(() => {
    const role = getRole()
    const doctorUser = role === 'Doctor'
    setIsDoctorUser(doctorUser)
    if (!doctorUser) {
      api.get('/doctors').then(res => setDoctors(res.data.filter((d: any) => d.isActive))).catch(() => {})
    }
  }, [])

  const todayStr = new Date().toISOString().split('T')[0]

  const fetchToday = async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const params = new URLSearchParams({ date: todayStr })
      if (!isDoctorUser && doctorId) params.set('doctorId', doctorId)
      const res = await api.get(`/appointments?${params}`)
      setAppointments(res.data.filter((a: Appointment) => a.status !== 'cancelled')
        .sort((a: Appointment, b: Appointment) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()))
    } catch (err: any) {
      if (err?.response?.status === 401) navigate('/dashboard')
      else setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isDoctorUser || doctorId) fetchToday()
    else setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDoctorUser, doctorId])

  // ✅ "دخول" الآن ينقل لشاشة "زيارة الطبيب" (سجل سابق + إدخال الزيارة الحالية) —
  // تسجيل الدخول الفعلي يصير من داخل تلك الشاشة نفسها
  const goToVisit = (id: string) => {
    navigate(`/visit/${id}`)
  }

  const formatTime = (d: string) => new Date(d).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })

  const stats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'completed').length,
    inProgress: appointments.filter(a => a.checkInTime && !a.checkOutTime).length,
  }
  const remaining = stats.total - stats.completed - stats.inProgress

  return (
    <div className="daily-shell" style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif", direction: isAr ? 'rtl' : 'ltr', background: '#F8FAFA', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 100, padding: '4px 16px', fontSize: 11, fontWeight: 600, color: PRIMARY, marginBottom: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, animation: 'soft-pulse 2s infinite' }} />
              {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display','Georgia',serif", fontSize: 26, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>
              📋 {t.title}
            </h2>
            <p style={{ fontSize: 12.5, color: TEXT_MUTED, marginTop: 4 }}>{t.subtitle}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
            {!isDoctorUser && (
              <div style={{ minWidth: 220 }}>
                <SearchableSelect isRtl={isAr} value={doctorId} onChange={setDoctorId}
                  placeholder={t.selectDoctor} options={doctors.map(d => ({ value: d.id, label: d.fullName }))} />
              </div>
            )}
            <button onClick={() => navigate(`/doctor-calendar${doctorId ? `?doctorId=${doctorId}` : ''}`)}
              style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '9px 16px', fontSize: 12.5, fontWeight: 600, color: TEXT_DARK, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {t.weeklyCalendar}
            </button>
          </div>
        </div>

        {(isDoctorUser || doctorId) && (
          <>
            {loadError ? (
              <div style={{ textAlign: 'center', padding: '40px 24px', background: CARD_BG, borderRadius: 20, border: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 14 }}>⚠️ {t.loadError}</p>
                <button onClick={fetchToday}
                  style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 9, padding: '9px 20px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                  {t.retry}
                </button>
              </div>
            ) : (
              <>
            {/* بطاقات الإحصائيات */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: t.total, value: stats.total, color: TEXT_DARK },
                { label: t.completed, value: stats.completed, color: SUCCESS },
                { label: t.inProgress, value: stats.inProgress, color: WARNING },
                { label: t.remaining, value: remaining, color: PRIMARY },
              ].map((s, i) => (
                <div key={i} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 700, color: s.color, margin: '0 0 4px', fontFamily: "'Inter',sans-serif" }}>{s.value}</p>
                  <p style={{ fontSize: 10.5, color: TEXT_MUTED, margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: TEXT_MUTED }}>
                <div style={{ width: 32, height: 32, margin: '0 auto 12px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: PRIMARY, animation: 'spin 0.8s linear infinite' }} />
                {t.loading}
              </div>
            ) : appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', background: CARD_BG, borderRadius: 20, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
                <p style={{ fontSize: 14, color: TEXT_MUTED }}>{t.noAppointments}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {appointments.map(a => (
                  <div key={a.id} className="daily-card"
                    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', cursor: 'pointer' }}
                    onClick={() => navigate(`/appointments/${a.id}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ textAlign: 'center', minWidth: 56 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, margin: 0, fontFamily: "'Inter',sans-serif" }}>{formatTime(a.appointmentDate)}</p>
                      </div>
                      <div style={{ width: 1, height: 32, background: BORDER }} />
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>{a.patientName}</p>
                        <p style={{ fontSize: 11.5, color: TEXT_MUTED, margin: '2px 0 0' }}>{a.type || '—'}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={e => e.stopPropagation()}>
                      <StatusPill status={a.status} checkInTime={a.checkInTime} checkOutTime={a.checkOutTime} t={t} />
                      {!a.checkInTime && a.status !== 'completed' && (
                        <button onClick={() => goToVisit(a.id)}
                          style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          🚪 {t.checkIn}
                        </button>
                      )}
                      {a.checkInTime && !a.checkOutTime && (
                        <button onClick={() => navigate(`/appointments`)}
                          style={{ background: WARNING_BG, color: '#92400E', border: 'none', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          🏁 {t.checkOut}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
              </>
            )}
          </>
        )}

        {!isDoctorUser && !doctorId && (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: CARD_BG, borderRadius: 20, border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 48, opacity: 0.4, marginBottom: 12 }}>👨‍⚕️</div>
            <p style={{ fontSize: 14, color: TEXT_MUTED }}>{t.notADoctor}</p>
          </div>
        )}
      </div>
    </div>
  )
}