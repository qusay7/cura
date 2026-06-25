import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import type { Patient, Doctor } from '../types'
import { ECGAnimation } from '../components/ECGAnimation'
import AppointmentCalendar from '../components/AppointmentCalendar'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const globalCss = `
@keyframes fade-up { from{opacity:0;transform:translateY(20px) scale(0.98);}to{opacity:1;transform:translateY(0) scale(1);} }
@keyframes soft-pulse { 0%,100%{opacity:0.6;}50%{opacity:1;} }
@keyframes spin { to{transform:rotate(360deg);} }
@keyframes pulse-soft { 0%,100%{opacity:0.3;transform:scale(0.8);}50%{opacity:1;transform:scale(1.2);} }
@keyframes slide-in { from{opacity:0;transform:translateX(-10px);}to{opacity:1;transform:translateX(0);} }

.add-appointment-shell { animation: fade-up 0.4s cubic-bezier(0.2,0.9,0.4,1.1) both; }
.add-appointment-shell * { box-sizing:border-box; }

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #5B8C8F !important;
  box-shadow: 0 0 0 3px rgba(91,140,143,0.1) !important;
  outline: none;
}

.disabled-message {
  background: linear-gradient(135deg,#F8FAFA 0%,#FFFFFF 100%);
  border: 2px dashed #DCE5E5; border-radius:20px; padding:40px 24px;
  text-align:center; transition:all 0.3s ease;
}
.disabled-message:hover { border-color:#5B8C8F; background:#F8FAFA; }

.calendar-container { background:white; border-radius:16px; border:1px solid #DCE5E5; overflow:hidden; transition:all 0.3s ease; }
.calendar-container:hover { border-color:#5B8C8F; box-shadow:0 4px 12px rgba(91,140,143,0.1); }
.calendar-container .rbc-toolbar { padding:16px; background:#F8FAFA; border-bottom:1px solid #DCE5E5; flex-wrap:wrap; gap:12px; }
.calendar-container .rbc-toolbar button { color:#2C3E3F; border:1px solid #DCE5E5; background:white; border-radius:8px; padding:6px 14px; font-size:13px; font-weight:500; transition:all 0.2s ease; }
.calendar-container .rbc-toolbar button:hover { background:#E8F0F0; border-color:#5B8C8F; color:#5B8C8F; }
.calendar-container .rbc-toolbar button.rbc-active { background:#5B8C8F; border-color:#5B8C8F; color:white; }
.calendar-container .rbc-toolbar-label { font-weight:600; color:#2C3E3F; font-size:15px; }
.calendar-container .rbc-header { padding:12px 8px; background:#F8FAFA; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; color:#6B8A8C; border-bottom:1px solid #DCE5E5; }
.calendar-container .rbc-event { background:#5B8C8F; border-radius:8px; padding:4px 8px; font-size:12px; transition:all 0.2s ease; border:none; }
.calendar-container .rbc-event:hover { background:#4A7679; transform:scale(1.02); box-shadow:0 2px 8px rgba(91,140,143,0.3); }
.calendar-container .rbc-current-time-indicator { background-color:#F59E0B; }
.selected-appointment-info { animation:slide-in 0.3s ease-out; }

@media(max-width:768px) {
  .add-appointment-title { font-size:24px !important; }
  .form-container { padding:20px !important; }
  .calendar-container .rbc-toolbar { flex-direction:column; align-items:stretch; }
}
`

const PRIMARY = '#5B8C8F'
const PRIMARY_DARK = '#4A7679'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const ERROR_BG = '#FDF5F5'
const ERROR_TEXT = '#C4A77D'
const SUCCESS = '#4A7679'

