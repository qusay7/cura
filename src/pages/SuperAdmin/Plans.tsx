import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { ECGAnimation } from '../../components/ECGAnimation'

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
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes slide-in {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.plans-shell { animation: fade-up 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) both; }

/* Form styles */
.form-container {
  background: #FFFFFF;
  border-radius: 28px;
  border: 1px solid #DCE5E5;
  padding: 28px;
  margin-bottom: 28px;
  animation: slide-in 0.3s ease;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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

.form-input {
  padding: 12px 16px;
  border: 1px solid #DCE5E5;
  border-radius: 14px;
  font-size: 14px;
  font-family: inherit;
  color: #2C3E3F;
  background: #FFFFFF;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #5B8C8F;
  box-shadow: 0 0 0 3px rgba(91, 140, 143, 0.1);
}

/* Plans Grid */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.plan-card {
  background: #FFFFFF;
  border: 1px solid #DCE5E5;
  border-radius: 24px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.06);
}

.plan-card.inactive {
  opacity: 0.65;
  filter: grayscale(0.05);
}

.plan-header {
  background: linear-gradient(135deg, #E8F0F0 0%, #F0F5F5 100%);
  padding: 20px 24px;
  border-bottom: 1px solid #DCE5E5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-name {
  font-size: 20px;
  font-weight: 700;
  color: #2C3E3F;
  margin: 0;
}

.plan-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
}

.plan-badge.active {
  background: rgba(74, 118, 121, 0.15);
  color: #4A7679;
}

.plan-badge.inactive {
  background: rgba(196, 167, 125, 0.15);
  color: #C4A77D;
}

.plan-body {
  padding: 24px;
}

.price-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.price-card {
  background: #E8F0F0;
  border-radius: 16px;
  padding: 14px;
  text-align: center;
}

.price-label {
  font-size: 11px;
  font-weight: 500;
  color: #6B8A8C;
  margin-bottom: 6px;
}

.price-value {
  font-size: 22px;
  font-weight: 700;
  color: #5B8C8F;
}

.price-currency {
  font-size: 11px;
  font-weight: 500;
}

.limits-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  padding-top: 8px;
  border-top: 1px solid #DCE5E5;
}

.limit-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.limit-label {
  color: #6B8A8C;
}

.limit-value {
  font-weight: 600;
  color: #2C3E3F;
}

.limit-unlimited {
  color: #4A7679;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.btn-edit {
  flex: 1;
  background: #E8F0F0;
  border: 1px solid rgba(91, 140, 143, 0.3);
  border-radius: 12px;
  padding: 10px;
  font-size: 12px;
  font-weight: 500;
  color: #5B8C8F;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background: #5B8C8F;
  color: white;
  border-color: #5B8C8F;
}

