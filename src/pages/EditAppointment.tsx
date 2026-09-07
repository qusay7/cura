import { useEffect, useState, useId, isValidElement, cloneElement } from 'react'
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import type { Patient, Doctor } from '../types'
import { ECGAnimation } from '../components/ECGAnimation'
import AppointmentCalendar from '../components/AppointmentCalendar'
import SearchableSelect from '../components/SearchableSelect'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

// ─── Global CSS with Comfortable Colors ────────────────────────────────────
const globalCss = `
        
  .edit-appointment-shell { animation: fade-up 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) both; }
  .edit-appointment-shell * { box-sizing:border-box; }

  .form-input:focus, .form-select:focus, .form-textarea:focus {
    border-color: #5B8C8F !important;
    box-shadow: 0 0 0 3px rgba(91, 140, 143, 0.1) !important;
  }

  .disabled-message {
    background: linear-gradient(135deg,#F8FAFA 0%,#FFFFFF 100%);
    border: 2px dashed #DCE5E5;
    border-radius:20px;
    padding:40px 24px;
    text-align:center;
    transition:all 0.3s ease;
  }

  .disabled-message:hover { 
    border-color:#5B8C8F; 
    background:#F8FAFA; 
  }

  .calendar-container {
    background:white;
    border-radius:16px;
    border:1px solid #DCE5E5;
    overflow:hidden;
    transition:all 0.3s ease;
  }

  .calendar-container:hover { 
    border-color:#5B8C8F; 
    box-shadow:0 4px 12px rgba(91,140,143,0.1); 
  }

  .calendar-container .rbc-toolbar { 
    padding:16px; 
    background:#F8FAFA; 
    border-bottom:1px solid #DCE5E5; 
    flex-wrap:wrap; 
    gap:12px; 
  }

  .calendar-container .rbc-toolbar button { 
    color:#2C3E3F; 
    border:1px solid #DCE5E5; 
    background:white; 
    border-radius:8px; 
    padding:6px 14px; 
    font-size:13px; 
    font-weight:500; 
    transition:all 0.2s ease; 
  }

  .calendar-container .rbc-toolbar button:hover { 
    background:#E8F0F0; 
    border-color:#5B8C8F; 
    color:#5B8C8F; 
  }

  .calendar-container .rbc-toolbar button.rbc-active { 
    background:#5B8C8F; 
    border-color:#5B8C8F; 
    color:white; 
  }

  .calendar-container .rbc-toolbar-label { 
    font-weight:600; 
    color:#2C3E3F; 
    font-size:15px; 
  }

  .calendar-container .rbc-header { 
    padding:12px 8px; 
    background:#F8FAFA; 
    font-weight:600; 
    font-size:12px; 
    text-transform:uppercase; 
    letter-spacing:0.5px; 
    color:#6B8A8C; 
    border-bottom:1px solid #DCE5E5; 
  }

  .calendar-container .rbc-event { 
    background:#5B8C8F; 
    border-radius:8px; 
    padding:4px 8px; 
    font-size:12px; 
    transition:all 0.2s ease; 
    border:none; 
  }

  .calendar-container .rbc-event:hover { 
    background:#4A7679; 
    transform:scale(1.02); 
    box-shadow:0 2px 8px rgba(91,140,143,0.3); 
  }

  @media(max-width: 768px) {
    .edit-appointment-title { font-size: 24px !important; }
    .form-container { padding: 20px !important; }
    .action-buttons { flex-direction: column !important; }
  }
`

// Comfortable color palette
const PRIMARY_DARK = '#4A7679'
const ERROR_BG = '#FDF5F5'
const ERROR_TEXT = '#C4A77D'
const SUCCESS = '#16A34A'
const SUCCESS_BG = '#F0FDF4'

