import { useEffect, useState } from 'react'
import api from '../api/axios'
import { PRIMARY, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'
import { printSection, escapeHtml } from '../utils/printSection'

interface LabOrderWidgetProps {
  patientId: string
  appointmentId?: string
  queueEntryId?: string
  lang: 'ar' | 'en'
  category?: 'lab' | 'radiology'
  // ✅ اختياري — غيّر قيمته (مثلاً عدّاد) لإجبار إعادة جلب القائمة من مكوّن
  // خارجي بعد ما يُنشئ طلب تحليل/أشعة من مصدر تاني (مثلاً اقتراحات التشخيص)
  refreshTrigger?: number
  // ✅ طبيب الزيارة/الحالة الحالية — يُطبع بتذييل الصفحة عند الطباعة
  doctorName?: string | null
}

interface LabOrderItem {
  id: string
  testName: string
  category: 'lab' | 'radiology'
  status: 'ordered' | 'in_progress' | 'completed' | 'cancelled'
  resultNotes: string | null
  orderedAt: string
  appointmentId: string | null
  queueEntryId: string | null
}

const COPY = {
  lab: {
    ar: { title: '🧪 التحاليل المخبرية', placeholder: 'اسم التحليل (مثال: CBC، سكر صائم...)', noItems: 'لا توجد تحاليل مطلوبة لهذي الزيارة' },
    en: { title: '🧪 Lab Tests', placeholder: 'Test name (e.g. CBC, Fasting Sugar...)', noItems: 'No tests ordered for this visit' },
  },
  radiology: {
    ar: { title: '🩻 فحوصات الأشعة', placeholder: 'اسم الفحص (مثال: أشعة صدر، سونار...)', noItems: 'لا توجد فحوصات مطلوبة لهذي الزيارة' },
    en: { title: '🩻 Imaging', placeholder: 'Scan name (e.g. Chest X-ray, Ultrasound...)', noItems: 'No imaging ordered for this visit' },
  },
}

const T = {
  ar: {
    order: '+ طلب', ordering: 'جارٍ الطلب...',
    statusOrdered: '⏳ مطلوب', statusInProgress: '🔬 جاري', statusCompleted: '✅ مكتمل', statusCancelled: '✕ ملغي',
  },
  en: {
    order: '+ Order', ordering: 'Ordering...',
    statusOrdered: '⏳ Ordered', statusInProgress: '🔬 In Progress', statusCompleted: '✅ Completed', statusCancelled: '✕ Cancelled',
  },
}

// ✅ يُستخدم بزيارة موعد عادي أو طوارئ (appointmentId/queueEntryId) — نفس مبدأ
// ProceduresPicker: مكوّن مستقل يجلب ويعرض ويضيف بحاله، بدون اعتماد على صفحة الأب.
// category يفرّق بين طلب مختبر وطلب أشعة (نفس الكيان بالباك اند، LabOrder.Category)
export default function LabOrderWidget({ patientId, appointmentId, queueEntryId, lang, category = 'lab', refreshTrigger, doctorName }: LabOrderWidgetProps) {
  const t = T[lang]
  const c = COPY[category][lang]
  const isAr = lang === 'ar'

  const [items, setItems] = useState<LabOrderItem[]>([])
  const [testName, setTestName] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [error, setError] = useState('')

  const fetchItems = () => {
    api.get(`/laborders/patient/${patientId}`)
      .then(res => setItems((res.data as LabOrderItem[]).filter(o =>
        o.category === category && ((appointmentId && o.appointmentId === appointmentId) || (queueEntryId && o.queueEntryId === queueEntryId))
      )))
      .catch(() => {})
  }

  useEffect(() => { fetchItems() }, [patientId, appointmentId, queueEntryId, category, refreshTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOrder = async () => {
    if (!testName.trim()) return
    setOrdering(true); setError('')
    try {
      await api.post('/laborders', { patientId, appointmentId, queueEntryId, testName: testName.trim(), category })
      setTestName('')
      fetchItems()
    } catch {
      setError(isAr ? 'فشل طلب التحليل' : 'Failed to order the test')
    } finally {
      setOrdering(false)
    }
  }

  const statusMap = {
    ordered: { bg: '#FFF8E1', fg: '#B8892A', label: t.statusOrdered },
    in_progress: { bg: '#EBF4FF', fg: '#3B82F6', label: t.statusInProgress },
    completed: { bg: '#E8F5E9', fg: '#22C55E', label: t.statusCompleted },
    cancelled: { bg: '#F3F4F6', fg: '#6B7280', label: t.statusCancelled },
  }

  const statusBadge = (s: LabOrderItem['status']) => {
    const map = statusMap[s]
    return <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 100, background: map.bg, color: map.fg }}>{map.label}</span>
  }

  // ✅ طباعة منفصلة لهذا القسم بس (مختبر أو أشعة حسب category) — نفس آلية
  // طباعة التشخيص/الوصفة بـ VisitWorkspace، بس القائمة هون جوّا المكوّن نفسه
  const handlePrint = () => {
    if (items.length === 0) return
    let clinicId = ''
    try { clinicId = JSON.parse(localStorage.getItem('user') || '{}').clinicId || '' } catch { /* ignore */ }
    if (!clinicId) return
    const bodyHtml = `<ul style="padding-inline-start:18px;margin:0;">${items.map(i =>
      `<li style="margin-bottom:6px;">${escapeHtml(i.testName)} — ${statusMap[i.status].label}</li>`
    ).join('')}</ul>`
    printSection({ clinicId, title: c.title, isAr, bodyHtml, doctorName })
  }

  return (
    <div style={{ background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <label style={{ fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED }}>{c.title}</label>
        {items.length > 0 && (
          <button type="button" onClick={handlePrint} title={c.title}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13 }}>🖨️</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 12 }}>
        <input value={testName} onChange={e => setTestName(e.target.value)} placeholder={c.placeholder}
          style={{ padding: '9px 10px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG }} />
        <button type="button" onClick={handleOrder} disabled={!testName.trim() || ordering}
          style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 9, padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: testName.trim() ? 'pointer' : 'not-allowed', opacity: testName.trim() ? 1 : 0.5 }}>
          {ordering ? t.ordering : t.order}
        </button>
      </div>

      {error && <p style={{ fontSize: 11, color: '#EF4444', margin: '0 0 10px' }}>⚠️ {error}</p>}

      {items.length === 0 ? (
        <p style={{ fontSize: 11.5, color: TEXT_MUTED, fontStyle: 'italic', margin: 0 }}>{c.noItems}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 12px' }}>
              <span style={{ fontSize: 12.5, color: TEXT_DARK }}>{item.testName}</span>
              {statusBadge(item.status)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
