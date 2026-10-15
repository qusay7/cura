import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { PRIMARY, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'
import { showMessageBox } from '../utils/messageBox'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

interface PrescriptionItem {
  id: string
  patientName: string
  doctorName: string | null
  prescription: string
  isDispensed: boolean
  dispensedAt: string | null
  createdAt: string
}

const T = {
  ar: {
    title: '💊 طابور الصيدلية', subtitle: 'الوصفات الطبية المسجّلة بالزيارات — تسجيل الصرف',
    tabPending: 'بانتظار الصرف', tabDispensed: 'مصروفة',
    patient: 'المريض', doctor: 'الطبيب', prescription: 'الوصفة', when: 'وقت التسجيل',
    noItems: 'لا توجد وصفات بهذا الفلتر', loading: 'جارٍ التحميل...',
    dispense: '✅ تم الصرف', dispensing: 'جارٍ الحفظ...', dispensedAt: 'صُرفت بتاريخ',
    errorOccurred: 'حدث خطأ',
  },
  en: {
    title: '💊 Pharmacy Queue', subtitle: 'Prescriptions recorded on visits — mark them dispensed',
    tabPending: 'Pending', tabDispensed: 'Dispensed',
    patient: 'Patient', doctor: 'Doctor', prescription: 'Prescription', when: 'Recorded at',
    noItems: 'No prescriptions for this filter', loading: 'Loading...',
    dispense: '✅ Dispense', dispensing: 'Saving...', dispensedAt: 'Dispensed on',
    errorOccurred: 'An error occurred',
  },
}

export default function PharmacyQueue() {
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const t = T[lang]
  const isAr = lang === 'ar'

  const [items, setItems] = useState<PrescriptionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'dispensed'>('pending')
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/visitnotes/pharmacy-queue?dispensed=${filter === 'dispensed'}`)
      setItems(res.data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const formatDateTime = (iso: string) =>
    new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).toLocaleString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })

  const handleDispense = async (item: PrescriptionItem) => {
    setSavingId(item.id)
    try {
      await api.put(`/visitnotes/${item.id}/dispense`)
      fetchItems()
    } catch (err: any) {
      showMessageBox(err.response?.data || t.errorOccurred, 'error')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif", background: '#F8FAFA', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>{t.title}</h2>
        <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6, marginBottom: 20 }}>{t.subtitle}</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {([['pending', t.tabPending], ['dispensed', t.tabDispensed]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              style={{
                background: filter === key ? PRIMARY : CARD_BG, color: filter === key ? '#FFF' : TEXT_MUTED,
                border: `1px solid ${filter === key ? PRIMARY : BORDER}`, borderRadius: 100, padding: '7px 16px',
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED }}>{t.loading}</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED }}>{t.noItems}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${BORDER}` }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_DARK }}>{item.patientName}</span>
                      <span style={{ fontSize: 11.5, color: TEXT_MUTED }}>👨‍⚕️ {item.doctorName || '—'}</span>
                    </div>
                    <div style={{ fontSize: 13, color: PRIMARY, fontWeight: 600, marginBottom: 4, whiteSpace: 'pre-wrap' }}>💊 {item.prescription}</div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED }}>
                      🕒 {formatDateTime(item.createdAt)}
                      {item.isDispensed && item.dispensedAt && ` — ${t.dispensedAt} ${formatDateTime(item.dispensedAt)}`}
                    </div>
                  </div>
                  {!item.isDispensed && (
                    <button onClick={() => handleDispense(item)} disabled={savingId === item.id}
                      style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 12.5, fontWeight: 700, cursor: savingId === item.id ? 'not-allowed' : 'pointer', opacity: savingId === item.id ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                      {savingId === item.id ? t.dispensing : t.dispense}
                    </button>
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
