import { useState, useEffect, useId, isValidElement, cloneElement } from 'react'
import api from '../api/axios'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER } from '../styles/theme'

// ✅ غيّر getImageUrl مع debugging:
const getImageUrl = (path?: string | null) => {
  if (!path) return ''

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${window.location.origin}${normalizedPath}`
}
 
const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

// ─── Global CSS with Comfortable Colors ──────────────────────────────────────
const globalCss = `

.settings-shell { animation: fade-up 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) both; }

/* Tabs Styles */
.tabs-container {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
  background: #FFFFFF;
  padding: 6px;
  border-radius: 20px;
  border: 1px solid #DCE5E5;
  width: fit-content;
}

.tab-btn {
  padding: 10px 24px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn.active {
  background: linear-gradient(135deg, #5B8C8F 0%, #4A7679 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(91, 140, 143, 0.2);
}

.tab-btn:not(.active) {
  color: #6B8A8C;
}

.tab-btn:not(.active):hover {
  background: #E8F0F0;
  color: #5B8C8F;
}

/* Form Styles */
.form-card {
  background: #FFFFFF;
  border-radius: 24px;
  border: 1px solid #DCE5E5;
  padding: 28px;
  margin-bottom: 24px;
  animation: slide-in 0.3s ease;
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  color: #2C3E3F;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #E8F0F0;
  display: inline-block;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #6B8A8C;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input, .form-textarea, .form-select {
  padding: 12px 16px;
  border: 1px solid #DCE5E5;
  border-radius: 14px;
  font-size: 14px;
  font-family: inherit;
  color: #2C3E3F;
  background: #FFFFFF;
  transition: all 0.2s ease;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: #5B8C8F;
  box-shadow: 0 0 0 3px rgba(91, 140, 143, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

/* Subscription Card */
.subscription-card {
  background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFA 100%);
  border-radius: 24px;
  border: 1px solid #DCE5E5;
  overflow: hidden;
}

.subscription-header {
  background: linear-gradient(135deg, #5B8C8F 0%, #4A7679 100%);
  padding: 24px;
  color: white;
  text-align: center;
}

.subscription-plan {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.subscription-period {
  font-size: 14px;
  opacity: 0.9;
}

.subscription-body {
  padding: 24px;
}

.subscription-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #E8F0F0;
  border-radius: 16px;
  margin-bottom: 20px;
}

.days-badge {
  background: #79674D;
  color: white;
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 20px;
  font-weight: 700;
}

/* Usage Bar */
.usage-item {
  margin-bottom: 16px;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
}

.usage-label {
  color: #6B8A8C;
}

.usage-value {
  font-weight: 600;
  color: #2C3E3F;
}

.usage-bar-bg {
  background: #E8F0F0;
  border-radius: 100px;
  height: 8px;
  overflow: hidden;
}

.usage-bar-fill {
  height: 100%;
  border-radius: 100px;
  background: linear-gradient(90deg, #5B8C8F, #8BAFB1);
  transition: width 0.8s ease;
}

.usage-bar-fill.high {
  background: linear-gradient(90deg, #79674D, #D4B78D);
}

/* Alert Messages */
.alert-success {
  background: #E8F0F0;
  border: 1px solid #5B8C8F;
  border-radius: 14px;
  padding: 14px 20px;
  color: #2C3E3F;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-error {
  background: #FDF5F5;
  border: 1px solid #79674D;
  border-radius: 14px;
  padding: 14px 20px;
  color: #79674D;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Buttons */
.btn-primary {
  background: #5B8C8F;
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary:hover:not(:disabled) {
  background: #4A7679;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(91, 140, 143, 0.2);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: #79674D;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  color: #b41e32;
}

/* Loading Screen */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60vh;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid #E8F0F0;
  border-top-color: #5B8C8F;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

/* Responsive */
@media(max-width: 768px) {
  .tabs-container {
    width: 100%;
  }
  .tab-btn {
    flex: 1;
    justify-content: center;
    padding: 8px 16px;
  }
  .form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .form-card {
    padding: 20px;
  }
}
`

// Comfortable color palette
const ERROR_TEXT = '#79674D'

// Translations
const T = {
  ar: {
    title: 'الإعدادات',
    clinic: 'بيانات العيادة',
    account: 'بيانات الحساب',
    subscription: 'الاشتراك',
    clinicInfo: 'بيانات العيادة',
    ownerInfo: 'بيانات المالك',
    name: 'اسم العيادة',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    address: 'العنوان',
    website: 'الموقع الإلكتروني',
    taxNumber: 'الرقم الضريبي',
    description: 'وصف العيادة',
    ownerName: 'اسم المالك',
    ownerPhone: 'هاتف المالك',
    ownerEmail: 'بريد المالك',
    fullName: 'الاسم الكامل',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    confirmPassword: 'تأكيد كلمة المرور',
    changePassword: 'تغيير كلمة المرور',
    save: 'حفظ البيانات',
    saving: 'جارٍ الحفظ...',
    currentPlan: 'الخطة الحالية',
    billingCycle: 'دورة الفوترة',
    expiryDate: 'تاريخ الانتهاء',
    daysRemaining: 'الأيام المتبقية',
    monthly: 'شهري',
    yearly: 'سنوي',
    day: 'يوم',
    patients: 'المرضى',
    doctors: 'الأطباء',
    users: 'المستخدمين',
    noSubscription: 'لا يوجد اشتراك نشط',
    error: 'حدث خطأ غير متوقع',
    passwordMismatch: 'كلمة المرور الجديدة غير متطابقة',
    saveSuccess: 'تم الحفظ بنجاح ✅',
    loading: 'جارٍ التحميل...',
  },
  en: {
    title: 'Settings',
    clinic: 'Clinic Info',
    account: 'Account Info',
    subscription: 'Subscription',
    clinicInfo: 'Clinic Information',
    ownerInfo: 'Owner Information',
    name: 'Clinic Name',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    website: 'Website',
    taxNumber: 'Tax Number',
    description: 'Description',
    ownerName: 'Owner Name',
    ownerPhone: 'Owner Phone',
    ownerEmail: 'Owner Email',
    fullName: 'Full Name',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    changePassword: 'Change Password',
    save: 'Save Changes',
    saving: 'Saving...',
    currentPlan: 'Current Plan',
    billingCycle: 'Billing Cycle',
    expiryDate: 'Expiry Date',
    daysRemaining: 'Days Remaining',
    monthly: 'Monthly',
    yearly: 'Yearly',
    day: 'days',
    patients: 'Patients',
    doctors: 'Doctors',
    users: 'Users',
    noSubscription: 'No active subscription',
    error: 'An unexpected error occurred',
    passwordMismatch: 'New password does not match',
    saveSuccess: 'Saved successfully ✅',
    loading: 'Loading...',
  },
}

// Form Field Component
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
    <div className="form-field">
      <label htmlFor={fieldId} className="form-label">{label} {required && <span style={{ color: ERROR_TEXT }}>*</span>}</label>
      {child}
      {error && <p id={errorId} role="alert" style={{ fontSize: 11, color: ERROR_TEXT, marginTop: 4 }}>{error}</p>}
    </div>
  )
}

// Usage Bar Component
const UsageBar = ({ label, current, max }: {
  label: string;
  current: number;
  max: number;
  lang: 'ar' | 'en';
}) => {
  const isUnlimited = max === -1
  const pct = isUnlimited ? 0 : Math.min((current / max) * 100, 100)
  const isHigh = pct > 85
 
  if (isUnlimited) {
    return (
      <div className="usage-item">
        <div className="usage-header">
          <span className="usage-label">{label}</span>
          <span className="usage-value">{current} / ∞</span>
        </div>
      </div>
    )
  }

  return (
    <div className="usage-item">
      <div className="usage-header">
        <span className="usage-label">{label}</span>
        <span className="usage-value">{current} / {max}</span>
      </div>
      <div className="usage-bar-bg">
        <div className={`usage-bar-fill ${isHigh ? 'high' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// Loading Screen
const SettingsLoadingScreen = ({ msg }: { msg: string }) => (
  <div className="loading-container">
    <div style={{ textAlign: 'center' }}>
      <div className="loading-spinner" />
      <p style={{ color: TEXT_MUTED }}>{msg}</p>
    </div>
  </div>
)

export default function Settings() {
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [activeTab, setActiveTab] = useState<'clinic' | 'account' | 'subscription'>('clinic')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') }
    catch { return {} }
  })()

  // Clinic Form
  const [clinicForm, setClinicForm] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    website: '',
    description: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    taxNumber: '',
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Account Form
  const [accountForm, setAccountForm] = useState({
    fullName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Subscription
  const [subscription, setSubscription] = useState<any>(null)

  // Inject styles
  useEffect(() => {
    const styleId = 'cura-settings-css'
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

  // Fetch data
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (user.clinicId) {
        const clinicRes = await api.get(`/clinics/${user.clinicId}`)
        const c = clinicRes.data
        setLogoUrl(c.logo || null)
        setClinicForm({
          name: c.name ?? '',
          phone: c.phone ?? '',
          address: c.address ?? '',
          email: c.email ?? '',
          website: c.website ?? '',
          description: c.description ?? '',
          ownerName: c.ownerName ?? '',
          ownerPhone: c.ownerPhone ?? '',
          ownerEmail: c.ownerEmail ?? '',
          taxNumber: c.taxNumber ?? '',
        })

        const subRes = await api.get(`/subscriptions/clinic/${user.clinicId}`)
        setSubscription(subRes.data)
      }
      setAccountForm(prev => ({ ...prev, fullName: user.fullName ?? '' }))
    } catch (err) {
      console.error(err)
      setError(T[lang].error)
      setTimeout(() => setError(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleClinicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setClinicForm({ ...clinicForm, [e.target.name]: e.target.value })
  }

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleLogoUpload = async () => {
    if (!logoFile || !user.clinicId) return
    setUploadingLogo(true); setError(''); setSuccess('')
    try {
      const formData = new FormData()
      formData.append('file', logoFile)
      const res = await api.post(`/clinics/${user.clinicId}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setLogoUrl(res.data.logo)
      setLogoFile(null)
      setLogoPreview(null)
      setSuccess(T[lang].saveSuccess)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || T[lang].error)
      setTimeout(() => setError(''), 3000)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountForm({ ...accountForm, [e.target.name]: e.target.value })
  }

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      await api.put(`/clinics/${user.clinicId}`, clinicForm)

      // ✅ لو فيه صورة شعار مختارة بانتظار الرفع، نرفعها هنا كمان — عشان "حفظ" وحد
      // يكفي لكل شي، بدل ما يحتاج المستخدم يتذكر يضغط زر "رفع الشعار" منفصل
      if (logoFile && user.clinicId) {
        const formData = new FormData()
        formData.append('file', logoFile)
        const logoRes = await api.post(`/clinics/${user.clinicId}/logo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setLogoUrl(logoRes.data.logo)
        setLogoFile(null)
        setLogoPreview(null)
      }

      setSuccess(T[lang].saveSuccess)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data || T[lang].error)
      setTimeout(() => setError(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
      setError(T[lang].passwordMismatch)
      setTimeout(() => setError(''), 3000)
      return
    }

    setSaving(true)
    try {
      await api.patch('/users/profile', {
        fullName: accountForm.fullName,
        currentPassword: accountForm.currentPassword || null,
        newPassword: accountForm.newPassword || null,
      })

      const updatedUser = { ...user, fullName: accountForm.fullName }
      localStorage.setItem('user', JSON.stringify(updatedUser))

      setSuccess(T[lang].saveSuccess)
      setAccountForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data || T[lang].error)
      setTimeout(() => setError(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const t = T[lang]
  const isAr = lang === 'ar'
  const font = isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif"

  if (loading) {
    return <SettingsLoadingScreen msg={t.loading} />
  }

  const tabs = [
    { key: 'clinic' as const, label: t.clinic, icon: '🏥' },
    { key: 'account' as const, label: t.account, icon: '👤' },
    { key: 'subscription' as const, label: t.subscription, icon: '💎' },
  ]

  return (
    <div className="settings-shell" style={{ fontFamily: font, direction: isAr ? 'rtl' : 'ltr', background: '#F8FAFA', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: PRIMARY_SOFT, border: `1px solid ${BORDER}`,
            borderRadius: 100, padding: '4px 16px', fontSize: 11,
            fontWeight: 600, color: PRIMARY, letterSpacing: '0.3px',
            marginBottom: 12,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, animation: 'soft-pulse 2s infinite' }} />
            {isAr ? 'إعدادات النظام' : 'System Settings'}
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', 'Georgia', serif", fontSize: 32, fontWeight: 500, color: TEXT_DARK, margin: 0, letterSpacing: '-0.3px' }}>
            ⚙️ {t.title}
          </h2>
          <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 8 }}>
            {isAr ? 'إدارة بيانات العيادة والحساب والاشتراك' : 'Manage clinic, account and subscription settings'}
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                setError('')
                setSuccess('')
              }}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        {error && (
          <div className="alert-error">
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} className="btn-icon">✕</button>
          </div>
        )}
        {success && (
          <div className="alert-success">
            <span>✅ {success}</span>
            <button onClick={() => setSuccess('')} className="btn-icon">✕</button>
          </div>
        )}

        {/* Clinic Tab */}
        {activeTab === 'clinic' && (
          <form onSubmit={handleSaveClinic}>
            <div className="form-card">
              <h3 className="form-title">🖼️ {isAr ? 'شعار العيادة' : 'Clinic Logo'}</h3>
              <p style={{ fontSize: 12.5, color: TEXT_MUTED, marginTop: -8, marginBottom: 18 }}>
                {isAr ? 'يظهر بصفحة تسجيل الدخول وبالمستندات المطبوعة (فواتير، تقارير)' : 'Shown on the login page and printed documents (invoices, reports)'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ width: 96, height: 96, borderRadius: 16, border: `1px solid ${BORDER}`, background: '#F8FAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {logoPreview || logoUrl ? (
<img 
  src={logoPreview || getImageUrl(logoUrl)} 
  alt="logo"
  onError={(e) => {
    console.error('Image failed to load:', (e.target as HTMLImageElement).src)
  }}
  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
/>                 ) : (
                    <span style={{ fontSize: 32, opacity: 0.3 }}>🏥</span>
                  )}
                </div>
                <div>
                  <input type="file" accept=".png,.jpg,.jpeg,.webp,.svg" onChange={handleLogoSelect} id="logo-input" style={{ display: 'none' }} />
                  <label htmlFor="logo-input" style={{ display: 'inline-block', cursor: 'pointer', marginBottom: 8, background: '#E8F0F0', color: '#5B8C8F', border: 'none', borderRadius: 12, padding: '9px 18px', fontSize: 13, fontWeight: 600 }}>
                    {isAr ? 'اختر صورة' : 'Choose Image'}
                  </label>
                  {logoFile && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button type="button" onClick={handleLogoUpload} disabled={uploadingLogo} className="btn-primary" style={{ padding: '8px 16px', fontSize: 12.5 }}>
                        {uploadingLogo ? T[lang].saving : (isAr ? 'رفع الشعار' : 'Upload Logo')}
                      </button>
                      <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null) }} style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 12, cursor: 'pointer' }}>
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  )}
                  <p style={{ fontSize: 10.5, color: TEXT_MUTED, marginTop: 6 }}>
                    {isAr ? 'PNG, JPG, WEBP, SVG — حتى 5 ميجا' : 'PNG, JPG, WEBP, SVG — up to 5 MB'}
                  </p>
                </div>
              </div>
            </div>

            <div className="form-card">
              <h3 className="form-title">🏥 {t.clinicInfo}</h3>
              <div className="form-grid">
                <FormField label={t.name} required>
                  <input name="name" value={clinicForm.name} onChange={handleClinicChange} className="form-input" required />
                </FormField>
                <FormField label={t.phone}>
                  <input name="phone" value={clinicForm.phone} onChange={handleClinicChange} className="form-input" />
                </FormField>
                <FormField label={t.email}>
                  <input type="email" name="email" value={clinicForm.email} onChange={handleClinicChange} className="form-input" />
                </FormField>
                <FormField label={t.website}>
                  <input name="website" value={clinicForm.website} onChange={handleClinicChange} className="form-input" />
                </FormField>
                <FormField label={t.address}>
                  <input name="address" value={clinicForm.address} onChange={handleClinicChange} className="form-input" />
                </FormField>
                <FormField label={t.taxNumber}>
                  <input name="taxNumber" value={clinicForm.taxNumber} onChange={handleClinicChange} className="form-input" />
                </FormField>
                <FormField label={t.description}>
                  <textarea name="description" value={clinicForm.description} onChange={handleClinicChange} className="form-textarea" rows={3} />
                </FormField>
              </div>
            </div>

            <div className="form-card">
              <h3 className="form-title">👤 {t.ownerInfo}</h3>
              <div className="form-grid">
                <FormField label={t.ownerName}>
                  <input name="ownerName" value={clinicForm.ownerName} onChange={handleClinicChange} className="form-input" />
                </FormField>
                <FormField label={t.ownerPhone}>
                  <input name="ownerPhone" value={clinicForm.ownerPhone} onChange={handleClinicChange} className="form-input" />
                </FormField>
                <FormField label={t.ownerEmail}>
                  <input type="email" name="ownerEmail" value={clinicForm.ownerEmail} onChange={handleClinicChange} className="form-input" />
                </FormField>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? t.saving : t.save}
              </button>
            </div>
          </form>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <form onSubmit={handleSaveAccount}>
            <div className="form-card">
              <h3 className="form-title">👤 {t.account}</h3>
              <div className="form-grid">
                <FormField label={t.fullName} required>
                  <input name="fullName" value={accountForm.fullName} onChange={handleAccountChange} className="form-input" required />
                </FormField>
              </div>

              <div style={{ marginTop: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
                  🔐 {t.changePassword}
                </h4>
                <div className="form-grid">
                  <FormField label={t.currentPassword}>
                    <input type="password" name="currentPassword" value={accountForm.currentPassword} onChange={handleAccountChange} className="form-input" />
                  </FormField>
                  <FormField label={t.newPassword}>
                    <input type="password" name="newPassword" value={accountForm.newPassword} onChange={handleAccountChange} className="form-input" />
                  </FormField>
                  <FormField label={t.confirmPassword}>
                    <input type="password" name="confirmPassword" value={accountForm.confirmPassword} onChange={handleAccountChange} className="form-input" />
                  </FormField>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? t.saving : t.save}
              </button>
            </div>
          </form>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="subscription-card">
            {subscription ? (
              <>
                <div className="subscription-header">
                  <div className="subscription-plan">💎 {subscription.planName}</div>
                  <div className="subscription-period">
                    {subscription.billingCycle === 'monthly' ? t.monthly : t.yearly}
                  </div>
                </div>
                <div className="subscription-body">
                  <div className="subscription-info">
                    <span style={{ color: TEXT_MUTED }}>{t.expiryDate}</span>
                    <span style={{ fontWeight: 600, color: TEXT_DARK }}>
                      {new Date(subscription.endDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>

                  <div className="subscription-info" style={{ background: subscription.daysRemaining <= 7 ? '#FDF5F5' : '#E8F0F0' }}>
                    <span style={{ color: TEXT_MUTED }}>{t.daysRemaining}</span>
                    <span className="days-badge" style={{ background: subscription.daysRemaining <= 7 ? ERROR_TEXT : PRIMARY }}>
                      {subscription.daysRemaining} {t.day}
                    </span>
                  </div>

                  <div style={{ paddingTop: 20, marginTop: 8, borderTop: `1px solid ${BORDER}` }}>
                    <UsageBar label={t.patients} current={subscription.currentPatients} max={subscription.maxPatients} lang={lang} />
                    <UsageBar label={t.doctors} current={subscription.currentDoctors} max={subscription.maxDoctors} lang={lang} />
                    <UsageBar label={t.users} current={subscription.currentUsers} max={subscription.maxUsers} lang={lang} />
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                <span style={{ fontSize: 64, opacity: 0.5 }}>💎</span>
                <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 16 }}>{t.noSubscription}</p>
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  )
}