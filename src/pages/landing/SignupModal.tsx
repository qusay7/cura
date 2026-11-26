import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { authService } from '../../api/axios'
import { C, type Lang } from './shared'

interface Props {
  open: boolean
  onClose: () => void
  lang: Lang
}

interface SignupResult {
  token: string
  refreshToken: string
  fullName: string
  email: string
  role: string
  clinicId: string
  clinicName: string
  timeFormat?: '12' | '24'
  country?: string
  currency?: string
  permissions: string[]
  subdomain: string
  username: string
  password: string
  trialEndsAt: string
  extraAccounts?: { role: string; username: string; password: string }[]
}

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9._-\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40)

const text = {
  ar: {
    title: 'ابدأ تجربتك المجانية',
    sub: 'تجربة مجانية لمدة 14 يوم — بدون بطاقة ائتمان',
    clinicName: 'اسم العيادة *',
    clinicNamePh: 'عيادة الأمل',
    subdomain: 'رابط عيادتك *',
    ownerName: 'اسمك *',
    ownerNamePh: 'أحمد محمد',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    contactHint: 'أدخل البريد أو الهاتف (واحد منهما على الأقل)',
    submit: 'إنشاء العيادة',
    submitting: 'جارِ الإنشاء...',
    close: 'إغلاق',
    successTitle: 'تم إنشاء عيادتك بنجاح!',
    successSub: 'احفظ بيانات الدخول هذه — ستحتاجها لاحقاً',
    subdomainLabel: 'الرابط',
    usernameLabel: 'اسم المستخدم',
    passwordLabel: 'كلمة المرور',
    extraAccountsTitle: 'حسابات جاهزة للعمل فوراً:',
    trialNote: (date: string) => `تجربتك المجانية فعّالة حتى ${date}`,
    goToDashboard: 'الدخول إلى لوحة التحكم ←',
    errGeneric: 'حدث خطأ، حاول مرة أخرى',
    errRequired: 'يرجى تعبئة الحقول المطلوبة',
    errContact: 'أدخل بريداً إلكترونياً أو رقم هاتف',
  },
  en: {
    title: 'Start your free trial',
    sub: '14-day free trial — no credit card required',
    clinicName: 'Clinic Name *',
    clinicNamePh: 'Al Amal Clinic',
    subdomain: 'Your clinic link *',
    ownerName: 'Your Name *',
    ownerNamePh: 'Ahmed Mohammed',
    email: 'Email',
    phone: 'Phone',
    contactHint: 'Enter an email or phone (at least one)',
    submit: 'Create Clinic',
    submitting: 'Creating...',
    close: 'Close',
    successTitle: 'Your clinic is ready!',
    successSub: 'Save these login details — you will need them later',
    subdomainLabel: 'Link',
    usernameLabel: 'Username',
    passwordLabel: 'Password',
    extraAccountsTitle: 'Also ready to use:',
    trialNote: (date: string) => `Your free trial is active until ${date}`,
    goToDashboard: 'Go to dashboard →',
    errGeneric: 'Something went wrong, please try again',
    errRequired: 'Please fill in the required fields',
    errContact: 'Enter an email or phone number',
  },
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', border: `1px solid ${C.border}`, borderRadius: 12,
  fontSize: 14, fontFamily: 'inherit', color: C.dark, background: C.white, outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: 'block',
}

