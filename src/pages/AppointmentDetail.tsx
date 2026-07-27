import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { ECGAnimation } from '../components/ECGAnimation'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const globalCss = `
@keyframes fade-up { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
@keyframes soft-pulse { 0%,100%{opacity:0.6;} 50%{opacity:1;} }
@keyframes pulse-soft { 0%,100%{opacity:0.3;transform:scale(0.8);} 50%{opacity:1;transform:scale(1.2);} }
.detail-shell { animation: fade-up 0.35s ease both; }
.detail-card { animation: fade-up 0.35s ease both; }
`

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const SUCCESS = '#4A7679'
const SUCCESS_BG = '#E8F5E9'
const WARNING = '#C4A77D'
const WARNING_BG = '#FBF4E4'

const T = {
  ar: {
    back: 'رجوع', title: 'تفاصيل الزيارة', loading: 'جاري التحميل...',
    notFound: 'الموعد غير موجود', errGeneric: 'حدث خطأ أثناء التحميل',
    patient: 'المريض', doctor: 'الطبيب', dateTime: 'الموعد', type: 'نوع الزيارة',
    status: 'الحالة', checkIn: 'وقت الدخول', checkOut: 'وقت الخروج',
    price: 'السعر', commission: 'حصة الطبيب', riyal: 'د.أ', notRecorded: '— لم يُسجَّل بعد',
    visitNoteTitle: '📋 ملاحظة الزيارة', diagnosis: 'التشخيص', prescription: 'الوصفة الطبية',
    tests: 'الفحوصات', notes: 'ملاحظات', nextVisit: 'الزيارة القادمة', noVisitNote: 'لم تُسجَّل ملاحظة زيارة لهذا الموعد',
    paymentTitle: '💰 الدفعة', totalAmount: 'المبلغ الإجمالي', amountPaid: 'المبلغ المدفوع',
    patientBalance: 'رصيد المريض', insuranceAmount: 'حصة التأمين', insuranceBalance: 'المتبقي من التأمين',
    paymentMethod: 'طريقة الدفع', isPaid: 'الحالة', paid: 'مدفوع بالكامل', unpaid: 'غير مكتمل',
    noPayment: 'لم تُسجَّل دفعة لهذا الموعد', cash: 'نقدي', card: 'بطاقة', insurance: 'تأمين',
    scheduled: 'مجدول', confirmed: 'مؤكد', completed: 'مكتمل', cancelled: 'ملغي',
    quickActions: 'إجراءات سريعة', editAppointment: 'تعديل الموعد', viewPatient: 'ملف المريض',
  },
  en: {
    back: 'Back', title: 'Visit Details', loading: 'Loading...',
    notFound: 'Appointment not found', errGeneric: 'An error occurred while loading',
    patient: 'Patient', doctor: 'Doctor', dateTime: 'Appointment', type: 'Visit Type',
    status: 'Status', checkIn: 'Check-in Time', checkOut: 'Check-out Time',
    price: 'Price', commission: 'Doctor Commission', riyal: 'JD', notRecorded: '— Not recorded yet',
    visitNoteTitle: '📋 Visit Note', diagnosis: 'Diagnosis', prescription: 'Prescription',
    tests: 'Tests', notes: 'Notes', nextVisit: 'Next Visit', noVisitNote: 'No visit note recorded for this appointment',
    paymentTitle: '💰 Payment', totalAmount: 'Total Amount', amountPaid: 'Amount Paid',
    patientBalance: 'Patient Balance', insuranceAmount: 'Insurance Amount', insuranceBalance: 'Insurance Remaining',
    paymentMethod: 'Payment Method', isPaid: 'Status', paid: 'Fully Paid', unpaid: 'Incomplete',
    noPayment: 'No payment recorded for this appointment', cash: 'Cash', card: 'Card', insurance: 'Insurance',
    scheduled: 'Scheduled', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled',
    quickActions: 'Quick Actions', editAppointment: 'Edit Appointment', viewPatient: 'Patient File',
  },
}

interface AppointmentData {
  id: string
  patientId: string
  patientName?: string
  doctorId?: string
  doctorName?: string
  appointmentDate: string
  type?: string
  status: string
  price?: number
  doctorCommissionAmount?: number
  checkInTime?: string
  checkOutTime?: string
}

