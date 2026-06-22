import { useState, useEffect } from 'react'
import api from '../api/axios'

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const ERROR_TEXT = '#C4A77D'

const T = {
  ar: {
    title: 'ملاحظات الزيارة', titleEdit: 'تعديل ملاحظات الزيارة',
    diagnosis: 'التشخيص', diagnosisPlaceholder: 'أدخل التشخيص...',
    prescription: 'الوصفة الطبية', prescriptionPlaceholder: 'أدخل الأدوية والجرعات...',
    tests: 'الفحوصات والأشعة', testsPlaceholder: 'أدخل الفحوصات المطلوبة...',
    notes: 'ملاحظات إضافية', notesPlaceholder: 'أي ملاحظات إضافية...',
    nextVisit: 'موعد الزيارة القادمة', cost: 'تكلفة الزيارة',
    save: 'حفظ', saving: 'جارٍ الحفظ...', cancel: 'إلغاء',
    error: 'حدث خطأ غير متوقع', success: 'تم حفظ ملاحظات الزيارة بنجاح',
  },
  en: {
    title: 'Visit Notes', titleEdit: 'Edit Visit Notes',
    diagnosis: 'Diagnosis', diagnosisPlaceholder: 'Enter diagnosis...',
    prescription: 'Prescription', prescriptionPlaceholder: 'Enter medications and dosages...',
    tests: 'Tests & Imaging', testsPlaceholder: 'Enter required tests...',
    notes: 'Additional Notes', notesPlaceholder: 'Any additional notes...',
    nextVisit: 'Next Visit Date', cost: 'Visit Cost',
    save: 'Save', saving: 'Saving...', cancel: 'Cancel',
    error: 'An unexpected error occurred', success: 'Visit notes saved successfully',
  },
}

interface VisitNote {
  id?: string
  diagnosis?: string
  prescription?: string
  tests?: string
  notes?: string
  nextVisitDate?: string
  cost?: number
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  appointmentId: string
  patientId: string
  doctorId?: string | null
  lang: 'ar' | 'en'
  existingNote?: VisitNote | null
}

export default function VisitNoteModal({ isOpen, onClose, onSaved, appointmentId, patientId, doctorId, lang, existingNote }: Props) {
  const t = T[lang]
  const isAr = lang === 'ar'
  const isEdit = !!existingNote?.id

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    diagnosis: '', prescription: '', tests: '', notes: '', nextVisitDate: '', cost: '',
  })

  useEffect(() => {
    if (existingNote) {
      setForm({
        diagnosis:     existingNote.diagnosis    || '',
        prescription:  existingNote.prescription || '',
        tests:         existingNote.tests        || '',
        notes:         existingNote.notes        || '',
        nextVisitDate: existingNote.nextVisitDate ? existingNote.nextVisitDate.split('T')[0] : '',
        cost:          existingNote.cost?.toString() || '',
      })
    } else {
      setForm({ diagnosis:'', prescription:'', tests:'', notes:'', nextVisitDate:'', cost:'' })
    }
    setError('')
  }, [existingNote, isOpen])

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSaving(true)
    try {
      const payload = {
        patientId,
        appointmentId,
        doctorId: doctorId || null,
        diagnosis:    form.diagnosis    || null,
        prescription: form.prescription || null,
        tests:        form.tests        || null,
        notes:        form.notes        || null,
        nextVisitDate: form.nextVisitDate || null,
        cost: form.cost ? parseFloat(form.cost) : null,
      }
      if (isEdit && existingNote?.id) {
        await api.put(`/visitnotes/${existingNote.id}`, payload)
      } else {
        await api.post('/visitnotes', payload)
      }
      onSaved()
      onClose()
    } catch (err: any) {
      const errData = err.response?.data
      setError(typeof errData === 'string' ? errData : errData?.message || t.error)
    } finally { setSaving(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: CARD_BG, border: `1px solid ${BORDER}`,
    borderRadius: 12, padding: '10px 14px', fontSize: 14,
    fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif",
    color: TEXT_DARK, outline: 'none', transition: 'all 0.2s ease',
  }

  const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical' as const }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: TEXT_MUTED, marginBottom: 5, letterSpacing: '0.5px' }}>{label}</label>
      {children}
    </div>
  )

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: CARD_BG, borderRadius: 24, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        dir={isAr ? 'rtl' : 'ltr'}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, background: PRIMARY_SOFT, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: PRIMARY, letterSpacing: '0.5px', marginBottom: 4 }}>
              🩺 {isEdit ? t.titleEdit : t.title}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: TEXT_MUTED, lineHeight: 1 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <form id="visit-note-form" onSubmit={handleSubmit}>

            {/* التشخيص */}
            <Field label={t.diagnosis}>
              <textarea name="diagnosis" value={form.diagnosis} onChange={handleChange}
                rows={3} placeholder={t.diagnosisPlaceholder} style={textareaStyle} />
            </Field>

            {/* الوصفة */}
            <Field label={t.prescription}>
              <textarea name="prescription" value={form.prescription} onChange={handleChange}
                rows={4} placeholder={t.prescriptionPlaceholder} style={textareaStyle} />
            </Field>

            {/* الفحوصات */}
            <Field label={t.tests}>
              <textarea name="tests" value={form.tests} onChange={handleChange}
                rows={2} placeholder={t.testsPlaceholder} style={textareaStyle} />
            </Field>

            {/* ملاحظات */}
            <Field label={t.notes}>
              <textarea name="notes" value={form.notes} onChange={handleChange}
                rows={2} placeholder={t.notesPlaceholder} style={textareaStyle} />
            </Field>

            {/* صف: الزيارة القادمة + التكلفة */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Field label={t.nextVisit}>
                  <input type="date" name="nextVisitDate" value={form.nextVisitDate} onChange={handleChange}
                    style={{ ...inputStyle, cursor: 'pointer' }} />
                </Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field label={`${t.cost} (JD)`}>
                  <input type="number" name="cost" value={form.cost} onChange={handleChange}
                    min="0" step="0.01" placeholder="0.00" style={inputStyle} />
                </Field>
              </div>
            </div>

            {error && (
              <div style={{ background: '#FDF5F5', border: `1px solid ${ERROR_TEXT}40`, borderRadius: 12, padding: '10px 14px', fontSize: 13, color: ERROR_TEXT }}>
                ⚠️ {error}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 10 }}>
          <button form="visit-note-form" type="submit" disabled={saving}
            style={{ flex: 1, background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 12, padding: '11px', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'all 0.2s ease', fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif" }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#4A7679' }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = PRIMARY }}>
            {saving ? t.saving : `💾 ${t.save}`}
          </button>
          <button type="button" onClick={onClose}
            style={{ padding: '11px 24px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 14, color: TEXT_MUTED, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = PRIMARY_SOFT}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  )
}
