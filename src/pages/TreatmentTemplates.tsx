import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import SearchableSelect from '../components/SearchableSelect'
import { useColumnVisibility, ColumnToggleButton } from '../components/ColumnToggle'
import type { ColumnDef } from '../components/ColumnToggle'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const globalCss = `
.templates-shell { animation: fade-up 0.4s cubic-bezier(0.2,0.9,0.4,1.1) both; }
.form-input:focus, .form-textarea:focus {
  border-color: #5B8C8F !important;
  box-shadow: 0 0 0 3px rgba(91,140,143,0.1) !important;
  outline: none;
}
@media(max-width:768px) {
  .templates-grid { grid-template-columns: 1fr !important; }
  .form-grid { grid-template-columns: 1fr !important; }
}
@media print {
  .no-print { display: none !important; }
  body { margin: 0; padding: 10px; }
}
`

const ERROR_BG = '#FDF5F5'
const ERROR_TEXT = '#79674D'
const SUCCESS = '#4A7679'

const T = {
  ar: {
    title: 'قوالب الزيارة', subtitle: 'الأسعار الافتراضية لأنواع الزيارات — تُستخدم تلقائياً عند الحجز وحساب حصص الأطباء',
    addTemplate: '+ إضافة قالب', editTemplate: 'تعديل القالب', newTemplate: 'قالب جديد',
    name: 'الاسم', nameEn: 'الاسم بالإنجليزي', department: 'القسم (اختياري)',
    departmentHint: 'اتركه فاضي ليكون القالب متاح لكل الأقسام',
    departmentPlaceholder: 'كل الأقسام (عام)',
    visitPricing: 'أسعار الزيارة الواحدة', visitPricingHint: 'تُستخدم عند حجز موعد عادي بهذا القالب',
    firstVisitPrice: 'سعر الكشف الأول', followUpPrice: 'سعر المراجعة',
    sessionsPricing: 'إعدادات الجلسات المتعددة', sessionsPricingHint: 'تُستخدم للخطط العلاجية متعددة الجلسات (مثل: سحب عصب)',
    sessionsCount: 'عدد الجلسات الافتراضي', pricePerSession: 'سعر الجلسة الواحدة', totalPrice: 'السعر الإجمالي',
    pricePlaceholder: '—', save: 'حفظ', cancel: 'إلغاء', saving: 'جارٍ الحفظ...',
    edit: 'تعديل', delete: 'حذف', noTemplates: 'لا توجد قوالب — اضغط "إضافة قالب" للبدء',
    loading: 'جاري التحميل...', confirmDelete: 'متأكد تبي تحذف هذا القالب؟',
    loadFailed: 'تعذّر تحميل القوالب', retry: 'إعادة المحاولة',
    saved: 'تم الحفظ بنجاح', errGeneric: 'حدث خطأ', nameRequired: 'الاسم مطلوب',
    generalBadge: 'عام لكل الأقسام', sessionsBadge: 'جلسة',
    noPriceSet: 'السعر غير محدد بعد',
    print: 'طباعة', exportPdf: 'تصدير PDF', exportExcel: 'تصدير Excel',
  },
  en: {
    title: 'Visit Templates', subtitle: 'Default prices for visit types — used automatically when booking and computing doctor commissions',
    addTemplate: '+ Add Template', editTemplate: 'Edit Template', newTemplate: 'New Template',
    name: 'Name', nameEn: 'English Name', department: 'Department (optional)',
    departmentHint: 'Leave empty to make this template available to all departments',
    departmentPlaceholder: 'All departments (general)',
    visitPricing: 'Single Visit Pricing', visitPricingHint: 'Used when booking a regular appointment with this template',
    firstVisitPrice: 'First Visit Price', followUpPrice: 'Follow-up Price',
    sessionsPricing: 'Multi-Session Settings', sessionsPricingHint: 'Used for multi-session treatment plans (e.g. root canal)',
    sessionsCount: 'Default Sessions Count', pricePerSession: 'Price per Session', totalPrice: 'Total Price',
    pricePlaceholder: '—', save: 'Save', cancel: 'Cancel', saving: 'Saving...',
    edit: 'Edit', delete: 'Delete', noTemplates: 'No templates yet — click "Add Template" to start',
    loading: 'Loading...', confirmDelete: 'Are you sure you want to delete this template?',
    loadFailed: 'Failed to load templates', retry: 'Retry',
    saved: 'Saved successfully', errGeneric: 'An error occurred', nameRequired: 'Name is required',
    generalBadge: 'General — all departments', sessionsBadge: 'session(s)',
    noPriceSet: 'Price not set yet',
    print: 'Print', exportPdf: 'Export PDF', exportExcel: 'Export Excel',
  },
}

