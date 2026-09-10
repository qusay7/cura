import { useState, useEffect, useRef, useId, isValidElement, cloneElement } from 'react'
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api/axios'
import type { Patient, Doctor } from '../types'
import { ECGAnimation } from '../components/ECGAnimation'
import AppointmentCalendar from '../components/AppointmentCalendar'
import SearchableSelect from '../components/SearchableSelect'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'
import { isHour12 } from '../utils/i18n'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const globalCss = `

.add-appointment-shell { animation: fade-up 0.4s cubic-bezier(0.2,0.9,0.4,1.1) both; }
.add-appointment-shell * { box-sizing:border-box; }

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #5B8C8F !important;
  box-shadow: 0 0 0 3px rgba(91,140,143,0.1) !important;
  outline: none;
}

.disabled-message {
  background: linear-gradient(135deg,#F8FAFA 0%,#FFFFFF 100%);
  border: 2px dashed #DCE5E5;
  border-radius:20px;
  padding:40px 24px;
  text-align:center;
  transition:all 0.3s ease;
}
.disabled-message:hover { border-color:#5B8C8F; background:#F8FAFA; }

.calendar-container {
  background:white;
  border-radius:16px;
  border:1px solid #DCE5E5;
  overflow:hidden;
  transition:all 0.3s ease;
}
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

.reminders-badge { animation:slide-in 0.3s ease-out; }
.reminder-preset-btn { transition:all 0.2s ease; }
.reminder-preset-btn:hover { transform:translateY(-2px); }
.reminder-preset-btn.active { box-shadow:0 4px 12px rgba(91,140,143,0.3); }

@media(max-width:768px) {
  .add-appointment-title { font-size:24px !important; }
  .form-container { padding:20px !important; }
  .calendar-container .rbc-toolbar { flex-direction:column; align-items:stretch; }
}
`

const PRIMARY_DARK = '#4A7679'
const ERROR_BG = '#FDF5F5'
const ERROR_TEXT = '#79674D'
const SUCCESS = '#16A34A'
const SUCCESS_BG = '#F0FDF4'

