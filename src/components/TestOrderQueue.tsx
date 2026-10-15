import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../api/axios'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'
import { showMessageBox } from '../utils/messageBox'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

interface TestOrder {
  id: string
  patientId: string
  patientName: string
  doctorName: string | null
  testName: string
  status: 'ordered' | 'in_progress' | 'completed' | 'cancelled'
  notes: string | null
  resultNotes: string | null
  resultAttachmentId: string | null
  orderedAt: string
  startedAt: string | null
  completedAt: string | null
}

// ✅ نفس كيان LabOrder بالباك اند (Category="lab"|"radiology") — صفحة واحدة
// تخدم المختبر والأشعة، تتغيّر فقط النصوص والفلتر وفئة المرفق المرفوع
const COPY = {
  lab: {
    ar: { title: '🧪 طابور المختبر', subtitle: 'طلبات التحاليل الواردة من الأطباء — بدء التنفيذ ورفع النتيجة', icon: '🧪', itemLabel: 'التحليل' },
    en: { title: '🧪 Lab Queue', subtitle: 'Test orders from doctors — start work and upload the result', icon: '🧪', itemLabel: 'Test' },
  },
  radiology: {
    ar: { title: '🩻 طابور الأشعة', subtitle: 'طلبات الأشعة الواردة من الأطباء — بدء التنفيذ ورفع النتيجة', icon: '🩻', itemLabel: 'الفحص' },
    en: { title: '🩻 Radiology Queue', subtitle: 'Imaging orders from doctors — start work and upload the result', icon: '🩻', itemLabel: 'Scan' },
  },
}

const T = {
  ar: {
    tabAll: 'الكل', tabOrdered: 'مطلوب', tabInProgress: 'جاري', tabCompleted: 'مكتمل', tabCancelled: 'ملغي',
    patient: 'المريض', doctor: 'الطبيب', ordered: 'وقت الطلب', status: 'الحالة',
    noItems: 'لا توجد طلبات بهذا الفلتر', loading: 'جارٍ التحميل...',
    start: '▶ بدء التنفيذ', upload: '📤 رفع النتيجة', cancelAction: '✕ إلغاء',
    statusOrdered: '⏳ مطلوب', statusInProgress: '🔬 جاري التنفيذ', statusCompleted: '✅ مكتمل', statusCancelled: '✕ ملغي',
    resultTitle: 'رفع النتيجة', resultFile: 'ملف النتيجة (اختياري)', resultNotes: 'ملاحظات النتيجة',
    confirmComplete: '✅ تأكيد الإنهاء', saving: 'جارٍ الحفظ...', close: 'إغلاق', cancelBtn: 'إلغاء',
    viewResult: '📄 عرض الملف', cancelConfirm: 'هل أنت متأكد من إلغاء هذا الطلب؟',
    errorOccurred: 'حدث خطأ',
  },
  en: {
    tabAll: 'All', tabOrdered: 'Ordered', tabInProgress: 'In Progress', tabCompleted: 'Completed', tabCancelled: 'Cancelled',
    patient: 'Patient', doctor: 'Doctor', ordered: 'Ordered at', status: 'Status',
    noItems: 'No orders for this filter', loading: 'Loading...',
    start: '▶ Start', upload: '📤 Upload Result', cancelAction: '✕ Cancel',
    statusOrdered: '⏳ Ordered', statusInProgress: '🔬 In Progress', statusCompleted: '✅ Completed', statusCancelled: '✕ Cancelled',
    resultTitle: 'Upload Result', resultFile: 'Result file (optional)', resultNotes: 'Result notes',
    confirmComplete: '✅ Confirm Complete', saving: 'Saving...', close: 'Close', cancelBtn: 'Cancel',
    viewResult: '📄 View File', cancelConfirm: 'Are you sure you want to cancel this order?',
    errorOccurred: 'An error occurred',
  },
}

