import { useEffect, useState, useId, isValidElement, cloneElement } from 'react'
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { ECGAnimation } from '../components/ECGAnimation'
import SearchableSelect from '../components/SearchableSelect'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const globalCss = `
.edit-doctor-shell { animation: fade-up 0.4s cubic-bezier(0.2,0.9,0.4,1.1) both; }
.edit-doctor-shell * { box-sizing:border-box; }
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
const ERROR_TEXT = '#79674D'
const SUCCESS = '#4A7679'

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
    title: 'تعديل بيانات الطبيب', back: 'رجوع',
    fullName: 'الاسم الكامل', fullNamePlaceholder: 'أدخل الاسم الكامل للطبيب',
    specialty: 'التخصص', specialtyPlaceholder: 'ابحث أو اختر التخصص...',
    department: 'القسم', departmentPlaceholder: 'اختر القسم...',
    workType: 'نوع العمل',
    phone: 'الهاتف', phonePlaceholder: '05xxxxxxxx',
    email: 'البريد الإلكتروني', emailPlaceholder: 'doctor@clinic.com',
    notes: 'ملاحظات', notesPlaceholder: 'أضف ملاحظات إضافية عن الطبيب...',
    save: 'حفظ التعديلات', cancel: 'إلغاء', saving: 'جارٍ الحفظ...',
    active: 'نشط', error: 'حدث خطأ غير متوقع',
    loadingMessage: 'جاري تحميل بيانات الطبيب',
    loadingSub: 'يرجى الانتظار أثناء تحميل المعلومات',
    loadFailed: 'تعذّر تحميل بيانات الطبيب',
    noDepartments: 'لا توجد أقسام',
    // ✅ الإعدادات المالية
    tabInfo: 'بيانات الطبيب', tabFinancial: 'الإعدادات المالية',
    generalTitle: 'الإعداد العام', generalHint: 'يطبّق على كل قوالب الزيارة، إلا لو فيه استثناء خاص لقالب معيّن',
    commissionType: 'نوع الحصة', percentage: 'نسبة مئوية', fixed: 'مبلغ ثابت',
    firstVisitPrice: 'سعر الكشف الأول', followUpPrice: 'سعر المراجعة',
    pricePlaceholder: 'استخدم سعر القالب', firstVisitRate: 'حصة الكشف الأول',
    followUpRate: 'حصة المراجعة', ratePlaceholder: 'بدون حصة',
    saveGeneral: 'حفظ الإعداد العام',
    exceptionsTitle: 'استثناءات لقوالب معيّنة',
    exceptionsHint: 'تتجاوز الإعداد العام وسعر القالب لهذا الطبيب بالذات',
    addException: '+ إضافة استثناء', selectTemplate: 'اختر قالب...',
    saveException: 'حفظ الاستثناء', noExceptions: 'ما فيه أي استثناءات مضافة',
    edit: 'تعديل', delete: 'حذف', cancel2: 'إلغاء',
    financialSaved: 'تم الحفظ بنجاح', financialError: 'حدث خطأ أثناء الحفظ',
    confirmDelete: 'متأكد تبي تحذف هذا الاستثناء؟',
  },
  en: {
    title: 'Edit Doctor', back: 'Back',
    fullName: 'Full Name', fullNamePlaceholder: "Enter doctor's full name",
    specialty: 'Specialty', specialtyPlaceholder: 'Search or select specialty...',
    department: 'Department', departmentPlaceholder: 'Select department...',
    workType: 'Work Type',
    phone: 'Phone', phonePlaceholder: '05xxxxxxxx',
    email: 'Email', emailPlaceholder: 'doctor@clinic.com',
    notes: 'Notes', notesPlaceholder: 'Add additional notes about the doctor...',
    save: 'Save Changes', cancel: 'Cancel', saving: 'Saving...',
    active: 'Active', error: 'An unexpected error occurred',
    loadingMessage: 'Loading Doctor Data',
    loadingSub: 'Please wait while we load doctor information',
    loadFailed: 'Failed to load doctor data',
    noDepartments: 'No departments available',
    tabInfo: 'Doctor Info', tabFinancial: 'Financial Settings',
    generalTitle: 'General Settings', generalHint: 'Applies to all visit templates unless a specific exception exists',
    commissionType: 'Commission Type', percentage: 'Percentage', fixed: 'Fixed Amount',
    firstVisitPrice: 'First Visit Price', followUpPrice: 'Follow-up Price',
    pricePlaceholder: 'Use template price', firstVisitRate: 'First Visit Commission',
    followUpRate: 'Follow-up Commission', ratePlaceholder: 'No commission',
    saveGeneral: 'Save General Settings',
    exceptionsTitle: 'Template-Specific Exceptions',
    exceptionsHint: 'Overrides the general setting and template price for this doctor only',
    addException: '+ Add Exception', selectTemplate: 'Select template...',
    saveException: 'Save Exception', noExceptions: 'No exceptions added yet',
    edit: 'Edit', delete: 'Delete', cancel2: 'Cancel',
    financialSaved: 'Saved successfully', financialError: 'An error occurred while saving',
    confirmDelete: 'Are you sure you want to delete this exception?',
  },
}

interface Department { id: string; name: string; nameEn?: string; isActive: boolean }

interface Template { id: string; name: string; nameEn?: string | null }

interface FinancialSetting {
  id: string
  templateId: string | null
  templateName: string | null
  isGeneral: boolean
  firstVisitPrice: number | null
  followUpPrice: number | null
  commissionType: 'percentage' | 'fixed'
  firstVisitCommissionRate: number | null
  followUpCommissionRate: number | null
  isActive: boolean
}

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

const LoadingScreen = ({ msg, subMsg }: { msg: string; subMsg: string }) => (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', zIndex: 9999 }}>
    <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 400, width: '100%' }}>
      <div style={{ background: PRIMARY_SOFT, borderRadius: 20, padding: '20px 24px', marginBottom: '1.5rem', border: `1px solid ${BORDER}` }}>
        <ECGAnimation height={100} showLetters={true} speed={0.7} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 9, color: TEXT_MUTED }}>
          <span>👨‍⚕️ FETCHING DATA</span><span>⚡ LOADING</span><span>📊 SECURE</span>
        </div>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: TEXT_DARK, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>{msg}</h3>
      <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 24 }}>{subMsg}</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, animation: `pulse-soft 1.5s ${i * 0.2}s infinite` }} />)}
      </div>
    </div>
  </div>
)

export default function EditDoctor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [departments, setDepartments] = useState<Department[]>([])
  const [form, setForm] = useState({
    fullName: '', specialty: '', phone: '', email: '', notes: '',
    isActive: true, departmentId: '', workType: 'appointments',
  })
  useUnsavedChangesWarning(form, !loading)

  // ✅ الإعدادات المالية
  const [activeTab, setActiveTab] = useState<'info' | 'financial'>('info')
  const [financialLoaded, setFinancialLoaded] = useState(false)
  const [financialLoading, setFinancialLoading] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [settings, setSettings] = useState<FinancialSetting[]>([])
  const [financialError, setFinancialError] = useState('')
  const [financialSuccess, setFinancialSuccess] = useState('')

  const emptyMoneyForm = {
    commissionType: 'percentage' as 'percentage' | 'fixed',
    firstVisitPrice: '', followUpPrice: '',
    firstVisitCommissionRate: '', followUpCommissionRate: '',
  }
  const [generalForm, setGeneralForm] = useState(emptyMoneyForm)
  const [savingGeneral, setSavingGeneral] = useState(false)

  const [showExceptionForm, setShowExceptionForm] = useState(false)
  const [editingExceptionId, setEditingExceptionId] = useState<string | null>(null)
  const [exceptionTemplateId, setExceptionTemplateId] = useState('')
  const [exceptionForm, setExceptionForm] = useState(emptyMoneyForm)
  const [savingException, setSavingException] = useState(false)

  const loadFinancialData = async () => {
    setFinancialLoading(true)
    setFinancialError('')
    try {
      const [tplRes, settingsRes] = await Promise.all([
        api.get('/treatmentplans/templates'),
        api.get(`/doctors/${id}/financial-settings`),
      ])
      setTemplates(tplRes.data)
      setSettings(settingsRes.data)

      const general = (settingsRes.data as FinancialSetting[]).find(s => s.isGeneral)
      if (general) {
        setGeneralForm({
          commissionType: general.commissionType,
          firstVisitPrice: general.firstVisitPrice?.toString() ?? '',
          followUpPrice: general.followUpPrice?.toString() ?? '',
          firstVisitCommissionRate: general.firstVisitCommissionRate?.toString() ?? '',
          followUpCommissionRate: general.followUpCommissionRate?.toString() ?? '',
        })
      }
      setFinancialLoaded(true)
    } catch {
      setFinancialError(t.financialError)
    } finally {
      setFinancialLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'financial' && !financialLoaded) loadFinancialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const buildMoneyPayload = (f: typeof emptyMoneyForm) => ({
    commissionType: f.commissionType,
    firstVisitPrice: f.firstVisitPrice ? parseFloat(f.firstVisitPrice) : null,
    followUpPrice: f.followUpPrice ? parseFloat(f.followUpPrice) : null,
    firstVisitCommissionRate: f.firstVisitCommissionRate ? parseFloat(f.firstVisitCommissionRate) : null,
    followUpCommissionRate: f.followUpCommissionRate ? parseFloat(f.followUpCommissionRate) : null,
  })

  const handleSaveGeneral = async () => {
    setSavingGeneral(true)
    setFinancialError(''); setFinancialSuccess('')
    try {
      await api.put(`/doctors/${id}/financial-settings/general`, buildMoneyPayload(generalForm))
      setFinancialSuccess(t.financialSaved)
      await loadFinancialData()
      setTimeout(() => setFinancialSuccess(''), 3000)
    } catch (err: any) {
      setFinancialError(err.response?.data?.message || err.response?.data || t.financialError)
    } finally {
      setSavingGeneral(false)
    }
  }

  const openAddException = () => {
    setEditingExceptionId(null)
    setExceptionTemplateId('')
    setExceptionForm(emptyMoneyForm)
    setShowExceptionForm(true)
  }

  const openEditException = (s: FinancialSetting) => {
    setEditingExceptionId(s.id)
    setExceptionTemplateId(s.templateId || '')
    setExceptionForm({
      commissionType: s.commissionType,
      firstVisitPrice: s.firstVisitPrice?.toString() ?? '',
      followUpPrice: s.followUpPrice?.toString() ?? '',
      firstVisitCommissionRate: s.firstVisitCommissionRate?.toString() ?? '',
      followUpCommissionRate: s.followUpCommissionRate?.toString() ?? '',
    })
    setShowExceptionForm(true)
  }

  const handleSaveException = async () => {
    if (!exceptionTemplateId) {
      setFinancialError(isAr ? 'اختر قالباً أولاً' : 'Please select a template first')
      return
    }
    setSavingException(true)
    setFinancialError(''); setFinancialSuccess('')
    try {
      await api.put(`/doctors/${id}/financial-settings/exceptions/${exceptionTemplateId}`, buildMoneyPayload(exceptionForm))
      setFinancialSuccess(t.financialSaved)
      setShowExceptionForm(false)
      await loadFinancialData()
      setTimeout(() => setFinancialSuccess(''), 3000)
    } catch (err: any) {
      setFinancialError(err.response?.data?.message || err.response?.data || t.financialError)
    } finally {
      setSavingException(false)
    }
  }

  const handleDeleteException = async (settingId: string) => {
    if (!window.confirm(t.confirmDelete)) return
    try {
      await api.delete(`/doctors/${id}/financial-settings/${settingId}`)
      await loadFinancialData()
    } catch {
      setFinancialError(t.financialError)
    }
  }

  useEffect(() => {
    const styleId = 'cura-edit-doctor-css'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style'); style.id = styleId; style.textContent = globalCss; document.head.appendChild(style)
    }
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)

    const fetchAll = async () => {
      const startTime = Date.now()
      try {
        const [doctorRes, deptsRes] = await Promise.all([
          api.get(`/doctors/${id}`),
          api.get('/departments'),
        ])
        const d = doctorRes.data
        setForm({
          fullName:     d.fullName     ?? '',
          specialty:    d.specialty    ?? '',
          phone:        d.phone        ?? '',
          email:        d.email        ?? '',
          notes:        d.notes        ?? '',
          isActive:     d.isActive     ?? true,
          departmentId: d.departmentId ?? '',
          workType:     d.workType     ?? 'both',
        })
        setDepartments(deptsRes.data.filter((dep: Department) => dep.isActive))
      } catch (err: any) {
        if (err?.response?.status === 401) { navigate('/doctors'); return }
        setLoadFailed(true)
        setTimeout(() => navigate('/doctors'), 2000)
      }
      finally {
        const elapsed = Date.now() - startTime
        setTimeout(() => setLoading(false), Math.max(0, 800 - elapsed))
      }
    }
    fetchAll()
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [id, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setForm(prev => ({ ...prev, [name]: newValue }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSaving(true)
    try {
      const payload: Record<string, any> = {
        fullName:  form.fullName,
        isActive:  form.isActive,
        workType:  form.workType,
      }
      if (form.specialty)    payload.specialty    = form.specialty
      if (form.phone)        payload.phone        = form.phone
      if (form.email)        payload.email        = form.email
      if (form.notes)        payload.notes        = form.notes
      payload.departmentId = form.departmentId || null

      await api.put(`/doctors/${id}`, payload)
      setSuccess(T[lang].financialSaved)
      setTimeout(() => navigate('/doctors'), 1200)
    } catch (err: any) {
      const errData = err.response?.data
      setError(typeof errData === 'string' ? errData : errData?.message || T[lang].error)
    } finally { setSaving(false) }
  }

  const t = T[lang]
  const isAr = lang === 'ar'

  if (loading) return <LoadingScreen msg={t.loadingMessage} subMsg={t.loadingSub} />

  if (loadFailed) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 40 }}>
        <span style={{ fontSize: 40, opacity: 0.5 }}>⚠️</span>
        <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 16 }}>{t.loadFailed}</p>
      </div>
    </div>
  )

  return (
    <div className="edit-doctor-shell" style={{ direction: isAr ? 'rtl' : 'ltr', background: '#F8FAFA', minHeight: '100vh', padding: '24px' }}>
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
            {isAr ? 'تعديل بيانات الطبيب' : 'Edit Doctor'}
          </div>
        </div>

        {/* ✅ التبويبات */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['info', 'financial'] as const).map(tab => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              style={{
                padding: '9px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                border: `1.5px solid ${activeTab === tab ? PRIMARY : BORDER}`,
                background: activeTab === tab ? PRIMARY_SOFT : CARD_BG,
                color: activeTab === tab ? PRIMARY : TEXT_MUTED,
                cursor: 'pointer', transition: 'all 0.2s ease',
                fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif",
              }}>
              {tab === 'info' ? `👤 ${t.tabInfo}` : `💰 ${t.tabFinancial}`}
            </button>
          ))}
        </div>

        {activeTab === 'info' && (
        <form onSubmit={handleSubmit}>
          <div className="form-container" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 24, padding: '28px' }}>

            {/* الاسم */}
            <FormField label={t.fullName} required>
              <input name="fullName" value={form.fullName} onChange={handleChange}
                placeholder={t.fullNamePlaceholder} className="form-input" style={inputStyle(isAr)} />
            </FormField>

            {/* التخصص */}
            <FormField label={t.specialty}>
              <input name="specialty" value={form.specialty} onChange={handleChange}
                placeholder={t.specialtyPlaceholder} list="specialties-list-edit"
                className="form-input" autoComplete="off" style={inputStyle(isAr)} />
              <datalist id="specialties-list-edit">
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
            <FormField label={t.phone}>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                placeholder={t.phonePlaceholder} className="form-input" style={inputStyle(isAr)} />
            </FormField>

            {/* البريد */}
            <FormField label={t.email}>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder={t.emailPlaceholder} className="form-input" style={inputStyle(isAr)} />
            </FormField>

            {/* ملاحظات */}
            <FormField label={t.notes}>
              <textarea name="notes" value={form.notes} onChange={handleChange}
                rows={3} placeholder={t.notesPlaceholder} className="form-textarea"
                style={{ ...inputStyle(isAr), resize: 'vertical' }} />
            </FormField>

            {/* نشط */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
              <input type="checkbox" name="isActive" id="isActive" checked={form.isActive} onChange={handleChange}
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: SUCCESS }} />
              <label htmlFor="isActive" style={{ fontSize: 13, fontWeight: 500, color: TEXT_DARK, cursor: 'pointer' }}>{t.active}</label>
            </div>

            {/* نجاح */}
            {success && (
              <div style={{ background: PRIMARY_SOFT, border: `1px solid ${SUCCESS}40`, borderRadius: 12, padding: '12px 16px', marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>✅</span><span style={{ fontSize: 13, color: SUCCESS }}>{success}</span>
              </div>
            )}

            {/* خطأ */}
            {error && (
              <div style={{ background: ERROR_BG, border: `1px solid ${ERROR_TEXT}40`, borderRadius: 12, padding: '12px 16px', marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>⚠️</span><span style={{ fontSize: 13, color: ERROR_TEXT }}>{error}</span>
              </div>
            )}

            {/* أزرار */}
            <div className="action-row" style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button type="submit" disabled={saving}
                style={{ flex: 1, background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s ease', fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif" }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#4A7679' }}
                onMouseLeave={e => { if (!saving) e.currentTarget.style.background = PRIMARY }}>
                {saving ? <><span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', animation: 'spin 0.8s linear infinite' }} />{t.saving}</> : t.save}
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
        )}

        {activeTab === 'financial' && (
          <div className="form-container" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 24, padding: '28px' }}>

            {financialLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: TEXT_MUTED }}>
                <div style={{ width: 32, height: 32, margin: '0 auto 12px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: PRIMARY, animation: 'spin 0.8s linear infinite' }} />
                {isAr ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : (
              <>
                {financialError && (
                  <div style={{ background: ERROR_BG, border: `1px solid ${ERROR_TEXT}40`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span>⚠️</span><span style={{ fontSize: 13, color: ERROR_TEXT }}>{financialError}</span>
                  </div>
                )}
                {financialSuccess && (
                  <div style={{ background: PRIMARY_SOFT, border: `1px solid ${SUCCESS}40`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span>✅</span><span style={{ fontSize: 13, color: SUCCESS }}>{financialSuccess}</span>
                  </div>
                )}

                {/* ═══ الإعداد العام ═══ */}
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, marginBottom: 4 }}>{t.generalTitle}</h3>
                  <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 16 }}>{t.generalHint}</p>

                  <FormField label={t.commissionType}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['percentage', 'fixed'] as const).map(ct => (
                        <button key={ct} type="button"
                          onClick={() => setGeneralForm(prev => ({ ...prev, commissionType: ct }))}
                          style={{
                            flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                            border: `2px solid ${generalForm.commissionType === ct ? PRIMARY : BORDER}`,
                            background: generalForm.commissionType === ct ? PRIMARY_SOFT : CARD_BG,
                            color: generalForm.commissionType === ct ? PRIMARY : TEXT_MUTED,
                            cursor: 'pointer', transition: 'all 0.2s ease',
                          }}>
                          {ct === 'percentage' ? `% ${t.percentage}` : `💵 ${t.fixed}`}
                        </button>
                      ))}
                    </div>
                  </FormField>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <FormField label={t.firstVisitPrice}>
                      <input type="number" value={generalForm.firstVisitPrice}
                        onChange={e => setGeneralForm(prev => ({ ...prev, firstVisitPrice: e.target.value }))}
                        placeholder={t.pricePlaceholder} className="form-input" style={inputStyle(isAr)} />
                    </FormField>
                    <FormField label={t.followUpPrice}>
                      <input type="number" value={generalForm.followUpPrice}
                        onChange={e => setGeneralForm(prev => ({ ...prev, followUpPrice: e.target.value }))}
                        placeholder={t.pricePlaceholder} className="form-input" style={inputStyle(isAr)} />
                    </FormField>
                    <FormField label={t.firstVisitRate}>
                      <input type="number" value={generalForm.firstVisitCommissionRate}
                        onChange={e => setGeneralForm(prev => ({ ...prev, firstVisitCommissionRate: e.target.value }))}
                        placeholder={t.ratePlaceholder} className="form-input" style={inputStyle(isAr)} />
                    </FormField>
                    <FormField label={t.followUpRate}>
                      <input type="number" value={generalForm.followUpCommissionRate}
                        onChange={e => setGeneralForm(prev => ({ ...prev, followUpCommissionRate: e.target.value }))}
                        placeholder={t.ratePlaceholder} className="form-input" style={inputStyle(isAr)} />
                    </FormField>
                  </div>

                  <button type="button" onClick={handleSaveGeneral} disabled={savingGeneral}
                    style={{ marginTop: 16, background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 13, fontWeight: 600, cursor: savingGeneral ? 'not-allowed' : 'pointer', opacity: savingGeneral ? 0.7 : 1 }}>
                    {savingGeneral ? t.saving : t.saveGeneral}
                  </button>
                </div>

                {/* ═══ الاستثناءات ═══ */}
                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, marginBottom: 4 }}>{t.exceptionsTitle}</h3>
                      <p style={{ fontSize: 12, color: TEXT_MUTED }}>{t.exceptionsHint}</p>
                    </div>
                    {!showExceptionForm && (
                      <button type="button" onClick={openAddException}
                        style={{ background: PRIMARY_SOFT, color: PRIMARY, border: `1px solid ${PRIMARY}40`, borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {t.addException}
                      </button>
                    )}
                  </div>

                  {/* فورم إضافة/تعديل استثناء */}
                  {showExceptionForm && (
                    <div style={{ background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, marginTop: 12 }}>
                      <FormField label={t.selectTemplate}>
                        <SearchableSelect
                          isRtl={isAr}
                          value={exceptionTemplateId}
                          onChange={setExceptionTemplateId}
                          placeholder={t.selectTemplate}
                          disabled={!!editingExceptionId}
                          options={templates.map(tpl => ({ value: tpl.id, label: isAr ? tpl.name : (tpl.nameEn || tpl.name) }))}
                        />
                      </FormField>

                      <FormField label={t.commissionType}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {(['percentage', 'fixed'] as const).map(ct => (
                            <button key={ct} type="button"
                              onClick={() => setExceptionForm(prev => ({ ...prev, commissionType: ct }))}
                              style={{
                                flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                                border: `2px solid ${exceptionForm.commissionType === ct ? PRIMARY : BORDER}`,
                                background: exceptionForm.commissionType === ct ? CARD_BG : CARD_BG,
                                color: exceptionForm.commissionType === ct ? PRIMARY : TEXT_MUTED,
                                cursor: 'pointer',
                              }}>
                              {ct === 'percentage' ? `% ${t.percentage}` : `💵 ${t.fixed}`}
                            </button>
                          ))}
                        </div>
                      </FormField>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <FormField label={t.firstVisitPrice}>
                          <input type="number" value={exceptionForm.firstVisitPrice}
                            onChange={e => setExceptionForm(prev => ({ ...prev, firstVisitPrice: e.target.value }))}
                            placeholder={t.pricePlaceholder} className="form-input" style={inputStyle(isAr)} />
                        </FormField>
                        <FormField label={t.followUpPrice}>
                          <input type="number" value={exceptionForm.followUpPrice}
                            onChange={e => setExceptionForm(prev => ({ ...prev, followUpPrice: e.target.value }))}
                            placeholder={t.pricePlaceholder} className="form-input" style={inputStyle(isAr)} />
                        </FormField>
                        <FormField label={t.firstVisitRate}>
                          <input type="number" value={exceptionForm.firstVisitCommissionRate}
                            onChange={e => setExceptionForm(prev => ({ ...prev, firstVisitCommissionRate: e.target.value }))}
                            placeholder={t.ratePlaceholder} className="form-input" style={inputStyle(isAr)} />
                        </FormField>
                        <FormField label={t.followUpRate}>
                          <input type="number" value={exceptionForm.followUpCommissionRate}
                            onChange={e => setExceptionForm(prev => ({ ...prev, followUpCommissionRate: e.target.value }))}
                            placeholder={t.ratePlaceholder} className="form-input" style={inputStyle(isAr)} />
                        </FormField>
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                        <button type="button" onClick={handleSaveException} disabled={savingException}
                          style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 12.5, fontWeight: 600, cursor: savingException ? 'not-allowed' : 'pointer', opacity: savingException ? 0.7 : 1 }}>
                          {savingException ? t.saving : t.saveException}
                        </button>
                        <button type="button" onClick={() => setShowExceptionForm(false)}
                          style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '9px 18px', fontSize: 12.5, fontWeight: 500, color: TEXT_MUTED, cursor: 'pointer' }}>
                          {t.cancel2}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* قائمة الاستثناءات الموجودة */}
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {settings.filter(s => !s.isGeneral).length === 0 ? (
                      <p style={{ fontSize: 12.5, color: TEXT_MUTED, textAlign: 'center', padding: '16px 0' }}>{t.noExceptions}</p>
                    ) : settings.filter(s => !s.isGeneral).map(s => (
                      <div key={s.id} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>{s.templateName}</p>
                          <p style={{ fontSize: 11.5, color: TEXT_MUTED, margin: '3px 0 0' }}>
                            {s.commissionType === 'percentage' ? t.percentage : t.fixed}
                            {' · '}{t.firstVisitRate}: {s.firstVisitCommissionRate ?? '—'}
                            {' · '}{t.followUpRate}: {s.followUpCommissionRate ?? '—'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" onClick={() => openEditException(s)}
                            style={{ background: PRIMARY_SOFT, color: PRIMARY, border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
                            {t.edit}
                          </button>
                          <button type="button" onClick={() => handleDeleteException(s.id)}
                            style={{ background: ERROR_BG, color: ERROR_TEXT, border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
                            {t.delete}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}