interface VisitNoteData {
  id: string
  diagnosis?: string
  prescription?: string
  tests?: string
  notes?: string
  nextVisitDate?: string
  cost?: number
}

interface PaymentData {
  hasPayment: boolean
  id?: string
  totalAmount?: number
  amountPaid?: number
  patientAmount?: number
  patientBalance?: number
  insuranceAmount?: number
  insuranceBalance?: number
  paymentMethod?: string
  isPaid?: boolean
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="detail-card" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 20, marginBottom: 16 }}>
    <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, marginBottom: 14 }}>{title}</h3>
    {children}
  </div>
)

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${BORDER}`, fontSize: 13 }}>
    <span style={{ color: TEXT_MUTED }}>{label}</span>
    <span style={{ color: TEXT_DARK, fontWeight: 600, textAlign: 'left' }}>{value}</span>
  </div>
)

const StatusBadge = ({ status, lang }: { status: string; lang: 'ar' | 'en' }) => {
  const t = T[lang]
  const config: Record<string, { color: string; bg: string; label: string; icon: string }> = {
    scheduled: { color: '#F59E0B', bg: '#FFF8E1', label: t.scheduled, icon: '⏰' },
    confirmed: { color: '#22C55E', bg: '#E8F5E9', label: t.confirmed, icon: '✓' },
    completed: { color: PRIMARY, bg: PRIMARY_SOFT, label: t.completed, icon: '✔️' },
    cancelled: { color: '#EF4444', bg: '#FFF5F5', label: t.cancelled, icon: '✕' },
  }
  const c = config[status] || { color: TEXT_MUTED, bg: '#F1F4F4', label: status, icon: '📋' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: c.bg, color: c.color }}>
      <span>{c.icon}</span>{c.label}
    </span>
  )
}

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [appointment, setAppointment] = useState<AppointmentData | null>(null)
  const [visitNote, setVisitNote] = useState<VisitNoteData | null>(null)
  const [payment, setPayment] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const t = T[lang]
  const isAr = lang === 'ar'

  useEffect(() => {
    const cssId = 'cura-appt-detail-css'
    if (!document.getElementById(cssId)) {
      const s = document.createElement('style'); s.id = cssId; s.textContent = globalCss; document.head.appendChild(s)
    }
  }, [])

  useEffect(() => {
    if (!id) return
    const fetchAll = async () => {
      setLoading(true); setError('')
      try {
        const [apptRes, noteRes, payRes] = await Promise.all([
          api.get(`/appointments/${id}`),
          api.get(`/visitnotes/appointment/${id}`).catch(() => ({ data: null })),
          api.get(`/payments/appointment/${id}`).catch(() => ({ data: { hasPayment: false } })),
        ])
        setAppointment(apptRes.data)
        setVisitNote(noteRes.data)
        setPayment(payRes.data)
      } catch {
        setError(t.notFound)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return t.notRecorded
    const d = new Date(dateStr)
    return d.toLocaleString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return t.notRecorded
    const d = new Date(dateStr)
    return d.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const methodLabel = (m?: string) => m === 'cash' ? t.cash : m === 'card' ? t.card : m === 'insurance' ? t.insurance : (m || '—')

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.95)' }}>
        <div style={{ textAlign: 'center' }}>
          <ECGAnimation height={90} showLetters speed={0.7} />
          <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 12 }}>{t.loading}</p>
        </div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 16 }}>{error || t.notFound}</p>
        <button onClick={() => navigate('/appointments')}
          style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, cursor: 'pointer' }}>
          {t.back}
        </button>
      </div>
    )
  }

  return (
    <div className="detail-shell" style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif", direction: isAr ? 'rtl' : 'ltr', background: '#F8FAFA', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={() => navigate('/appointments')}
            style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 16px', fontSize: 12.5, color: TEXT_MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {isAr ? '→' : '←'} {t.back}
          </button>
          <StatusBadge status={appointment.status} lang={lang} />
        </div>

        <h2 style={{ fontFamily: "'DM Serif Display','Georgia',serif", fontSize: 24, fontWeight: 500, color: TEXT_DARK, marginBottom: 4 }}>
          🩺 {t.title}
        </h2>
        <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 22 }}>
          {appointment.patientName || '—'} · {formatDateTime(appointment.appointmentDate)}
        </p>

        {/* بيانات الموعد */}
        <Section title={`📅 ${t.dateTime}`}>
          <Row label={t.patient} value={appointment.patientName || '—'} />
          <Row label={t.doctor} value={appointment.doctorName || '—'} />
          <Row label={t.dateTime} value={formatDateTime(appointment.appointmentDate)} />
          <Row label={t.type} value={appointment.type || '—'} />
          <Row label={t.checkIn} value={formatTime(appointment.checkInTime)} />
          <Row label={t.checkOut} value={formatTime(appointment.checkOutTime)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
            <span style={{ color: TEXT_MUTED }}>{t.price}</span>
            <span style={{ color: PRIMARY, fontWeight: 700 }}>{appointment.price != null ? `${appointment.price} ${t.riyal}` : t.notRecorded}</span>
          </div>
          {appointment.doctorCommissionAmount != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
              <span style={{ color: TEXT_MUTED }}>{t.commission}</span>
              <span style={{ color: SUCCESS, fontWeight: 700 }}>{appointment.doctorCommissionAmount} {t.riyal}</span>
            </div>
          )}
        </Section>

        {/* ملاحظة الزيارة */}
        <Section title={t.visitNoteTitle}>
          {visitNote ? (
            <>
              {visitNote.diagnosis && <Row label={t.diagnosis} value={visitNote.diagnosis} />}
              {visitNote.prescription && <Row label={t.prescription} value={visitNote.prescription} />}
              {visitNote.tests && <Row label={t.tests} value={visitNote.tests} />}
              {visitNote.notes && (
                <div style={{ padding: '10px 0', fontSize: 13 }}>
                  <span style={{ color: TEXT_MUTED, display: 'block', marginBottom: 4 }}>{t.notes}</span>
                  <span style={{ color: TEXT_DARK }}>{visitNote.notes}</span>
                </div>
              )}
              {visitNote.nextVisitDate && <Row label={t.nextVisit} value={new Date(visitNote.nextVisitDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')} />}
            </>
          ) : (
            <p style={{ fontSize: 12.5, color: TEXT_MUTED, fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>{t.noVisitNote}</p>
          )}
        </Section>

        {/* الدفعة */}
        <Section title={t.paymentTitle}>
          {payment?.hasPayment ? (
            <>
              <Row label={t.totalAmount} value={`${payment.totalAmount} ${t.riyal}`} />
              <Row label={t.amountPaid} value={`${payment.amountPaid} ${t.riyal}`} />
              {(payment.insuranceAmount ?? 0) > 0 && (
                <>
                  <Row label={t.insuranceAmount} value={`${payment.insuranceAmount} ${t.riyal}`} />
                  <Row label={t.insuranceBalance} value={`${payment.insuranceBalance} ${t.riyal}`} />
                </>
              )}
              <Row label={t.paymentMethod} value={methodLabel(payment.paymentMethod)} />
              <div style={{ marginTop: 10 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100,
                  fontSize: 12, fontWeight: 700,
                  background: payment.isPaid ? SUCCESS_BG : WARNING_BG,
                  color: payment.isPaid ? SUCCESS : WARNING,
                }}>
                  {payment.isPaid ? `✅ ${t.paid}` : `⏳ ${t.unpaid}`}
                </span>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 12.5, color: TEXT_MUTED, fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>{t.noPayment}</p>
          )}
        </Section>

        {/* إجراءات سريعة */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={() => navigate(`/appointments/${id}/edit`)}
            style={{ flex: 1, background: PRIMARY_SOFT, color: PRIMARY, border: 'none', borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ✏️ {t.editAppointment}
          </button>
          <button onClick={() => navigate(`/patients/${appointment.patientId}`)}
            style={{ flex: 1, background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 500, color: TEXT_MUTED, cursor: 'pointer' }}>
            👤 {t.viewPatient}
          </button>
        </div>
      </div>
    </div>
  )
}