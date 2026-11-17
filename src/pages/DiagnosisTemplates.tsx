import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { hasPermission } from '../utils/permissions'
import SearchableSelect from '../components/SearchableSelect'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'
import { showMessageBox } from '../utils/messageBox'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const globalCss = `
.diagnosis-templates-shell { animation: fade-up 0.4s cubic-bezier(0.2,0.9,0.4,1.1) both; }
@media(max-width:768px) {
  .diagnosis-templates-grid { grid-template-columns: 1fr !important; }
}
`

const ERROR_BG = '#FDF5F5'
const ERROR_TEXT = '#79674D'
const SUCCESS = '#4A7679'

const T = {
  ar: {
    title: 'اقتراحات التشخيص والأدوية',
    subtitle: 'قائمة العيادة الخاصة بالتشخيصات والأدوية المقترحة — تظهر كاقتراحات قابلة للتعديل أثناء كتابة ملاحظة الزيارة، وما بتُفرض على الطبيب أبداً',
    addTemplate: '+ إضافة تشخيص', editTemplate: 'تعديل التشخيص', newTemplate: 'تشخيص جديد',
    name: 'اسم التشخيص', medications: 'الأدوية المقترحة',
    drugName: 'اسم الدواء', instructions: 'الجرعة/التعليمات (اختياري)',
    addMedication: '+ إضافة دواء', removeMedication: 'حذف',
    tests: 'التحاليل والأشعة المقترحة', testName: 'اسم التحليل/الأشعة', category: 'النوع',
    lab: 'تحليل مخبري', radiology: 'أشعة', addTest: '+ إضافة تحليل/أشعة',
    noTests: 'بدون تحاليل أو أشعة مقترحة',
    procedures: 'الإجراءات المقترحة', pickProcedure: 'اختر إجراء...', needsNursingLabel: '🩺 يحتاج تنفيذ تمريض',
    addProcedure: '+ إضافة إجراء', noProcedures: 'بدون إجراءات مقترحة',
    save: 'حفظ', cancel: 'إلغاء', saving: 'جارٍ الحفظ...',
    edit: 'تعديل', delete: 'حذف', noTemplates: 'لا توجد تشخيصات محفوظة — اضغط "إضافة تشخيص" للبدء',
    loading: 'جاري التحميل...', confirmDelete: 'متأكد تبي تحذف هذا التشخيص؟',
    loadFailed: 'تعذّر تحميل القائمة', retry: 'إعادة المحاولة',
    saved: 'تم الحفظ بنجاح', errGeneric: 'حدث خطأ', nameRequired: 'اسم التشخيص مطلوب',
    noMedications: 'بدون أدوية مقترحة',
  },
  en: {
    title: 'Diagnosis & Medication Suggestions',
    subtitle: "Your clinic's own list of diagnoses and suggested medications — shown as editable suggestions while writing a visit note, never forced on the doctor",
    addTemplate: '+ Add Diagnosis', editTemplate: 'Edit Diagnosis', newTemplate: 'New Diagnosis',
    name: 'Diagnosis Name', medications: 'Suggested Medications',
    drugName: 'Drug Name', instructions: 'Dosage/Instructions (optional)',
    addMedication: '+ Add Medication', removeMedication: 'Remove',
    tests: 'Suggested Tests & Radiology', testName: 'Test/Radiology Name', category: 'Type',
    lab: 'Lab Test', radiology: 'Radiology', addTest: '+ Add Test/Radiology',
    noTests: 'No suggested tests or radiology',
    procedures: 'Suggested Procedures', pickProcedure: 'Pick a procedure...', needsNursingLabel: '🩺 Needs nursing to perform',
    addProcedure: '+ Add Procedure', noProcedures: 'No suggested procedures',
    save: 'Save', cancel: 'Cancel', saving: 'Saving...',
    edit: 'Edit', delete: 'Delete', noTemplates: 'No diagnoses saved yet — click "Add Diagnosis" to start',
    loading: 'Loading...', confirmDelete: 'Are you sure you want to delete this diagnosis?',
    loadFailed: 'Failed to load the list', retry: 'Retry',
    saved: 'Saved successfully', errGeneric: 'An error occurred', nameRequired: 'Diagnosis name is required',
    noMedications: 'No suggested medications',
  },
}

