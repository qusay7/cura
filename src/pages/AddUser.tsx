import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import SearchableSelect from '../components/SearchableSelect'
import { useSubmitGuard } from '../hooks/useSubmitGuard'
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const ERROR_TEXT = '#79674D'

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

export default function AddUser() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lang] = useState<'ar' | 'en'>(getStoredLang())
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [roles, setRoles] = useState<{ id: string; name: string; nameEn: string|null; description: string|null }[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const isAr = lang === 'ar'

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [form, setForm] = useState({
    fullName: '', username: '', email: '', password: '',
    role: '', clinicId: user.clinicId || '',
    departmentId: '', specialty: '',
  })
  useUnsavedChangesWarning(form)

  useEffect(() => {
    if (user.clinicId) {
      api.get('/departments')
        .then(res => setDepartments(res.data.filter((d: any) => d.isActive)))
        .catch(() => {})
    }
  }, [])

  // ✅ الأدوار وتسمياتها تُجلب بالكامل من قاعدة البيانات (GET /api/roles) —
  // بدون أي قائمة أو خريطة ترجمة ثابتة بالكود.
  // Role.Description = التسمية العربية، Role.NameEn = التسمية الإنجليزية (كلاهما مخزّن
  // فعلياً بجدول Roles من لحظة إنشاء العيادة عبر RoleSeedingService)
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

  // SuperAdmin لا يُنشئ حساب SuperAdmin آخر من هذي الشاشة
  const roleOptions = roles
    .filter(r => r.name !== 'SuperAdmin')
    .map(r => ({ value: r.name, label: roleLabel(r) }))

  const showDepartment = ['Doctor', 'Receptionist', 'ClinicStaff'].includes(form.role)
  const showSpecialty  = form.role === 'Doctor'

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
    setError(''); setSuccess('')

    if (!form.fullName.trim())
      return setError(isAr ? 'الاسم مطلوب' : 'Name is required')
    if (!form.username.trim())
      return setError(isAr ? 'اسم المستخدم مطلوب' : 'Username is required')
    if (!form.password.trim())
      return setError(isAr ? 'كلمة المرور مطلوبة' : 'Password is required')
    if (!form.role)
      return setError(isAr ? 'الدور مطلوب' : 'Role is required')
    if (!/^[a-zA-Z0-9]+$/.test(form.username))
      return setError(isAr ? 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط' : 'Username must contain only English letters and numbers')
    if (form.password.length < 6)
      return setError(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters')

    // ✅ التخصص إجباري للطبيب
    if (form.role === 'Doctor' && !form.specialty.trim())
      return setError(isAr ? 'التخصص مطلوب للطبيب' : 'Specialty is required for Doctor')

    const email = `${form.username}@CURA.COM`

    try {
      await api.post('/users', {
        fullName:     form.fullName,
        username:     form.username,
        email,
        password:     form.password,
        role:         form.role,
        clinicId:     form.clinicId || null,
        departmentId: form.departmentId || null,
        specialty:    form.role === 'Doctor' ? form.specialty : undefined,
      })
      setSuccess(isAr ? 'تم إنشاء المستخدم بنجاح ✅' : 'User created successfully ✅')
      setForm(prev => ({ ...prev, fullName: '', username: '', password: '', role: '', departmentId: '', specialty: '' }))
      setTimeout(() => navigate('/users'), 1500)
    } catch (err: any) {
      const errData = err.response?.data
      setError(typeof errData === 'string' ? errData : (isAr ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred'))
    }
  }

  // ✅ يمنع الضغط المزدوج على زر الحفظ (مثلاً وقت نت بطيء وتأخر رد الـ API)
  const { run: handleSubmit, loading } = useSubmitGuard(handleSubmitRaw)

  const generatedEmail = form.username ? `${form.username}@CURA.COM` : ''

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
            {isAr ? 'مستخدم جديد' : 'New User'}
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>
            {isAr ? 'إضافة مستخدم' : 'Add User'}
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
                {isAr ? '📧 يتم إنشاؤه تلقائياً' : '📧 Auto-generated'}
              </div>
            </Field>

            {/* كلمة المرور */}
            <Field label={isAr ? 'كلمة المرور *' : 'Password *'}>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                placeholder="••••••••" style={inputStyle} />
            </Field>

            {/* الدور */}
            <Field label={isAr ? 'الدور *' : 'Role *'}>
              {!form.clinicId ? (
                <div style={{ fontSize: 12, color: ERROR_TEXT, padding: '10px 14px', border: `1px solid ${ERROR_TEXT}40`, borderRadius: 12, background: '#FDF5F5' }}>
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

            {/* ✅ التخصص — إجباري للطبيب */}
            {showSpecialty && (
              <Field label={isAr ? 'التخصص *' : 'Specialty *'}>
                <input
                  name="specialty"
                  value={form.specialty}
                  onChange={handleChange}
                  placeholder={isAr ? 'ابحث أو اختر التخصص...' : 'Search or select specialty...'}
                  list="specialties-user"
                  style={{
                    ...inputStyle,
                    border: `1px solid ${form.specialty ? BORDER : ERROR_TEXT}`,
                  }}
                  autoComplete="off"
                />
                <datalist id="specialties-user">
                  {SPECIALTIES[lang].map(s => <option key={s} value={s} />)}
                </datalist>
                {!form.specialty && (
                  <div style={{ fontSize: 11, color: ERROR_TEXT, marginTop: 4 }}>
                    ⚠️ {isAr ? 'التخصص مطلوب للطبيب' : 'Specialty is required for Doctor'}
                  </div>
                )}
              </Field>
            )}

            {/* القسم */}
            {showDepartment && (
              <Field label={isAr ? 'القسم' : 'Department'}>
                <select name="departmentId" value={form.departmentId} onChange={handleChange} style={inputStyle}>
                  <option value="">{isAr ? 'بدون قسم' : 'No department'}</option>
                  {departments.length === 0 ? (
                    <option disabled>{isAr ? 'لا توجد أقسام' : 'No departments found'}</option>
                  ) : departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {departments.length === 0 && (
                  <div style={{ fontSize: 11, color: ERROR_TEXT, marginTop: 4 }}>
                    {isAr ? '⚠️ أنشئ أقساماً أولاً من صفحة الأقسام' : '⚠️ Create departments first'}
                  </div>
                )}
              </Field>
            )}

            {/* خطأ / نجاح */}
            {error && (
              <div style={{ background: '#FDF5F5', border: `1px solid ${ERROR_TEXT}40`, borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: ERROR_TEXT }}>
                ⚠️ {error}
              </div>
            )}
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
                {loading ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : (isAr ? 'إضافة المستخدم' : 'Add User')}
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