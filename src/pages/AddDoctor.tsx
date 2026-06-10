import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
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
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes pulse-soft {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

.add-doctor-shell { animation: fade-up 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) both; }

.add-doctor-shell * { box-sizing:border-box; }

/* Form focus styles */
.form-input:focus, .form-textarea:focus {
  border-color: #5B8C8F !important;
  box-shadow: 0 0 0 3px rgba(91, 140, 143, 0.1) !important;
}

/* Remove number input arrows */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}

@media(max-width: 768px) {
  .add-doctor-title { font-size: 24px !important; }
  .form-container { padding: 20px !important; }
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
const ERROR_BG = '#FDF5F5'
const ERROR_TEXT = '#C4A77D'
const SUCCESS = '#4A7679'

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  ar: {
    title: 'إضافة طبيب جديد',
    back: 'رجوع',
    fullName: 'الاسم الكامل',
    fullNamePlaceholder: 'أدخل الاسم الكامل للطبيب',
    specialty: 'التخصص',
    specialtyPlaceholder: 'طب عام، طب أسنان، قلبية، ...',
    phone: 'الهاتف',
    phonePlaceholder: '05xxxxxxxx',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'doctor@clinic.com',
    notes: 'ملاحظات',
    notesPlaceholder: 'أضف ملاحظات إضافية عن الطبيب...',
    submit: 'حفظ الطبيب',
    cancel: 'إلغاء',
    saving: 'جارٍ الحفظ...',
    error: 'حدث خطأ غير متوقع',
    required: 'هذا الحقل مطلوب',
    emailInvalid: 'البريد الإلكتروني غير صالح',
    phoneInvalid: 'رقم الهاتف غير صالح',
    loadingMessage: 'جاري تجهيز النموذج',
    loadingSub: 'يرجى الانتظار...',
    specializations: {
      general: 'طب عام',
      dentistry: 'طب أسنان',
      cardiology: 'قلبية',
      dermatology: 'جلدية',
      pediatrics: 'أطفال',
      neurology: 'أعصاب',
      orthopedics: 'عظام',
      ophthalmology: 'عيون',
    }
  },
  en: {
    title: 'Add New Doctor',
    back: 'Back',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter doctor\'s full name',
    specialty: 'Specialty',
    specialtyPlaceholder: 'General, Dentistry, Cardiology, ...',
    phone: 'Phone',
    phonePlaceholder: '05xxxxxxxx',
    email: 'Email',
    emailPlaceholder: 'doctor@clinic.com',
    notes: 'Notes',
    notesPlaceholder: 'Add additional notes about the doctor...',
    submit: 'Save Doctor',
    cancel: 'Cancel',
    saving: 'Saving...',
    error: 'An unexpected error occurred',
    required: 'This field is required',
    emailInvalid: 'Invalid email address',
    phoneInvalid: 'Invalid phone number',
    loadingMessage: 'Preparing Form',
    loadingSub: 'Please wait...',
    specializations: {
      general: 'General Practice',
      dentistry: 'Dentistry',
      cardiology: 'Cardiology',
      dermatology: 'Dermatology',
      pediatrics: 'Pediatrics',
      neurology: 'Neurology',
      orthopedics: 'Orthopedics',
      ophthalmology: 'Ophthalmology',
    }
  },
}

// ─── Form Field Component ────────────────────────────────────────────────────
const FormField = ({ label, required, children, error }: { 
  label: string; 
  required?: boolean; 
  children: React.ReactNode;
  error?: string;
}) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{
      display: 'block',
      fontSize: 12,
      fontWeight: 600,
      color: TEXT_MUTED,
      marginBottom: 8,
      letterSpacing: '0.5px',
    }}>
      {label} {required && <span style={{ color: ERROR_TEXT }}>*</span>}
    </label>
    {children}
    {error && (
      <p style={{ fontSize: 11, color: ERROR_TEXT, marginTop: 5, marginBottom: 0 }}>
        {error}
      </p>
    )}
  </div>
)

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AddDoctor() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())

  const [form, setForm] = useState({
    fullName: '',
    specialty: '',
    phone: '',
    email: '',
    notes: '',
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Inject global styles and handle language changes
  useEffect(() => {
    const styleId = 'cura-add-doctor-css'
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

    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    const t = T[lang]

    if (!form.fullName.trim()) {
      errors.fullName = t.required
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = t.emailInvalid
    }

    if (form.phone && !/^[\d\s\+-]{8,}$/.test(form.phone.replace(/\s/g, ''))) {
      errors.phone = t.phoneInvalid
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setError('')
    setLoading(true)

    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([_, v]) => v !== '')
      )
      await api.post('/doctors', payload)
      navigate('/doctors')
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
      setLoading(false)
    }
  }

  const t = T[lang]
  const isAr = lang === 'ar'

  // Get specialty options
  const getSpecialtyOptions = () => {
    const specializations = T[lang].specializations
    return Object.entries(specializations).map(([key, value]) => ({
      value: isAr ? value : key,
      label: value
    }))
  }

  return (
    <div 
      className="add-doctor-shell" 
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
            onClick={() => navigate('/doctors')}
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
            onMouseEnter={(e) => {
              e.currentTarget.style.color = PRIMARY
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = TEXT_MUTED
            }}
          >
            <span>←</span> {t.back}
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
              {isAr ? 'طبيب جديد' : 'New Doctor'}
            </div>

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

            {/* Full Name Field */}
            <FormField label={t.fullName} required error={validationErrors.fullName}>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder={t.fullNamePlaceholder}
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

            {/* Specialty Field */}
            <FormField label={t.specialty}>
              <input
                name="specialty"
                value={form.specialty}
                onChange={handleChange}
                placeholder={t.specialtyPlaceholder}
                list="specialties"
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
              <datalist id="specialties">
                {getSpecialtyOptions().map(opt => (
                  <option key={opt.value} value={opt.label} />
                ))}
              </datalist>
            </FormField>

            {/* Phone Field */}
            <FormField label={t.phone} error={validationErrors.phone}>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder={t.phonePlaceholder}
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

            {/* Email Field */}
            <FormField label={t.email} error={validationErrors.email}>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder={t.emailPlaceholder}
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

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: 12,
              marginTop: 8,
            }}>
              <button
                type="submit"
                disabled={loading}
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
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = '#4A7679'
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = PRIMARY
                }}
              >
                {loading ? (
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
                  t.submit
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/doctors')}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 500,
                  color: TEXT_MUTED,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = PRIMARY_SOFT
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
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