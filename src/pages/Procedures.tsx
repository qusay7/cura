import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { hasPermission } from '../utils/permissions'
import { getCurrencySymbol } from '../utils/i18n'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const globalCss = `
.procedures-shell { animation: fade-up 0.4s cubic-bezier(0.2,0.9,0.4,1.1) both; }
@media(max-width:768px) {
  .procedures-grid { grid-template-columns: 1fr !important; }
}
`

const ERROR_BG = '#FDF5F5'
const ERROR_TEXT = '#79674D'
const SUCCESS = '#4A7679'

const T = {
  ar: {
    title: 'كتالوج الإجراءات',
    subtitle: 'الحقن، البنج، الأدوية وأي إجراء إضافي — يضيفه الطبيب لأي زيارة بسعره الافتراضي، وله تعديله وقت الاستخدام',
    addProcedure: '+ إضافة إجراء', editProcedure: 'تعديل الإجراء', newProcedure: 'إجراء جديد',
    name: 'اسم الإجراء', nameEn: 'الاسم بالإنجليزي', defaultPrice: 'السعر الافتراضي',
    save: 'حفظ', cancel: 'إلغاء', saving: 'جارٍ الحفظ...',
    edit: 'تعديل', delete: 'حذف', noProcedures: 'لا توجد إجراءات محفوظة — اضغط "إضافة إجراء" للبدء',
    loading: 'جاري التحميل...', confirmDelete: 'متأكد تبي تحذف هذا الإجراء؟',
    loadFailed: 'تعذّر تحميل القائمة', retry: 'إعادة المحاولة',
    saved: 'تم الحفظ بنجاح', errGeneric: 'حدث خطأ', nameRequired: 'اسم الإجراء مطلوب',
    noPriceSet: 'السعر غير محدد',
  },
  en: {
    title: 'Procedures Catalog',
    subtitle: 'Injections, anesthesia, medications, and any add-on procedure — a doctor can attach it to any visit at its default price, editable per use',
    addProcedure: '+ Add Procedure', editProcedure: 'Edit Procedure', newProcedure: 'New Procedure',
    name: 'Procedure Name', nameEn: 'English Name', defaultPrice: 'Default Price',
    save: 'Save', cancel: 'Cancel', saving: 'Saving...',
    edit: 'Edit', delete: 'Delete', noProcedures: 'No procedures saved yet — click "Add Procedure" to start',
    loading: 'Loading...', confirmDelete: 'Are you sure you want to delete this procedure?',
    loadFailed: 'Failed to load the list', retry: 'Retry',
    saved: 'Saved successfully', errGeneric: 'An error occurred', nameRequired: 'Procedure name is required',
    noPriceSet: 'Price not set',
  },
}

interface ProcedureItem { id: string; name: string; nameEn: string | null; defaultPrice: number | null }

const emptyForm = { name: '', nameEn: '', defaultPrice: '' }

export default function Procedures() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [procedures, setProcedures] = useState<ProcedureItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const t = T[lang]
  const isAr = lang === 'ar'

  useEffect(() => {
    const id = 'cura-procedures-css'
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
      const res = await api.get('/procedures')
      setProcedures(res.data)
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

  const openEdit = (p: ProcedureItem) => {
    setEditId(p.id)
    setForm({ name: p.name, nameEn: p.nameEn || '', defaultPrice: p.defaultPrice?.toString() ?? '' })
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
        defaultPrice: form.defaultPrice ? parseFloat(form.defaultPrice) : null,
      }

      if (editId) {
        await api.put(`/procedures/${editId}`, payload)
      } else {
        await api.post('/procedures', payload)
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
      await api.delete(`/procedures/${id}`)
      fetchAll()
    } catch {
      setError(t.errGeneric)
    }
  }

  const canManage = hasPermission('procedures.manage')

  return (
    <div className="procedures-shell" style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif", direction: isAr ? 'rtl' : 'ltr', background: '#F8FAFA', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 100, padding: '4px 16px', fontSize: 11, fontWeight: 600, color: PRIMARY, marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, animation: 'soft-pulse 2s infinite' }} />
            {isAr ? 'إعدادات العيادة' : 'Clinic Settings'}
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display','Georgia',serif", fontSize: 28, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>
            💉 {t.title}
          </h2>
          <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6, maxWidth: 640 }}>{t.subtitle}</p>
        </div>

        {canManage && (
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={openAdd}
              style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t.addProcedure}
            </button>
          </div>
        )}

        {success && (
          <div style={{ background: PRIMARY_SOFT, border: `1px solid ${SUCCESS}40`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>✅</span><span style={{ fontSize: 13, color: SUCCESS }}>{success}</span>
          </div>
        )}

        {showForm && (
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT_DARK, marginBottom: 18 }}>
              {editId ? `✏️ ${t.editProcedure}` : `➕ ${t.newProcedure}`}
            </h3>

            {error && (
              <div style={{ background: ERROR_BG, border: `1px solid ${ERROR_TEXT}40`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: ERROR_TEXT }}>
                ⚠️ {error}
              </div>
            )}

            <div className="procedures-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.name} *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.nameEn}</label>
                <input value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "'Inter',sans-serif", color: TEXT_DARK }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.defaultPrice} ({getCurrencySymbol(lang)})</label>
                <input type="number" value={form.defaultPrice} onChange={e => setForm({ ...form, defaultPrice: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "'Inter',sans-serif", color: TEXT_DARK }} />
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
        ) : procedures.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: CARD_BG, borderRadius: 20, border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 48, opacity: 0.4, marginBottom: 12 }}>💉</div>
            <p style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: canManage ? 16 : 0 }}>{t.noProcedures}</p>
            {canManage && (
              <button onClick={openAdd}
                style={{ background: PRIMARY, color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {t.addProcedure}
              </button>
            )}
          </div>
        ) : (
          <div className="procedures-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {procedures.map(p => (
              <div key={p.id} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 18 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, margin: '0 0 4px' }}>{p.name}</h4>
                {p.nameEn && <p style={{ fontSize: 11.5, color: TEXT_MUTED, margin: '0 0 8px', fontFamily: "'Inter',sans-serif" }}>{p.nameEn}</p>}
                <p style={{ fontSize: 13, color: p.defaultPrice != null ? PRIMARY : '#79674D', fontWeight: 600, fontStyle: p.defaultPrice != null ? 'normal' : 'italic', margin: 0 }}>
                  {p.defaultPrice != null ? `${p.defaultPrice} ${getCurrencySymbol(lang)}` : t.noPriceSet}
                </p>

                {canManage && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                    <button onClick={() => openEdit(p)}
                      style={{ flex: 1, background: PRIMARY_SOFT, color: PRIMARY, border: 'none', borderRadius: 9, padding: '7px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      ✏️ {t.edit}
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      style={{ flex: 1, background: ERROR_BG, color: ERROR_TEXT, border: 'none', borderRadius: 9, padding: '7px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      🗑️ {t.delete}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
