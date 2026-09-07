import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { ECGAnimation } from '../../components/ECGAnimation'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER } from '../../styles/theme'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

// ─── Global CSS with Comfortable Colors ──────────────────────────────────────
const globalCss = `

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

.form-field-full {
  grid-column: 1 / -1;
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

.form-textarea {
  padding: 12px 16px;
  border: 1px solid #DCE5E5;
  border-radius: 14px;
  font-size: 14px;
  font-family: inherit;
  color: #2C3E3F;
  background: #FFFFFF;
  transition: all 0.2s ease;
  resize: vertical;
  min-height: 96px;
  line-height: 1.7;
}

.form-textarea:focus {
  outline: none;
  border-color: #5B8C8F;
  box-shadow: 0 0 0 3px rgba(91, 140, 143, 0.1);
}

/* Featured toggle row */
.featured-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #FBF4E4;
  border: 1px solid #E8D4A8;
  border-radius: 16px;
  padding: 14px 18px;
}

.toggle-switch {
  position: relative;
  width: 42px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 100px;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.toggle-knob {
  position: absolute;
  top: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #FFFFFF;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
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

.plan-card.featured {
  border-color: #79674D;
  box-shadow: 0 4px 20px rgba(196, 167, 125, 0.18);
}

.plan-card.featured:hover {
  box-shadow: 0 16px 36px rgba(196, 167, 125, 0.28);
}

.plan-header {
  background: linear-gradient(135deg, #E8F0F0 0%, #F0F5F5 100%);
  padding: 20px 24px;
  border-bottom: 1px solid #DCE5E5;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.plan-card.featured .plan-header {
  background: linear-gradient(135deg, #FBF4E4 0%, #F5EBD4 100%);
  border-bottom-color: #E8D4A8;
}

.plan-name {
  font-size: 20px;
  font-weight: 700;
  color: #2C3E3F;
  margin: 0;
}

.plan-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.plan-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.plan-badge.active {
  background: rgba(74, 118, 121, 0.15);
  color: #4A7679;
}

.plan-badge.inactive {
  background: rgba(196, 167, 125, 0.15);
  color: #79674D;
}

.plan-badge.featured {
  background: #79674D;
  color: #FFFFFF;
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

.features-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  padding: 14px 16px;
  background: #F8FAFA;
  border-radius: 14px;
  border: 1px solid #EEF3F3;
}

.features-list-empty {
  font-size: 12px;
  color: #6B8A8C;
  font-style: italic;
}

.feature-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #2C3E3F;
  line-height: 1.5;
}

.feature-check {
  color: #5B8C8F;
  font-weight: 700;
  flex-shrink: 0;
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
  color: #79674D;
}

.btn-toggle-active:hover {
  background: #79674D;
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
  border: 1px solid #79674D;
  border-radius: 14px;
  padding: 14px 18px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #79674D;
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

const SUCCESS = '#4A7679'
const WARNING = '#79674D'

interface Plan {
  id: string
  name: string
  description?: string
  monthlyPrice: number
  yearlyPrice: number
  maxUsers: number
  maxDoctors: number
  maxPatients: number
  maxDailyMessages: number   // ← جديد
  isActive: boolean
  isFeatured: boolean
  features: string[]
  createdAt: string
}

const defaultPlans = [
  {
    name: 'Basic',
    description: 'للعيادات الصغيرة',
    monthlyPrice: 20,
    yearlyPrice: 199,
    maxUsers: 3,
    maxDoctors: 2,
    maxPatients: 300,
    maxDailyMessages: 20,
    isActive: true,
    isFeatured: false,
    featuresText: 'جدولة المواعيد\nملاحظات الزيارة\nتقارير أساسية',
  },
  {
    name: 'Standard',
    description: 'للعيادات المتوسطة',
    monthlyPrice: 29,
    yearlyPrice: 299,
    maxUsers: 10,
    maxDoctors: 5,
    maxPatients: 1000,
    maxDailyMessages: 50,
    isActive: true,
    isFeatured: true,
    featuresText: 'جميع مميزات الخطة الأساسية\nفواتير إلكترونية\nأقسام متعددة\nدعم ذو أولوية',
  },
  {
    name: 'Premium',
    description: 'للعيادات الكبيرة',
    monthlyPrice: 45,
    yearlyPrice: 410,
    maxUsers: -1,
    maxDoctors: -1,
    maxPatients: -1,
    maxDailyMessages: 100,
    isActive: true,
    isFeatured: false,
    featuresText: 'جميع مميزات الخطة المتقدمة\nمستخدمون وأطباء غير محدودين\nمدير حساب مخصص\nتدريب مجاني للفريق',
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
// emptyForm
   const emptyForm = {
    name: '', description: '',
    monthlyPrice: '', yearlyPrice: '',
    maxUsers: '', maxDoctors: '', maxPatients: '', maxDailyMessages: '',
    featuresText: '', isFeatured: false,
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
      setSuccess(lang === 'ar' ? 'تم إنشاء الخطط الافتراضية ✅' : 'Default plans created ✅')
      fetchPlans()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError(lang === 'ar' ? 'حدث خطأ أثناء إنشاء الخطط' : 'Error creating default plans')
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
      maxDailyMessages: String(plan.maxDailyMessages),  // ← جديد
      // Rejoin the features array back into one-per-line text for editing
      featuresText: (plan.features || []).join('\n'),
      isFeatured: plan.isFeatured,
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
        maxDailyMessages: parseInt(form.maxDailyMessages),
        featuresText: form.featuresText,
        isFeatured: form.isFeatured,
        isActive: true,
      }

      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, payload)
        setSuccess(lang === 'ar' ? 'تم تعديل الخطة ✅' : 'Plan updated ✅')
      } else {
        await api.post('/plans', payload)
        setSuccess(lang === 'ar' ? 'تم إضافة الخطة ✅' : 'Plan added ✅')
      }

      setShowForm(false)
      setEditingPlan(null)
      setForm(emptyForm)
      fetchPlans()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || (lang === 'ar' ? 'حدث خطأ' : 'An error occurred'))
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
      alert(lang === 'ar' ? 'حدث خطأ' : 'An error occurred')
    }
  }

  const unlimitedPlaceholder = lang === 'ar' ? '-1 = غير محدود' : '-1 = Unlimited'
  const fields = [
    { key: 'name', label: lang === 'ar' ? 'اسم الخطة' : 'Plan Name', placeholder: 'Basic', type: 'text', required: true },
    { key: 'description', label: lang === 'ar' ? 'الوصف' : 'Description', placeholder: lang === 'ar' ? 'للعيادات الصغيرة' : 'For small clinics', type: 'text', required: false },
    { key: 'monthlyPrice', label: lang === 'ar' ? 'السعر الشهري' : 'Monthly Price', placeholder: '20', type: 'number', required: true },
    { key: 'yearlyPrice', label: lang === 'ar' ? 'السعر السنوي' : 'Yearly Price', placeholder: '199', type: 'number', required: true },
    { key: 'maxUsers', label: lang === 'ar' ? 'عدد المستخدمين' : 'Max Users', placeholder: unlimitedPlaceholder, type: 'number', required: true },
    { key: 'maxDoctors', label: lang === 'ar' ? 'عدد الأطباء' : 'Max Doctors', placeholder: unlimitedPlaceholder, type: 'number', required: true },
    { key: 'maxPatients', label: lang === 'ar' ? 'عدد المرضى' : 'Max Patients', placeholder: unlimitedPlaceholder, type: 'number', required: true },
    { key: 'maxDailyMessages', label: lang === 'ar' ? 'الرسائل اليومية' : 'Daily Messages', placeholder: unlimitedPlaceholder, type: 'number', required: true },
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
    messages: lang === 'ar' ? 'الرسائل اليومية' : 'Daily Messages',
    unlimited: lang === 'ar' ? 'غير محدود' : 'Unlimited',
    noPlans: lang === 'ar' ? 'لا توجد خطط — اضغط "إنشاء الخطط الافتراضية" للبدء' : 'No plans — click "Create Default Plans" to start',
    loading: lang === 'ar' ? 'جاري التحميل...' : 'Loading...',
    featuresLabel: lang === 'ar' ? 'المميزات (ميزة بكل سطر)' : 'Features (one per line)',
    featuresPlaceholder: lang === 'ar' ? 'جدولة المواعيد\nملاحظات الزيارة\nتقارير أساسية' : 'Appointment scheduling\nVisit notes\nBasic reports',
    featuresHint: lang === 'ar' ? 'هذي القائمة تظهر بالضبط لزوّار صفحة الأسعار العامة' : 'This list is shown as-is on the public pricing page',
    featuredLabel: lang === 'ar' ? 'الخطة الأكثر اختياراً ⭐' : 'Most Popular plan ⭐',
    featuredHint: lang === 'ar'
      ? 'خطة واحدة بس تُعرض كمميّزة بأي وقت — تفعيلها هنا يلغي التمييز عن أي خطة أخرى تلقائياً'
      : 'Only one plan can be featured at a time — enabling this will automatically unfeature any other plan',
    featured: lang === 'ar' ? 'مميّزة' : 'Featured',
    noFeatures: lang === 'ar' ? 'لم تُضف أي مميزات لهذه الخطة بعد' : 'No features added to this plan yet',
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
                    <label className="form-label">{f.label} {f.required && <span style={{ color: '#79674D' }}>*</span>}</label>
                    <input
                      type={f.type}
                      value={form[f.key as keyof typeof form] as string}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="form-input"
                      required={f.required}
                    />
                  </div>
                ))}

                {/* Features — multi-line, spans the full grid width */}
                <div className="form-field form-field-full">
                  <label className="form-label">{t.featuresLabel}</label>
                  <textarea
                    value={form.featuresText}
                    onChange={e => setForm({ ...form, featuresText: e.target.value })}
                    placeholder={t.featuresPlaceholder}
                    className="form-textarea"
                    rows={5}
                  />
                  <p style={{ fontSize: 11, color: TEXT_MUTED, margin: '2px 0 0' }}>💡 {t.featuresHint}</p>
                </div>

                {/* Featured toggle — spans the full grid width */}
                <div className="form-field form-field-full">
                  <div className="featured-toggle-row">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#8A6A22', marginBottom: 3 }}>{t.featuredLabel}</div>
                      <div style={{ fontSize: 11, color: TEXT_MUTED, lineHeight: 1.5 }}>{t.featuredHint}</div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.isFeatured}
                      onClick={() => setForm({ ...form, isFeatured: !form.isFeatured })}
                      className="toggle-switch"
                      style={{ background: form.isFeatured ? WARNING : '#DCE5E5' }}
                    >
                      <span className="toggle-knob" style={{ [isAr ? 'right' : 'left']: form.isFeatured ? 21 : 3 } as React.CSSProperties} />
                    </button>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 20, marginTop: 12 }}>
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
              <div key={plan.id} className={`plan-card ${!isActive ? 'inactive' : ''} ${plan.isFeatured ? 'featured' : ''}`}>
                {/* Plan Header */}
                <div className="plan-header">
                  <div>
                    <h3 className="plan-name">{planIcon} {plan.name}</h3>
                    {plan.description && (
                      <p style={{ fontSize: 12, color: TEXT_MUTED, margin: '4px 0 0' }}>{plan.description}</p>
                    )}
                  </div>
                  <div className="plan-badges">
                    <span className={`plan-badge ${isActive ? 'active' : 'inactive'}`}>
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: isActive ? SUCCESS : WARNING,
                        display: 'inline-block',
                      }} />
                      {isActive ? t.active : t.inactive}
                    </span>
                    {plan.isFeatured && (
                      <span className="plan-badge featured">⭐ {t.featured}</span>
                    )}
                  </div>
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
                    <div className="limit-item">
  <span className="limit-label">💬 {t.messages}</span>
  <span className="limit-value">
    {plan.maxDailyMessages === -1 ? (
      <span className="limit-unlimited">∞ {t.unlimited}</span>
    ) : plan.maxDailyMessages}
  </span>
</div>
                  </div>

                  {/* Features preview — mirrors exactly what the public pricing page shows */}
                  <div className="features-list">
                    {plan.features && plan.features.length > 0 ? (
                      plan.features.map((f, i) => (
                        <div key={i} className="feature-row">
                          <span className="feature-check">✓</span>
                          <span>{f}</span>
                        </div>
                      ))
                    ) : (
                      <span className="features-list-empty">{t.noFeatures}</span>
                    )}
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