const T = {
  ar: {
    title: 'حجز موعد جديد', back: 'رجوع',
    patient: 'المريض', doctor: 'الطبيب', date: 'تاريخ ووقت الموعد',
    selectDoctorFirst: 'اختر الطبيب أولاً',
    selectDoctorHint: 'يرجى اختيار الطبيب من القائمة أعلاه لعرض المواعيد المتاحة',
    queueBooking: 'حجز دور', queueBookingHint: 'سيتم تسجيل الموعد بوقت الحجز تلقائياً',
    queueUnavailable: 'الطبيب غير متاح', checkingAvailability: 'جارٍ التحقق من التوفر...',
    type: 'نوع الزيارة', typePlaceholder: 'اختر نوع الزيارة...',
    suggestedFromTemplate: 'السعر المقترح من القالب:',
    price: 'السعر', pricePlaceholder: '0.00',
    notes: 'ملاحظات', notesPlaceholder: 'أضف ملاحظات إضافية...',
    customReminders: '🔔 التذكيرات المخصصة',
    reminderHint: 'اختر الأوقات التي يريدها المريض للتذكير قبل الموعد',
    remindersPresets: 'خيارات سريعة:',
    reminderFewHours: '🔔 تذكيرات قليلة',
    reminderBalanced: '📱 تذكيرات متوازنة',
    reminderMany: '⏰ تذكيرات كثيرة',
    reminderNone: '❌ بدون تذكيرات',
    reminderCustom: 'أو أدخل مخصص:',
    reminderHelper: 'أمثلة: 1,2,4,24 (بالساعات)',
    reminderPreview: '📊 المريض سيستقبل تذكيرات في:',
    submit: 'حجز الموعد', submitQueue: 'حجز الدور',
    cancel: 'إلغاء', saving: 'جارٍ الحفظ...',
    saved: 'تم حجز الموعد بنجاح',
    error: 'حدث خطأ غير متوقع', required: 'هذا الحقل مطلوب',
    loadingMessage: 'جاري تحميل البيانات',
    loadingSub: 'يرجى الانتظار أثناء تجهيز النموذج',
    loadFailed: 'تعذّر تحميل بيانات الحجز', retry: 'إعادة المحاولة',
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
    queueUnavailable: 'Doctor Unavailable', checkingAvailability: 'Checking availability...',
    type: 'Visit Type', typePlaceholder: 'Select visit type...',
    suggestedFromTemplate: 'Suggested price from template:',
    price: 'Price', pricePlaceholder: '0.00',
    notes: 'Notes', notesPlaceholder: 'Add additional notes...',
    customReminders: '🔔 Custom Reminders',
    reminderHint: 'Choose when the patient should receive reminder notifications',
    remindersPresets: 'Quick options:',
    reminderFewHours: '🔔 Few reminders',
    reminderBalanced: '📱 Balanced reminders',
    reminderMany: '⏰ Many reminders',
    reminderNone: '❌ No reminders',
    reminderCustom: 'Or enter custom:',
    reminderHelper: 'Examples: 1,2,4,24 (hours)',
    reminderPreview: '📊 Patient will receive reminders at:',
    submit: 'Book Appointment', submitQueue: 'Book Queue',
    cancel: 'Cancel', saving: 'Saving...',
    saved: 'Appointment booked successfully',
    error: 'An unexpected error occurred', required: 'This field is required',
    loadingMessage: 'Loading Data',
    loadingSub: 'Please wait while we prepare the booking form',
    loadFailed: 'Failed to load booking data', retry: 'Retry',
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

// ─── Loading Screen ────────────────────────────────────────────────────────
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

// ─── Form Field ─────────────────────────────────────────────────────────────
const FormField = ({ label, required, children, error }: {
  label: string; required?: boolean; children: React.ReactNode; error?: string }) => {
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
    <div style={{ marginBottom:20 }}>
      <label htmlFor={fieldId} style={{ display:'block', fontSize:12, fontWeight:600, color:TEXT_MUTED, marginBottom:8, letterSpacing:'0.5px' }}>
        {label} {required && <span style={{ color:'#EF4444' }}>*</span>}
      </label>
      {child}
      {error && <p id={errorId} role="alert" style={{ fontSize:11, color:'#EF4444', marginTop:5 }}>{error}</p>}
    </div>
  )
}

// ─── Format Date for display ────────────────────────────────────────────────
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
  const minuteStr = minutes.toString().padStart(2,'0')
  const timeStr = isHour12()
    ? `${(hours % 12 || 12).toString().padStart(2,'0')}:${minuteStr} ${hours >= 12 ? (isArabic ? 'م' : 'PM') : (isArabic ? 'ص' : 'AM')}`
    : `${hours.toString().padStart(2,'0')}:${minuteStr}`
  return isArabic
    ? `${weekday}، ${day} ${monthName}، ${timeStr}`
    : `${weekday}, ${monthName} ${day}, ${timeStr}`
}