export default function SignupModal({ open, onClose, lang }: Props) {
  const isAr = lang === 'ar'
  const t = text[lang]
  const navigate = useNavigate()

  const [clinicName, setClinicName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [subdomainTouched, setSubdomainTouched] = useState(false)
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<SignupResult | null>(null)

  if (!open) return null

  const handleClinicNameChange = (value: string) => {
    setClinicName(value)
    if (!subdomainTouched) setSubdomain(slugify(value))
  }

  const reset = () => {
    setClinicName(''); setSubdomain(''); setSubdomainTouched(false)
    setOwnerName(''); setEmail(''); setPhone('')
    setError(''); setResult(null)
  }

  const handleClose = () => {
    if (submitting) return
    reset()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicName.trim() || !subdomain.trim() || !ownerName.trim()) {
      setError(t.errRequired)
      return
    }
    if (!email.trim() && !phone.trim()) {
      setError(t.errContact)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const res = await api.post<SignupResult>(`/public/signup?lang=${lang}`, {
        clinicName: clinicName.trim(),
        subdomain: subdomain.trim(),
        ownerName: ownerName.trim(),
        ownerEmail: email.trim() || null,
        ownerPhone: phone.trim() || null,
      })
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data || t.errGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEnterDashboard = () => {
    if (!result) return
    authService.setTokens(result.token, result.refreshToken)
    localStorage.setItem('clinicSubdomain', result.subdomain)
    localStorage.setItem('user', JSON.stringify({
      fullName: result.fullName,
      email: result.email,
      role: result.role,
      clinicId: result.clinicId,
      clinicName: result.clinicName,
    }))
    localStorage.setItem('permissions', JSON.stringify(result.permissions || []))
    localStorage.setItem('cura-timeFormat', result.timeFormat === '12' ? '12' : '24')
    if (result.country) localStorage.setItem('cura-country', result.country)
    if (result.currency) localStorage.setItem('cura-currency', result.currency)
    navigate('/dashboard')
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,31,31,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          background: C.white, borderRadius: 24, padding: 32, maxWidth: 440, width: '100%',
          maxHeight: '90vh', overflowY: 'auto', fontFamily: isAr ? "'Noto Kufi Arabic', sans-serif" : "'Inter', sans-serif",
        }}
      >
        {!result ? (
          <>
            <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 26, color: C.dark, marginBottom: 4 }}>{t.title}</h2>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>{t.sub}</p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{t.clinicName}</label>
                <input style={inputStyle} value={clinicName} placeholder={t.clinicNamePh}
                  onChange={(e) => handleClinicNameChange(e.target.value)} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{t.subdomain}</label>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                  <input
                    style={{ ...inputStyle, border: 'none', flex: 1 }}
                    value={subdomain}
                    onChange={(e) => { setSubdomainTouched(true); setSubdomain(slugify(e.target.value)) }}
                  />
                  <span style={{ padding: '0 14px', fontSize: 13, color: C.muted, whiteSpace: 'nowrap' }}>.cura.jo</span>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{t.ownerName}</label>
                <input style={inputStyle} value={ownerName} placeholder={t.ownerNamePh}
                  onChange={(e) => setOwnerName(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 6 }}>
                <div>
                  <label style={labelStyle}>{t.email}</label>
                  <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>{t.phone}</label>
                  <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <p style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>{t.contactHint}</p>

              {error && (
                <div style={{ background: '#FDF5F5', border: '1px solid #C0392B', borderRadius: 12, padding: '10px 14px', marginBottom: 16, color: '#C0392B', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? t.submitting : t.submit}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 24, color: C.dark, marginBottom: 4 }}>{t.successTitle}</h2>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>{t.successSub}</p>

            <div style={{ background: C.tealSoft, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, marginBottom: 16 }}>
              {[
                { label: t.subdomainLabel, value: `${result.subdomain}.cura.jo` },
                { label: t.usernameLabel, value: result.username },
                { label: t.passwordLabel, value: result.password },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.dark, fontFamily: 'monospace' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {result.extraAccounts && result.extraAccounts.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8 }}>{t.extraAccountsTitle}</p>
                {result.extraAccounts.map((acc) => (
                  <div key={acc.role} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 12.5 }}>
                    <span style={{ fontWeight: 700, color: C.dark }}>{acc.role}</span>
                    <span style={{ color: C.muted }}>👤 {acc.username}</span>
                    <span style={{ color: C.muted, fontFamily: 'monospace' }}>🔑 {acc.password}</span>
                  </div>
                ))}
              </div>
            )}

            <p style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>
              {t.trialNote(new Date(result.trialEndsAt).toLocaleDateString(isAr ? 'ar' : 'en'))}
            </p>

            <button onClick={handleEnterDashboard} className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }}>
              {t.goToDashboard}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
