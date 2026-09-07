import { useState, useEffect, useId, isValidElement, cloneElement } from 'react'
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const globalCss = `
.add-doctor-shell { animation: fade-up 0.4s cubic-bezier(0.2,0.9,0.4,1.1) both; }
.add-doctor-shell * { box-sizing:border-box; }
.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #5B8C8F !important;
  box-shadow: 0 0 0 3px rgba(91,140,143,0.1) !important;
  outline: none;
}
@media(max-width:768px) {
  .form-container { padding:16px !important; }
  .action-row { flex-direction:column !important; }
}
`

const ERROR_BG = '#FDF5F5'
const ERROR_TEXT = '#C4A77D'
const SUCCESS = '#16A34A'
const SUCCESS_BG = '#F0FDF4'

const SPECIALTIES = {
  ar: [
    'طب عام', 'طب أسنان', 'قلبية', 'جلدية', 'أطفال', 'أعصاب',
    'عظام وكسور', 'عيون', 'أنف وأذن وحنجرة', 'نساء وتوليد',
    'مسالك بولية', 'جراحة عامة', 'جراحة تجميل', 'أورام',
    'غدد صماء', 'روماتيزم', 'كلى', 'رئة وجهاز تنفسي',
    'هضمي وكبد', 'دم وأورام دموية', 'طب طوارئ', 'تخدير',
    'طب نفسي', 'طب أسرة', 'طب رياضي', 'علاج طبيعي',
    'تغذية وحمية', 'طب مخبري', 'أشعة وتصوير', 'طب شيخوخة',
  ],
  en: [
    'General Practice', 'Dentistry', 'Cardiology', 'Dermatology',
    'Pediatrics', 'Neurology', 'Orthopedics', 'Ophthalmology',
    'ENT', 'Obstetrics & Gynecology', 'Urology', 'General Surgery',
    'Plastic Surgery', 'Oncology', 'Endocrinology', 'Rheumatology',
    'Nephrology', 'Pulmonology', 'Gastroenterology', 'Hematology',
    'Emergency Medicine', 'Anesthesiology', 'Psychiatry',
    'Family Medicine', 'Sports Medicine', 'Physiotherapy',
    'Nutrition & Dietetics', 'Laboratory Medicine', 'Radiology', 'Geriatrics',
  ],
}

const WORK_TYPES = {
  ar: [
    { value: 'appointments', label: '📅 حجز مواعيد فقط' },  // ✅ أول
    { value: 'queue',        label: '🔢 قائمة انتظار فقط' },
  //  { value: 'both',         label: '✅ كلاهما' },
  ],
  en: [
    { value: 'appointments', label: '📅 Appointments Only' }, // ✅ أول
    { value: 'queue',        label: '🔢 Queue Only' },
   // { value: 'both',         label: '✅ Both' },
  ],
}

const T = {
  ar: {
    title: 'إضافة طبيب جديد', back: 'رجوع',
    fullName: 'الاسم الكامل', fullNamePlaceholder: 'أدخل الاسم الكامل للطبيب',
    specialty: 'التخصص', specialtyPlaceholder: 'ابحث أو اختر التخصص...',
    department: 'القسم', departmentPlaceholder: 'اختر القسم...',
    workType: 'نوع العمل',
    phone: 'الهاتف', phonePlaceholder: '05xxxxxxxx',
    email: 'البريد الإلكتروني', emailPlaceholder: 'doctor@clinic.com',
    notes: 'ملاحظات', notesPlaceholder: 'أضف ملاحظات إضافية عن الطبيب...',
    submit: 'حفظ الطبيب', cancel: 'إلغاء', saving: 'جارٍ الحفظ...',
    saved: 'تم حفظ الطبيب بنجاح',
    error: 'حدث خطأ غير متوقع', required: 'هذا الحقل مطلوب',
    emailInvalid: 'البريد الإلكتروني غير صالح', phoneInvalid: 'رقم الهاتف غير صالح',
    noDepartments: 'لا توجد أقسام — أضف أقساماً أولاً من صفحة الأقسام',
  },
  en: {
    title: 'Add New Doctor', back: 'Back',
    fullName: 'Full Name', fullNamePlaceholder: "Enter doctor's full name",
    specialty: 'Specialty', specialtyPlaceholder: 'Search or select specialty...',
    department: 'Department', departmentPlaceholder: 'Select department...',
    workType: 'Work Type',
    phone: 'Phone', phonePlaceholder: '05xxxxxxxx',
    email: 'Email', emailPlaceholder: 'doctor@clinic.com',
    notes: 'Notes', notesPlaceholder: 'Add additional notes about the doctor...',
    submit: 'Save Doctor', cancel: 'Cancel', saving: 'Saving...',
    saved: 'Doctor saved successfully',
    error: 'An unexpected error occurred', required: 'This field is required',
    emailInvalid: 'Invalid email address', phoneInvalid: 'Invalid phone number',
    noDepartments: 'No departments — add departments first from Departments page',
  },
}