interface Department { id: string; name: string; nameEn?: string | null; isActive: boolean }

interface Template {
  id: string
  name: string
  nameEn: string | null
  departmentId: string | null
  departmentName: string | null
  defaultSessionsCount: number
  defaultPricePerSession: number | null
  defaultTotalPrice: number | null
  firstVisitPrice: number | null
  followUpPrice: number | null
}

const emptyForm = {
  name: '', nameEn: '', departmentId: '',
  defaultSessionsCount: '1', defaultPricePerSession: '', defaultTotalPrice: '',
  firstVisitPrice: '', followUpPrice: '',
}

export default function TreatmentTemplates() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [templates, setTemplates] = useState<Template[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null)
  const [toastError, setToastError] = useState('')

  useEffect(() => {
    if (!toastError) return
    const timer = setTimeout(() => setToastError(''), 4000)
    return () => clearTimeout(timer)
  }, [toastError])

  // ✅ Column definitions
  const columnDefs: ColumnDef[] = [
    { key: 'name', label: T[lang].name, locked: true },
    { key: 'department', label: T[lang].department },
    { key: 'firstVisitPrice', label: T[lang].firstVisitPrice },
    { key: 'followUpPrice', label: T[lang].followUpPrice },
    { key: 'sessionsCount', label: T[lang].sessionsCount },
    { key: 'pricePerSession', label: T[lang].pricePerSession },
    { key: 'totalPrice', label: T[lang].totalPrice },
  ]
  const { visibleKeys, toggle } = useColumnVisibility('treatment-templates-columns', columnDefs)

  const t = T[lang]
  const isAr = lang === 'ar'

  useEffect(() => {
    const id = 'cura-templates-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = globalCss; document.head.appendChild(s)
    }
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    setLoadFailed(false)
    try {
      const [tplRes, deptRes] = await Promise.all([
        api.get('/treatmentplans/templates'),
        api.get('/departments'),
      ])
      setTemplates(tplRes.data)
      setDepartments(deptRes.data.filter((d: Department) => d.isActive))
    } catch (err: any) {
      if (err?.response?.status === 401) navigate('/dashboard')
      else setLoadFailed(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const openAdd = () => {
    setEditId(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  const openEdit = (tpl: Template) => {
    setEditId(tpl.id)
    setForm({
      name: tpl.name,
      nameEn: tpl.nameEn || '',
      departmentId: tpl.departmentId || '',
      defaultSessionsCount: String(tpl.defaultSessionsCount),
      defaultPricePerSession: tpl.defaultPricePerSession?.toString() ?? '',
      defaultTotalPrice: tpl.defaultTotalPrice?.toString() ?? '',
      firstVisitPrice: tpl.firstVisitPrice?.toString() ?? '',
      followUpPrice: tpl.followUpPrice?.toString() ?? '',
    })
    setError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError(t.nameRequired)
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        nameEn: form.nameEn || null,
        departmentId: form.departmentId || null,
        defaultSessionsCount: parseInt(form.defaultSessionsCount) || 1,
        defaultPricePerSession: form.defaultPricePerSession ? parseFloat(form.defaultPricePerSession) : null,
        defaultTotalPrice: form.defaultTotalPrice ? parseFloat(form.defaultTotalPrice) : null,
        firstVisitPrice: form.firstVisitPrice ? parseFloat(form.firstVisitPrice) : null,
        followUpPrice: form.followUpPrice ? parseFloat(form.followUpPrice) : null,
      }

      if (editId) {
        await api.put(`/treatmentplans/templates/${editId}`, payload)
      } else {
        await api.post('/treatmentplans/templates', payload)
      }

      setSuccess(t.saved)
      setShowForm(false)
      fetchAll()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || t.errGeneric)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.confirmDelete)) return
    try {
      await api.delete(`/treatmentplans/templates/${id}`)
      fetchAll()
    } catch {
      setError(t.errGeneric)
    }
  }

  // ✅ Export function
  const handleExport = async (format: 'pdf' | 'excel') => {
    setDownloading(format)
    try {
      const rows = templates.map(tpl => ({
        name: tpl.name,
        department: tpl.departmentName || t.generalBadge,
        firstVisitPrice: tpl.firstVisitPrice || '—',
        followUpPrice: tpl.followUpPrice || '—',
        sessionsCount: tpl.defaultSessionsCount,
        pricePerSession: tpl.defaultPricePerSession || '—',
        totalPrice: tpl.defaultTotalPrice || '—',
      }))

      const response = await api.post(
        `/export/${format}`,
        {
          title: t.title,
          columns: columnDefs.filter(c => visibleKeys.has(c.key)).map(c => c.label),
          rows: rows.map(r =>
            columnDefs.filter(c => visibleKeys.has(c.key)).map(c => String(r[c.key as keyof typeof r] || '—'))
          ),
          isRtl: isAr,
        },
        { responseType: 'blob' }
      )

      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `templates.${format === 'excel' ? 'xlsx' : 'pdf'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setToastError(isAr ? 'فشل التصدير' : 'Export failed')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="templates-shell" style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif", direction: isAr ? 'rtl' : 'ltr', background: '#F8FAFA', minHeight: '100vh', padding: '24px' }}>
      {toastError && (
        <div role="alert" style={{ position:'fixed', top:20, [isAr?'left':'right']:20, zIndex:2000, background:'#FFF5F5', border:'1px solid #FCA5A5', borderRadius:12, padding:'12px 18px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 6px 20px rgba(0,0,0,0.12)', maxWidth:340 }}>
          <span>⚠️</span><span style={{ fontSize:13, color:'#EF4444' }}>{toastError}</span>
        </div>
      )}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 100, padding: '4px 16px', fontSize: 11, fontWeight: 600, color: PRIMARY, marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, animation: 'soft-pulse 2s infinite' }} />
            {isAr ? 'إعدادات العيادة' : 'Clinic Settings'}
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display','Georgia',serif", fontSize: 28, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>
            📋 {t.title}
          </h2>
          <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6, maxWidth: 560 }}>{t.subtitle}</p>
        </div>

        {/* ✅ Print, Export, Columns buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }} className="no-print">
          <button onClick={() => window.print()}
            style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_MUTED, cursor: 'pointer' }}>
            🖨️ {t.print}
          </button>
          <button onClick={() => handleExport('pdf')} disabled={downloading !== null}
            style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_DARK, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading === 'excel' ? 0.5 : 1 }}>
            {downloading === 'pdf' ? '⏳' : '📄'} {t.exportPdf}
          </button>
          <button onClick={() => handleExport('excel')} disabled={downloading !== null}
            style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_DARK, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading === 'pdf' ? 0.5 : 1 }}>
            {downloading === 'excel' ? '⏳' : '📊'} {t.exportExcel}
          </button>
          <div style={{ marginLeft: 'auto' }}>
            <ColumnToggleButton columns={columnDefs} visibleKeys={visibleKeys} onToggle={toggle} isRtl={isAr} />
          </div>
        </div>

        {/* Action */}
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }} className="no-print">
          <button onClick={openAdd}
            style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {t.addTemplate}
          </button>
        </div>

        {/* Messages */}
        {success && (
          <div style={{ background: PRIMARY_SOFT, border: `1px solid ${SUCCESS}40`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>✅</span><span style={{ fontSize: 13, color: SUCCESS }}>{success}</span>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT_DARK, marginBottom: 18 }}>
              {editId ? `✏️ ${t.editTemplate}` : `➕ ${t.newTemplate}`}
            </h3>

            {error && (
              <div style={{ background: ERROR_BG, border: `1px solid ${ERROR_TEXT}40`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: ERROR_TEXT }}>
                ⚠️ {error}
              </div>
            )}

            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.name} *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.nameEn}</label>
                <input className="form-input" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "'Inter',sans-serif", color: TEXT_DARK }} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.department}</label>
                <SearchableSelect
                  isRtl={isAr}
                  value={form.departmentId}
                  onChange={v => setForm({ ...form, departmentId: v })}
                  placeholder={t.departmentPlaceholder}
                  options={departments.map(d => ({ value: d.id, label: isAr ? d.name : (d.nameEn || d.name) }))}
                />
                <p style={{ fontSize: 11, color: TEXT_MUTED, margin: '4px 0 0' }}>💡 {t.departmentHint}</p>
              </div>
            </div>

            {/* أسعار الزيارة الواحدة */}
            <div style={{ background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK, marginBottom: 3 }}>{t.visitPricing}</p>
              <p style={{ fontSize: 11.5, color: TEXT_MUTED, marginBottom: 12 }}>{t.visitPricingHint}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.firstVisitPrice}</label>
                  <input type="number" className="form-input" value={form.firstVisitPrice}
                    onChange={e => setForm({ ...form, firstVisitPrice: e.target.value })}
                    placeholder={t.pricePlaceholder}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "'Inter',sans-serif", color: TEXT_DARK, background: CARD_BG }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.followUpPrice}</label>
                  <input type="number" className="form-input" value={form.followUpPrice}
                    onChange={e => setForm({ ...form, followUpPrice: e.target.value })}
                    placeholder={t.pricePlaceholder}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "'Inter',sans-serif", color: TEXT_DARK, background: CARD_BG }} />
                </div>
              </div>
            </div>

            {/* إعدادات الجلسات المتعددة */}
            <div style={{ background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK, marginBottom: 3 }}>{t.sessionsPricing}</p>
              <p style={{ fontSize: 11.5, color: TEXT_MUTED, marginBottom: 12 }}>{t.sessionsPricingHint}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.sessionsCount}</label>
                  <input type="number" min={1} className="form-input" value={form.defaultSessionsCount}
                    onChange={e => setForm({ ...form, defaultSessionsCount: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "'Inter',sans-serif", color: TEXT_DARK, background: CARD_BG }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.pricePerSession}</label>
                  <input type="number" className="form-input" value={form.defaultPricePerSession}
                    onChange={e => setForm({ ...form, defaultPricePerSession: e.target.value })}
                    placeholder={t.pricePlaceholder}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "'Inter',sans-serif", color: TEXT_DARK, background: CARD_BG }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.totalPrice}</label>
                  <input type="number" className="form-input" value={form.defaultTotalPrice}
                    onChange={e => setForm({ ...form, defaultTotalPrice: e.target.value })}
                    placeholder={t.pricePlaceholder}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "'Inter',sans-serif", color: TEXT_DARK, background: CARD_BG }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 12, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? t.saving : t.save}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 500, color: TEXT_MUTED, cursor: 'pointer' }}>
                {t.cancel}
              </button>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        {loadFailed ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: CARD_BG, borderRadius: 20, border: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 14 }}>⚠️ {t.loadFailed}</p>
            <button onClick={fetchAll}
              style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 9, padding: '9px 20px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
              {t.retry}
            </button>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: TEXT_MUTED }}>
            <div style={{ width: 32, height: 32, margin: '0 auto 12px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: PRIMARY, animation: 'spin 0.8s linear infinite' }} />
            {t.loading}
          </div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: CARD_BG, borderRadius: 20, border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 48, opacity: 0.4, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 14, color: TEXT_MUTED }}>{t.noTemplates}</p>
          </div>
        ) : (
          <div className="templates-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {templates.map(tpl => {
              const hasVisitPrice = tpl.firstVisitPrice != null || tpl.followUpPrice != null
              const hasSessionPrice = tpl.defaultPricePerSession != null || tpl.defaultTotalPrice != null
              return (
                <div key={tpl.id} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>{tpl.name}</h4>
                      {tpl.nameEn && <p style={{ fontSize: 11.5, color: TEXT_MUTED, margin: '2px 0 0', fontFamily: "'Inter',sans-serif" }}>{tpl.nameEn}</p>}
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: tpl.departmentName ? PRIMARY : '#79674D', background: tpl.departmentName ? PRIMARY_SOFT : '#FBF4E4', borderRadius: 100, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                      {tpl.departmentName || t.generalBadge}
                    </span>
                  </div>

                  {hasVisitPrice && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      {tpl.firstVisitPrice != null && (
                        <span style={{ fontSize: 11.5, background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '4px 9px', color: TEXT_DARK }}>
                          {t.firstVisitPrice}: <strong>{tpl.firstVisitPrice}</strong>
                        </span>
                      )}
                      {tpl.followUpPrice != null && (
                        <span style={{ fontSize: 11.5, background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '4px 9px', color: TEXT_DARK }}>
                          {t.followUpPrice}: <strong>{tpl.followUpPrice}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {hasSessionPrice && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11.5, background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '4px 9px', color: TEXT_DARK }}>
                        {tpl.defaultSessionsCount} {t.sessionsBadge}
                        {tpl.defaultPricePerSession != null && ` · ${tpl.defaultPricePerSession}/${isAr ? 'جلسة' : 'session'}`}
                        {tpl.defaultTotalPrice != null && ` · ${isAr ? 'إجمالي' : 'total'}: ${tpl.defaultTotalPrice}`}
                      </span>
                    </div>
                  )}

                  {!hasVisitPrice && !hasSessionPrice && (
                    <p style={{ fontSize: 11.5, color: '#79674D', fontStyle: 'italic', marginBottom: 8 }}>⚠️ {t.noPriceSet}</p>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
                    <button onClick={() => openEdit(tpl)}
                      style={{ flex: 1, background: PRIMARY_SOFT, color: PRIMARY, border: 'none', borderRadius: 9, padding: '7px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      ✏️ {t.edit}
                    </button>
                    <button onClick={() => handleDelete(tpl.id)}
                      style={{ flex: 1, background: ERROR_BG, color: ERROR_TEXT, border: 'none', borderRadius: 9, padding: '7px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      🗑️ {t.delete}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}