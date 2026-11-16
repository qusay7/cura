import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import SearchableSelect from '../components/SearchableSelect'
import { useSubmitGuard } from '../hooks/useSubmitGuard'
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning'
import { showMessageBox } from '../utils/messageBox'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'

export default function EditUser() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [success, setSuccess] = useState('')
  const [loadingUser, setLoadingUser] = useState(true)
  const [lang] = useState<'ar' | 'en'>(getStoredLang())
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [roles, setRoles] = useState<{ id: string; name: string; nameEn: string|null; description: string|null }[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const isAr = lang === 'ar'

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [form, setForm] = useState({
    fullName: '', username: '', password: '',
    role: '', clinicId: user.clinicId || '',
    departmentId: '',
  })
  useUnsavedChangesWarning(form)

  useEffect(() => {
    if (!id) return
    api.get(`/users/${id}`)
      .then(res => {
        const u = res.data
        setForm(prev => ({
          ...prev,
          fullName: u.fullName || '',
          username: u.username || '',
          role: u.role || '',
          clinicId: u.clinicId || prev.clinicId,
          departmentId: u.departmentId || '',
        }))
      })
      .catch(() => {
        showMessageBox(isAr ? 'تعذّر تحميل بيانات المستخدم' : 'Failed to load user data', 'error')
        navigate('/users')
      })
      .finally(() => setLoadingUser(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (user.clinicId) {
      api.get('/departments')
        .then(res => setDepartments(res.data.filter((d: any) => d.isActive)))
        .catch(() => {})
    }
  }, [])

  // ✅ نفس منطق AddUser — الأدوار وتسمياتها من قاعدة البيانات بالكامل
  useEffect(() => {
    if (!form.clinicId) return
    setRolesLoading(true)
    api.get('/roles', { params: { clinicId: form.clinicId } })
      .then(res => setRoles(res.data.map((r: any) => ({ id: r.id, name: r.name, nameEn: r.nameEn, description: r.description }))))
      .catch(() => setRoles([]))
      .finally(() => setRolesLoading(false))
  }, [form.clinicId])

  const roleLabel = (role: { name: string; nameEn: string|null; description: string|null }) =>
    (isAr ? role.description : role.nameEn) || role.name

  const roleOptions = roles
    .filter(r => r.name !== 'SuperAdmin')
    .map(r => ({ value: r.name, label: roleLabel(r) }))

  const showDepartment = ['Doctor', 'Receptionist', 'ClinicStaff'].includes(form.role)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'username') {
      setForm(prev => ({ ...prev, [name]: value.replace(/[^a-zA-Z0-9]/g, '') }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmitRaw = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')

    if (!form.fullName.trim())
      return showMessageBox(isAr ? 'الاسم مطلوب' : 'Name is required', 'warning')
    if (!form.username.trim())
      return showMessageBox(isAr ? 'اسم المستخدم مطلوب' : 'Username is required', 'warning')
    if (!form.role)
      return showMessageBox(isAr ? 'الدور مطلوب' : 'Role is required', 'warning')
    if (!/^[a-zA-Z0-9]+$/.test(form.username))
      return showMessageBox(isAr ? 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط' : 'Username must contain only English letters and numbers', 'warning')
    if (form.password && form.password.length < 6)
      return showMessageBox(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters', 'warning')

    try {
      await api.put(`/users/${id}`, {
        fullName:     form.fullName,
        username:     form.username,
        role:         form.role,
        departmentId: form.departmentId || null,
        password:     form.password || undefined,
      })
      setSuccess(isAr ? 'تم تحديث المستخدم بنجاح ✅' : 'User updated successfully ✅')
      setTimeout(() => navigate('/users'), 1200)
    } catch (err: any) {
      const errData = err.response?.data
      showMessageBox(typeof errData === 'string' ? errData : (isAr ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred'), 'error')
    }
  }

  const { run: handleSubmit, loading } = useSubmitGuard(handleSubmitRaw)

  const generatedEmail = form.username ? `${form.username}@CURA.COM` : ''

  if (loadingUser) {
    return (
      <div dir={isAr ? 'rtl' : 'ltr'} style={{ background: '#F8FAFA', minHeight: '100vh', padding: 24, textAlign: 'center' }}>
        <p style={{ color: TEXT_MUTED, marginTop: 40 }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    )
  }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ background: '#F8FAFA', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}
            onMouseEnter={e => e.currentTarget.style.color = PRIMARY}
            onMouseLeave={e => e.currentTarget.style.color = TEXT_MUTED}>
            ← {isAr ? 'رجوع' : 'Back'}
          </button>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 100, padding: '4px 16px', fontSize: 11, fontWeight: 600, color: PRIMARY, marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY }} />
            {isAr ? 'تعديل مستخدم' : 'Edit User'}
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>
            {isAr ? 'تعديل مستخدم' : 'Edit User'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 28 }}>

            {/* الاسم */}
            <Field label={isAr ? 'الاسم الكامل *' : 'Full Name *'}>
              <input name="fullName" value={form.fullName} onChange={handleChange}
                placeholder={isAr ? 'أدخل الاسم الكامل' : 'Enter full name'} style={inputStyle} />
            </Field>

            {/* اسم المستخدم */}
            <Field label={isAr ? 'اسم المستخدم *' : 'Username *'}>
              <input name="username" value={form.username} onChange={handleChange}
                placeholder={isAr ? 'أحرف إنجليزية وأرقام فقط' : 'English letters & numbers only'} style={inputStyle} />
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4, fontStyle: 'italic' }}>
                {isAr ? '✏️ يمكن استخدام الأحرف الإنجليزية والأرقام فقط' : '✏️ English letters and numbers only'}
              </div>
            </Field>

            {/* البريد — تلقائي */}
            <Field label={isAr ? 'البريد الإلكتروني' : 'Email'}>
              <input type="email" value={generatedEmail} readOnly
                style={{ ...inputStyle, background: '#F5F7F7', cursor: 'not-allowed', color: TEXT_MUTED }} />
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4, fontStyle: 'italic' }}>
                {isAr ? '📧 يتم إنشاؤه تلقائياً من اسم المستخدم' : '📧 Auto-generated from the username'}
              </div>
            </Field>

            {/* كلمة المرور — اختياري */}
            <Field label={isAr ? 'كلمة مرور جديدة' : 'New Password'}>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                placeholder={isAr ? 'اتركها فارغة لعدم التغيير' : 'Leave blank to keep unchanged'} style={inputStyle} />
            </Field>

            {/* الدور */}
            <Field label={isAr ? 'الدور *' : 'Role *'}>
              {!form.clinicId ? (
                <div style={{ fontSize: 12, color: '#79674D', padding: '10px 14px', border: '1px solid #79674D40', borderRadius: 12, background: '#FDF5F5' }}>
                  ⚠️ {isAr ? 'لا يمكن تحميل الأدوار بدون عيادة محددة' : 'Cannot load roles without a selected clinic'}
                </div>
              ) : (
                <SearchableSelect
                  isRtl={isAr}
                  value={form.role}
                  onChange={v => setForm(prev => ({ ...prev, role: v }))}
                  loading={rolesLoading}
                  placeholder={isAr ? 'اختر دوراً...' : 'Select role...'}
                  emptyText={isAr ? 'لا توجد أدوار — أنشئها أولاً من إعدادات العيادة' : 'No roles found — create some in clinic settings first'}
                  options={roleOptions}
                />
              )}
            </Field>

            {/* القسم */}
            {showDepartment && (
              <Field label={isAr ? 'القسم' : 'Department'}>
                <select name="departmentId" value={form.departmentId} onChange={handleChange} style={inputStyle}>
                  <option value="">{isAr ? 'بدون قسم' : 'No department'}</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </Field>
            )}

            {/* نجاح */}
            {success && (
              <div style={{ background: '#F0F8F0', border: '1px solid #4A767940', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#4A7679' }}>
                {success}
              </div>
            )}

            {/* أزرار */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" disabled={loading} style={{
                flex: 1, background: PRIMARY, color: '#FFFFFF', border: 'none',
                borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#4A7679' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = PRIMARY }}>
                {loading ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : (isAr ? 'حفظ التعديلات' : 'Save Changes')}
              </button>
              <button type="button" onClick={() => navigate(-1)} style={{
                padding: '12px 24px', background: 'transparent',
                border: `1px solid ${BORDER}`, borderRadius: 12,
                fontSize: 14, color: TEXT_MUTED, cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => e.currentTarget.style.background = PRIMARY_SOFT}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B8A8C', marginBottom: 8, letterSpacing: '0.5px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#FFFFFF', border: '1px solid #DCE5E5',
  borderRadius: 12, padding: '10px 14px', fontSize: 14, color: '#2C3E3F',
  outline: 'none', transition: 'all 0.2s ease',
}
