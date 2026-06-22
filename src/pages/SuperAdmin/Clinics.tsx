import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const globalCss = `
@keyframes fade-up { 
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes soft-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slide-in {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}
.clinics-shell { animation: fade-up 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) both; }
.form-container {
  background: #FFFFFF; border-radius: 28px; border: 1px solid #DCE5E5;
  padding: 28px; margin-bottom: 28px; animation: slide-in 0.3s ease;
}
.form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 12px; font-weight: 600; color: #6B8A8C; text-transform: uppercase; letter-spacing: 0.5px; }
.form-input {
  padding: 12px 16px; border: 1px solid #DCE5E5; border-radius: 14px;
  font-size: 14px; font-family: inherit; color: #2C3E3F; background: #FFFFFF; transition: all 0.2s ease;
}
.form-input:focus { outline: none; border-color: #5B8C8F; box-shadow: 0 0 0 3px rgba(91, 140, 143, 0.1); }
.table-container { background: #FFFFFF; border-radius: 24px; border: 1px solid #DCE5E5; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.clinics-table { width: 100%; border-collapse: collapse; }
.clinics-table th { padding: 14px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6B8A8C; background: #F8FAFA; border-bottom: 1px solid #DCE5E5; text-transform: uppercase; letter-spacing: 0.5px; }
.clinics-table td { padding: 14px 16px; font-size: 13px; color: #2C3E3F; border-bottom: 1px solid #DCE5E5; }
.clinics-table tr:last-child td { border-bottom: none; }
.clinic-row { transition: background 0.2s ease; }
.clinic-row:hover { background: #E8F0F0; }
.status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 500; }
.status-active { background: rgba(74,118,121,0.15); color: #4A7679; }
.status-inactive { background: rgba(196,167,125,0.15); color: #C4A77D; }
.btn-primary { background: #5B8C8F; color: white; border: none; border-radius: 14px; padding: 10px 24px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 8px; }
.btn-primary:hover { background: #4A7679; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(91,140,143,0.2); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.btn-secondary { background: transparent; border: 1px solid #DCE5E5; border-radius: 14px; padding: 10px 20px; font-size: 13px; font-weight: 500; color: #6B8A8C; cursor: pointer; transition: all 0.2s ease; }
.btn-secondary:hover { background: #E8F0F0; border-color: #5B8C8F; }
.btn-details { background: #E8F0F0; border: 1px solid #DCE5E5; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 500; color: #5B8C8F; cursor: pointer; transition: all 0.2s ease; }
.btn-details:hover { background: #5B8C8F; color: white; border-color: #5B8C8F; }
.btn-toggle { border: none; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; }
.btn-toggle-active { background: rgba(196,167,125,0.15); color: #C4A77D; }
.btn-toggle-active:hover { background: #C4A77D; color: white; }
.btn-toggle-inactive { background: rgba(74,118,121,0.15); color: #4A7679; }
.btn-toggle-inactive:hover { background: #4A7679; color: white; }
.alert-error { background: #FDF5F5; border: 1px solid #C4A77D; border-radius: 14px; padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; color: #C4A77D; }
.alert-success { background: #E8F0F0; border: 1px solid #5B8C8F; border-radius: 14px; padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; color: #2C3E3F; }
.loading-container { display: flex; align-items: center; justify-content: center; height: 60vh; }
.loading-spinner { width: 48px; height: 48px; border-radius: 50%; border: 3px solid #E8F0F0; border-top-color: #5B8C8F; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
.empty-state { text-align: center; padding: 60px 24px; }
.empty-icon { font-size: 64px; opacity: 0.5; margin-bottom: 16px; }
@media(max-width: 1024px) { .form-grid { grid-template-columns: repeat(2, 1fr); } }
@media(max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
  .form-container { padding: 20px; }
  .table-container { overflow-x: auto; }
  .clinics-table { min-width: 600px; }
}
`

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const WARNING = '#C4A77D'

interface Clinic {
  id: string
  name: string
  subdomain: string
  phone?: string
  email?: string
  ownerName?: string
  isActive: boolean
  createdAt: string
}

interface Plan {
  id: string
  name: string
  monthlyPrice: number
  yearlyPrice: number
  maxDoctors: number
  maxPatients: number
  maxUsers: number
  isActive: boolean
}

