import { useEffect, useState, useId, isValidElement, cloneElement } from 'react'
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { ECGAnimation } from '../components/ECGAnimation'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

// ─── Global CSS with Comfortable Colors ──────────────────────────────────────
const globalCss = `

.edit-patient-shell { animation: fade-up 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) both; }

.form-section {
  animation: slide-in 0.3s ease both;
}
.form-section:nth-child(1) { animation-delay: 0.05s; }
.form-section:nth-child(2) { animation-delay: 0.1s; }
.form-section:nth-child(3) { animation-delay: 0.15s; }

.edit-patient-shell * { box-sizing:border-box; }

/* Form focus styles */
.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #5B8C8F !important;
  box-shadow: 0 0 0 3px rgba(91, 140, 143, 0.1) !important;
}

/* Custom scrollbar */
.edit-patient-shell ::-webkit-scrollbar {
  width: 5px;
}
.edit-patient-shell ::-webkit-scrollbar-track {
  background: #E8EDEE;
  border-radius: 4px;
}
.edit-patient-shell ::-webkit-scrollbar-thumb {
  background: #8BAFB1;
  border-radius: 4px;
}

@media(max-width: 768px) {
  .edit-patient-title { font-size: 24px !important; }
  .form-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
  .action-buttons { flex-direction: column !important; }
}
`

// Comfortable color palette
const ERROR_BG = '#FDF5F5'
const ERROR_TEXT = '#C4A77D'
 const WARNING = '#C4A77D'

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  ar: {
    title: 'تعديل بيانات المريض',
    back: 'رجوع',
    basicInfo: 'البيانات الأساسية',
    additionalInfo: 'معلومات إضافية',
    notes: 'ملاحظات',
    status: 'حالة المريض',
    stopped: 'موقوف',
    active: 'نشط',
    save: 'حفظ التعديلات',
    cancel: 'إلغاء',
    saving: 'جارٍ الحفظ...',
    loadingMessage: 'جاري تحميل بيانات المريض',
    loadingSub: 'يرجى الانتظار أثناء تحميل المعلومات',
    fullName: 'الاسم الكامل',
    fullNamePlaceholder: 'أدخل الاسم الكامل للمريض',
    phone: 'الهاتف',
    phonePlaceholder: '05xxxxxxxx',
    phone2: 'هاتف 2',
    phone2Placeholder: '05xxxxxxxx',
    gender: 'الجنس',
    genderPlaceholder: 'اختر...',
    male: 'ذكر',
    female: 'أنثى',
    dateOfBirth: 'تاريخ الميلاد',
    nationalId: 'الرقم الوطني',
    nationalIdPlaceholder: 'رقم الهوية أو الإقامة',
    bloodType: 'فصيلة الدم',
    bloodTypePlaceholder: 'اختر...',
    address: 'العنوان',
    addressPlaceholder: 'العنوان الكامل',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'patient@example.com',
    emergencyContact: 'شخص الطوارئ',
    emergencyContactPlaceholder: 'اسم الشخص',
    emergencyPhone: 'هاتف الطوارئ',
    emergencyPhonePlaceholder: '05xxxxxxxx',
    allergies: 'الحساسية',
    allergiesPlaceholder: 'أدوية، أطعمة، ...',
    chronicDiseases: 'أمراض مزمنة',
    chronicDiseasesPlaceholder: 'ضغط، سكري، ...',
    occupation: 'المهنة',
    occupationPlaceholder: 'المهنة',
    maritalStatus: 'الحالة الاجتماعية',
    maritalStatusPlaceholder: 'اختر...',
    single: 'أعزب',
    married: 'متزوج',
    divorced: 'مطلق',
    widowed: 'أرمل',
    notesPlaceholder: 'أي ملاحظات إضافية عن المريض...',
    error: 'حدث خطأ غير متوقع',
  },
  en: {
    title: 'Edit Patient',
    back: 'Back',
    basicInfo: 'Basic Information',
    additionalInfo: 'Additional Information',
    notes: 'Notes',
    status: 'Patient Status',
    stopped: 'Stopped',
    active: 'Active',
    save: 'Save Changes',
    cancel: 'Cancel',
    saving: 'Saving...',
    loadingMessage: 'Loading Patient Data',
    loadingSub: 'Please wait while we load patient information',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter patient\'s full name',
    phone: 'Phone',
    phonePlaceholder: '05xxxxxxxx',
    phone2: 'Phone 2',
    phone2Placeholder: '05xxxxxxxx',
    gender: 'Gender',
    genderPlaceholder: 'Select...',
    male: 'Male',
    female: 'Female',
    dateOfBirth: 'Date of Birth',
    nationalId: 'National ID',
    nationalIdPlaceholder: 'ID or Iqama number',
    bloodType: 'Blood Type',
    bloodTypePlaceholder: 'Select...',
    address: 'Address',
    addressPlaceholder: 'Full address',
    email: 'Email',
    emailPlaceholder: 'patient@example.com',
    emergencyContact: 'Emergency Contact',
    emergencyContactPlaceholder: 'Contact person name',
    emergencyPhone: 'Emergency Phone',
    emergencyPhonePlaceholder: '05xxxxxxxx',
    allergies: 'Allergies',
    allergiesPlaceholder: 'Medications, foods, ...',
    chronicDiseases: 'Chronic Diseases',
    chronicDiseasesPlaceholder: 'Hypertension, Diabetes, ...',
    occupation: 'Occupation',
    occupationPlaceholder: 'Occupation',
    maritalStatus: 'Marital Status',
    maritalStatusPlaceholder: 'Select...',
    single: 'Single',
    married: 'Married',
    divorced: 'Divorced',
    widowed: 'Widowed',
    notesPlaceholder: 'Any additional notes about the patient...',
    error: 'An unexpected error occurred',
  },
}