.btn-toggle {
  flex: 1;
  border: none;
  border-radius: 12px;
  padding: 10px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-toggle-active {
  background: rgba(196, 167, 125, 0.15);
  color: #C4A77D;
}

.btn-toggle-active:hover {
  background: #C4A77D;
  color: white;
}

.btn-toggle-inactive {
  background: rgba(74, 118, 121, 0.15);
  color: #4A7679;
}

.btn-toggle-inactive:hover {
  background: #4A7679;
  color: white;
}

/* Buttons */
.btn-primary {
  background: #5B8C8F;
  color: white;
  border: none;
  border-radius: 14px;
  padding: 10px 24px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary:hover {
  background: #4A7679;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(91, 140, 143, 0.2);
}

.btn-secondary {
  background: transparent;
  border: 1px solid #DCE5E5;
  border-radius: 14px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 500;
  color: #6B8A8C;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #E8F0F0;
  border-color: #5B8C8F;
}

.btn-success {
  background: #4A7679;
  color: white;
  border: none;
  border-radius: 14px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-success:hover {
  background: #3D6B6E;
  transform: translateY(-2px);
}

/* Alert Messages */
.alert-error {
  background: #FDF5F5;
  border: 1px solid #C4A77D;
  border-radius: 14px;
  padding: 14px 18px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #C4A77D;
}

.alert-success {
  background: #E8F0F0;
  border: 1px solid #5B8C8F;
  border-radius: 14px;
  padding: 14px 18px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #2C3E3F;
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

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 24px;
  background: #FFFFFF;
  border-radius: 24px;
  border: 1px solid #DCE5E5;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.5;
  margin-bottom: 16px;
}

/* Responsive */
@media(max-width: 1024px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .plans-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

@media(max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .plans-grid {
    grid-template-columns: 1fr;
  }
  .form-container {
    padding: 20px;
  }
  .action-buttons {
    flex-direction: column;
  }
}
`

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const SUCCESS = '#4A7679'
const WARNING = '#C4A77D'

interface Plan {
  id: string
  name: string
  description?: string
  monthlyPrice: number
  yearlyPrice: number
  maxUsers: number
  maxDoctors: number
  maxPatients: number
  isActive: boolean
  createdAt: string
}

const defaultPlans = [
  {
    name: 'Basic',
    description: 'للعيادات الصغيرة',
    monthlyPrice: 99,
    yearlyPrice: 999,
    maxUsers: 3,
    maxDoctors: 2,
    maxPatients: 300,
    isActive: true,
  },
  {
    name: 'Standard',
    description: 'للعيادات المتوسطة',
    monthlyPrice: 199,
    yearlyPrice: 1999,
    maxUsers: 10,
    maxDoctors: 5,
    maxPatients: 1000,
    isActive: true,
  },
  {
    name: 'Premium',
    description: 'للعيادات الكبيرة',
    monthlyPrice: 399,
    yearlyPrice: 3999,
    maxUsers: -1,
    maxDoctors: -1,
    maxPatients: -1,
    isActive: true,
  },
]

// Loading Screen Component
const PlansLoadingScreen = ({ msg }: { msg: string }) => (
  <div className="loading-container">
    <div style={{ textAlign: 'center' }}>
      <div className="loading-spinner" />
      <p style={{ color: TEXT_MUTED }}>{msg}</p>
    </div>
  </div>
)

export default function SuperAdminPlans() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const emptyForm = {
    name: '', description: '',
    monthlyPrice: '', yearlyPrice: '',
    maxUsers: '', maxDoctors: '', maxPatients: '',
  }
  const [form, setForm] = useState(emptyForm)

  // Inject styles
  useEffect(() => {
    const styleId = 'cura-plans-css'
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

  useEffect(() => { fetchPlans() }, [])

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans')
      setPlans(res.data)
    } catch {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleSeedPlans = async () => {
    setSeeding(true)
    setError('')
    try {
      for (const plan of defaultPlans) {
        const exists = plans.find(p => p.name === plan.name)
        if (!exists) {
          await api.post('/plans', plan)
        }
      }
      setSuccess('تم إنشاء الخطط الافتراضية ✅')
      fetchPlans()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('حدث خطأ أثناء إنشاء الخطط')
    } finally {
      setSeeding(false)
    }
  }

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setForm({
      name: plan.name,
      description: plan.description || '',
      monthlyPrice: String(plan.monthlyPrice),
      yearlyPrice: String(plan.yearlyPrice),
      maxUsers: String(plan.maxUsers),
      maxDoctors: String(plan.maxDoctors),
      maxPatients: String(plan.maxPatients),
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        monthlyPrice: parseFloat(form.monthlyPrice),
        yearlyPrice: parseFloat(form.yearlyPrice),
        maxUsers: parseInt(form.maxUsers),
        maxDoctors: parseInt(form.maxDoctors),
        maxPatients: parseInt(form.maxPatients),
        isActive: true,
      }

      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, payload)
        setSuccess('تم تعديل الخطة ✅')
      } else {
        await api.post('/plans', payload)
        setSuccess('تم إضافة الخطة ✅')
      }

      setShowForm(false)
      setEditingPlan(null)
      setForm(emptyForm)
      fetchPlans()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data || 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/plans/${id}/toggle`)
      setPlans(prev => prev.map(p =>
        p.id === id ? { ...p, isActive: !p.isActive } : p
      ))
    } catch {
      alert('حدث خطأ')
    }
  }

  const fields = [
    { key: 'name', label: 'اسم الخطة', placeholder: 'Basic', type: 'text', required: true },
    { key: 'description', label: 'الوصف', placeholder: 'للعيادات الصغيرة', type: 'text', required: false },
    { key: 'monthlyPrice', label: 'السعر الشهري', placeholder: '99', type: 'number', required: true },
    { key: 'yearlyPrice', label: 'السعر السنوي', placeholder: '999', type: 'number', required: true },
    { key: 'maxUsers', label: 'عدد المستخدمين', placeholder: '-1 = غير محدود', type: 'number', required: true },
    { key: 'maxDoctors', label: 'عدد الأطباء', placeholder: '-1 = غير محدود', type: 'number', required: true },
    { key: 'maxPatients', label: 'عدد المرضى', placeholder: '-1 = غير محدود', type: 'number', required: true },
  ]

  const t = {
    title: lang === 'ar' ? 'إدارة الخطط' : 'Plans Management',
    addPlan: lang === 'ar' ? 'إضافة خطة' : 'Add Plan',
    editPlan: lang === 'ar' ? 'تعديل الخطة' : 'Edit Plan',
    newPlan: lang === 'ar' ? 'خطة جديدة' : 'New Plan',
    seedPlans: lang === 'ar' ? 'إنشاء الخطط الافتراضية' : 'Create Default Plans',
    seeding: lang === 'ar' ? 'جاري الإنشاء...' : 'Creating...',
    save: lang === 'ar' ? 'حفظ' : 'Save',
    cancel: lang === 'ar' ? 'إلغاء' : 'Cancel',
    edit: lang === 'ar' ? 'تعديل' : 'Edit',
    activate: lang === 'ar' ? 'تفعيل' : 'Activate',
    deactivate: lang === 'ar' ? 'إيقاف' : 'Deactivate',
    active: lang === 'ar' ? 'نشطة' : 'Active',
    inactive: lang === 'ar' ? 'موقوفة' : 'Inactive',
    monthly: lang === 'ar' ? 'شهري' : 'Monthly',
    yearly: lang === 'ar' ? 'سنوي' : 'Yearly',
    users: lang === 'ar' ? 'المستخدمون' : 'Users',
    doctors: lang === 'ar' ? 'الأطباء' : 'Doctors',
    patients: lang === 'ar' ? 'المرضى' : 'Patients',
    unlimited: lang === 'ar' ? 'غير محدود' : 'Unlimited',
    noPlans: lang === 'ar' ? 'لا توجد خطط — اضغط "إنشاء الخطط الافتراضية" للبدء' : 'No plans — click "Create Default Plans" to start',
    loading: lang === 'ar' ? 'جاري التحميل...' : 'Loading...',
  }

  const isAr = lang === 'ar'
  const font = isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif"

  if (loading) {
    return <PlansLoadingScreen msg={t.loading} />
  }

  return (
    <div className="plans-shell" style={{ fontFamily: font, direction: isAr ? 'rtl' : 'ltr', background: '#F8FAFA', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

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
            {isAr ? 'لوحة التحكم' : 'Admin Panel'}
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', 'Georgia', serif", fontSize: 32, fontWeight: 500, color: TEXT_DARK, margin: 0, letterSpacing: '-0.3px' }}>
            💎 {t.title}
          </h2>
          <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 8 }}>
            {isAr ? `📊 ${plans.length} خطة مسجلة` : `📊 ${plans.length} registered plans`}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {plans.length === 0 && (
            <button onClick={handleSeedPlans} disabled={seeding} className="btn-success">
              {seeding ? t.seeding : `🚀 ${t.seedPlans}`}
            </button>
          )}
          <button onClick={() => {
            setEditingPlan(null)
            setForm(emptyForm)
            setShowForm(!showForm)
          }} className="btn-primary">
            <span>+</span> {t.addPlan}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="alert-error">
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
          </div>
        )}
        {success && (
          <div className="alert-success">
            <span>✅ {success}</span>
            <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="form-container">
            <h3 style={{ fontSize: 18, fontWeight: 600, color: TEXT_DARK, marginBottom: 20 }}>
              {editingPlan ? `✏️ ${t.editPlan}` : `➕ ${t.newPlan}`}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {fields.map(f => (
                  <div key={f.key} className="form-field">
                    <label className="form-label">{f.label} {f.required && <span style={{ color: '#C4A77D' }}>*</span>}</label>
                    <input
                      type={f.type}
                      value={form[f.key as keyof typeof form]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="form-input"
                      required={f.required}
                    />
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 20, marginTop: 8 }}>
                💡 {isAr ? 'استخدم -1 للحصول على عدد غير محدود' : 'Use -1 for unlimited'}
              </p>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : `💾 ${t.save}`}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingPlan(null) }} className="btn-secondary">
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Plans Grid */}
        <div className="plans-grid">
          {plans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💎</div>
              <p style={{ fontSize: 16, color: TEXT_MUTED }}>{t.noPlans}</p>
            </div>
          ) : plans.map(plan => {
            const planIcon = plan.name === 'Basic' ? '🥉' : plan.name === 'Standard' ? '🥈' : plan.name === 'Premium' ? '🥇' : '💎'
            const isActive = plan.isActive
            
            return (
              <div key={plan.id} className={`plan-card ${!isActive ? 'inactive' : ''}`}>
                {/* Plan Header */}
                <div className="plan-header">
                  <div>
                    <h3 className="plan-name">{planIcon} {plan.name}</h3>
                    {plan.description && (
                      <p style={{ fontSize: 12, color: TEXT_MUTED, margin: '4px 0 0' }}>{plan.description}</p>
                    )}
                  </div>
                  <span className={`plan-badge ${isActive ? 'active' : 'inactive'}`}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: isActive ? SUCCESS : WARNING,
                      display: 'inline-block',
                    }} />
                    {isActive ? t.active : t.inactive}
                  </span>
                </div>

                {/* Plan Body */}
                <div className="plan-body">
                  {/* Prices */}
                  <div className="price-grid">
                    <div className="price-card">
                      <div className="price-label">{t.monthly}</div>
                      <div className="price-value">
                        {plan.monthlyPrice} <span className="price-currency">{isAr ? 'د.أ' : 'JOD'}</span>
                      </div>
                    </div>
                    <div className="price-card">
                      <div className="price-label">{t.yearly}</div>
                      <div className="price-value">
                        {plan.yearlyPrice} <span className="price-currency">{isAr ? 'د.أ' : 'JOD'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="limits-list">
                    <div className="limit-item">
                      <span className="limit-label">👥 {t.users}</span>
                      <span className="limit-value">
                        {plan.maxUsers === -1 ? (
                          <span className="limit-unlimited">∞ {t.unlimited}</span>
                        ) : plan.maxUsers}
                      </span>
                    </div>
                    <div className="limit-item">
                      <span className="limit-label">👨‍⚕️ {t.doctors}</span>
                      <span className="limit-value">
                        {plan.maxDoctors === -1 ? (
                          <span className="limit-unlimited">∞ {t.unlimited}</span>
                        ) : plan.maxDoctors}
                      </span>
                    </div>
                    <div className="limit-item">
                      <span className="limit-label">👥 {t.patients}</span>
                      <span className="limit-value">
                        {plan.maxPatients === -1 ? (
                          <span className="limit-unlimited">∞ {t.unlimited}</span>
                        ) : plan.maxPatients}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="action-buttons">
                    <button onClick={() => handleEdit(plan)} className="btn-edit">
                      ✏️ {t.edit}
                    </button>
                    <button
                      onClick={() => handleToggle(plan.id)}
                      className={`btn-toggle ${isActive ? 'btn-toggle-active' : 'btn-toggle-inactive'}`}
                    >
                      {isActive ? `🔴 ${t.deactivate}` : `🟢 ${t.activate}`}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}