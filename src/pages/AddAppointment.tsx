import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import type { Patient, Doctor } from '../types'
import { ECGAnimation } from '../components/ECGAnimation'
import AppointmentCalendar from '../components/AppointmentCalendar'

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
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes pulse-soft {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

.add-appointment-shell { animation: fade-up 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) both; }
.add-appointment-shell * { box-sizing:border-box; }

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #5B8C8F !important;
  box-shadow: 0 0 0 3px rgba(91, 140, 143, 0.1) !important;
}

/* Disabled field style */
.disabled-field {
  opacity: 0.6;
  pointer-events: none;
  filter: grayscale(0.1);
}

.disabled-message {
  background: #F8FAFA;
  border: 1px dashed #DCE5E5;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: #6B8A8C;
}

@media(max-width: 768px) {
  .add-appointment-title { font-size: 24px !important; }
  .form-container { padding: 20px !important; }
}
`

// Comfortable color palette
const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const ERROR_BG = '#FDF5F5'
const ERROR_TEXT = '#C4A77D'

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  ar: {
    title: 'حجز موعد جديد',
    back: 'رجوع',
    patient: 'المريض *',
    patientPlaceholder: 'اختر مريضاً...',
    doctor: 'الطبيب',
    doctorPlaceholder: 'بدون طبيب',
    date: 'تاريخ ووقت الموعد *',
    selectDoctorFirst: 'الرجاء اختيار الطبيب أولاً لعرض الأوقات المتاحة',
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
    submit: 'حجز الموعد',
    cancel: 'إلغاء',
    saving: 'جارٍ الحفظ...',
    error: 'حدث خطأ غير متوقع',
    required: 'هذا الحقل مطلوب',
    loadingMessage: 'جاري تحميل البيانات',
    loadingSub: 'يرجى الانتظار أثناء تجهيز النموذج',
    invalidDate: 'يرجى اختيار تاريخ ووقت صحيح',
  },
  en: {
    title: 'Book New Appointment',
    back: 'Back',
    patient: 'Patient *',
    patientPlaceholder: 'Select a patient...',
    doctor: 'Doctor',
    doctorPlaceholder: 'No doctor',
    date: 'Appointment Date & Time *',
    selectDoctorFirst: 'Please select a doctor first to see available slots',
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
    submit: 'Book Appointment',
    cancel: 'Cancel',
    saving: 'Saving...',
    error: 'An unexpected error occurred',
    required: 'This field is required',
    loadingMessage: 'Loading Data',
    loadingSub: 'Please wait while we prepare the booking form',
    invalidDate: 'Please select a valid date and time',
  },
}

// ─── Loading Screen ──────────────────────────────────────────────────────────
const FormLoadingScreen = ({ msg, subMsg }: { msg: string; subMsg: string }) => (
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
          <span>📋 LOADING FORM</span>
          <span>⚡ PREPARING</span>
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
      <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 24 }}>{subMsg}</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: PRIMARY,
            animation: `pulse-soft 1.5s ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  </div>
)