// ─── Translations ───────────────────────────────────────────────────────────
const T = {
  ar: {
    title: 'تعديل الموعد',
    back: 'رجوع',
    patient: 'المريض',
    patientPlaceholder: 'اختر مريضاً...',
    doctor: 'الطبيب',
    doctorPlaceholder: 'بدون طبيب',
    date: 'تاريخ ووقت الموعد',
    type: 'نوع الزيارة',
    typePlaceholder: 'اختر...',
    typeConsultation: 'استشارة',
    typeFollowup: 'متابعة',
    typeEmergency: 'طوارئ',
    typeCheckup: 'كشف',
    price: 'السعر',
    pricePlaceholder: '0.00',
    notes: 'ملاحظات',
    notesPlaceholder: 'أضف ملاحظات إضافية...',
    status: 'الحالة',
    statusPlaceholder: 'اختر الحالة...',
    scheduled: 'مجدول',
    confirmed: 'مؤكد',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    save: 'حفظ التعديلات',
    cancel: 'إلغاء',
    saving: 'جارٍ الحفظ...',
    error: 'حدث خطأ غير متوقع',
    required: 'هذا الحقل مطلوب',
    loadingMessage: 'جاري تحميل بيانات الموعد',
    loadingSub: 'يرجى الانتظار أثناء تحميل المعلومات',
    selectDoctorFirst: 'اختر الطبيب أولاً',
    selectDoctorHint: 'يرجى اختيار الطبيب من القائمة أعلاه لعرض المواعيد المتاحة',
    queueBooking: 'حجز دور',
    queueBookingHint: 'سيتم تسجيل الموعد بوقت الحجز تلقائياً',
    queueUnavailable: 'الطبيب غير متاح',
    checkingAvailability: 'جارٍ التحقق من التوفر...',
    timeConflict: 'الطبيب لديه موعد في',
    selectedTime: 'الموعد المحدد',
    conflictCheckFailed: 'تعذّر التحقق من تعارض المواعيد — يرجى المحاولة مرة أخرى',
    saved: 'تم حفظ التعديلات بنجاح',
  },
  en: {
    title: 'Edit Appointment',
    back: 'Back',
    patient: 'Patient',
    patientPlaceholder: 'Select a patient...',
    doctor: 'Doctor',
    doctorPlaceholder: 'No doctor',
    date: 'Appointment Date & Time',
    type: 'Visit Type',
    typePlaceholder: 'Select...',
    typeConsultation: 'Consultation',
    typeFollowup: 'Follow-up',
    typeEmergency: 'Emergency',
    typeCheckup: 'Checkup',
    price: 'Price',
    pricePlaceholder: '0.00',
    notes: 'Notes',
    notesPlaceholder: 'Add additional notes...',
    status: 'Status',
    statusPlaceholder: 'Select status...',
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    save: 'Save Changes',
    cancel: 'Cancel',
    saving: 'Saving...',
    error: 'An unexpected error occurred',
    required: 'This field is required',
    loadingMessage: 'Loading Appointment Data',
    loadingSub: 'Please wait while we load appointment information',
    selectDoctorFirst: 'Select Doctor First',
    selectDoctorHint: 'Please select a doctor from above to see available time slots',
    queueBooking: 'Queue Booking',
    queueBookingHint: 'Appointment will be set to current time automatically',
    queueUnavailable: 'Doctor Unavailable',
    checkingAvailability: 'Checking availability...',
    timeConflict: 'Doctor has an appointment at',
    selectedTime: 'Selected Time',
    conflictCheckFailed: 'Could not verify scheduling conflicts — please try again',
    saved: 'Changes saved successfully',
  },
}

// ─── Loading Screen with ECG ───────────────────────────────────────────────
const EditAppointmentLoadingScreen = ({ msg, subMsg }: { msg: string; subMsg: string }) => (
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
          <span>📅 FETCHING DATA</span>
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

// ─── Form Field Component ──────────────────────────────────────────────────
const FormField = ({ label, required, children, error }: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) => {
  const fieldId = useId()
  const errorId = `${fieldId}-error`
  const child = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, {
        id: fieldId,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
        'aria-required': required || undefined,
      })
    : children
  return (
    <div style={{ marginBottom: 20 }}>
      <label htmlFor={fieldId} style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: TEXT_MUTED,
        marginBottom: 8,
        letterSpacing: '0.5px',
      }}>
        {label} {required && <span style={{ color: ERROR_TEXT }}>*</span>}
      </label>
      {child}
      {error && <p id={errorId} role="alert" style={{ fontSize: 11, color: ERROR_TEXT, marginTop: 5 }}>{error}</p>}
    </div>
  )
}