// ─── Loading Screen with ECG ─────────────────────────────────────────────────
const EditPatientLoadingScreen = ({ msg, subMsg }: { msg: string; subMsg: string }) => (
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
          <span>👤 FETCHING DATA</span>
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

// ─── Form Field Component ────────────────────────────────────────────────────
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
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={fieldId} style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: TEXT_MUTED,
        marginBottom: 6,
        letterSpacing: '0.5px',
      }}>
        {label} {required && <span style={{ color: ERROR_TEXT }}>*</span>}
      </label>
      {child}
      {error && <p id={errorId} role="alert" style={{ fontSize: 11, color: ERROR_TEXT, marginTop: 5 }}>{error}</p>}
    </div>
  )
}

// ─── Form Section Component ──────────────────────────────────────────────────
const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="form-section" style={{
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: 20,
    padding: '20px',
  }}>
    <h3 style={{
      fontSize: 16,
      fontWeight: 600,
      color: TEXT_DARK,
      margin: '0 0 16px 0',
      paddingBottom: 10,
      borderBottom: `2px solid ${PRIMARY_SOFT}`,
      display: 'inline-block',
    }}>
      {title}
    </h3>
    <div style={{ marginTop: 8 }}>
      {children}
    </div>
  </div>
)

// ─── Main Component ──────────────────────────────────────────────────────────
export default function EditPatient() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    phone2: '',
    gender: '',
    dateOfBirth: '',
    nationalId: '',
    bloodType: '',
    address: '',
    email: '',
    emergencyContact: '',
    emergencyPhone: '',
    allergies: '',
    chronicDiseases: '',
    occupation: '',
    maritalStatus: '',
    notes: '',
    stopped: false,
  })
  useUnsavedChangesWarning(form, !loading)

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Inject global styles
  useEffect(() => {
    const styleId = 'cura-edit-patient-css'
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

  // Fetch patient data
  useEffect(() => {
    const fetchPatient = async () => {
      const startTime = Date.now()
      const minLoadingTime = 800

      try {
        const response = await api.get(`/patients/${id}`)
        const p = response.data
        setForm({
          fullName: p.fullName ?? '',
          phone: p.phone ?? '',
          phone2: p.phone2 ?? '',
          gender: p.gender ?? '',
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
          nationalId: p.nationalId ?? '',
          bloodType: p.bloodType ?? '',
          address: p.address ?? '',
          email: p.email ?? '',
          emergencyContact: p.emergencyContact ?? '',
          emergencyPhone: p.emergencyPhone ?? '',
          allergies: p.allergies ?? '',
          chronicDiseases: p.chronicDiseases ?? '',
          occupation: p.occupation ?? '',
          maritalStatus: p.maritalStatus ?? '',
          notes: p.notes ?? '',
          stopped: p.stopped ?? false,
        })
      } catch (err) {
        console.error('Error fetching patient:', err)
        navigate('/patients')
      } finally {
        const elapsed = Date.now() - startTime
        if (elapsed < minLoadingTime) {
          setTimeout(() => setLoading(false), minLoadingTime - elapsed)
        } else {
          setLoading(false)
        }
      }
    }

    fetchPatient()
  }, [id, navigate])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setForm(prev => ({ ...prev, [name]: newValue }))
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    const t = T[lang]

    if (!form.fullName.trim()) {
      errors.fullName = t.fullName + ' ' + ('required' in t ? 'مطلوب' : 'is required')
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'البريد الإلكتروني غير صالح'
    }

    if (form.phone && !/^[\d\s\+-]{8,}$/.test(form.phone.replace(/\s/g, ''))) {
      errors.phone = 'رقم الهاتف غير صالح'
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
    setSaving(true)

    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([_, v]) => v !== '' && v !== false)
      )
      await api.put(`/patients/${id}`, payload)
      navigate(`/patients/${id}`)
    } catch (err: any) {
      const errData = err.response?.data
      if (typeof errData === 'string') {
        setError(errData)
      } else if (errData?.errors) {
        const messages = Object.values(errData.errors).flat().join('، ')
        setError(messages as string)
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

  // Blood types
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  
  // Marital status options
  const maritalStatuses = [
    { value: 'single', label: t.single },
    { value: 'married', label: t.married },
    { value: 'divorced', label: t.divorced },
    { value: 'widowed', label: t.widowed },
  ]

  // Max date for date of birth
  const getMaxDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  if (loading) {
    return (
      <EditPatientLoadingScreen 
        msg={t.loadingMessage} 
        subMsg={t.loadingSub}
      />
    )
  }

  return (
    <div 
      className="edit-patient-shell" 
      style={{
        direction: isAr ? 'rtl' : 'ltr',
        background: '#F8FAFA',
        minHeight: '100vh',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate(`/patients/${id}`)}
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
              {isAr ? 'تعديل المريض' : 'Edit Patient'}
            </div>
            <h2 className="edit-patient-title" style={{
              fontFamily: "'DM Serif Display', 'Georgia', serif",
              fontSize: 28,
              fontWeight: 500,
              color: TEXT_DARK,
              margin: 0,
              letterSpacing: '-0.3px',
            }}>
             
            </h2>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
          }}>
            
            {/* Basic Information Section */}
            <FormSection title={t.basicInfo}>
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

              <FormField label={t.phone2}>
                <input
                  type="tel"
                  name="phone2"
                  value={form.phone2}
                  onChange={handleChange}
                  placeholder={t.phone2Placeholder}
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

              <FormField label={t.gender}>
                <select
                  name="gender"
                  value={form.gender}
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
                  <option value="">{t.genderPlaceholder}</option>
                  <option value="male">{t.male}</option>
                  <option value="female">{t.female}</option>
                </select>
              </FormField>

              <FormField label={t.dateOfBirth}>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  max={getMaxDate()}
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

              <FormField label={t.nationalId}>
                <input
                  name="nationalId"
                  value={form.nationalId}
                  onChange={handleChange}
                  placeholder={t.nationalIdPlaceholder}
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

              <FormField label={t.bloodType}>
                <select
                  name="bloodType"
                  value={form.bloodType}
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
                  <option value="">{t.bloodTypePlaceholder}</option>
                  {bloodTypes.map(bt => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </FormField>

              <FormField label={t.maritalStatus}>
                <select
                  name="maritalStatus"
                  value={form.maritalStatus}
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
                  <option value="">{t.maritalStatusPlaceholder}</option>
                  {maritalStatuses.map(ms => (
                    <option key={ms.value} value={ms.value}>{ms.label}</option>
                  ))}
                </select>
              </FormField>

              <FormField label={t.occupation}>
                <input
                  name="occupation"
                  value={form.occupation}
                  onChange={handleChange}
                  placeholder={t.occupationPlaceholder}
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

              {/* Status Checkbox */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 8,
                paddingTop: 8,
                borderTop: `1px solid ${BORDER}`,
              }}>
                <input
                  type="checkbox"
                  name="stopped"
                  id="stopped"
                  checked={form.stopped}
                  onChange={handleChange}
                  style={{
                    width: 18,
                    height: 18,
                    cursor: 'pointer',
                    accentColor: WARNING,
                  }}
                />
                <label htmlFor="stopped" style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: TEXT_DARK,
                  cursor: 'pointer',
                }}>
                  {t.stopped}
                </label>
              </div>
            </FormSection>

            {/* Additional Information Section */}
            <FormSection title={t.additionalInfo}>
              <FormField label={t.address}>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder={t.addressPlaceholder}
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

              <FormField label={t.emergencyContact}>
                <input
                  name="emergencyContact"
                  value={form.emergencyContact}
                  onChange={handleChange}
                  placeholder={t.emergencyContactPlaceholder}
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

              <FormField label={t.emergencyPhone}>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={form.emergencyPhone}
                  onChange={handleChange}
                  placeholder={t.emergencyPhonePlaceholder}
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

              <FormField label={t.allergies}>
                <input
                  name="allergies"
                  value={form.allergies}
                  onChange={handleChange}
                  placeholder={t.allergiesPlaceholder}
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

              <FormField label={t.chronicDiseases}>
                <input
                  name="chronicDiseases"
                  value={form.chronicDiseases}
                  onChange={handleChange}
                  placeholder={t.chronicDiseasesPlaceholder}
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
            </FormSection>
          </div>

          {/* Notes Section - Full Width */}
          <div style={{ marginTop: 24 }}>
            <FormSection title={t.notes}>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                placeholder={t.notesPlaceholder}
                className="form-textarea"
                style={{
                  width: '100%',
                  background: CARD_BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  padding: '12px 14px',
                  fontSize: 14,
                  fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
                  color: TEXT_DARK,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  resize: 'vertical',
                }}
              />
            </FormSection>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: ERROR_BG,
              border: `1px solid ${ERROR_TEXT}40`,
              borderRadius: 12,
              padding: '12px 16px',
              marginTop: 24,
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
            marginTop: 24,
            paddingTop: 8,
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
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.background = '#4A7679'
              }}
              onMouseLeave={(e) => {
                if (!saving) e.currentTarget.style.background = PRIMARY
              }}
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
              onClick={() => navigate(`/patients/${id}`)}
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
        </form>
      </div>
    </div>
  )
}