// ─── Form Field Component ────────────────────────────────────────────────────
const FormField = ({ label, required, children, error }: { 
  label: string; required?: boolean; children: React.ReactNode; error?: string;
}) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{
      display: 'block', fontSize: 12, fontWeight: 600, color: TEXT_MUTED,
      marginBottom: 8, letterSpacing: '0.5px',
    }}>
      {label} {required && <span style={{ color: ERROR_TEXT }}>*</span>}
    </label>
    {children}
    {error && <p style={{ fontSize: 11, color: ERROR_TEXT, marginTop: 5 }}>{error}</p>}
  </div>
)

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AddAppointment() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())

  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    type: '',
    price: '',
    notes: '',
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // دالة لاختيار الموعد من التقويم
  const handleSlotSelect = (dateTime: string) => {
    setForm(prev => ({
      ...prev,
      appointmentDate: dateTime
    }))
    if (validationErrors.appointmentDate) {
      setValidationErrors(prev => ({ ...prev, appointmentDate: '' }))
    }
  }

  // Inject global styles
  useEffect(() => {
    const styleId = 'cura-add-appointment-css'
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

    const fetchData = async () => {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          api.get('/patients'),
          api.get('/doctors')
        ])
        setPatients(patientsRes.data)
        setDoctors(doctorsRes.data.filter((d: Doctor) => d.isActive))
      } catch (err) {
        console.error('Error fetching data:', err)
        navigate('/login')
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()

    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    const t = T[lang]

    if (!form.patientId) {
      errors.patientId = t.required
    }
    if (!form.appointmentDate) {
      errors.appointmentDate = t.required
    } else {
      const selectedDate = new Date(form.appointmentDate)
      if (isNaN(selectedDate.getTime())) {
        errors.appointmentDate = t.invalidDate
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setError('')
    setLoading(true)

    try {
      const payload: Record<string, any> = {
        patientId: form.patientId,
        appointmentDate: new Date(form.appointmentDate).toISOString(),
      }

      if (form.doctorId) payload.doctorId = form.doctorId
      if (form.type) payload.type = form.type
      if (form.price) payload.price = parseFloat(form.price)
      if (form.notes?.trim()) payload.notes = form.notes.trim()

      await api.post('/appointments', payload)
      navigate('/appointments')

    } catch (err: any) {
      const errData = err.response?.data
      if (typeof errData === 'string') {
        setError(errData)
      } else if (errData?.errors) {
        setError(Object.values(errData.errors).flat().join('، ') as string)
      } else {
        setError(T[lang].error)
      }
    } finally {
      setLoading(false)
    }
  }

  const t = T[lang]
  const isAr = lang === 'ar'

  if (loadingData) {
    return <FormLoadingScreen msg={t.loadingMessage} subMsg={t.loadingSub} />
  }

  // ✅ متغير للتحقق من اختيار الطبيب
  const isDoctorSelected = !!form.doctorId

  return (
    <div className="add-appointment-shell" style={{
      direction: isAr ? 'rtl' : 'ltr',
      background: '#F8FAFA',
      minHeight: '100vh',
      padding: '24px',
    }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate('/appointments')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', color: TEXT_MUTED,
              fontSize: 13, cursor: 'pointer', marginBottom: 16,
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = PRIMARY }}
            onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_MUTED }}
          >
            <span>←</span> {t.back}
          </button>

          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: PRIMARY_SOFT, border: `1px solid ${BORDER}`,
              borderRadius: 100, padding: '4px 16px', fontSize: 11,
              fontWeight: 600, color: PRIMARY, letterSpacing: '0.3px',
              marginBottom: 12,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: PRIMARY, animation: 'soft-pulse 2s infinite',
              }} />
              {isAr ? 'موعد جديد' : 'New Appointment'}
            </div>
            <h2 className="add-appointment-title" style={{
              fontFamily: "'DM Serif Display', 'Georgia', serif",
              fontSize: 28,
              fontWeight: 500,
              color: TEXT_DARK,
              margin: 0,
              letterSpacing: '-0.3px',
            }}>
              {t.title}
            </h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-container" style={{
            background: CARD_BG, border: `1px solid ${BORDER}`,
            borderRadius: 24, padding: '28px',
          }}>
            {/* Patient Field */}
            <FormField label={t.patient} required error={validationErrors.patientId}>
              <select
                name="patientId"
                value={form.patientId}
                onChange={handleChange}
                className="form-select"
                style={{
                  width: '100%', background: CARD_BG, border: `1px solid ${BORDER}`,
                  borderRadius: 12, padding: '10px 14px', fontSize: 14,
                  fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
                  color: TEXT_DARK, outline: 'none', transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <option value="">{t.patientPlaceholder}</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    #{p.patientNumber} — {p.fullName}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 4 }}>
                {isAr ? 'عدد المرضى المسجلين:' : 'Registered patients:'} {patients.length}
              </p>
            </FormField>

            {/* Doctor Field */}
            <FormField label={t.doctor}>
              <select
                name="doctorId"
                value={form.doctorId}
                onChange={handleChange}
                className="form-select"
                style={{
                  width: '100%', background: CARD_BG, border: `1px solid ${BORDER}`,
                  borderRadius: 12, padding: '10px 14px', fontSize: 14,
                  fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
                  color: TEXT_DARK, outline: 'none', transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <option value="">{t.doctorPlaceholder}</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} {d.specialty ? `— ${d.specialty}` : ''}
                  </option>
                ))}
              </select>
            </FormField>

            {/* ✅ Date Field — معطل حتى يتم اختيار الطبيب */}
            <FormField label={t.date} required error={validationErrors.appointmentDate}>
              {isDoctorSelected ? (
                <AppointmentCalendar
                  doctorId={form.doctorId}
                  onSelectSlot={handleSlotSelect}
                />
              ) : (
                <div className="disabled-message">
                  <span style={{ fontSize: 32, opacity: 0.5 }}>📅</span>
                  <p style={{ fontSize: 13, marginTop: 8, marginBottom: 0 }}>
                    {t.selectDoctorFirst}
                  </p>
                </div>
              )}
              {form.appointmentDate && isDoctorSelected && (
                <p style={{ fontSize: 12, color: '#4A7679', marginTop: 8, fontWeight: 600 }}>
                  ✅ {isAr ? 'تم اختيار:' : 'Selected:'} {new Date(form.appointmentDate).toLocaleString(isAr ? 'ar' : 'en')}
                </p>
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
                  width: '100%', background: CARD_BG, border: `1px solid ${BORDER}`,
                  borderRadius: 12, padding: '10px 14px', fontSize: 14,
                  fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
                  color: TEXT_DARK, outline: 'none', transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <option value="">{t.typePlaceholder}</option>
                <option value="كشف">{t.typeCheckup}</option>
                <option value="متابعة">{t.typeFollowup}</option>
                <option value="استشارة">{t.typeConsultation}</option>
                <option value="طوارئ">{t.typeEmergency}</option>
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
                  width: '100%', background: CARD_BG, border: `1px solid ${BORDER}`,
                  borderRadius: 12, padding: '10px 14px', fontSize: 14,
                  fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
                  color: TEXT_DARK, outline: 'none', transition: 'all 0.2s ease',
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
                  width: '100%', background: CARD_BG, border: `1px solid ${BORDER}`,
                  borderRadius: 12, padding: '10px 14px', fontSize: 14,
                  fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
                  color: TEXT_DARK, outline: 'none', transition: 'all 0.2s ease',
                  resize: 'vertical',
                }}
              />
            </FormField>

            {/* Error Message */}
            {error && (
              <div style={{
                background: ERROR_BG, border: `1px solid ${ERROR_TEXT}40`,
                borderRadius: 12, padding: '12px 16px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span style={{ fontSize: 13, color: ERROR_TEXT }}>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1, background: PRIMARY, color: '#FFFFFF', border: 'none',
                  borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600,
                  fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
                  cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
                  opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#4A7679' }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = PRIMARY }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 14, height: 14, borderRadius: '50%',
                      border: `2px solid rgba(255,255,255,0.3)`,
                      borderTopColor: '#FFFFFF', animation: 'spin 0.8s linear infinite',
                    }} />
                    {t.saving}
                  </>
                ) : t.submit}
              </button>

              <button
                type="button"
                onClick={() => navigate('/appointments')}
                style={{
                  padding: '12px 24px', background: 'transparent',
                  border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 14,
                  fontWeight: 500, color: TEXT_MUTED, cursor: 'pointer',
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