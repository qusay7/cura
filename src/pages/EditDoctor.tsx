import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
@keyframes slide-in {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.edit-doctor-shell { animation: fade-up 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) both; }
.form-section { animation: slide-in 0.3s ease both; }
.edit-doctor-shell * { box-sizing:border-box; }

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #5B8C8F !important;
  box-shadow: 0 0 0 3px rgba(91, 140, 143, 0.1) !important;
}

@media(max-width: 768px) {
  .edit-doctor-title { font-size: 24px !important; }
  .action-buttons { flex-direction: column !important; }
}
`

const PRIMARY = '#5B8C8F'
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
    title: 'تعديل بيانات الطبيب',
    back: 'رجوع',
    basicInfo: 'البيانات الأساسية',
    save: 'حفظ التعديلات',
    cancel: 'إلغاء',
    saving: 'جارٍ الحفظ...',
    loadingMessage: 'جاري تحميل بيانات الطبيب',
    loadingSub: 'يرجى الانتظار أثناء تحميل المعلومات',
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
    status: 'الحالة',
    active: 'نشط',
    inactive: 'غير نشط',
    error: 'حدث خطأ غير متوقع',
  },
  en: {
    title: 'Edit Doctor',
    back: 'Back',
    basicInfo: 'Basic Information',
    save: 'Save Changes',
    cancel: 'Cancel',
    saving: 'Saving...',
    loadingMessage: 'Loading Doctor Data',
    loadingSub: 'Please wait while we load doctor information',
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
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    error: 'An unexpected error occurred',
  },
}

const EditDoctorLoadingScreen = ({ msg, subMsg }: { msg: string; subMsg: string }) => (
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
          <span>👨‍⚕️ FETCHING DATA</span>
          <span>⚡ LOADING</span>
          <span>📊 SECURE</span>
        </div>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: TEXT_DARK, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>{msg}</h3>
      <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 24 }}>{subMsg}</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, animation: `pulse-soft 1.5s ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  </div>
)

const FormField = ({ label, required, children, error }: { label: string; required?: boolean; children: React.ReactNode; error?: string }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6, letterSpacing: '0.5px' }}>{label} {required && <span style={{ color: ERROR_TEXT }}>*</span>}</label>
    {children}
    {error && <p style={{ fontSize: 11, color: ERROR_TEXT, marginTop: 5 }}>{error}</p>}
  </div>
)

export default function EditDoctor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())

  const [form, setForm] = useState({
    fullName: '',
    specialty: '',
    phone: '',
    email: '',
    notes: '',
    isActive: true,
  })

  useEffect(() => {
    const styleId = 'cura-edit-doctor-css'
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

  useEffect(() => {
    const fetchDoctor = async () => {
      const startTime = Date.now()
      const minLoadingTime = 800
      try {
        const response = await api.get(`/doctors/${id}`)
        const d = response.data
        setForm({
          fullName: d.fullName ?? '',
          specialty: d.specialty ?? '',
          phone: d.phone ?? '',
          email: d.email ?? '',
          notes: d.notes ?? '',
          isActive: d.isActive ?? true,
        })
      } catch (err) {
        console.error('Error fetching doctor:', err)
        navigate('/doctors')
      } finally {
        const elapsed = Date.now() - startTime
        if (elapsed < minLoadingTime) {
          setTimeout(() => setLoading(false), minLoadingTime - elapsed)
        } else {
          setLoading(false)
        }
      }
    }
    fetchDoctor()
  }, [id, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setForm(prev => ({ ...prev, [name]: newValue }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([_, v]) => v !== '' && v !== null)
      )
      await api.put(`/doctors/${id}`, payload)
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
      setSaving(false)
    }
  }

  const t = T[lang]
  const isAr = lang === 'ar'

  if (loading) {
    return <EditDoctorLoadingScreen msg={t.loadingMessage} subMsg={t.loadingSub} />
  }

  return (
    <div className="edit-doctor-shell" style={{ direction: isAr ? 'rtl' : 'ltr', background: '#F8FAFA', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => navigate('/doctors')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 13, cursor: 'pointer', marginBottom: 16, transition: 'color 0.2s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.color = PRIMARY} onMouseLeave={(e) => e.currentTarget.style.color = TEXT_MUTED}>
            <span>←</span> {t.back}
          </button>
        
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '24px' }}>
            <FormField label={t.fullName} required>
              <input name="fullName" value={form.fullName} onChange={handleChange} placeholder={t.fullNamePlaceholder} className="form-input" style={{ width: '100%', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 14px', fontSize: 14, fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif", color: TEXT_DARK, outline: 'none', transition: 'all 0.2s ease' }} />
            </FormField>

            <FormField label={t.specialty}>
              <input name="specialty" value={form.specialty} onChange={handleChange} placeholder={t.specialtyPlaceholder} className="form-input" style={{ width: '100%', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 14px', fontSize: 14, fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif", color: TEXT_DARK, outline: 'none', transition: 'all 0.2s ease' }} />
            </FormField>

            <FormField label={t.phone}>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder={t.phonePlaceholder} className="form-input" style={{ width: '100%', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 14px', fontSize: 14, fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif", color: TEXT_DARK, outline: 'none', transition: 'all 0.2s ease' }} />
            </FormField>

            <FormField label={t.email}>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder={t.emailPlaceholder} className="form-input" style={{ width: '100%', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 14px', fontSize: 14, fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif", color: TEXT_DARK, outline: 'none', transition: 'all 0.2s ease' }} />
            </FormField>

            <FormField label={t.notes}>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder={t.notesPlaceholder} className="form-textarea" style={{ width: '100%', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 14px', fontSize: 14, fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif", color: TEXT_DARK, outline: 'none', transition: 'all 0.2s ease', resize: 'vertical' }} />
            </FormField>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
              <input type="checkbox" name="isActive" id="isActive" checked={form.isActive} onChange={handleChange} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: SUCCESS }} />
              <label htmlFor="isActive" style={{ fontSize: 13, fontWeight: 500, color: TEXT_DARK, cursor: 'pointer' }}>{t.active}</label>
            </div>
          </div>

          {error && (
            <div style={{ background: ERROR_BG, border: `1px solid ${ERROR_TEXT}40`, borderRadius: 12, padding: '12px 16px', marginTop: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <span style={{ fontSize: 13, color: ERROR_TEXT }}>{error}</span>
            </div>
          )}

          <div className="action-buttons" style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="submit" disabled={saving} style={{ flex: 1, background: PRIMARY, color: '#FFFFFF', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif", cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = '#4A7679' }} onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = PRIMARY }}>
              {saving ? <><span style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid rgba(255,255,255,0.3)`, borderTopColor: '#FFFFFF', animation: 'spin 0.8s linear infinite' }} /> {t.saving}</> : t.save}
            </button>
            <button type="button" onClick={() => navigate('/doctors')} style={{ padding: '12px 32px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 14, fontWeight: 500, color: TEXT_MUTED, cursor: 'pointer', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.background = PRIMARY_SOFT} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