export default function TestOrderQueue({ category }: { category: 'lab' | 'radiology' }) {
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const t = T[lang]
  const c = COPY[category][lang]
  const isAr = lang === 'ar'

  const [orders, setOrders] = useState<TestOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'ordered' | 'in_progress' | 'completed' | 'cancelled'>('all')

  const [resultModalOrder, setResultModalOrder] = useState<TestOrder | null>(null)
  const [resultNotes, setResultNotes] = useState('')
  const [resultFile, setResultFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const statusParam = filter !== 'all' ? `&status=${filter}` : ''
      const res = await api.get(`/laborders?category=${category}${statusParam}`)
      setOrders(res.data)
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [filter, category])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const formatDateTime = (iso: string) =>
    new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).toLocaleString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })

  const statusBadge = (s: TestOrder['status']) => {
    const map = {
      ordered: { bg: '#FFF8E1', fg: '#B8892A', label: t.statusOrdered },
      in_progress: { bg: '#EBF4FF', fg: '#3B82F6', label: t.statusInProgress },
      completed: { bg: '#E8F5E9', fg: '#22C55E', label: t.statusCompleted },
      cancelled: { bg: '#F3F4F6', fg: '#6B7280', label: t.statusCancelled },
    }[s]
    return (
      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: map.bg, color: map.fg }}>
        {map.label}
      </span>
    )
  }

  const handleStart = async (order: TestOrder) => {
    try {
      await api.put(`/laborders/${order.id}/start`)
      fetchOrders()
    } catch (err: any) {
      showMessageBox(err.response?.data || t.errorOccurred, 'error')
    }
  }

  const handleCancel = async (order: TestOrder) => {
    if (!window.confirm(t.cancelConfirm)) return
    try {
      await api.put(`/laborders/${order.id}/cancel`)
      fetchOrders()
    } catch (err: any) {
      showMessageBox(err.response?.data || t.errorOccurred, 'error')
    }
  }

  const openResultModal = (order: TestOrder) => {
    setResultModalOrder(order)
    setResultNotes('')
    setResultFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleComplete = async () => {
    if (!resultModalOrder) return
    setSaving(true)
    try {
      let resultAttachmentId: string | undefined
      if (resultFile) {
        const formData = new FormData()
        formData.append('file', resultFile)
        formData.append('patientId', resultModalOrder.patientId)
        formData.append('category', category)
        const uploadRes = await api.post(`/attachments/upload?lang=${lang}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).catch(() => null)
        resultAttachmentId = uploadRes?.data?.id
      }
      await api.put(`/laborders/${resultModalOrder.id}/complete`, { resultNotes: resultNotes || null, resultAttachmentId })
      setResultModalOrder(null)
      fetchOrders()
    } catch (err: any) {
      showMessageBox(err.response?.data || t.errorOccurred, 'error')
    } finally {
      setSaving(false)
    }
  }

  const viewResultFile = async (attachmentId: string) => {
    try {
      const res = await api.get(`/attachments/${attachmentId}/file`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      window.open(url, '_blank')
    } catch {
      showMessageBox(isAr ? 'تعذّر فتح الملف' : 'Could not open file', 'error')
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif", background: '#F8FAFA', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>{c.title}</h2>
        <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6, marginBottom: 20 }}>{c.subtitle}</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {([
            ['all', t.tabAll], ['ordered', t.tabOrdered], ['in_progress', t.tabInProgress],
            ['completed', t.tabCompleted], ['cancelled', t.tabCancelled],
          ] as const).map(([key, label]) => (
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
          ) : orders.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED }}>{t.noItems}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {orders.map(o => (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${BORDER}` }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_DARK }}>{o.patientName}</span>
                      <span style={{ fontSize: 12.5, color: PRIMARY, fontWeight: 600 }}>{c.icon} {o.testName}</span>
                      {statusBadge(o.status)}
                    </div>
                    <div style={{ fontSize: 11.5, color: TEXT_MUTED, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span>👨‍⚕️ {o.doctorName || '—'}</span>
                      <span>🕒 {formatDateTime(o.orderedAt)}</span>
                    </div>
                    {o.notes && <div style={{ fontSize: 11.5, color: TEXT_MUTED, marginTop: 3, fontStyle: 'italic' }}>{o.notes}</div>}
                    {o.status === 'completed' && o.resultNotes && (
                      <div style={{ fontSize: 12, color: '#22C55E', marginTop: 4, fontWeight: 600 }}>📋 {o.resultNotes}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {o.status === 'ordered' && (
                      <>
                        <button onClick={() => handleStart(o)}
                          style={{ background: PRIMARY_SOFT, color: PRIMARY, border: 'none', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          {t.start}
                        </button>
                        <button onClick={() => handleCancel(o)}
                          style={{ background: '#FFF5F5', color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          {t.cancelAction}
                        </button>
                      </>
                    )}
                    {o.status === 'in_progress' && (
                      <>
                        <button onClick={() => openResultModal(o)}
                          style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          {t.upload}
                        </button>
                        <button onClick={() => handleCancel(o)}
                          style={{ background: '#FFF5F5', color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          {t.cancelAction}
                        </button>
                      </>
                    )}
                    {o.status === 'completed' && o.resultAttachmentId && (
                      <button onClick={() => viewResultFile(o.resultAttachmentId!)}
                        style={{ background: 'transparent', color: TEXT_DARK, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        {t.viewResult}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {resultModalOrder && (
          <div onClick={() => !saving && setResultModalOrder(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,30,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
            <div onClick={e => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}
              style={{ background: CARD_BG, borderRadius: 16, padding: 22, maxWidth: 380, width: '100%' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, margin: '0 0 4px' }}>{t.resultTitle}</h3>
              <p style={{ fontSize: 12.5, color: TEXT_MUTED, margin: '0 0 16px' }}>{resultModalOrder.patientName} — {resultModalOrder.testName}</p>

              <label style={{ fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 6 }}>{t.resultFile}</label>
              <input ref={fileInputRef} type="file" onChange={e => setResultFile(e.target.files?.[0] || null)}
                style={{ ...inputStyle, marginBottom: 14 }} />

              <label style={{ fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 6 }}>{t.resultNotes}</label>
              <textarea value={resultNotes} onChange={e => setResultNotes(e.target.value)} rows={3}
                style={{ ...inputStyle, resize: 'vertical', marginBottom: 18 }} />

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleComplete} disabled={saving}
                  style={{ flex: 1, background: PRIMARY, color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? t.saving : t.confirmComplete}
                </button>
                <button onClick={() => setResultModalOrder(null)} disabled={saving}
                  style={{ padding: '10px 18px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: TEXT_MUTED, cursor: 'pointer' }}>
                  {t.cancelBtn}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