const getFieldLabels = (lang: 'ar' | 'en') => {
  const isAr = lang === 'ar'
  return [
    { key: 'name',               label: isAr ? 'اسم العيادة *'        : 'Clinic Name *',        placeholder: isAr ? 'عيادة الأمل'          : 'Al Amal Clinic',       required: true  },
    { key: 'subDomain',          label: isAr ? 'النطاق الفرعي *'      : 'Subdomain *',          placeholder: 'alamal',                                               required: true  },
    { key: 'phone',              label: isAr ? 'الهاتف'               : 'Phone',                placeholder: '05xxxxxxxx',                                           required: false },
    { key: 'email',              label: isAr ? 'البريد الإلكتروني'    : 'Email',                placeholder: 'clinic@example.com',                                   required: false },
    { key: 'address',            label: isAr ? 'العنوان'              : 'Address',              placeholder: isAr ? 'عمان، الأردن'         : 'Amman, Jordan',        required: false },
    { key: 'website',            label: isAr ? 'الموقع الإلكتروني'   : 'Website',              placeholder: 'https://example.com',                                  required: false },
    { key: 'ownerName',          label: isAr ? 'اسم المالك'           : 'Owner Name',           placeholder: isAr ? 'أحمد محمد'            : 'Ahmed Mohammed',       required: false },
    { key: 'ownerEmail',         label: isAr ? 'بريد المالك'          : 'Owner Email',          placeholder: 'owner@example.com',                                    required: false },
    { key: 'ownerPhone',         label: isAr ? 'هاتف المالك'          : 'Owner Phone',          placeholder: '05xxxxxxxx',                                           required: false },
    { key: 'taxNumber',          label: isAr ? 'الرقم الضريبي'        : 'Tax Number',           placeholder: '300xxxxxxxxx',                                         required: false },
    { key: 'commercialRegister', label: isAr ? 'السجل التجاري'        : 'Commercial Register',  placeholder: '10xxxxxxxx',                                           required: false },
    { key: 'description',        label: isAr ? 'الوصف'               : 'Description',          placeholder: isAr ? 'نبذة عن العيادة...'   : 'About the clinic...',  required: false },
  ]
}

const ClinicsLoadingScreen = ({ msg }: { msg: string }) => (
  <div className="loading-container">
    <div style={{ textAlign: 'center' }}>
      <div className="loading-spinner" />
      <p style={{ color: TEXT_MUTED }}>{msg}</p>
    </div>
  </div>
)

export default function SuperAdminClinics() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const emptyForm = {
    name: '', subDomain: '', phone: '', email: '',
    address: '', website: '', ownerName: '',
    ownerEmail: '', ownerPhone: '', taxNumber: '',
    commercialRegister: '', description: '',
    invoiceId: '', invoiceKey: '', logo: '',
  }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    const styleId = 'cura-clinics-css'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = globalCss
      document.head.appendChild(style)
    }
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  useEffect(() => {
    fetchClinics()
    fetchPlans()
  }, [])

  const fetchClinics = async () => {
    try {
      const res = await api.get('/clinics')
      setClinics(res.data)
    } catch {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans')
      setPlans(res.data.filter((p: Plan) => p.isActive))
    } catch {}
  }

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const subdomainRegex = /^[a-z0-9._-]+$/i
    if (!subdomainRegex.test(form.subDomain)) {
      setError(isAr
        ? 'Subdomain يجب أن يحتوي على أحرف إنجليزية وأرقام ورموز فقط'
        : 'Subdomain must contain only English letters, numbers, and symbols')
      return
    }

    if (!selectedPlan) {
      setError(isAr ? 'يرجى اختيار خطة الاشتراك' : 'Please select a subscription plan')
      return
    }

    setSaving(true)
    try {
      // 1 — إنشاء العيادة
        const clinicRes = await api.post('/clinics', form)
        const clinic = clinicRes.data
        console.log('Clinic created:', clinic)
        console.log('Clinic ID:', clinic.id)

      // 2 — إنشاء ClinicAdmin
      await api.post('/users', {
        fullName: form.name,
        username: form.subDomain,
        email: `${form.subDomain}@CURA.com`,
        password: `${form.subDomain}@123`,
        role: 'ClinicAdmin',
        clinicId: clinic.id,
      })

      // 3 — إنشاء الاشتراك
      const plan = plans.find(p => p.id === selectedPlan)
      const price = billingCycle === 'monthly' ? plan?.monthlyPrice : plan?.yearlyPrice
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + (billingCycle === 'monthly' ? 1 : 12))

      await api.post('/subscriptions', {
        clinicId: clinic.id,
        planId: selectedPlan,
        billingCycle,
        pricePaid: price,
        startDate: new Date().toISOString(),
        endDate: endDate.toISOString(),
      })

      // ✅ 4 — إنشاء الأدوار الأساسية
      await api.post(`/roles/seed-defaults/${clinic.id}`)

      // ✅ 5 — إنشاء الأقسام الافتراضية
 
