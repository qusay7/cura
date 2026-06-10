import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getRole } from '../utils/permissions'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const ERROR_TEXT = '#C4A77D'

export default function AddUser() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lang] = useState<'ar' | 'en'>(getStoredLang())
  const isAr = lang === 'ar'
  const currentRole = getRole()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [form, setForm] = useState({
    fullName:  '',
    email:     '',
    password:  '',
    role:      '',
    clinicId:  user.clinicId || '',
  })

  // الأدوار المتاحة حسب الدور الحالي
  const availableRoles = () => {
    if (currentRole === 'SuperAdmin') {
      return [
        { value: 'ClinicAdmin',   label: isAr ? 'مدير عيادة'       : 'Clinic Admin' },
        { value: 'Doctor',        label: isAr ? 'طبيب'              : 'Doctor' },
        { value: 'Receptionist',  label: isAr ? 'موظف استقبال'     : 'Receptionist' },
        { value: 'ClinicStaff',   label: isAr ? 'موظف الشركة'      : 'Clinic Staff' },
      ]
    }
    // ClinicAdmin يضيف فقط Doctor و Receptionist
    return [
      { value: 'Doctor',       label: isAr ? 'طبيب'          : 'Doctor' },
      { value: 'Receptionist', label: isAr ? 'موظف استقبال' : 'Receptionist' },
    ]
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.fullName.trim()) return setError(isAr ? 'الاسم مطلوب' : 'Name is required')
    if (!form.email.trim())    return setError(isAr ? 'البريد مطلوب' : 'Email is required')
    if (!form.password.trim()) return setError(isAr ? 'كلمة المرور مطلوبة' : 'Password is required')
    if (!form.role)            return setError(isAr ? 'الدور مطلوب' : 'Role is required')

    if (form.password.length < 6)
      return setError(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters')

    setLoading(true)
    try {
      await api.post('/users', {
        fullName: form.fullName,
        email:    form.email,
        password: form.password,
        role:     form.role,
        clinicId: form.clinicId || null,
      })
      setSuccess(isAr ? 'تم إنشاء المستخدم بنجاح ✅' : 'User created successfully ✅')
      setForm({ ...form, fullName: '', email: '', password: '', role: '' })
    } catch (err: any) {
      const errData = err.response?.data
      if (typeof errData === 'string') setError(errData)
      else setError(isAr ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ background: '#F8FAFA', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}
          >
            ← {isAr ? 'رجوع' : 'Back'}
          </button>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: PRIMARY_SOFT, border: `1px solid ${BORDER}`,
            borderRadius: 100, padding: '4px 16px', fontSize: 11,
            fontWeight: 600, color: PRIMARY, marginBottom: 12,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY }} />
            {isAr ? 'مستخدم جديد' : 'New User'}
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 28, fontWeight: 500, color: TEXT_DARK, margin: 0,
          }}>
            {isAr ? 'إضافة مستخدم' : 'Add User'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{
            background: CARD_BG, border: `1px solid ${BORDER}`,
            borderRadius: 20, padding: 28,
          }}>

            {/* الاسم */}
            <Field label={isAr ? 'الاسم الكامل *' : 'Full Name *'} isAr={isAr}>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder={isAr ? 'أدخل الاسم الكامل' : 'Enter full name'}
                style={inputStyle}
              />
            </Field>

            {/* البريد */}
            <Field label={isAr ? 'البريد الإلكتروني *' : 'Email *'} isAr={isAr}>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@clinic.com"
                style={inputStyle}
              />
            </Field>

            {/* كلمة المرور */}
            <Field label={isAr ? 'كلمة المرور *' : 'Password *'} isAr={isAr}>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={inputStyle}
              />
            </Field>

            {/* الدور */}
            <Field label={isAr ? 'الدور *' : 'Role *'} isAr={isAr}>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">{isAr ? 'اختر دوراً...' : 'Select role...'}</option>
                {availableRoles().map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </Field>

            {/* خطأ / نجاح */}
            {error && (
              <div style={{
                background: '#FDF5F5', border: `1px solid ${ERROR_TEXT}40`,
                borderRadius: 12, padding: '12px 16px', marginBottom: 20,
                fontSize: 13, color: ERROR_TEXT,
              }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{
                background: '#F0F8F0', border: '1px solid #4A767940',
                borderRadius: 12, padding: '12px 16px', marginBottom: 20,
                fontSize: 13, color: '#4A7679',
              }}>
                {success}
              </div>
            )}

            {/* أزرار */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1, background: PRIMARY, color: '#FFFFFF',
                  border: 'none', borderRadius: 12, padding: '12px',
                  fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1, transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#4A7679' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = PRIMARY }}
              >
                {loading
                  ? (isAr ? 'جارٍ الحفظ...' : 'Saving...')
                  : (isAr ? 'إضافة المستخدم' : 'Add User')}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  padding: '12px 24px', background: 'transparent',
                  border: `1px solid ${BORDER}`, borderRadius: 12,
                  fontSize: 14, color: TEXT_MUTED, cursor: 'pointer',
                }}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}

// ─── مكوّنات مساعدة ───
function Field({ label,  children }: {
  label: string; isAr: boolean; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600,
        color: '#6B8A8C', marginBottom: 8, letterSpacing: '0.5px',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#FFFFFF',
  border: '1px solid #DCE5E5',
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 14,
  color: '#2C3E3F',
  outline: 'none',
  transition: 'all 0.2s ease',
}