const T = {
  ar: {
    title: 'حجز موعد جديد', back: 'رجوع',
    patient: 'المريض', doctor: 'الطبيب', date: 'تاريخ ووقت الموعد',
    selectDoctorFirst: 'اختر الطبيب أولاً',
    selectDoctorHint: 'يرجى اختيار الطبيب من القائمة أعلاه لعرض المواعيد المتاحة',
    queueBooking: 'حجز دور', queueBookingHint: 'سيتم تسجيل الموعد بوقت الحجز تلقائياً',
    type: 'نوع الزيارة', typePlaceholder: 'اختر نوع الزيارة...',
    typeConsultation: 'استشارة', typeFollowup: 'متابعة',
    typeEmergency: 'طوارئ', typeCheckup: 'كشف',
    price: 'السعر', pricePlaceholder: '0.00',
    notes: 'ملاحظات', notesPlaceholder: 'أضف ملاحظات إضافية...',
    submit: 'حجز الموعد', submitQueue: 'حجز الدور',
    cancel: 'إلغاء', saving: 'جارٍ الحفظ...',
    error: 'حدث خطأ غير متوقع', required: 'هذا الحقل مطلوب',
    loadingMessage: 'جاري تحميل البيانات',
    loadingSub: 'يرجى الانتظار أثناء تجهيز النموذج',
    invalidDate: 'يرجى اختيار تاريخ ووقت صحيح',
    futureDateError: 'يجب أن يكون الموعد في المستقبل',
    selectedAppointment: 'الموعد المحدد', change: 'تغيير',
    priceNote: 'يمكنك تعديل السعر إذا لزم الأمر',
    noActiveDoctors: 'لا يوجد أطباء نشطون',
    registeredPatients: 'عدد المرضى المسجلين:',
    noDoctor: 'بدون طبيب',
    queueWorkType: '🔢 طبيب دور',
    appointmentsWorkType: '📅 طبيب مواعيد',
  },
  en: {
    title: 'Book New Appointment', back: 'Back',
    patient: 'Patient', doctor: 'Doctor', date: 'Appointment Date & Time',
    selectDoctorFirst: 'Select Doctor First',
    selectDoctorHint: 'Please select a doctor from above to see available time slots',
    queueBooking: 'Queue Booking', queueBookingHint: 'Appointment will be set to current time automatically',
    type: 'Visit Type', typePlaceholder: 'Select visit type...',
    typeConsultation: 'Consultation', typeFollowup: 'Follow-up',
    typeEmergency: 'Emergency', typeCheckup: 'Checkup',
    price: 'Price', pricePlaceholder: '0.00',
    notes: 'Notes', notesPlaceholder: 'Add additional notes...',
    submit: 'Book Appointment', submitQueue: 'Book Queue',
    cancel: 'Cancel', saving: 'Saving...',
    error: 'An unexpected error occurred', required: 'This field is required',
    loadingMessage: 'Loading Data',
    loadingSub: 'Please wait while we prepare the booking form',
    invalidDate: 'Please select a valid date and time',
    futureDateError: 'Appointment must be in the future',
    selectedAppointment: 'Selected Appointment', change: 'Change',
    priceNote: 'You can adjust the price if needed',
    noActiveDoctors: 'No active doctors available',
    registeredPatients: 'Registered patients:',
    noDoctor: 'No doctor',
    queueWorkType: '🔢 Queue Doctor',
    appointmentsWorkType: '📅 Appointment Doctor',
  },
}

// ─── Loading Screen ──────────────────────────────────────────────────────────
const FormLoadingScreen = ({ msg, subMsg }: { msg: string; subMsg: string }) => (
  <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.95)', backdropFilter:'blur(8px)', zIndex:9999 }}>
    <div style={{ textAlign:'center', padding:'2rem', maxWidth:400, width:'100%' }}>
      <div style={{ background:PRIMARY_SOFT, borderRadius:20, padding:'20px 24px', marginBottom:'1.5rem', border:`1px solid ${BORDER}` }}>
        <ECGAnimation height={100} showLetters={true} speed={0.7} />
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, fontSize:9, color:TEXT_MUTED }}>
          <span>📋 LOADING FORM</span><span>⚡ PREPARING</span><span>📊 SECURE</span>
        </div>
      </div>
      <h3 style={{ fontSize:18, fontWeight:600, color:TEXT_DARK, marginBottom:8, fontFamily:"'Playfair Display',serif" }}>{msg}</h3>
      <p style={{ fontSize:13, color:TEXT_MUTED, marginBottom:24 }}>{subMsg}</p>
      <div style={{ display:'flex', justifyContent:'center', gap:8 }}>
        {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:PRIMARY, animation:`pulse-soft 1.5s ${i*0.2}s infinite` }} />)}
      </div>
    </div>
  </div>
)

// ─── Form Field ──────────────────────────────────────────────────────────────
const FormField = ({ label, required, children, error }: {
  label: string; required?: boolean; children: React.ReactNode; error?: string
}) => (
  <div style={{ marginBottom:20 }}>
    <label style={{ display:'block', fontSize:12, fontWeight:600, color:TEXT_MUTED, marginBottom:8, letterSpacing:'0.5px' }}>
      {label} {required && <span style={{ color:'#EF4444' }}>*</span>}
    </label>
    {children}
    {error && <p style={{ fontSize:11, color:'#EF4444', marginTop:5 }}>{error}</p>}
  </div>
)