export default function EditAppointment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [queueAbsence, setQueueAbsence] = useState<{ available: boolean; message?: string } | null>(null)
  const [checkingAbsence, setCheckingAbsence] = useState(false)

  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    type: '',
    price: '',
    status: '',
    notes: '',
  })
  useUnsavedChangesWarning(form, !loading)

  // ✅ التحقق من تضارب الأوقات
  const checkTimeConflict = async (doctorId: string | undefined, dateTime: string) => {
    if (!doctorId) return { conflict: false }

    try {
      const response = await api.get(`/appointments?doctorId=${doctorId}`)
      const appointments = response.data || []

      const newTime = new Date(dateTime).getTime()
      const minGap = 20 * 60 * 1000 // 20 دقيقة

      for (const apt of appointments) {
        if (apt.id === id) continue // تخطي الموعد الحالي

        const existingTime = new Date(apt.appointmentDate).getTime()
        const timeDiff = Math.abs(newTime - existingTime)

        if (timeDiff < minGap) {
          const existingTimeFormatted = new Date(existingTime).toLocaleTimeString(
            lang === 'ar' ? 'ar-SA' : 'en-US',
            { hour: '2-digit', minute: '2-digit' }
          )
          return {
            conflict: true,
            message: `${T[lang].timeConflict} ${existingTimeFormatted}`
          }
        }
      }
      return { conflict: false }
    } catch {
      // ✅ لو فشل طلب التحقق نفسه (شبكة مثلاً)، ما نفترض عدم وجود تعارض —
      // نمنع الحفظ صراحة بدل حفظ حجز مزدوج محتمل بصمت
      return { conflict: true, message: T[lang].conflictCheckFailed }
    }
  }

  // Inject global styles
  useEffect(() => {
    const styleId = 'cura-edit-appointment-css'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = globalCss + `
              `
      document.head.appendChild(style)
    }

    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)

    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      const startTime = Date.now()
      const minLoadingTime = 800

      try {
        const [apptRes, patientsRes, doctorsRes] = await Promise.all([
          api.get(`/appointments/${id}`),
          api.get('/patients'),
          api.get('/doctors'),
        ])

        const a = apptRes.data
        setForm({
          patientId: a.patientId ?? '',
          doctorId: a.doctorId ?? '',
          appointmentDate: a.appointmentDate
            ? new Date(a.appointmentDate).toISOString().slice(0, 16)
            : '',
          type: a.type ?? '',
          price: a.price?.toString() ?? '',
          status: a.status ?? 'scheduled',
          notes: a.notes ?? '',
        })
        setPatients(patientsRes.data)
        setDoctors(doctorsRes.data.filter((d: Doctor) => d.isActive))
      } catch (err) {
        console.error('Error fetching data:', err)
        navigate('/appointments')
      } finally {
        const elapsed = Date.now() - startTime
        if (elapsed < minLoadingTime) {
          setTimeout(() => setLoading(false), minLoadingTime - elapsed)
        } else {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [id, navigate])

  // ✅ حسب نوع الطبيب
  const selectedDoctor = doctors.find(d => d.id === form.doctorId)
  const isQueueOnly = selectedDoctor?.workType === 'queue'
  const isDoctorSelected = !!form.doctorId

  // ✅ التحقق من القائمة
  useEffect(() => {
    if (!isQueueOnly || !form.doctorId) {
      setQueueAbsence(null)
      return
    }
    setCheckingAbsence(true)
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    api.get(`/absences/check?doctorId=${form.doctorId}&date=${dateStr}&time=${timeStr}`)
      .then(res => setQueueAbsence(res.data))
      .catch(() => setQueueAbsence(null))
      .finally(() => setCheckingAbsence(false))
  }, [isQueueOnly, form.doctorId])

  const isQueueBlocked = isQueueOnly && queueAbsence?.available === false

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handlePatientSelect = (patientId: string) => setForm(prev => ({ ...prev, patientId }))
  const handleDoctorSelect = (doctorId: string) => setForm(prev => ({ ...prev, doctorId }))

  // ✅ دالة اختيار الموعد من التقويم
  const handleSlotSelect = (dateTime: string, price?: number) => {
    setForm(prev => ({
      ...prev,
      appointmentDate: dateTime,
      price: price ? String(price) : prev.price
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // ✅ التحقق يدوياً — SearchableSelect لا يشارك بالتحقق الأصلي للمتصفح
    // (لا عنصر <select required> فعلي)، فلم يعد ممكناً الاعتماد عليه هنا
    if (!form.patientId) {
      setError(T[lang].required)
      return
    }

    setSaving(true)

    try {
      // ✅ التحقق من التضارب مباشرة قبل الحفظ — يغطي أي تغيير على الطبيب أو
      // الموعد منذ آخر اختيار، ويتجنب مشاكل تعدد الطلبات غير المتزامنة
      if (form.doctorId && form.appointmentDate) {
        const conflict = await checkTimeConflict(form.doctorId, form.appointmentDate)
        if (conflict.conflict) {
          setError(conflict.message || '')
          return
        }
      }

      const payload = {
        patientId: form.patientId,
        doctorId: form.doctorId || null,
        appointmentDate: form.appointmentDate
          ? new Date(form.appointmentDate).toISOString()
          : null,
        type: form.type || null,
        price: form.price ? parseFloat(form.price) : null,
        status: form.status || null,
        notes: form.notes || null,
      }

      await api.put(`/appointments/${id}`, payload)
      setSuccess(T[lang].saved)
      setTimeout(() => navigate('/appointments'), 1200)
    } catch (err: any) {
      const errData = err.response?.data
      if (typeof errData === 'string') {
        setError(errData)
      } else if (errData?.message) {
        setError(errData.message)
      } else {
        setError(T[lang].error)
      }
    } finally {
      setSaving(false)
    }
  }

  const t = T[lang]
  const isAr = lang === 'ar'

  // Get min datetime (now + 1 hour)
  const getMinDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    now.setMinutes(0, 0, 0)
    return now.toISOString().slice(0, 16)
  }

  // Status options
  const statusOptions = [
    { value: 'scheduled', label: t.scheduled, icon: '⏰' },
    { value: 'confirmed', label: t.confirmed, icon: '✓' },
    { value: 'completed', label: t.completed, icon: '✔️' },
    { value: 'cancelled', label: t.cancelled, icon: '✕' },
  ]

  // Type options
  const typeOptions = [
    { value: 'كشف', label: t.typeCheckup },
    { value: 'متابعة', label: t.typeFollowup },
    { value: 'استشارة', label: t.typeConsultation },
    { value: 'طوارئ', label: t.typeEmergency },
  ]

  if (loading) {
    return (
      <EditAppointmentLoadingScreen
        msg={t.loadingMessage}
        subMsg={t.loadingSub}
      />
    )
  }

  return (
    <div
      className="edit-appointment-shell"
      style={{
        direction: isAr ? 'rtl' : 'ltr',
        background: '#F8FAFA',
        minHeight: '100vh',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate('/appointments')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: TEXT_MUTED,
              fontSize: 13,
              cursor: 'pointer',
              marginBottom: 16,
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = PRIMARY }}
            onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_MUTED }}
          >
            <span>{isAr ? '→' : '←'}</span> {t.back}
          </button>

          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: PRIMARY_SOFT,
              border: `1px solid ${BORDER}`,
              borderRadius: 100,
              padding: '4px 16px',
              fontSize: 11,
              fontWeight: 600,
              color: PRIMARY,
              letterSpacing: '0.3px',
              marginBottom: 12,
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: PRIMARY,
                animation: 'soft-pulse 2s infinite',
              }} />
              {isAr ? 'تعديل موعد' : 'Edit Appointment'}
            </div>
            <h2 className="edit-appointment-title" style={{
              fontFamily: "'DM Serif Display', 'Georgia', serif",
              fontSize: 28,
              fontWeight: 500,
              color: TEXT_DARK,
              margin: 0,
              letterSpacing: '-0.3px',
            }}>
              ✏️ {t.title}
            </h2>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>
          <div className="form-container" style={{
            background: CARD_BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 24,
            padding: '28px',
          }}>

            {/* Patient Field */}
            <FormField label={t.patient} required>
              <SearchableSelect
                isRtl={isAr}
                value={form.patientId}
                onChange={handlePatientSelect}
                placeholder={t.patientPlaceholder}
                options={patients.map(p => ({ value: p.id, label: `#${p.patientNumber} — ${p.fullName}` }))}
              />
            </FormField>

            {/* Doctor Field */}
            <FormField label={t.doctor}>
              <SearchableSelect
                isRtl={isAr}
                value={form.doctorId}
                onChange={handleDoctorSelect}
                placeholder={t.doctorPlaceholder}
                options={doctors.map(d => ({ value: d.id, label: `${d.fullName}${d.specialty ? ` — ${d.specialty}` : ''}` }))}
              />
            </FormField>

            {/* Date Field */}
            <FormField label={t.date} required={!isQueueOnly} error={error ? error : ''}>
              {!isDoctorSelected ? (
                <div className="disabled-message">
                  <div style={{ width:'56px', height:'56px', background:PRIMARY_SOFT, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px auto' }}>
                    <span style={{ fontSize:'28px' }}>📅</span>
                  </div>
                  <p style={{ fontSize:'15px', fontWeight:600, margin:'0 0 8px 0', color:PRIMARY }}>{t.selectDoctorFirst}</p>
                  <p style={{ fontSize:'12px', margin:0, color:TEXT_MUTED }}>{t.selectDoctorHint}</p>
                </div>
              ) : isQueueOnly ? (
                checkingAbsence ? (
                  <div style={{ background:'#F8FAFA', border:`1px dashed ${BORDER}`, borderRadius:16, padding:'24px', textAlign:'center' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', border:`3px solid ${PRIMARY_SOFT}`, borderTopColor:PRIMARY, animation:'spin 0.8s linear infinite', margin:'0 auto 10px' }} />
                    <p style={{ fontSize:13, color:TEXT_MUTED, margin:0 }}>{t.checkingAvailability}</p>
                  </div>
                ) : isQueueBlocked ? (
                  <div style={{ background:'#FEF3C7', border:'2px solid #FCD34D', borderRadius:16, padding:'24px', textAlign:'center' }}>
                    <span style={{ fontSize:40 }}>🚫</span>
                    <p style={{ fontSize:15, fontWeight:700, color:'#92400E', margin:'10px 0 6px' }}>{t.queueUnavailable}</p>
                    <p style={{ fontSize:12, color:TEXT_MUTED, margin:0 }}>{queueAbsence?.message}</p>
                  </div>
                ) : (
                  <div style={{ background:'#FFF8E1', border:'2px solid #FCD34D', borderRadius:16, padding:'24px', textAlign:'center' }}>
                    <span style={{ fontSize:40 }}>🔢</span>
                    <p style={{ fontSize:15, fontWeight:700, color:'#F59E0B', margin:'10px 0 6px' }}>{t.queueBooking}</p>
                    <p style={{ fontSize:12, color:TEXT_MUTED, margin:0 }}>{t.queueBookingHint}</p>
                    <div style={{ marginTop:12, padding:'8px 16px', background:'#FFFBEB', borderRadius:10, display:'inline-flex', alignItems:'center', gap:8, fontSize:12, color:'#92400E' }}>
                      🕐 {new Date().toLocaleTimeString(isAr ? 'ar-SA' : undefined, { hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                )
              ) : (
                <div className="calendar-container">
                  <AppointmentCalendar doctorId={form.doctorId} onSelectSlot={handleSlotSelect} />
                </div>
              )}
              {form.appointmentDate && (
                <div style={{
                  marginTop: 12,
                  padding: '12px 16px',
                  background: PRIMARY_SOFT,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: TEXT_DARK,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  📅 {new Date(form.appointmentDate).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </FormField>

            {/* Type Field */}
            <FormField label={t.type}>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="form-select"
                style={{
                  width: '100%',
                  background: CARD_BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 14,
                  fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
                  color: TEXT_DARK,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <option value="">{t.typePlaceholder}</option>
                {typeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>

            {/* Status Field */}
            <FormField label={t.status}>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="form-select"
                style={{
                  width: '100%',
                  background: CARD_BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 14,
                  fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
                  color: TEXT_DARK,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Price Field */}
            <FormField label={t.price}>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder={t.pricePlaceholder}
                className="form-input"
                style={{
                  width: '100%',
                  background: CARD_BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 14,
                  fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
                  color: TEXT_DARK,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
              />
            </FormField>

            {/* Notes Field */}
            <FormField label={t.notes}>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder={t.notesPlaceholder}
                className="form-textarea"
                style={{
                  width: '100%',
                  background: CARD_BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 14,
                  fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
                  color: TEXT_DARK,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  resize: 'vertical',
                }}
              />
            </FormField>

            {/* Success Message */}
            {success && (
              <div style={{
                background: SUCCESS_BG,
                border: `1px solid ${SUCCESS}40`,
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <span style={{ fontSize: 16 }}>✅</span>
                <span style={{ fontSize: 13, color: SUCCESS, fontWeight: 600 }}>{success}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div style={{
                background: ERROR_BG,
                border: `1px solid ${ERROR_TEXT}40`,
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span style={{ fontSize: 13, color: ERROR_TEXT }}>{error}</span>
              </div>
            )}

            {/* Actions Buttons */}
            <div className="action-buttons" style={{
              display: 'flex',
              gap: 12,
              marginTop: 8,
            }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  background: PRIMARY,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: saving ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = PRIMARY_DARK }}
                onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = PRIMARY }}
              >
                {saving ? (
                  <>
                    <span style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      border: `2px solid rgba(255,255,255,0.3)`,
                      borderTopColor: '#FFFFFF',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    {t.saving}
                  </>
                ) : (
                  t.save
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/appointments')}
                style={{
                  padding: '12px 32px',
                  background: 'transparent',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 500,
                  color: TEXT_MUTED,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = PRIMARY_SOFT }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}