interface Medication { id?: string; drugName: string; instructions: string }
interface Test { id?: string; testName: string; category: 'lab' | 'radiology' }
interface TemplateProcedure { id?: string; procedureId: string; name?: string; nameEn?: string | null; defaultPrice?: number | null; needsNursing: boolean }
interface Template { id: string; name: string; medications: Medication[]; tests: Test[]; procedures: TemplateProcedure[] }
interface CatalogProcedure { id: string; name: string; nameEn: string | null }

const emptyForm = {
  name: '',
  medications: [{ drugName: '', instructions: '' }] as Medication[],
  tests: [{ testName: '', category: 'lab' }] as Test[],
  procedures: [{ procedureId: '', needsNursing: false }] as TemplateProcedure[],
}

export default function DiagnosisTemplates() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [templates, setTemplates] = useState<Template[]>([])
  const [catalog, setCatalog] = useState<CatalogProcedure[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  const t = T[lang]
  const isAr = lang === 'ar'

  useEffect(() => {
    const id = 'cura-diagnosis-templates-css'
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
      const res = await api.get('/diagnosistemplates')
      setTemplates(res.data)
    } catch (err: any) {
      if (err?.response?.status === 401) navigate('/dashboard')
      else setLoadFailed(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    api.get('/procedures').then(res => setCatalog(res.data)).catch(() => {})
  }, [])

  const openAdd = () => {
    setEditId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (tpl: Template) => {
    setEditId(tpl.id)
    setForm({
      name: tpl.name,
      medications: tpl.medications.length > 0
        ? tpl.medications.map(m => ({ drugName: m.drugName, instructions: m.instructions || '' }))
        : [{ drugName: '', instructions: '' }],
      tests: tpl.tests.length > 0
        ? tpl.tests.map(x => ({ testName: x.testName, category: x.category }))
        : [{ testName: '', category: 'lab' }],
      procedures: tpl.procedures.length > 0
        ? tpl.procedures.map(p => ({ procedureId: p.procedureId, needsNursing: p.needsNursing }))
        : [{ procedureId: '', needsNursing: false }],
    })
    setShowForm(true)
  }

  const updateMedication = (idx: number, field: 'drugName' | 'instructions', value: string) => {
    setForm(f => ({ ...f, medications: f.medications.map((m, i) => i === idx ? { ...m, [field]: value } : m) }))
  }

  const addMedicationRow = () => setForm(f => ({ ...f, medications: [...f.medications, { drugName: '', instructions: '' }] }))
  const removeMedicationRow = (idx: number) => setForm(f => ({ ...f, medications: f.medications.filter((_, i) => i !== idx) }))

  const updateTest = (idx: number, field: 'testName' | 'category', value: string) => {
    setForm(f => ({ ...f, tests: f.tests.map((x, i) => i === idx ? { ...x, [field]: value } : x) }))
  }

  const addTestRow = () => setForm(f => ({ ...f, tests: [...f.tests, { testName: '', category: 'lab' }] }))
  const removeTestRow = (idx: number) => setForm(f => ({ ...f, tests: f.tests.filter((_, i) => i !== idx) }))

  const updateProcedure = (idx: number, field: 'procedureId' | 'needsNursing', value: string | boolean) => {
    setForm(f => ({ ...f, procedures: f.procedures.map((p, i) => i === idx ? { ...p, [field]: value } : p) }))
  }

  const addProcedureRow = () => setForm(f => ({ ...f, procedures: [...f.procedures, { procedureId: '', needsNursing: false }] }))
  const removeProcedureRow = (idx: number) => setForm(f => ({ ...f, procedures: f.procedures.filter((_, i) => i !== idx) }))

  const handleSave = async () => {
    if (!form.name.trim()) {
      showMessageBox(t.nameRequired, 'warning')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        medications: form.medications
          .filter(m => m.drugName.trim())
          .map(m => ({ drugName: m.drugName.trim(), instructions: m.instructions.trim() || null })),
        tests: form.tests
          .filter(x => x.testName.trim())
          .map(x => ({ testName: x.testName.trim(), category: x.category })),
        procedures: form.procedures
          .filter(p => p.procedureId)
          .map(p => ({ procedureId: p.procedureId, needsNursing: p.needsNursing })),
      }

      if (editId) {
        await api.put(`/diagnosistemplates/${editId}`, payload)
      } else {
        await api.post('/diagnosistemplates', payload)
      }

      setSuccess(t.saved)
      setShowForm(false)
      fetchAll()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      showMessageBox(err.response?.data?.message || err.response?.data || t.errGeneric, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.confirmDelete)) return
    try {
      await api.delete(`/diagnosistemplates/${id}`)
      fetchAll()
    } catch {
      showMessageBox(t.errGeneric, 'error')
    }
  }

  const canManage = hasPermission('diagnosistemplates.manage')

  return (
    <div className="diagnosis-templates-shell" style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif", direction: isAr ? 'rtl' : 'ltr', background: '#F8FAFA', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 100, padding: '4px 16px', fontSize: 11, fontWeight: 600, color: PRIMARY, marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, animation: 'soft-pulse 2s infinite' }} />
            {isAr ? 'إعدادات العيادة' : 'Clinic Settings'}
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display','Georgia',serif", fontSize: 28, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>
            💊 {t.title}
          </h2>
          <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6, maxWidth: 640 }}>{t.subtitle}</p>
        </div>

        {/* Action */}
        {canManage && (
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={openAdd}
              style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t.addTemplate}
            </button>
          </div>
        )}

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

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.name} *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK }} />
            </div>

            <div style={{ background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK, marginBottom: 12 }}>{t.medications}</p>

              {form.medications.map((m, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 10, alignItems: 'end' }}>
                  <div>
                    {idx === 0 && <label style={{ display: 'block', fontSize: 11, color: TEXT_MUTED, marginBottom: 4 }}>{t.drugName}</label>}
                    <input value={m.drugName} onChange={e => updateMedication(idx, 'drugName', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG }} />
                  </div>
                  <div>
                    {idx === 0 && <label style={{ display: 'block', fontSize: 11, color: TEXT_MUTED, marginBottom: 4 }}>{t.instructions}</label>}
                    <input value={m.instructions} onChange={e => updateMedication(idx, 'instructions', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG }} />
                  </div>
                  <button type="button" onClick={() => removeMedicationRow(idx)}
                    style={{ background: ERROR_BG, color: ERROR_TEXT, border: 'none', borderRadius: 9, padding: '8px 12px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>
              ))}

              <button type="button" onClick={addMedicationRow}
                style={{ background: PRIMARY_SOFT, color: PRIMARY, border: 'none', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                {t.addMedication}
              </button>
            </div>

            <div style={{ background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK, marginBottom: 12 }}>{t.tests}</p>

              {form.tests.map((x, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, marginBottom: 10, alignItems: 'end' }}>
                  <div>
                    {idx === 0 && <label style={{ display: 'block', fontSize: 11, color: TEXT_MUTED, marginBottom: 4 }}>{t.testName}</label>}
                    <input value={x.testName} onChange={e => updateTest(idx, 'testName', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG }} />
                  </div>
                  <div>
                    {idx === 0 && <label style={{ display: 'block', fontSize: 11, color: TEXT_MUTED, marginBottom: 4 }}>{t.category}</label>}
                    <select value={x.category} onChange={e => updateTest(idx, 'category', e.target.value)}
                      style={{ padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG, cursor: 'pointer' }}>
                      <option value="lab">🧪 {t.lab}</option>
                      <option value="radiology">☢️ {t.radiology}</option>
                    </select>
                  </div>
                  <button type="button" onClick={() => removeTestRow(idx)}
                    style={{ background: ERROR_BG, color: ERROR_TEXT, border: 'none', borderRadius: 9, padding: '8px 12px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>
              ))}

              <button type="button" onClick={addTestRow}
                style={{ background: PRIMARY_SOFT, color: PRIMARY, border: 'none', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                {t.addTest}
              </button>
            </div>

            <div style={{ background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK, marginBottom: 12 }}>💉 {t.procedures}</p>

              {form.procedures.map((p, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, marginBottom: 10, alignItems: 'end' }}>
                  <div>
                    <SearchableSelect isRtl={isAr} value={p.procedureId} onChange={v => updateProcedure(idx, 'procedureId', v)}
                      placeholder={t.pickProcedure}
                      options={catalog.map(c => ({ value: c.id, label: isAr ? c.name : (c.nameEn || c.name) }))} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: TEXT_MUTED, cursor: 'pointer', whiteSpace: 'nowrap', paddingBottom: 8 }}>
                    <input type="checkbox" checked={p.needsNursing} onChange={e => updateProcedure(idx, 'needsNursing', e.target.checked)} />
                    {t.needsNursingLabel}
                  </label>
                  <button type="button" onClick={() => removeProcedureRow(idx)}
                    style={{ background: ERROR_BG, color: ERROR_TEXT, border: 'none', borderRadius: 9, padding: '8px 12px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>
              ))}

              <button type="button" onClick={addProcedureRow}
                style={{ background: PRIMARY_SOFT, color: PRIMARY, border: 'none', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                {t.addProcedure}
              </button>
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

        {/* List */}
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
            <div style={{ fontSize: 48, opacity: 0.4, marginBottom: 12 }}>💊</div>
            <p style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: canManage ? 16 : 0 }}>{t.noTemplates}</p>
            {canManage && (
              <button onClick={openAdd}
                style={{ background: PRIMARY, color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {t.addTemplate}
              </button>
            )}
          </div>
        ) : (
          <div className="diagnosis-templates-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {templates.map(tpl => (
              <div key={tpl.id} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 18 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, margin: '0 0 10px' }}>{tpl.name}</h4>

                {tpl.medications.length === 0 ? (
                  <p style={{ fontSize: 11.5, color: '#79674D', fontStyle: 'italic', marginBottom: 8 }}>{t.noMedications}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                    {tpl.medications.map((m, i) => (
                      <span key={i} style={{ fontSize: 11.5, background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '4px 9px', color: TEXT_DARK }}>
                        💊 <strong>{m.drugName}</strong>{m.instructions ? ` — ${m.instructions}` : ''}
                      </span>
                    ))}
                  </div>
                )}

                {tpl.tests.length === 0 ? (
                  <p style={{ fontSize: 11.5, color: '#79674D', fontStyle: 'italic', marginBottom: 8 }}>{t.noTests}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                    {tpl.tests.map((x, i) => (
                      <span key={i} style={{ fontSize: 11.5, background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '4px 9px', color: TEXT_DARK }}>
                        {x.category === 'radiology' ? '☢️' : '🧪'} <strong>{x.testName}</strong>
                      </span>
                    ))}
                  </div>
                )}

                {tpl.procedures.length === 0 ? (
                  <p style={{ fontSize: 11.5, color: '#79674D', fontStyle: 'italic', marginBottom: 8 }}>{t.noProcedures}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                    {tpl.procedures.map((p, i) => (
                      <span key={i} style={{ fontSize: 11.5, background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '4px 9px', color: TEXT_DARK }}>
                        💉 <strong>{isAr ? p.name : (p.nameEn || p.name)}</strong>{p.needsNursing ? ' · 🩺' : ''}
                      </span>
                    ))}
                  </div>
                )}

                {canManage && (
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