interface Department { id: string; name: string; nameEn?: string; isActive: boolean }

const FormField = ({ label, required, children, error }: {
  label: string; required?: boolean; children: React.ReactNode; error?: string
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
    <div style={{ marginBottom: 18 }}>
      <label htmlFor={fieldId} style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6, letterSpacing: '0.5px' }}>
        {label} {required && <span style={{ color: ERROR_TEXT }}>*</span>}
      </label>
      {child}
      {error && <p id={errorId} role="alert" style={{ fontSize: 11, color: ERROR_TEXT, marginTop: 5, marginBottom: 0 }}>{error}</p>}
    </div>
  )
}

const inputStyle = (isAr: boolean) => ({
  width: '100%', background: CARD_BG, border: `1px solid ${BORDER}`,
  borderRadius: 12, padding: '10px 14px', fontSize: 14,
  fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
  color: TEXT_DARK, outline: 'none', transition: 'all 0.2s ease',
})

export default function AddDoctor() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [departments, setDepartments] = useState<Department[]>([])
  const [form, setForm] = useState({
    fullName: '', specialty: '', phone: '', email: '', notes: '',
    departmentId: '',   workType: 'appointments',
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  useUnsavedChangesWarning(form)

  useEffect(() => {
    const styleId = 'cura-add-doctor-css'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style'); style.id = styleId; style.textContent = globalCss; document.head.appendChild(style)
    }
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)

    // جلب الأقسام
    api.get('/departments')
      .then(res => setDepartments(res.data.filter((d: Department) => d.isActive)))
      .catch(() => {})

    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    const t = T[lang]
    if (!form.fullName.trim()) errors.fullName = t.required
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = t.emailInvalid
    if (form.phone && !/^[\d\s\+-]{8,}$/.test(form.phone.replace(/\s/g, ''))) errors.phone = t.phoneInvalid
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setError(''); setLoading(true)
    try {
      const payload: Record<string, any> = {
        fullName: form.fullName,
        workType: form.workType,
      }
      if (form.specialty)    payload.specialty    = form.specialty
      if (form.phone)        payload.phone        = form.phone
      if (form.email)        payload.email        = form.email
      if (form.notes)        payload.notes        = form.notes
      if (form.departmentId) payload.departmentId = form.departmentId

      await api.post('/doctors', payload)
      setSuccess(T[lang].saved)
      setTimeout(() => navigate('/doctors'), 1200)
    } catch (err: any) {
      const errData = err.response?.data
      setError(typeof errData === 'string' ? errData : errData?.message || T[lang].error)
    } finally {
      setLoading(false)
    }
  }
// ─── Department Search Select ────────────────────────────────────────────────
const DepartmentSelect = ({ departments, value, onChange, placeholder, isAr }: {
  departments: Department[]
  value: string
  onChange: (id: string) => void
  placeholder: string
  isAr: boolean
}) => {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = departments.filter(d => {
    const name = isAr ? d.name : (d.nameEn || d.name)
    return name.toLowerCase().includes(search.toLowerCase())
  })

  const selected = departments.find(d => d.id === value)
  const selectedLabel = selected ? (isAr ? selected.name : (selected.nameEn || selected.name)) : ''

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        width: '100%', background: '#FFFFFF', border: `1px solid #DCE5E5`,
        borderRadius: 12, padding: '10px 14px', fontSize: 14,
        fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif",
        color: value ? '#2C3E3F' : '#6B8A8C', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}
        onClick={() => setOpen(prev => !prev)}>
        <span>{selectedLabel || placeholder}</span>
        <span style={{ fontSize: 10, color: '#6B8A8C' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#FFFFFF', border: '1px solid #DCE5E5', borderRadius: 12,
          marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden',
        }}>
          {/* بحث */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #DCE5E5' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isAr ? 'ابحث...' : 'Search...'}
              style={{
                width: '100%', border: '1px solid #DCE5E5', borderRadius: 8,
                padding: '6px 10px', fontSize: 13, outline: 'none',
                fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif",
              }}
            />
          </div>

          {/* بدون قسم */}
          <div
            onClick={() => { onChange(''); setOpen(false); setSearch('') }}
            style={{
              padding: '9px 14px', fontSize: 13, cursor: 'pointer', color: '#6B8A8C',
              background: !value ? '#E8F0F0' : 'transparent',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFA'}
            onMouseLeave={e => e.currentTarget.style.background = !value ? '#E8F0F0' : 'transparent'}>
            {isAr ? 'بدون قسم' : 'No department'}
          </div>

          {/* النتائج */}
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '10px 14px', fontSize: 13, color: '#6B8A8C', textAlign: 'center' }}>
                {isAr ? 'لا نتائج' : 'No results'}
              </div>
            ) : filtered.map(d => {
              const label = isAr ? d.name : (d.nameEn || d.name)
              const isSelected = d.id === value
              return (
                <div key={d.id}
                  onClick={() => { onChange(d.id); setOpen(false); setSearch('') }}
                  style={{
                    padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                    background: isSelected ? '#E8F0F0' : 'transparent',
                    color: isSelected ? '#5B8C8F' : '#2C3E3F',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F8FAFA' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
                  {label}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
  const t = T[lang]
  const isAr = lang === 'ar'

  return (
    <div className="add-doctor-shell" style={{ direction: isAr ? 'rtl' : 'ltr', background: '#F8FAFA', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => navigate('/doctors')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 13, cursor: 'pointer', marginBottom: 16, transition: 'color 0.2s ease' }}
            onMouseEnter={e => e.currentTarget.style.color = PRIMARY}
            onMouseLeave={e => e.currentTarget.style.color = TEXT_MUTED}>
            <span>←</span> {t.back}
          </button>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 100, padding: '4px 16px', fontSize: 11, fontWeight: 600, color: PRIMARY }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, animation: 'soft-pulse 2s infinite' }} />
            {isAr ? 'طبيب جديد' : 'New Doctor'}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-container" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 24, padding: '28px' }}>

            {/* الاسم */}
            <FormField label={t.fullName} required error={validationErrors.fullName}>
              <input name="fullName" value={form.fullName} onChange={handleChange}
                placeholder={t.fullNamePlaceholder} className="form-input" style={inputStyle(isAr)} />
            </FormField>

            {/* التخصص — datalist للبحث */}
            <FormField label={t.specialty}>
              <input name="specialty" value={form.specialty} onChange={handleChange}
                placeholder={t.specialtyPlaceholder} list="specialties-list"
                className="form-input" autoComplete="off" style={inputStyle(isAr)} />
              <datalist id="specialties-list">
                {SPECIALTIES[lang].map(s => <option key={s} value={s} />)}
              </datalist>
            </FormField>

            {/* القسم */}
<FormField label={t.department}>
  {departments.length === 0 ? (
    <p style={{ fontSize: 12, color: '#F59E0B', margin: '4px 0 0' }}>⚠️ {t.noDepartments}</p>
  ) : (
    <DepartmentSelect
      departments={departments}
      value={form.departmentId}
      onChange={id => setForm(prev => ({ ...prev, departmentId: id }))}
      placeholder={t.departmentPlaceholder}
      isAr={isAr}
    />
  )}
</FormField>

            {/* نوع العمل */}
            <FormField label={t.workType}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {WORK_TYPES[lang].map(wt => (
                  <button key={wt.value} type="button"
                    onClick={() => setForm(prev => ({ ...prev, workType: wt.value }))}
                    style={{
                      flex: 1, minWidth: 120, padding: '10px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                      border: `2px solid ${form.workType === wt.value ? PRIMARY : BORDER}`,
                      background: form.workType === wt.value ? PRIMARY_SOFT : CARD_BG,
                      color: form.workType === wt.value ? PRIMARY : TEXT_MUTED,
                      cursor: 'pointer', transition: 'all 0.2s ease',
                    }}>
                    {wt.label}
                  </button>
                ))}
              </div>
            </FormField>

            {/* الهاتف */}
            <FormField label={t.phone} error={validationErrors.phone}>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                placeholder={t.phonePlaceholder} className="form-input" style={inputStyle(isAr)} />
            </FormField>

            {/* البريد */}
            <FormField label={t.email} error={validationErrors.email}>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder={t.emailPlaceholder} className="form-input" style={inputStyle(isAr)} />
            </FormField>

            {/* ملاحظات */}
            <FormField label={t.notes}>
              <textarea name="notes" value={form.notes} onChange={handleChange}
                rows={3} placeholder={t.notesPlaceholder} className="form-textarea"
                style={{ ...inputStyle(isAr), resize: 'vertical' }} />
            </FormField>

            {/* خطأ */}
            {success && (
              <div style={{ background: SUCCESS_BG, border: `1px solid ${SUCCESS}40`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>✅</span><span style={{ fontSize: 13, color: SUCCESS, fontWeight: 600 }}>{success}</span>
              </div>
            )}

            {error && (
              <div style={{ background: ERROR_BG, border: `1px solid ${ERROR_TEXT}40`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>⚠️</span><span style={{ fontSize: 13, color: ERROR_TEXT }}>{error}</span>
              </div>
            )}

            {/* أزرار */}
            <div className="action-row" style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" disabled={loading}
                style={{ flex: 1, background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s ease', fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif" }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#4A7679' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = PRIMARY }}>
                {loading ? <><span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', animation: 'spin 0.8s linear infinite' }} />{t.saving}</> : t.submit}
              </button>
              <button type="button" onClick={() => navigate('/doctors')}
                style={{ padding: '12px 24px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 14, fontWeight: 500, color: TEXT_MUTED, cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.background = PRIMARY_SOFT}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {t.cancel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