console.log('Calling departments seed for:', clinic.id)
const deptRes = await api.post(`/departments/seed-defaults/${clinic.id}`)
console.log('Departments result:', deptRes.data)

      setSuccess(
        isAr
          ? `تم إنشاء العيادة والمدير والاشتراك والأدوار بنجاح!\n👤 Username: ${form.subDomain}\n🔑 Password: ${form.subDomain}@123`
          : `Clinic, admin, subscription and roles created!\n👤 Username: ${form.subDomain}\n🔑 Password: ${form.subDomain}@123`
      )
      setShowForm(false)
      setForm(emptyForm)
      setSelectedPlan('')
      setBillingCycle('monthly')
      fetchClinics()
      setTimeout(() => setSuccess(''), 12000)
    } catch (err: any) {
      setError(err.response?.data || (isAr ? 'حدث خطأ' : 'An error occurred'))
      setTimeout(() => setError(''), 5000)
    } finally {
      setSaving(false)
    }
  }
  
  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/clinics/${id}/toggle`)
      setClinics(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c))
    } catch {
      alert('حدث خطأ')
    }
  }

  const fields = getFieldLabels(lang)

  const t = {
    title:       lang === 'ar' ? 'إدارة العيادات'     : 'Clinics Management',
    addClinic:   lang === 'ar' ? 'إضافة عيادة'        : 'Add Clinic',
    newClinic:   lang === 'ar' ? 'عيادة جديدة'        : 'New Clinic',
    save:        lang === 'ar' ? 'حفظ العيادة'        : 'Save Clinic',
    cancel:      lang === 'ar' ? 'إلغاء'              : 'Cancel',
    saving:      lang === 'ar' ? 'جاري الحفظ...'     : 'Saving...',
    details:     lang === 'ar' ? 'تفاصيل'             : 'Details',
    activate:    lang === 'ar' ? 'تفعيل'              : 'Activate',
    deactivate:  lang === 'ar' ? 'إيقاف'              : 'Deactivate',
    active:      lang === 'ar' ? 'نشطة'               : 'Active',
    inactive:    lang === 'ar' ? 'موقوفة'             : 'Inactive',
    clinicName:  lang === 'ar' ? 'العيادة'            : 'Clinic',
    subdomain:   lang === 'ar' ? 'النطاق الفرعي'      : 'Subdomain',
    owner:       lang === 'ar' ? 'المالك'             : 'Owner',
    phone:       lang === 'ar' ? 'الهاتف'             : 'Phone',
    status:      lang === 'ar' ? 'الحالة'             : 'Status',
    actions:     lang === 'ar' ? 'إجراءات'            : 'Actions',
    noClinics:   lang === 'ar' ? 'لا توجد عيادات مسجلة' : 'No clinics registered',
    loading:     lang === 'ar' ? 'جاري التحميل...'   : 'Loading...',
    planSection: lang === 'ar' ? 'خطة الاشتراك *'    : 'Subscription Plan *',
    monthly:     lang === 'ar' ? 'شهري'              : 'Monthly',
    yearly:      lang === 'ar' ? 'سنوي'              : 'Yearly',
    noPlans:     lang === 'ar' ? 'لا توجد خطط متاحة — أنشئ خطة أولاً' : 'No plans available — create a plan first',
    selected:    lang === 'ar' ? 'محدد'              : 'Selected',
    doctors:     lang === 'ar' ? 'أطباء'             : 'doctors',
    patients:    lang === 'ar' ? 'مرضى'              : 'patients',
    sar:         lang === 'ar' ? 'ر.س'              : 'SAR',
    mo:          lang === 'ar' ? 'شهر'              : 'mo',
    yr:          lang === 'ar' ? 'سنة'              : 'yr',
  }

  const isAr = lang === 'ar'
  const font = isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif"

  if (loading) return <ClinicsLoadingScreen msg={t.loading} />

  return (
    <div className="clinics-shell" style={{ fontFamily: font, direction: isAr ? 'rtl' : 'ltr', background: '#F8FAFA', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 100, padding: '4px 16px', fontSize: 11, fontWeight: 600, color: PRIMARY, marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, animation: 'soft-pulse 2s infinite' }} />
            SuperAdmin
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display','Georgia',serif", fontSize: 32, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>
            🏥 {t.title}
          </h2>
          <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 8 }}>
            📊 {clinics.length} {isAr ? 'عيادة مسجلة' : 'registered clinics'}
          </p>
        </div>

        {/* Action Button */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <span>{showForm ? '✕' : '+'}</span>
            {showForm ? (isAr ? 'إغلاق' : 'Close') : t.addClinic}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="alert-error">
            <span style={{ whiteSpace: 'pre-line' }}>⚠️ {error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', flexShrink: 0 }}>✕</button>
          </div>
        )}
        {success && (
          <div className="alert-success">
            <span style={{ whiteSpace: 'pre-line' }}>✅ {success}</span>
            <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', flexShrink: 0 }}>✕</button>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="form-container">
            <h3 style={{ fontSize: 18, fontWeight: 600, color: TEXT_DARK, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              ➕ {t.newClinic}
            </h3>

            <form onSubmit={handleSubmit}>
              {/* Fields Grid */}
              <div className="form-grid">
                {fields.map(f => (
                  <div key={f.key} className="form-field">
                    <label className="form-label">{f.label}</label>
                    <input
                      type={f.key === 'email' || f.key === 'ownerEmail' ? 'email' : 'text'}
                      value={form[f.key as keyof typeof form]}
                      onChange={e => {
                        let val = e.target.value
                        if (f.key === 'subDomain') {
                          val = val.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase()
                        }
                        setForm({ ...form, [f.key]: val })
                      }}
                      placeholder={f.placeholder}
                      className="form-input"
                      required={f.required}
                    />
                    {/* Preview للـ Subdomain */}
                    {f.key === 'subDomain' && form.subDomain && (
                      <div style={{ marginTop: 6, padding: '8px 12px', background: '#F0F8F0', borderRadius: 8, fontSize: 11, color: '#4A7679', border: '1px solid #4A767940', lineHeight: 1.8 }}>
                        👤 Username: <strong>{form.subDomain}</strong><br />
                        📧 Email: <strong>{form.subDomain}@CURA.com</strong><br />
                        🔑 Password: <strong>{form.subDomain}@123</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* ✅ قسم الاشتراك */}
              <div style={{ marginTop: 28, padding: '20px 24px', background: PRIMARY_SOFT, borderRadius: 16, border: `1px solid ${BORDER}` }}>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: TEXT_DARK, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  💎 {t.planSection}
                </h4>

                {/* Billing Cycle Toggle */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  {(['monthly', 'yearly'] as const).map(cycle => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setBillingCycle(cycle)}
                      style={{
                        padding: '8px 24px', borderRadius: 10, fontSize: 13,
                        fontWeight: 600, cursor: 'pointer', border: 'none',
                        background: billingCycle === cycle ? PRIMARY : CARD_BG,
                        color: billingCycle === cycle ? '#fff' : TEXT_MUTED,
                        transition: 'all 0.2s',
                        boxShadow: billingCycle === cycle ? '0 2px 8px rgba(91,140,143,0.2)' : 'none',
                      }}
                    >
                      {cycle === 'monthly' ? `📅 ${t.monthly}` : `📆 ${t.yearly}`}
                    </button>
                  ))}
                  {billingCycle === 'yearly' && (
                    <span style={{ fontSize: 11, color: '#4A7679', fontWeight: 600, alignSelf: 'center', background: '#4A767920', padding: '4px 10px', borderRadius: 100 }}>
                      🎉 {isAr ? 'وفر أكثر!' : 'Save more!'}
                    </span>
                  )}
                </div>

                {/* Plans Grid */}
                {plans.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', background: CARD_BG, borderRadius: 12 }}>
                    <p style={{ fontSize: 13, color: WARNING }}>⚠️ {t.noPlans}</p>
                    <button
                      type="button"
                      onClick={() => navigate('/superadmin/plans')}
                      style={{ marginTop: 8, background: PRIMARY, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer' }}
                    >
                      {isAr ? 'إنشاء خطة' : 'Create Plan'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {plans.map(plan => {
                      const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
                      const isSelected = selectedPlan === plan.id
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan.id)}
                          style={{
                            padding: '16px', borderRadius: 14, cursor: 'pointer',
                            border: `2px solid ${isSelected ? PRIMARY : BORDER}`,
                            background: isSelected ? `${PRIMARY}10` : CARD_BG,
                            transition: 'all 0.2s',
                            position: 'relative',
                          }}
                        >
                          {isSelected && (
                            <div style={{ position: 'absolute', top: 8, insetInlineEnd: 8, width: 20, height: 20, borderRadius: '50%', background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>
                              ✓
                            </div>
                          )}
                          <p style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, margin: '0 0 8px' }}>
                            {plan.name === 'Basic' ? '🥉' : plan.name === 'Standard' ? '🥈' : '🥇'} {plan.name}
                          </p>
                          <p style={{ fontSize: 22, fontWeight: 700, color: PRIMARY, margin: '0 0 8px' }}>
                            {price}
                            <span style={{ fontSize: 11, color: TEXT_MUTED }}>
                              {' '}{t.sar}/{billingCycle === 'monthly' ? t.mo : t.yr}
                            </span>
                          </p>
                          <div style={{ fontSize: 11, color: TEXT_MUTED, lineHeight: 1.8 }}>
                            <div>👨‍⚕️ {plan.maxDoctors === -1 ? '∞' : plan.maxDoctors} {t.doctors}</div>
                            <div>👥 {plan.maxPatients === -1 ? '∞' : plan.maxPatients} {t.patients}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                <button type="submit" disabled={saving || !selectedPlan} className="btn-primary">
                  {saving ? `⏳ ${t.saving}` : `💾 ${t.save}`}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setSelectedPlan(''); setBillingCycle('monthly') }} className="btn-secondary">
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="table-container">
          <table className="clinics-table">
            <thead>
              <tr>
                <th>{t.clinicName}</th>
                <th>{t.subdomain}</th>
                <th>{t.owner}</th>
                <th>{t.phone}</th>
                <th>{t.status}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {clinics.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-icon">🏥</div>
                      <p style={{ fontSize: 14, color: TEXT_MUTED }}>{t.noClinics}</p>
                    </div>
                  </td>
                </tr>
              ) : clinics.map(clinic => (
                <tr key={clinic.id} className="clinic-row">
                  <td>
                    <p style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, margin: 0 }}>{clinic.name}</p>
                    <p style={{ fontSize: 11, color: TEXT_MUTED, margin: '2px 0 0' }}>
                      {new Date(clinic.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </p>
                  </td>
                  <td style={{ fontSize: 13, color: TEXT_MUTED }}>{clinic.subdomain}</td>
                  <td style={{ fontSize: 13, color: TEXT_MUTED }}>{clinic.ownerName || '—'}</td>
                  <td style={{ fontSize: 13, color: TEXT_MUTED }}>{clinic.phone || '—'}</td>
                  <td>
                    <span className={`status-badge ${clinic.isActive ? 'status-active' : 'status-inactive'}`}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                      {clinic.isActive ? t.active : t.inactive}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => navigate(`/superadmin/clinics/${clinic.id}`)} className="btn-details">
                        ✏️ {t.details}
                      </button>
                      <button onClick={() => handleToggle(clinic.id)} className={`btn-toggle ${clinic.isActive ? 'btn-toggle-active' : 'btn-toggle-inactive'}`}>
                        {clinic.isActive ? `🔴 ${t.deactivate}` : `🟢 ${t.activate}`}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}