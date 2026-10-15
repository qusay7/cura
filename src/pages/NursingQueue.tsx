import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { PRIMARY, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'
import { showMessageBox } from '../utils/messageBox'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

interface NursingItem {
  type: 'appointment' | 'emergency'
  id: string
  patientId: string
  patientName: string
  doctorName: string | null
  time: string
  hasVitals: boolean
  bloodPressure: string | null
  bloodSugar: number | null
  heartRate: number | null
  respiratoryRate: number | null
}

const T = {
  ar: {
    title: '🩺 طابور التمريض', subtitle: 'مواعيد اليوم وحالات الطوارئ النشطة — تسجيل العلامات الحيوية قبل دخول الطبيب',
    patient: 'المريض', doctor: 'الطبيب', time: 'الوقت',
    noItems: 'لا توجد زيارات نشطة اليوم', loading: 'جارٍ التحميل...',
    typeAppointment: 'موعد', typeEmergency: 'طوارئ',
    bloodPressure: 'ضغط الدم', bloodPressurePlaceholder: '120/80',
    bloodSugar: 'سكر الدم', heartRate: 'النبض', respiratoryRate: 'التنفس',
    save: '✅ حفظ', saving: 'جارٍ الحفظ...', edit: '✏️ تعديل', vitalsRecorded: 'تم أخذ العلامات الحيوية',
    errorOccurred: 'حدث خطأ',
  },
  en: {
    title: '🩺 Nursing Queue', subtitle: "Today's appointments and active ER cases — record vitals before the doctor sees the patient",
    patient: 'Patient', doctor: 'Doctor', time: 'Time',
    noItems: 'No active visits today', loading: 'Loading...',
    typeAppointment: 'Appointment', typeEmergency: 'Emergency',
    bloodPressure: 'Blood Pressure', bloodPressurePlaceholder: '120/80',
    bloodSugar: 'Blood Sugar', heartRate: 'Heart Rate', respiratoryRate: 'Resp. Rate',
    save: '✅ Save', saving: 'Saving...', edit: '✏️ Edit', vitalsRecorded: 'Vitals recorded',
    errorOccurred: 'An error occurred',
  },
}

export default function NursingQueue() {
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const t = T[lang]
  const isAr = lang === 'ar'

  const [items, setItems] = useState<NursingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openFormId, setOpenFormId] = useState<string | null>(null)
  const [form, setForm] = useState({ bloodPressure: '', bloodSugar: '', heartRate: '', respiratoryRate: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/visitnotes/nursing-queue')
      setItems(res.data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const formatTime = (iso: string) =>
    new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).toLocaleString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })

  const openForm = (item: NursingItem) => {
    setOpenFormId(item.id)
    setForm({
      bloodPressure: item.bloodPressure || '',
      bloodSugar: item.bloodSugar?.toString() || '',
      heartRate: item.heartRate?.toString() || '',
      respiratoryRate: item.respiratoryRate?.toString() || '',
    })
  }

  const handleSave = async (item: NursingItem) => {
    setSaving(true)
    try {
      await api.put('/visitnotes/vitals', {
        patientId: item.patientId,
        appointmentId: item.type === 'appointment' ? item.id : undefined,
        queueEntryId: item.type === 'emergency' ? item.id : undefined,
        bloodPressure: form.bloodPressure || null,
        bloodSugar: form.bloodSugar ? parseFloat(form.bloodSugar) : null,
        heartRate: form.heartRate ? parseInt(form.heartRate) : null,
        respiratoryRate: form.respiratoryRate ? parseInt(form.respiratoryRate) : null,
      })
      setOpenFormId(null)
      fetchItems()
    } catch (err: any) {
      showMessageBox(err.response?.data || t.errorOccurred, 'error')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = { padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif", background: '#F8FAFA', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>{t.title}</h2>
        <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6, marginBottom: 20 }}>{t.subtitle}</p>

        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED }}>{t.loading}</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED }}>{t.noItems}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {items.map(item => (
                <div key={`${item.type}-${item.id}`} style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_DARK }}>{item.patientName}</span>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 100, background: item.type === 'emergency' ? '#FFF5F5' : '#EBF4FF', color: item.type === 'emergency' ? '#EF4444' : '#3B82F6' }}>
                          {item.type === 'emergency' ? t.typeEmergency : t.typeAppointment}
                        </span>
                        <span style={{ fontSize: 11.5, color: TEXT_MUTED }}>👨‍⚕️ {item.doctorName || '—'}</span>
                      </div>
                      <div style={{ fontSize: 11, color: TEXT_MUTED }}>🕒 {formatTime(item.time)}</div>
                      {item.hasVitals && openFormId !== item.id && (
                        <div style={{ fontSize: 11.5, color: '#22C55E', marginTop: 6, fontWeight: 600, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <span>✅ {t.vitalsRecorded}</span>
                          {item.bloodPressure && <span>🩸 {item.bloodPressure}</span>}
                          {item.bloodSugar != null && <span>🍬 {item.bloodSugar}</span>}
                          {item.heartRate != null && <span>❤️ {item.heartRate}</span>}
                          {item.respiratoryRate != null && <span>🌬️ {item.respiratoryRate}</span>}
                        </div>
                      )}
                    </div>
                    {openFormId !== item.id && (
                      <button onClick={() => openForm(item)}
                        style={{ background: item.hasVitals ? 'transparent' : PRIMARY, color: item.hasVitals ? TEXT_DARK : '#FFF', border: item.hasVitals ? `1px solid ${BORDER}` : 'none', borderRadius: 9, padding: '8px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {item.hasVitals ? t.edit : t.save.replace('✅ ', '')}
                      </button>
                    )}
                  </div>

                  {openFormId === item.id && (
                    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 10.5, color: TEXT_MUTED, marginBottom: 4 }}>{t.bloodPressure}</label>
                        <input value={form.bloodPressure} onChange={e => setForm({ ...form, bloodPressure: e.target.value })} placeholder={t.bloodPressurePlaceholder} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 10.5, color: TEXT_MUTED, marginBottom: 4 }}>{t.bloodSugar}</label>
                        <input type="number" value={form.bloodSugar} onChange={e => setForm({ ...form, bloodSugar: e.target.value })} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 10.5, color: TEXT_MUTED, marginBottom: 4 }}>{t.heartRate}</label>
                        <input type="number" value={form.heartRate} onChange={e => setForm({ ...form, heartRate: e.target.value })} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 10.5, color: TEXT_MUTED, marginBottom: 4 }}>{t.respiratoryRate}</label>
                        <input type="number" value={form.respiratoryRate} onChange={e => setForm({ ...form, respiratoryRate: e.target.value })} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                        <button onClick={() => handleSave(item)} disabled={saving}
                          style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                          {saving ? t.saving : t.save}
                        </button>
                        <button onClick={() => setOpenFormId(null)} disabled={saving}
                          style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 9, padding: '9px 14px', fontSize: 12, color: TEXT_MUTED, cursor: 'pointer' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