// ─── Format Date for display ─────────────────────────────────────────────────
const formatAppointmentDate = (dateString: string, isArabic: boolean): string => {
  if (!dateString) return ''
  const [datePart, timePart] = dateString.split('T')
  if (!datePart) return dateString
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart ? timePart.split(':').map(Number) : [0, 0]
  const monthNames = isArabic
    ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
    : ['January','February','March','April','May','June','July','August','September','October','November','December']
  const weekdayNames = isArabic
    ? ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
    : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const dateObj = new Date(year, month-1, day)
  const weekday = weekdayNames[dateObj.getDay()]
  const monthName = monthNames[month-1]
  const hour12 = hours % 12 || 12
  const ampm = hours >= 12 ? (isArabic ? 'م' : 'PM') : (isArabic ? 'ص' : 'AM')
  const hourStr = hour12.toString().padStart(2,'0')
  const minuteStr = minutes.toString().padStart(2,'0')
  return isArabic
    ? `${weekday}، ${day} ${monthName}، ${hourStr}:${minuteStr} ${ampm}`
    : `${weekday}, ${monthName} ${day}, ${hourStr}:${minuteStr} ${ampm}`
}

// ─── Get local now as string ──────────────────────────────────────────────────
const getLocalNowString = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:00`
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AddAppointment() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [doctorStatus, setDoctorStatus] = useState<{
    isBusy: boolean; queueCount: number; currentPatient?: string; nextAppointmentTime?: string
  } | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)

  const [form, setForm] = useState({
    patientId: '', doctorId: '', appointmentDate: '',
    appointmentPrice: undefined as number | undefined,
    type: '', price: '', notes: '',
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const styleId = 'cura-add-appointment-css'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style'); style.id = styleId; style.textContent = globalCss; document.head.appendChild(style)
    }
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)

    const fetchData = async () => {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([api.get('/patients'), api.get('/doctors')])
        setPatients(patientsRes.data)
        setDoctors(doctorsRes.data.filter((d: Doctor) => d.isActive))
      } catch { navigate('/login') }
      finally { setLoadingData(false) }
    }
    fetchData()
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [navigate])

  // جلب حالة الطبيب
  useEffect(() => {
    if (!form.doctorId) { setDoctorStatus(null); return }
    setLoadingStatus(true)
    api.get(`/appointments/doctor-status/${form.doctorId}`)
      .then(res => setDoctorStatus(res.data))
      .catch(() => setDoctorStatus(null))
      .finally(() => setLoadingStatus(false))
  }, [form.doctorId])

  // إعادة تعيين التاريخ عند تغيير الطبيب
  useEffect(() => {
    if (form.doctorId) setForm(prev => ({ ...prev, appointmentDate: '', appointmentPrice: undefined }))
  }, [form.doctorId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSlotSelect = (dateTime: string, price?: number) => {
    setForm(prev => ({ ...prev, appointmentDate: dateTime, appointmentPrice: price }))
    if (validationErrors.appointmentDate) setValidationErrors(prev => ({ ...prev, appointmentDate: '' }))
  }

  // ✅ تحديد نوع عمل الطبيب المختار
  const selectedDoctor = doctors.find(d => d.id === form.doctorId)
  const isQueueOnly = selectedDoctor?.workType === 'queue'
  const isAppointmentsOnly = selectedDoctor?.workType === 'appointments'

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    const t = T[lang]
    if (!form.patientId) errors.patientId = t.required

    // التحقق من التاريخ فقط إذا لم يكن دور
    if (!isQueueOnly) {
      if (!form.appointmentDate) {
        errors.appointmentDate = t.required
      } else {
        const selectedDate = new Date(form.appointmentDate)
        if (isNaN(selectedDate.getTime())) errors.appointmentDate = t.invalidDate
        else if (selectedDate <= new Date()) errors.appointmentDate = t.futureDateError
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setError(''); setLoading(true)

    try {
      // ✅ إذا كان دور — استخدم الوقت الحالي
      const appointmentDate = isQueueOnly ? getLocalNowString() : form.appointmentDate

      const payload: Record<string, any> = {
        patientId: form.patientId,
        appointmentDate,
        status: 'scheduled',
        lang: lang,
      }
      
      if (form.doctorId) payload.doctorId = form.doctorId
      if (form.type) payload.type = form.type
      const finalPrice = form.appointmentPrice ?? (form.price ? parseFloat(form.price) : undefined)
      if (finalPrice) payload.price = finalPrice
      if (form.notes?.trim()) payload.notes = form.notes.trim()

      await api.post('/appointments', payload)
      navigate('/appointments')
    } catch (err: any) {
      const errData = err.response?.data
      if (typeof errData === 'string') setError(errData)
      else if (errData?.errors) setError(Object.values(errData.errors).flat().join('، ') as string)
      else if (errData?.message) setError(errData.message)
      else setError(T[lang].error)
    } finally { setLoading(false) }
  }

  const t = T[lang]
  const isAr = lang === 'ar'
  const isDoctorSelected = !!form.doctorId
  const isPatientSelected = !!form.patientId
  const canSubmit = isPatientSelected && (isQueueOnly || !!form.appointmentDate)

  const selectStyle = {
    width:'100%', background:CARD_BG, border:`1px solid ${BORDER}`,
    borderRadius:12, padding:'10px 14px', fontSize:14,
    fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif",
    color:TEXT_DARK, outline:'none', transition:'all 0.2s ease', cursor:'pointer',
  }

  if (loadingData) return <FormLoadingScreen msg={t.loadingMessage} subMsg={t.loadingSub} />

  return (
    <div className="add-appointment-shell" style={{ direction:isAr?'rtl':'ltr', background:'#F8FAFA', minHeight:'100vh', padding:'24px' }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <button onClick={()=>navigate('/appointments')}
            style={{ display:'inline-flex', alignItems:'center', gap:6, background:'none', border:'none', color:TEXT_MUTED, fontSize:13, cursor:'pointer', marginBottom:16 }}
            onMouseEnter={e=>e.currentTarget.style.color=PRIMARY} onMouseLeave={e=>e.currentTarget.style.color=TEXT_MUTED}>
            <span>←</span> {t.back}
          </button>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:PRIMARY_SOFT, border:`1px solid ${BORDER}`, borderRadius:100, padding:'4px 16px', fontSize:11, fontWeight:600, color:PRIMARY, marginBottom:12 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:PRIMARY, animation:'soft-pulse 2s infinite' }} />
            {isAr ? 'موعد جديد' : 'New Appointment'}
          </div>
          <h2 className="add-appointment-title" style={{ fontFamily:"'DM Serif Display','Georgia',serif", fontSize:28, fontWeight:500, color:TEXT_DARK, margin:0 }}>
            {t.title}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-container" style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:24, padding:'28px' }}>

            {/* المريض */}
            <FormField label={t.patient} required error={validationErrors.patientId}>
              <select name="patientId" value={form.patientId} onChange={handleChange} className="form-select" style={selectStyle}>
                <option value="">{isAr ? 'اختر مريضاً...' : 'Select a patient...'}</option>
                {patients.map(p => <option key={p.id} value={p.id}>#{p.patientNumber} — {p.fullName}</option>)}
              </select>
              <p style={{ fontSize:10, color:TEXT_MUTED, marginTop:4 }}>
                {t.registeredPatients} {patients.length}
              </p>
            </FormField>

            {/* الطبيب */}
            <FormField label={t.doctor}>
              <select name="doctorId" value={form.doctorId} onChange={handleChange} className="form-select" style={selectStyle}>
                <option value="">{t.noDoctor}</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.workType === 'queue' ? '🔢' : d.workType === 'appointments' ? '📅' : '✅'} {d.fullName}
                    {d.specialty ? ` — ${d.specialty}` : ''}
                  </option>
                ))}
              </select>
              {doctors.length === 0 && (
                <p style={{ fontSize:11, color:'#F59E0B', marginTop:4 }}>⚠️ {t.noActiveDoctors}</p>
              )}
              {/* ✅ بادج نوع العمل */}
              {selectedDoctor && (
                <div style={{ marginTop:6, display:'inline-flex', alignItems:'center', gap:6, padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:600,
                  background: isQueueOnly ? '#FFF8E1' : '#E8F5E9',
                  color: isQueueOnly ? '#F59E0B' : '#22C55E',
                  border: `1px solid ${isQueueOnly ? '#FCD34D' : '#86EFAC'}`,
                }}>
                  {isQueueOnly ? t.queueWorkType : t.appointmentsWorkType}
                </div>
              )}
            </FormField>

            {/* حالة الطبيب */}
            {form.doctorId && (
              <div style={{ marginBottom:16 }}>
                {loadingStatus ? (
                  <div style={{ fontSize:12, color:TEXT_MUTED }}>جارٍ التحقق...</div>
                ) : doctorStatus && (
                  <div style={{ padding:'10px 16px', borderRadius:12, fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
                    background: doctorStatus.isBusy ? '#FFF5F5' : doctorStatus.queueCount > 0 ? '#FFF8E1' : '#E8F5E9',
                    border: `1px solid ${doctorStatus.isBusy ? '#FCA5A5' : doctorStatus.queueCount > 0 ? '#FCD34D' : '#86EFAC'}`,
                    color: doctorStatus.isBusy ? '#EF4444' : doctorStatus.queueCount > 0 ? '#F59E0B' : '#22C55E',
                  }}>
                    <span style={{ fontSize:18 }}>{doctorStatus.isBusy ? '🔴' : doctorStatus.queueCount > 0 ? '🟡' : '🟢'}</span>
                    <div>
                      {doctorStatus.isBusy ? (
                        <><div>{isAr ? 'مشغول حالياً' : 'Currently Busy'}</div>
                        {doctorStatus.currentPatient && <div style={{ fontSize:11, fontWeight:400, opacity:0.8 }}>{isAr?'مع':'with'}: {doctorStatus.currentPatient}</div>}</>
                      ) : doctorStatus.queueCount > 0 ? (
                        <div>{isAr ? `في قائمة الدور — ${doctorStatus.queueCount} مريض` : `In Queue — ${doctorStatus.queueCount} patients`}</div>
                      ) : (
                        <div>{isAr ? 'متاح الآن' : 'Available Now'}</div>
                      )}
                      {doctorStatus.nextAppointmentTime && !doctorStatus.isBusy && (
                        <div style={{ fontSize:11, fontWeight:400, opacity:0.8 }}>{isAr?'الموعد القادم:':'Next:'} {doctorStatus.nextAppointmentTime}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* التاريخ والوقت */}
            <FormField label={t.date} required={!isQueueOnly} error={validationErrors.appointmentDate}>
              {!isDoctorSelected ? (
                // لم يتم اختيار طبيب
                <div className="disabled-message">
                  <div style={{ width:'56px', height:'56px', background:PRIMARY_SOFT, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px auto' }}>
                    <span style={{ fontSize:'28px' }}>📅</span>
                  </div>
                  <p style={{ fontSize:'15px', fontWeight:600, margin:'0 0 8px 0', color:PRIMARY }}>{t.selectDoctorFirst}</p>
                  <p style={{ fontSize:'12px', margin:0, color:TEXT_MUTED }}>{t.selectDoctorHint}</p>
                </div>
              ) : isQueueOnly ? (
                // ✅ طبيب دور — لا تقويم
                <div style={{ background:'#FFF8E1', border:'2px solid #FCD34D', borderRadius:16, padding:'24px', textAlign:'center' }}>
                  <span style={{ fontSize:40 }}>🔢</span>
                  <p style={{ fontSize:15, fontWeight:700, color:'#F59E0B', margin:'10px 0 6px' }}>{t.queueBooking}</p>
                  <p style={{ fontSize:12, color:TEXT_MUTED, margin:0 }}>{t.queueBookingHint}</p>
                  <div style={{ marginTop:12, padding:'8px 16px', background:'#FFFBEB', borderRadius:10, display:'inline-flex', alignItems:'center', gap:8, fontSize:12, color:'#92400E' }}>
                    🕐 {new Date().toLocaleTimeString(isAr ? 'ar-SA' : undefined, { hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>
              ) : (
                // طبيب مواعيد — التقويم
                <div className="calendar-container">
                  <AppointmentCalendar doctorId={form.doctorId} onSelectSlot={handleSlotSelect} />
                </div>
              )}

              {/* ملخص الموعد المختار */}
              {form.appointmentDate && isDoctorSelected && !isQueueOnly && (
                <div className="selected-appointment-info" style={{ marginTop:'16px', padding:'14px 18px',
                  background:`linear-gradient(135deg,${SUCCESS}10 0%,${PRIMARY_SOFT} 100%)`,
                  borderRadius:'12px', border:`1px solid ${SUCCESS}`,
                  display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'36px', height:'36px', background:PRIMARY, borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:'18px' }}>✅</span>
                    </div>
                    <div>
                      <div style={{ fontSize:'10px', fontWeight:600, color:PRIMARY, textTransform:'uppercase', letterSpacing:'0.5px' }}>{t.selectedAppointment}</div>
                      <div style={{ fontSize:'13px', fontWeight:600, color:TEXT_DARK }}>
                        {formatAppointmentDate(form.appointmentDate, isAr)}
                      </div>
                      {form.appointmentPrice && (
                        <div style={{ fontSize:'11px', color:PRIMARY, marginTop:'3px', fontWeight:500 }}>
                          💰 {form.appointmentPrice} {isAr?'د.أ':'JD'}
                        </div>
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={()=>setForm(prev=>({...prev, appointmentDate:'', appointmentPrice:undefined}))}
                    style={{ background:'#FFFFFF', border:`1px solid ${BORDER}`, borderRadius:'10px', padding:'6px 14px', fontSize:'12px', fontWeight:500, cursor:'pointer', color:TEXT_MUTED }}
                    onMouseEnter={e=>{e.currentTarget.style.background='#FFE5E5';e.currentTarget.style.borderColor=ERROR_TEXT;e.currentTarget.style.color=ERROR_TEXT}}
                    onMouseLeave={e=>{e.currentTarget.style.background='#FFFFFF';e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.color=TEXT_MUTED}}>
                    🔄 {t.change}
                  </button>
                </div>
              )}
            </FormField>

            {/* نوع الزيارة */}
            <FormField label={t.type}>
              <select name="type" value={form.type} onChange={handleChange} className="form-select" style={selectStyle}>
                <option value="">{t.typePlaceholder}</option>
                <option value="كشف">🩺 {t.typeCheckup}</option>
                <option value="متابعة">📋 {t.typeFollowup}</option>
                <option value="استشارة">💬 {t.typeConsultation}</option>
                <option value="طوارئ">🚨 {t.typeEmergency}</option>
              </select>
            </FormField>

            {/* السعر */}
            <FormField label={t.price}>
              <input type="number" name="price" value={form.price} onChange={handleChange}
                min="0" step="0.01" placeholder={t.pricePlaceholder} disabled={!!form.appointmentPrice}
                className="form-input"
                style={{ width:'100%', background:form.appointmentPrice?'#F8FAFA':CARD_BG, border:`1px solid ${BORDER}`, borderRadius:12, padding:'10px 14px', fontSize:14, fontFamily:isAr?"'Cairo',sans-serif":"'Inter',sans-serif", color:TEXT_DARK, outline:'none', opacity:form.appointmentPrice?0.6:1, cursor:form.appointmentPrice?'not-allowed':'text' }} />
              {form.appointmentPrice && (
                <p style={{ fontSize:11, color:PRIMARY, marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
                  <span>ℹ️</span> {t.priceNote}
                </p>
              )}
            </FormField>

            {/* ملاحظات */}
            <FormField label={t.notes}>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder={t.notesPlaceholder} className="form-textarea"
                style={{ width:'100%', background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:12, padding:'10px 14px', fontSize:14, fontFamily:isAr?"'Cairo',sans-serif":"'Inter',sans-serif", color:TEXT_DARK, outline:'none', resize:'vertical' }} />
            </FormField>

            {/* خطأ */}
            {error && (
              <div style={{ background:ERROR_BG, border:`1px solid ${ERROR_TEXT}40`, borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:14 }}>⚠️</span>
                <span style={{ fontSize:13, color:ERROR_TEXT }}>{error}</span>
              </div>
            )}

            {/* أزرار */}
            <div style={{ display:'flex', gap:12, marginTop:8 }}>
              <button type="submit" disabled={loading || !canSubmit}
                style={{ flex:1, background:PRIMARY, color:'#FFFFFF', border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:600,
                  fontFamily:isAr?"'Cairo',sans-serif":"'Inter',sans-serif",
                  cursor:(loading||!canSubmit)?'not-allowed':'pointer', opacity:(loading||!canSubmit)?0.7:1,
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s ease' }}
                onMouseEnter={e=>{if(!loading&&canSubmit)e.currentTarget.style.background=PRIMARY_DARK}}
                onMouseLeave={e=>{if(!loading&&canSubmit)e.currentTarget.style.background=PRIMARY}}>
                {loading ? (
                  <><span style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#FFFFFF', animation:'spin 0.8s linear infinite' }} />{t.saving}</>
                ) : isQueueOnly ? `🔢 ${t.submitQueue}` : t.submit}
              </button>
              <button type="button" onClick={()=>navigate('/appointments')}
                style={{ padding:'12px 24px', background:'transparent', border:`1px solid ${BORDER}`, borderRadius:12, fontSize:14, fontWeight:500, color:TEXT_MUTED, cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.background=PRIMARY_SOFT}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                {t.cancel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}