// ─── Get local now as string ────────────────────────────────────────────────
// ✅ يهيّئ سلسلة التاريخ من التوقيت المحلي (لا UTC) — الباك اند يخزّن الموعد
// كوقت حائط بدون منطقة زمنية، فـ toISOString() هنا يزيح الوقت بمقدار فرق
// التوقيت المحلي بدون أي تحويل عكسي عند القراءة
const toLocalDateTimeString = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:00`

const getLocalNowString = (): string => toLocalDateTimeString(new Date())

// ✅ معاينة التذكيرات
const getReminderPreview = (customReminders: string, isAr: boolean): string => {
  const reminders = customReminders
    .split(',')
    .filter((r) => r.trim())
    .map((r) => parseInt(r.trim()))
    .filter(h => !isNaN(h))
    .sort((a, b) => b - a)

  if (reminders.length === 0) {
    return isAr ? '❌ بدون تذكيرات' : '❌ No reminders'
  }

  return (
    reminders
      .map((hours) => {
        if (hours === 1) return isAr ? 'قبل ساعة' : '1 hour before'
        if (hours === 24) return isAr ? 'قبل يوم' : '1 day before'
        return isAr ? `قبل ${hours} ساعات` : `${hours} hours before`
      })
      .join(' • ') + ' ✅'
  )
}

interface VisitTemplate {
  id: string
  name: string
  nameEn: string | null
  firstVisitPrice: number | null
  followUpPrice: number | null
  defaultSessionsCount: number
  departmentId: string | null
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AddAppointment() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state as { prefillPatientId?: string; prefillDoctorId?: string; prefillDate?: string; prefillDateTime?: string } | null) || {}
   const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [loadDataFailed, setLoadDataFailed] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [templates, setTemplates] = useState<VisitTemplate[]>([])
  const [doctorFinancialSettings, setDoctorFinancialSettings] = useState<any[]>([])
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [doctorStatus, setDoctorStatus] = useState<{
    isBusy: boolean; queueCount: number; currentPatient?: string; nextAppointmentTime?: string
  } | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [queueAbsence, setQueueAbsence] = useState<{ available: boolean; message?: string } | null>(null)
  const [checkingAbsence, setCheckingAbsence] = useState(false)
  const [insurance, setInsurance] = useState<any>(null)
  const [insuranceApplies, setInsuranceApplies] = useState(true)
  const [overrideRate, setOverrideRate] = useState('')

  // ✅ التذكيرات المخصصة
  const [customReminders, setCustomReminders] = useState('1,2,4,24')

  const [form, setForm] = useState({
    patientId: prefill.prefillPatientId || '', doctorId: prefill.prefillDoctorId || '',
    appointmentDate: prefill.prefillDateTime || '',
        appointmentPrice: undefined as number | undefined,
    type: '', templateId: '', price: '', notes: '',
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  useUnsavedChangesWarning(form)

  const fetchData = async () => {
    setLoadingData(true)
    setLoadDataFailed(false)
    try {
      const [patientsRes, doctorsRes, templatesRes] = await Promise.all([
        api.get('/patients'), api.get('/doctors'), api.get('/treatmentplans/templates'),
      ])
      setPatients(patientsRes.data)
      setDoctors(doctorsRes.data.filter((d: Doctor) => d.isActive))
      setTemplates(templatesRes.data)
    } catch (err: any) {
      if (err?.response?.status === 401) navigate('/login')
      else setLoadDataFailed(true)
    }
    finally { setLoadingData(false) }
  }

  useEffect(() => {
    const styleId = 'cura-add-appointment-css'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style'); style.id = styleId; style.textContent = globalCss; document.head.appendChild(style)
    }
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    fetchData()
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [navigate])

  useEffect(() => {
    if (!form.doctorId) { setDoctorStatus(null); return }
    setLoadingStatus(true)
    api.get(`/appointments/doctor-status/${form.doctorId}`)
      .then(res => setDoctorStatus(res.data))
      .catch(() => setDoctorStatus(null))
      .finally(() => setLoadingStatus(false))
  }, [form.doctorId])

    const firstDoctorRun = useRef(true)
  useEffect(() => {
    if (firstDoctorRun.current) { firstDoctorRun.current = false; return }
    if (form.doctorId) setForm(prev => ({ ...prev, appointmentDate: '', appointmentPrice: undefined }))
  }, [form.doctorId])

  useEffect(() => {
    if (!form.doctorId) { setDoctorFinancialSettings([]); return }
    api.get(`/doctors/${form.doctorId}/financial-settings`)
      .then(res => setDoctorFinancialSettings(res.data))
      .catch(() => setDoctorFinancialSettings([]))
  }, [form.doctorId])

  useEffect(() => {
    if (!form.templateId) return
    const template = templates.find(tpl => tpl.id === form.templateId)
    if (!template) return

    const exception = doctorFinancialSettings.find((s: any) => s.templateId === form.templateId)
    const doctorGeneral = doctorFinancialSettings.find((s: any) => s.isGeneral)
    const suggested = exception?.firstVisitPrice ?? doctorGeneral?.firstVisitPrice ?? template.firstVisitPrice

    if (suggested != null) {
      setForm(prev => ({
        ...prev,
        appointmentPrice: suggested,
        price: String(suggested),
      }))
    }
  }, [form.doctorId, form.templateId, templates, doctorFinancialSettings])

  useEffect(() => {
    if (!form.patientId) { setInsurance(null); return }
    api.get(`/insurance/calculate?patientId=${form.patientId}&amount=${form.appointmentPrice || 0}`)
      .then(r => {
        setInsurance(r.data)
        setInsuranceApplies(true)
        if (r.data?.hasInsurance) setOverrideRate(String(r.data.coverageRate))
      })
      .catch(() => setInsurance(null))
  }, [form.patientId])

  useEffect(() => {
    if (!form.patientId || !form.appointmentPrice) { return }
    api.get(`/insurance/calculate?patientId=${form.patientId}&amount=${form.appointmentPrice}`)
      .then(r => {
        setInsurance(r.data)
        if (r.data?.hasInsurance) setOverrideRate(prev => prev || String(r.data.coverageRate))
      })
      .catch(() => {})
  }, [form.appointmentPrice])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSlotSelect = (dateTime: string, price?: number) => {
    setForm(prev => ({
      ...prev,
      appointmentDate: dateTime,
      appointmentPrice: price,
      price: price ? String(price) : prev.price
    }))
  }

  const handlePatientSelect = (patientId: string) => {
    setForm(prev => ({ ...prev, patientId }))
    if (validationErrors.patientId) setValidationErrors(prev => ({ ...prev, patientId: '' }))
  }

  const handleDoctorSelect = (doctorId: string) => {
    setForm(prev => ({ ...prev, doctorId }))
    if (validationErrors.doctorId) setValidationErrors(prev => ({ ...prev, doctorId: '' }))
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(tpl => tpl.id === templateId)
    setForm(prev => ({
      ...prev,
      templateId,
      type: template ? (isAr ? template.name : (template.nameEn || template.name)) : prev.type,
    }))
  }

  const selectedDoctor = doctors.find(d => d.id === form.doctorId)
  const isQueueOnly = selectedDoctor?.workType === 'queue'
  const isAppointmentsOnly = selectedDoctor?.workType === 'appointments'

  useEffect(() => {
    if (!isQueueOnly || !form.doctorId) { setQueueAbsence(null); return }
    setCheckingAbsence(true)
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    api.get(`/absences/check?doctorId=${form.doctorId}&date=${dateStr}&time=${timeStr}`)
      .then(res => setQueueAbsence(res.data))
      .catch(() => setQueueAbsence(null))
      .finally(() => setCheckingAbsence(false))
  }, [isQueueOnly, form.doctorId])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    const t = T[lang]
    if (!form.patientId) errors.patientId = t.required

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

  const selectedTemplate = templates.find(tpl => tpl.id === form.templateId)
  const isMultiSession = (selectedTemplate?.defaultSessionsCount ?? 1) > 1
  const selectedDoctorDeptId = (selectedDoctor as any)?.departmentId ?? null
  const availableTemplates = selectedDoctorDeptId
    ? templates.filter(tpl => tpl.departmentId === null || tpl.departmentId === selectedDoctorDeptId)
    : templates

  useEffect(() => {
    if (form.templateId && !availableTemplates.some(tpl => tpl.id === form.templateId)) {
      setForm(prev => ({ ...prev, templateId: '' }))
    }
  }, [form.doctorId])

  const [sessionIntervalValue, setSessionIntervalValue] = useState(1)
  const [sessionIntervalUnit, setSessionIntervalUnit] = useState<'day' | 'week' | 'month'>('week')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setError(''); setLoading(true)

    try {
      const appointmentDate = isQueueOnly ? getLocalNowString() : form.appointmentDate

      const payload: Record<string, any> = {
        patientId: form.patientId,
        appointmentDate,
        status: 'scheduled',
        lang: lang,
        customReminders: customReminders,  // ✅ إضافة التذكيرات
      }

      if (form.doctorId) payload.doctorId = form.doctorId
      if (form.type) payload.type = form.type
      if (form.templateId) payload.templateId = form.templateId

      const finalPrice = form.price !== '' ? parseFloat(form.price) : form.appointmentPrice
      if (finalPrice !== undefined && finalPrice !== null && !Number.isNaN(finalPrice)) {
        payload.price = finalPrice
      }

      if (form.notes?.trim()) payload.notes = form.notes.trim()

      if (isMultiSession) {
        let plan: any = null
        try {
          const plansRes = await api.get(`/treatmentplans/patient/${form.patientId}`)
          plan = (plansRes.data as any[]).find(p => p.templateId === form.templateId && p.status === 'active')
        } catch { }

        if (!plan) {
          const createRes = await api.post('/treatmentplans', {
            patientId: form.patientId,
            doctorId: form.doctorId || null,
            templateId: form.templateId,
          })
          plan = createRes.data
        }

        const unlinkedSessions = (plan.sessions ?? [])
          .filter((s: any) => s.status === 'scheduled' && !s.appointmentId)
          .sort((a: any, b: any) => a.sessionNumber - b.sessionNumber)

        if (unlinkedSessions.length === 0) {
          setError(isAr ? 'كل جلسات هذي الخطة محجوزة أو مكتملة أصلاً — راجع خطة العلاج بملف المريض' : 'All sessions in this plan are already booked or completed — check the treatment plan in the patient file')
          setLoading(false)
          return
        }

        const intervalDays = sessionIntervalUnit === 'day' ? sessionIntervalValue
          : sessionIntervalUnit === 'week' ? sessionIntervalValue * 7
          : sessionIntervalValue * 30

        const baseDate = new Date(appointmentDate.replace(' ', 'T'))
        let bookedCount = 0
        let failedCount = 0

        for (let i = 0; i < unlinkedSessions.length; i++) {
          const session = unlinkedSessions[i]
          const sessionDate = new Date(baseDate)
          sessionDate.setDate(sessionDate.getDate() + i * intervalDays)
          const isoScheduledDate = toLocalDateTimeString(sessionDate)

          try {
            const apptRes = await api.post('/appointments', { ...payload, appointmentDate: isoScheduledDate })
            const newAppointmentId = apptRes.data.id

            await api.put(`/treatmentplans/${plan.id}/sessions/${session.id}`, {
              status: 'scheduled',
              appointmentId: newAppointmentId,
              scheduledDate: isoScheduledDate,
            })
            bookedCount++
          } catch {
            failedCount++
          }
        }

        if (bookedCount === 0) {
          setError(isAr ? 'تعذّر حجز أي جلسة — تحقق من دوام الطبيب بالتواريخ المحسوبة' : 'Could not book any session — check the doctor\'s availability on the calculated dates')
          setLoading(false)
          return
        }

        if (failedCount > 0) {
          setSuccess(isAr
            ? `تم حجز ${bookedCount} من ${unlinkedSessions.length} جلسة تلقائياً. ${failedCount} جلسة تحتاج حجز يدوي (تعارض بالموعد المحسوب) — راجع خطة العلاج بملف المريض.`
            : `${bookedCount} of ${unlinkedSessions.length} sessions booked automatically. ${failedCount} session(s) need manual booking (schedule conflict) — check the treatment plan in the patient file.`)
          setLoading(false)
          setTimeout(() => navigate('/appointments'), 3500)
          return
        }

        setSuccess(t.saved)
        setTimeout(() => navigate('/appointments'), 1200)
        return
      }

      await api.post('/appointments', payload)
      setSuccess(t.saved)
      setTimeout(() => navigate('/appointments'), 1200)
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
  const isQueueBlocked = isQueueOnly && queueAbsence?.available === false
  const canSubmit = isPatientSelected
    && (isQueueOnly ? !isQueueBlocked : !!form.appointmentDate)

  const selectStyle = {
    width:'100%', background:CARD_BG, border:`1px solid ${BORDER}`,
    borderRadius:12, padding:'10px 14px', fontSize:14,
    fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif",
    color:TEXT_DARK, outline:'none', transition:'all 0.2s ease', cursor:'pointer',
  }

  if (loadingData) return <FormLoadingScreen msg={t.loadingMessage} subMsg={t.loadingSub} />

  if (loadDataFailed) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 40 }}>
        <span style={{ fontSize: 40, opacity: 0.5 }}>⚠️</span>
        <p style={{ fontSize: 14, color: TEXT_MUTED, margin: '16px 0 20px' }}>{t.loadFailed}</p>
        <button onClick={fetchData}
          style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {t.retry}
        </button>
      </div>
    </div>
  )

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

        {prefill.prefillDate && (
          <div style={{ background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📅</span>
            <p style={{ fontSize: 12.5, color: TEXT_DARK, margin: 0 }}>
              {isAr
                ? <>الطبيب حدّد موعد مراجعة بتاريخ <strong>{new Date(prefill.prefillDate).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> — اختر الوقت المناسب من التقويم بالأسفل</>
                : <>Doctor set a follow-up for <strong>{new Date(prefill.prefillDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> — pick the time slot below</>}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-container" style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:24, padding:'28px' }}>

            {/* المريض */}
            <FormField label={t.patient} required error={validationErrors.patientId}>
              <SearchableSelect
                isRtl={isAr}
                value={form.patientId}
                onChange={handlePatientSelect}
                placeholder={isAr ? 'اختر مريضاً...' : 'Select a patient...'}
                options={patients.map(p => ({ value: p.id, label: `#${p.patientNumber} — ${p.fullName}` }))}
              />
              <p style={{ fontSize:10, color:TEXT_MUTED, marginTop:4 }}>
                {t.registeredPatients} {patients.length}
              </p>
            </FormField>

            {/* الطبيب */}
            <FormField label={t.doctor}>
              <SearchableSelect
                isRtl={isAr}
                value={form.doctorId}
                onChange={handleDoctorSelect}
                placeholder={t.noDoctor}
                options={doctors.map(d => ({
                  value: d.id,
                  label: `${d.workType === 'queue' ? '🔢' : d.workType === 'appointments' ? '📅' : '✅'} ${d.fullName}${d.specialty ? ` — ${d.specialty}` : ''}`,
                }))}
              />
              {doctors.length === 0 && (
                <p style={{ fontSize:11, color:'#F59E0B', marginTop:4 }}>⚠️ {t.noActiveDoctors}</p>
              )}
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
                      🕐 {new Date().toLocaleTimeString(isAr ? 'ar-SA' : undefined, { hour:'2-digit', minute:'2-digit', hour12: isHour12() })}
                    </div>
                  </div>
                )
              ) : (
                <div className="calendar-container">
                  <AppointmentCalendar doctorId={form.doctorId} onSelectSlot={handleSlotSelect} initialDateTime={form.appointmentDate || undefined} lang={lang} />
                </div>
              )}

            </FormField>

            {/* نوع الزيارة */}
            <FormField label={t.type}>
              <SearchableSelect
                isRtl={isAr}
                value={form.templateId}
                onChange={handleTemplateSelect}
                placeholder={t.typePlaceholder}
                options={availableTemplates.map(tpl => ({
                  value: tpl.id,
                  label: isAr ? tpl.name : (tpl.nameEn || tpl.name),
                }))}
              />
              {selectedDoctorDeptId && availableTemplates.length < templates.length && (
                <p style={{ fontSize: 11, color: TEXT_MUTED, margin: '6px 0 0' }}>
                  ℹ️ {isAr
                    ? 'القوالب معروضة حسب قسم الطبيب المختار — قوالب أقسام ثانية مخفية'
                    : "Templates are filtered by the selected doctor's department"}
                </p>
              )}
            </FormField>

            {/* ✅ التباعد الزمني بين الجلسات */}
            {isMultiSession && (
              <FormField label={isAr ? `التباعد بين الجلسات (${selectedTemplate?.defaultSessionsCount} جلسات)` : `Interval Between Sessions (${selectedTemplate?.defaultSessionsCount} sessions)`}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" min={1} value={sessionIntervalValue}
                    onChange={e => setSessionIntervalValue(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: 70, padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "'Inter',sans-serif", color: TEXT_DARK }} />
                  <SearchableSelect
                    isRtl={isAr}
                    value={sessionIntervalUnit}
                    onChange={v => setSessionIntervalUnit(v as 'day' | 'week' | 'month')}
                    options={[
                      { value: 'day', label: isAr ? 'يوم' : 'Day(s)' },
                      { value: 'week', label: isAr ? 'أسبوع' : 'Week(s)' },
                      { value: 'month', label: isAr ? 'شهر' : 'Month(s)' },
                    ]}
                  />
                </div>
                <p style={{ fontSize: 11, color: TEXT_MUTED, margin: '6px 0 0' }}>
                  💡 {isAr
                    ? `هيتحجز ${selectedTemplate?.defaultSessionsCount} مواعيد تلقائياً، كل وحدة بعد اللي قبلها بـ${sessionIntervalValue} ${sessionIntervalUnit === 'day' ? 'يوم' : sessionIntervalUnit === 'week' ? 'أسبوع' : 'شهر'} — تقدر تعدّل أي موعد لحاله بعدين`
                    : `${selectedTemplate?.defaultSessionsCount} appointments will be booked automatically, each ${sessionIntervalValue} ${sessionIntervalUnit}(s) apart — you can edit any of them individually later`}
                </p>
              </FormField>
            )}

            {/* السعر */}
            <FormField label={t.price}>
              {form.appointmentPrice && (() => {
                const hasDoctorException = doctorFinancialSettings.some(
                  (s: any) => (s.templateId === form.templateId || s.isGeneral) && s.firstVisitPrice != null
                )
                return (
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'6px 12px', background:PRIMARY_SOFT, borderRadius:8, fontSize:12 }}>
                    <span>💰</span>
                    <span style={{ color:TEXT_MUTED }}>
                      {hasDoctorException
                        ? (isAr ? 'سعر خاص لهذا الطبيب:' : "Doctor's special price:")
                        : t.suggestedFromTemplate}
                    </span>
                    <span style={{ fontWeight:700, color:PRIMARY }}>{form.appointmentPrice} {isAr?'د.أ':'JD'}</span>
                  </div>
                )
              })()}
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0" step="0.01"
                placeholder={t.pricePlaceholder}
                className="form-input"
                style={{
                  width:'100%', background:CARD_BG, border:`1px solid ${BORDER}`,
                  borderRadius:12, padding:'10px 14px', fontSize:14,
                  fontFamily:isAr?"'Cairo',sans-serif":"'Inter',sans-serif",
                  color:TEXT_DARK, outline:'none'
                }}
              />
              <p style={{ fontSize:11, color:TEXT_MUTED, marginTop:5 }}>
                {isAr?'يمكنك تعديل السعر إذا لزم الأمر':'You can adjust the price if needed'}
              </p>
            </FormField>

            {/* ✅ التأمين — Interactive */}
            {insurance?.hasInsurance && (form.appointmentPrice || form.price) && (() => {
              const total = form.price !== '' ? parseFloat(form.price) : (form.appointmentPrice || 0)
              const rate = insuranceApplies ? (parseFloat(overrideRate) || 0) : 0
              const insAmount = Math.round(total * rate / 100 * 1000) / 1000
              const patAmount = Math.round((total - insAmount) * 1000) / 1000
              return (
                <div style={{ background: insuranceApplies ? '#F0FDF4' : '#F8FAFA', border: `1px solid ${insuranceApplies ? '#86EFAC' : '#DCE5E5'}`, borderRadius: 14, padding: '14px 16px', marginBottom: 16, transition: 'all 0.2s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: insuranceApplies ? 12 : 4, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>🏥</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: insuranceApplies ? '#16A34A' : '#6B8A8C' }}>
                        {isAr ? `تأمين نشط — ${insurance.companyName}` : `Active Insurance — ${insurance.companyName}`}
                      </span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <span style={{ fontSize: 11, color: '#6B8A8C', fontWeight: 600 }}>
                        {insuranceApplies ? (isAr ? 'يشمله التأمين' : 'Covered') : (isAr ? 'مستثنى' : 'Excluded')}
                      </span>
                      <input type="checkbox" checked={insuranceApplies} onChange={e => setInsuranceApplies(e.target.checked)}
                        style={{ width: 15, height: 15, accentColor: '#16A34A', cursor: 'pointer' }} />
                    </label>
                  </div>

                  {insuranceApplies ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 11.5, color: '#6B8A8C' }}>{isAr ? 'نسبة التغطية:' : 'Coverage rate:'}</span>
                        <input type="number" min={0} max={100} value={overrideRate} onChange={e => setOverrideRate(e.target.value)}
                          style={{ width: 60, padding: '3px 6px', border: '1px solid #86EFAC', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#16A34A', textAlign: 'center', fontFamily: "'Inter',sans-serif" }} />
                        <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 700 }}>%</span>
                        {overrideRate !== String(insurance.coverageRate) && (
                          <span style={{ fontSize: 10, color: '#B8892A', background: '#FBF4E4', padding: '2px 8px', borderRadius: 100 }}>
                            {isAr ? `مُعدَّلة يدوياً (الافتراضي ${insurance.coverageRate}%)` : `Manually adjusted (default ${insurance.coverageRate}%)`}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        <div style={{ textAlign: 'center', background: '#FFF', borderRadius: 10, padding: '10px 6px' }}>
                          <p style={{ fontSize: 11, color: '#6B8A8C', margin: '0 0 4px' }}>{isAr ? 'إجمالي الزيارة' : 'Total'}</p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: '#2C3E3F', margin: 0, fontFamily: "'Inter',monospace" }}>
                            {total} {isAr ? 'د.أ' : 'JD'}
                          </p>
                        </div>
                        <div style={{ textAlign: 'center', background: '#FFF', borderRadius: 10, padding: '10px 6px' }}>
                          <p style={{ fontSize: 11, color: '#6B8A8C', margin: '0 0 4px' }}>{isAr ? 'يدفع التأمين' : 'Insurance pays'}</p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: '#16A34A', margin: 0, fontFamily: "'Inter',monospace" }}>
                            {insAmount.toFixed(2)} {isAr ? 'د.أ' : 'JD'}
                          </p>
                        </div>
                        <div style={{ textAlign: 'center', background: '#FFFBEB', borderRadius: 10, padding: '10px 6px', border: '1px solid #FCD34D' }}>
                          <p style={{ fontSize: 11, color: '#6B8A8C', margin: '0 0 4px' }}>{isAr ? 'يدفع المريض' : 'Patient pays'}</p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: '#F59E0B', margin: 0, fontFamily: "'Inter',monospace" }}>
                            {patAmount.toFixed(2)} {isAr ? 'د.أ' : 'JD'}
                          </p>
                        </div>
                      </div>
                      <p style={{ fontSize: 11, color: '#6B8A8C', margin: '8px 0 0', textAlign: 'center' }}>
                        📋 {isAr ? 'رقم البوليصة' : 'Policy'}: {insurance.policyNumber}
                        {' · '}{isAr ? 'صالحة حتى' : 'Valid until'}: {insurance.expiryDate}
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: 12, color: '#6B8A8C', margin: 0 }}>
                      {isAr
                        ? `⚠️ هذا الموعد مستثنى من التأمين — يدفع المريض كامل المبلغ (${total} د.أ)`
                        : `⚠️ This visit is excluded from insurance — patient pays the full amount (${total} JD)`}
                    </p>
                  )}

                  <p style={{ fontSize: 10, color: '#8BAFB1', margin: '10px 0 0', textAlign: 'center', fontStyle: 'italic' }}>
                    {isAr
                      ? 'هذا تقدير مبدئي للاستئناس — التفصيل النهائي والفاتورة يُحسمان عند إنهاء الزيارة'
                      : 'This is a preliminary estimate — the final breakdown and invoice are settled when the visit is completed'}
                  </p>
                </div>
              )
            })()}

            {/* لا يوجد تأمين */}
            {insurance && !insurance.hasInsurance && form.patientId && (
              <div style={{ background:'#F8FAFA', border:'1px solid #DCE5E5', borderRadius:10, padding:'10px 14px', marginBottom:12, fontSize:12, color:'#6B8A8C', display:'flex', alignItems:'center', gap:8 }}>
                <span>ℹ️</span> {isAr?'المريض لا يملك تأميناً نشطاً':'Patient has no active insurance'}
              </div>
            )}

            

            {/* ملاحظات */}
            <FormField label={t.notes}>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder={t.notesPlaceholder} className="form-textarea"
                style={{ width:'100%', background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:12, padding:'10px 14px', fontSize:14, fontFamily:isAr?"'Cairo',sans-serif":"'Inter',sans-serif", color:TEXT_DARK, outline:'none', resize:'vertical' }} />
            </FormField>

            {/* نجاح */}
            {success && (
              <div style={{ background:SUCCESS_BG, border:`1px solid ${SUCCESS}40`, borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:16 }}>✅</span>
                <span style={{ fontSize:13, color:SUCCESS, fontWeight:600 }}>{success}</span>
              </div>
            )}

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