import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { ECGAnimation } from '../components/ECGAnimation'
import VisitNoteModal from './VisitNoteModal'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const SUCCESS = '#4A7679'
const INFO = '#8BAFB1'
const DANGER = '#C4A77D'

const T = {
  ar: {
    back: 'رجوع', title: 'تفاصيل الموعد',
    patient: 'المريض', doctor: 'الطبيب', date: 'التاريخ والوقت',
    type: 'النوع', price: 'السعر', status: 'الحالة',
    notes: 'ملاحظات', createdAt: 'تاريخ الإنشاء',
    checkIn: 'وقت الدخول', checkOut: 'وقت الخروج',
    duration: 'مدة الزيارة', minutes: 'دقيقة',
    visitNotes: 'ملاحظات الزيارة', addVisitNote: 'إضافة ملاحظات الزيارة',
    editVisitNote: 'تعديل ملاحظات الزيارة',
    diagnosis: 'التشخيص', prescription: 'الوصفة الطبية',
    tests: 'الفحوصات', nextVisit: 'الزيارة القادمة',
    cost: 'التكلفة', noVisitNote: 'لا توجد ملاحظات زيارة بعد',
    scheduled: 'مجدول', confirmed: 'مؤكد', completed: 'مكتمل', cancelled: 'ملغي',
    loading: 'جاري التحميل...', notFound: 'الموعد غير موجود',
    riyal: 'د.أ', notAvailable: 'غير متوفر',
    patientHistory: 'سجل المريض',
  },
  en: {
    back: 'Back', title: 'Appointment Details',
    patient: 'Patient', doctor: 'Doctor', date: 'Date & Time',
    type: 'Type', price: 'Price', status: 'Status',
    notes: 'Notes', createdAt: 'Created At',
    checkIn: 'Check-in', checkOut: 'Check-out',
    duration: 'Duration', minutes: 'min',
    visitNotes: 'Visit Notes', addVisitNote: 'Add Visit Notes',
    editVisitNote: 'Edit Visit Notes',
    diagnosis: 'Diagnosis', prescription: 'Prescription',
    tests: 'Tests & Imaging', nextVisit: 'Next Visit',
    cost: 'Cost', noVisitNote: 'No visit notes yet',
    scheduled: 'Scheduled', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled',
    loading: 'Loading...', notFound: 'Appointment not found',
    riyal: 'JD', notAvailable: 'N/A',
    patientHistory: 'Patient History',
  },
}

interface AppointmentDetail {
  id: string; patientId: string; patientName: string; patientNumber: number
  doctorId: string | null; doctorName: string | null
  appointmentDate: string; type: string | null; price: number | null
  status: string; notes: string | null; notes2: string | null; notes3: string | null
  createdAt: string; checkInTime?: string; checkOutTime?: string
}

interface VisitNote {
  id?: string; diagnosis?: string; prescription?: string
  tests?: string; notes?: string; nextVisitDate?: string; cost?: number
  doctorName?: string; createdAt?: string
}

export default function AppointmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null)
  const [visitNote, setVisitNote] = useState<VisitNote | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  const fetchData = async () => {
    try {
      const [apptRes, noteRes] = await Promise.all([
        api.get(`/appointments/${id}`),
        api.get(`/visitnotes/appointment/${id}`).catch(() => ({ data: null })),
      ])
      setAppointment(apptRes.data)
      setVisitNote(noteRes.data)
    } catch { navigate('/appointments') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [id])

  const t = T[lang]
  const isAr = lang === 'ar'

  const formatDateTime = (dateStr: string) => {
    const [datePart, timePart] = dateStr.split('T')
    const [y, mo, d] = datePart.split('-').map(Number)
    const [h, mi] = (timePart || '00:00').split(':').map(Number)
    const date = new Date(y, mo-1, d, h, mi)
    return date.toLocaleString(isAr ? 'ar-SA' : 'en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })
  }

  const formatTime = (dateStr: string) => {
    const [, timePart] = dateStr.split('T')
    return timePart ? timePart.substring(0, 5) : dateStr
  }

  const getDuration = () => {
    if (!appointment?.checkInTime || !appointment?.checkOutTime) return null
    const inTime = new Date(appointment.checkInTime)
    const outTime = new Date(appointment.checkOutTime)
    return Math.round((outTime.getTime() - inTime.getTime()) / 60000)
  }

  const statusConfig = (status: string) => {
    switch (status) {
      case 'scheduled': return { color: INFO,    bg: `${INFO}20`,    label: t.scheduled, icon: '⏰' }
      case 'confirmed': return { color: SUCCESS, bg: `${SUCCESS}20`, label: t.confirmed, icon: '✓'  }
      case 'completed': return { color: PRIMARY, bg: `${PRIMARY}20`, label: t.completed, icon: '✔️' }
      case 'cancelled': return { color: DANGER,  bg: `${DANGER}20`,  label: t.cancelled, icon: '✕'  }
      default:          return { color: TEXT_MUTED, bg: `${TEXT_MUTED}20`, label: status, icon: '📋' }
    }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center', maxWidth:300 }}>
        <div style={{ background:PRIMARY_SOFT, borderRadius:20, padding:'20px 24px', marginBottom:16, border:`1px solid ${BORDER}` }}>
          <ECGAnimation height={80} showLetters={false} speed={0.7} />
        </div>
        <p style={{ color:TEXT_MUTED, fontSize:14 }}>{t.loading}</p>
      </div>
    </div>
  )

  if (!appointment) return (
    <div style={{ textAlign:'center', padding:'60px 24px', color:TEXT_MUTED }}>
      <span style={{ fontSize:48 }}>📅</span>
      <p style={{ marginTop:16 }}>{t.notFound}</p>
    </div>
  )

  const sc = statusConfig(appointment.status)
  const duration = getDuration()

  const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) => (
    <div style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:`1px solid ${BORDER}` }}>
      <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:11, fontWeight:600, color:TEXT_MUTED, margin:'0 0 2px', letterSpacing:'0.5px', textTransform:'uppercase' }}>{label}</p>
        <div style={{ fontSize:14, fontWeight:500, color:TEXT_DARK }}>{value}</div>
      </div>
    </div>
  )

  return (
    <div dir={isAr?'rtl':'ltr'} style={{ background:'#F8FAFA', minHeight:'100vh', padding:24, fontFamily:isAr?"'Cairo',sans-serif":"'Inter',sans-serif" }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <button onClick={()=>navigate('/appointments')}
            style={{ display:'inline-flex', alignItems:'center', gap:6, background:'none', border:'none', color:TEXT_MUTED, fontSize:13, cursor:'pointer', marginBottom:16 }}
            onMouseEnter={e=>e.currentTarget.style.color=PRIMARY} onMouseLeave={e=>e.currentTarget.style.color=TEXT_MUTED}>
            ← {t.back}
          </button>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:PRIMARY_SOFT, border:`1px solid ${BORDER}`, borderRadius:100, padding:'4px 16px', fontSize:11, fontWeight:600, color:PRIMARY, marginBottom:10 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:PRIMARY }} />📅 {t.title}
              </div>
              <h2 style={{ fontFamily:"'DM Serif Display','Georgia',serif", fontSize:28, fontWeight:500, color:TEXT_DARK, margin:0 }}>
                {appointment.patientName}
              </h2>
              <p style={{ fontSize:13, color:TEXT_MUTED, margin:'4px 0 0' }}>#{appointment.patientNumber}</p>
            </div>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:100, fontSize:13, fontWeight:600, background:sc.bg, color:sc.color }}>
              {sc.icon} {sc.label}
            </span>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

          {/* بيانات الموعد */}
          <div style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:20, padding:'20px 24px', gridColumn:'1 / -1' }}>
            <h3 style={{ fontSize:15, fontWeight:600, color:TEXT_DARK, margin:'0 0 4px', display:'flex', alignItems:'center', gap:8 }}>
              📋 {t.title}
            </h3>
            <div style={{ marginTop:8 }}>
              <InfoRow icon="👤" label={t.patient} value={`${appointment.patientName} — #${appointment.patientNumber}`} />
              <InfoRow icon="👨‍⚕️" label={t.doctor} value={appointment.doctorName || t.notAvailable} />
              <InfoRow icon="📅" label={t.date} value={formatDateTime(appointment.appointmentDate)} />
              {appointment.type && <InfoRow icon="🩺" label={t.type} value={appointment.type} />}
              {appointment.price != null && <InfoRow icon="💰" label={t.price} value={`${appointment.price} ${t.riyal}`} />}
              {appointment.notes && <InfoRow icon="📝" label={t.notes} value={appointment.notes} />}

              {/* CheckIn / CheckOut */}
              {appointment.checkInTime && (
                <InfoRow icon="🟢" label={t.checkIn} value={formatTime(appointment.checkInTime)} />
              )}
              {appointment.checkOutTime && (
                <InfoRow icon="🏁" label={t.checkOut} value={formatTime(appointment.checkOutTime)} />
              )}
              {duration !== null && (
                <InfoRow icon="⏱️" label={t.duration} value={`${duration} ${t.minutes}`} />
              )}
            </div>

            {/* رابط سجل المريض */}
            <button onClick={()=>navigate(`/patients/${appointment.patientId}`)}
              style={{ marginTop:16, background:'transparent', border:`1px solid ${BORDER}`, borderRadius:10, padding:'8px 16px', fontSize:12, color:PRIMARY, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}
              onMouseEnter={e=>e.currentTarget.style.background=PRIMARY_SOFT}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              👤 {t.patientHistory}
            </button>
          </div>

          {/* ملاحظات الزيارة */}
          <div style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:20, padding:'20px 24px', gridColumn:'1 / -1' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ fontSize:15, fontWeight:600, color:TEXT_DARK, margin:0, display:'flex', alignItems:'center', gap:8 }}>
                🩺 {t.visitNotes}
              </h3>
              <button onClick={()=>setShowModal(true)}
                style={{ background:PRIMARY, color:'#FFF', border:'none', borderRadius:10, padding:'8px 16px', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
                onMouseEnter={e=>e.currentTarget.style.background='#4A7679'}
                onMouseLeave={e=>e.currentTarget.style.background=PRIMARY}>
                {visitNote?.id ? `✏️ ${t.editVisitNote}` : `+ ${t.addVisitNote}`}
              </button>
            </div>

            {visitNote?.id ? (
              <div style={{ display:'grid', gap:12 }}>
                {visitNote.diagnosis && (
                  <div style={{ background:'#F8FAFA', borderRadius:12, padding:'12px 16px', border:`1px solid ${BORDER}` }}>
                    <p style={{ fontSize:11, fontWeight:700, color:PRIMARY, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.5px' }}>🔬 {t.diagnosis}</p>
                    <p style={{ fontSize:14, color:TEXT_DARK, margin:0, whiteSpace:'pre-wrap' }}>{visitNote.diagnosis}</p>
                  </div>
                )}
                {visitNote.prescription && (
                  <div style={{ background:'#F0FDF4', borderRadius:12, padding:'12px 16px', border:'1px solid #86EFAC' }}>
                    <p style={{ fontSize:11, fontWeight:700, color:'#16A34A', margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.5px' }}>💊 {t.prescription}</p>
                    <p style={{ fontSize:14, color:TEXT_DARK, margin:0, whiteSpace:'pre-wrap' }}>{visitNote.prescription}</p>
                  </div>
                )}
                {visitNote.tests && (
                  <div style={{ background:'#EFF6FF', borderRadius:12, padding:'12px 16px', border:'1px solid #BFDBFE' }}>
                    <p style={{ fontSize:11, fontWeight:700, color:'#1D4ED8', margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.5px' }}>🧪 {t.tests}</p>
                    <p style={{ fontSize:14, color:TEXT_DARK, margin:0, whiteSpace:'pre-wrap' }}>{visitNote.tests}</p>
                  </div>
                )}
                {visitNote.notes && (
                  <div style={{ background:'#FFFBEB', borderRadius:12, padding:'12px 16px', border:'1px solid #FCD34D' }}>
                    <p style={{ fontSize:11, fontWeight:700, color:'#D97706', margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.5px' }}>📝 {t.notes}</p>
                    <p style={{ fontSize:14, color:TEXT_DARK, margin:0, whiteSpace:'pre-wrap' }}>{visitNote.notes}</p>
                  </div>
                )}
                <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                  {visitNote.nextVisitDate && (
                    <div style={{ flex:1, minWidth:140, background:PRIMARY_SOFT, borderRadius:12, padding:'10px 14px', border:`1px solid ${BORDER}` }}>
                      <p style={{ fontSize:10, fontWeight:700, color:PRIMARY, margin:'0 0 3px', textTransform:'uppercase' }}>📅 {t.nextVisit}</p>
                      <p style={{ fontSize:14, fontWeight:600, color:TEXT_DARK, margin:0 }}>
                        {new Date(visitNote.nextVisitDate).toLocaleDateString(isAr?'ar-SA':undefined)}
                      </p>
                    </div>
                  )}
                  {visitNote.cost != null && (
                    <div style={{ flex:1, minWidth:140, background:'#F0FDF4', borderRadius:12, padding:'10px 14px', border:'1px solid #86EFAC' }}>
                      <p style={{ fontSize:10, fontWeight:700, color:'#16A34A', margin:'0 0 3px', textTransform:'uppercase' }}>💰 {t.cost}</p>
                      <p style={{ fontSize:14, fontWeight:600, color:TEXT_DARK, margin:0 }}>{visitNote.cost} {t.riyal}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'32px 0', color:TEXT_MUTED }}>
                <span style={{ fontSize:40, opacity:0.5 }}>🩺</span>
                <p style={{ fontSize:13, marginTop:10 }}>{t.noVisitNote}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <VisitNoteModal
        isOpen={showModal}
        onClose={()=>setShowModal(false)}
        onSaved={fetchData}
        appointmentId={appointment.id}
        patientId={appointment.patientId}
        doctorId={appointment.doctorId}
        lang={lang}
        existingNote={visitNote}
      />
    </div>
  )
}
