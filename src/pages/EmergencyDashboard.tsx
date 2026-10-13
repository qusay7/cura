import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'
import { getCurrencySymbol } from '../utils/i18n'
import { hasPermission } from '../utils/permissions'
import { showMessageBox } from '../utils/messageBox'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

interface ActiveEntry {
  id: string
  queueNumber: number
  status: 'waiting' | 'called' | 'completed' | 'cancelled'
  notes?: string | null
  createdAt: string
  price?: number | null
  dischargedAt?: string | null
  hasPayment?: boolean
  amountPaid?: number | null
  isPaid: boolean
  patientId: string
  patientName: string
  patientPhone?: string | null
  doctorId?: string | null
  doctorName?: string | null
}

interface Department { id: string; name: string; type: number; isActive: boolean }

interface PaymentInfo { hasPayment: boolean; totalAmount?: number; patientAmount?: number; amountPaid?: number; isPaid?: boolean }

const T = {
  ar: {
    title: 'لوحة الطوارئ', subtitle: 'الحالات النشطة — الأحدث أولاً، لكل الأطباء المناوبين',
    noDeptTitle: '⚠️ لا يوجد قسم طوارئ', noDeptBody: 'يجب إنشاء قسم من نوع "طوارئ" أولاً من صفحة الأقسام.',
    goToDepartments: 'الذهاب لصفحة الأقسام',
    checkInNew: '+ تسجيل دخول جديد',
    noPatients: 'لا يوجد مرضى في الطوارئ حالياً',
    loading: 'جارٍ التحميل...',
    waiting: '⏳ انتظار', called: '📢 مُستدعى',
    noDoctor: 'بدون طبيب محدد',
    since: 'منذ',
    preview: '👁️ معاينة', dischargeAction: '🚪 تسجيل خروج', fullFile: '📋 الملف الكامل',
    previewTitle: 'معاينة الفاتورة', dischargeTitle: 'تسجيل خروج المريض', collectTitle: 'تحصيل دفعة متبقية',
    totalAmount: 'المبلغ المستحق', amountPaid: 'المبلغ المدفوع', noCharge: 'لا توجد مستحقات بعد',
    statusPaid: '✅ مدفوعة بالكامل', statusUnpaid: '⏳ غير مدفوعة',
    paymentMethodLabel: 'طريقة الدفع', cash: 'نقدي', card: 'بطاقة',
    registerPayment: '💳 تسجيل دفعة', savingPayment: 'جارٍ الحفظ...', collectPayment: '💳 تحصيل دفعة',
    confirmDischarge: '🚪 تأكيد تسجيل الخروج', discharging: 'جارٍ التسجيل...',
    dischargeConfirm: 'هل أنت متأكد من تسجيل خروج هذا المريض؟',
    close: 'إغلاق', cancel: 'إلغاء', errorOccurred: 'حدث خطأ', loadingInfo: 'جارٍ التحميل...',
    tabIncomplete: 'غير مكتمل / غير مدفوع', tabCompleted: 'مكتمل', tabAll: 'الكل',
    dischargedAtLabel: 'خرج', noEntriesForTab: 'لا يوجد مرضى بهذا التصنيف',
  },
  en: {
    title: 'Emergency Dashboard', subtitle: 'Active cases — newest first, visible to all on-duty doctors',
    noDeptTitle: '⚠️ No Emergency Department', noDeptBody: 'Create a department of type "Emergency" first from the Departments page.',
    goToDepartments: 'Go to Departments',
    checkInNew: '+ New Check-In',
    noPatients: 'No patients currently in the ER',
    loading: 'Loading...',
    waiting: '⏳ Waiting', called: '📢 Called',
    noDoctor: 'No doctor assigned yet',
    since: 'since',
    preview: '👁️ Preview', dischargeAction: '🚪 Discharge', fullFile: '📋 Full file',
    previewTitle: 'Bill Preview', dischargeTitle: 'Discharge Patient', collectTitle: 'Collect Outstanding Payment',
    totalAmount: 'Amount due', amountPaid: 'Amount paid', noCharge: 'No charges yet',
    statusPaid: '✅ Fully paid', statusUnpaid: '⏳ Not paid',
    paymentMethodLabel: 'Payment method', cash: 'Cash', card: 'Card',
    registerPayment: '💳 Register Payment', savingPayment: 'Saving...', collectPayment: '💳 Collect Payment',
    confirmDischarge: '🚪 Confirm Discharge', discharging: 'Discharging...',
    dischargeConfirm: 'Are you sure you want to discharge this patient?',
    close: 'Close', cancel: 'Cancel', errorOccurred: 'An error occurred', loadingInfo: 'Loading...',
    tabIncomplete: 'Incomplete / Unpaid', tabCompleted: 'Completed', tabAll: 'All',
    dischargedAtLabel: 'Discharged', noEntriesForTab: 'No patients in this view',
  },
}

const timeAgo = (iso: string, isAr: boolean): string => {
  const diffMs = Date.now() - new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return isAr ? 'الآن' : 'just now'
  if (mins < 60) return isAr ? `منذ ${mins} د` : `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return isAr ? `منذ ${hours} س` : `${hours}h ago`
  const days = Math.floor(hours / 24)
  return isAr ? `منذ ${days} يوم` : `${days}d ago`
}

export default function EmergencyDashboard() {
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const navigate = useNavigate()
  const t = T[lang]
  const isAr = lang === 'ar'

  const [department, setDepartment] = useState<Department | null>(null)
  const [entries, setEntries] = useState<ActiveEntry[]>([])
  const [loading, setLoading] = useState(true)
  // ✅ نجيب كل الحالات (status=all) مرة وحدة ونفلتر بالفرونت — عشان التبديل بين
  // التابات فوري بدون طلب جديد، وعشان "الكل" و"مكتمل" يشوفوا نفس القائمة بالضبط
  const [filter, setFilter] = useState<'incomplete' | 'completed' | 'all'>('incomplete')

  // ✅ معاينة/تسجيل خروج مباشرة من اللوحة — الاستقبال والمحاسب يقدروا يحصّلوا
  // الدفعة ويسجّلوا الخروج من هنا بدون فتح الملف الطبي الكامل (emergency.manage فقط)
  const [modalEntry, setModalEntry] = useState<ActiveEntry | null>(null)
  const [modalMode, setModalMode] = useState<'preview' | 'discharge'>('preview')
  const [modalPayment, setModalPayment] = useState<PaymentInfo | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [savingPayment, setSavingPayment] = useState(false)
  const [discharging, setDischarging] = useState(false)
  const canOpenFullFile = hasPermission('emergency.manage')

  useEffect(() => {
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      const depts = await api.get('/departments').then(res => res.data).catch(() => [])
      const dept = (depts as Department[]).find(d => d.type === 1 && d.isActive) || null
      setDepartment(dept)
      if (dept) {
        const res = await api.get(`/queue/active?departmentId=${dept.id}&status=all`)
        setEntries(res.data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 15000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const openModal = async (e: ActiveEntry, mode: 'preview' | 'discharge') => {
    setModalEntry(e)
    setModalMode(mode)
    setModalLoading(true)
    setModalPayment(null)
    try {
      const res = await api.get(`/payments/queue/${e.id}`)
      setModalPayment(res.data)
      setPayAmount(e.price != null ? String(e.price) : '')
      setPayMethod('cash')
    } catch {
      setModalPayment({ hasPayment: false })
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    if (savingPayment || discharging) return
    setModalEntry(null)
  }

  const handleRegisterPayment = async () => {
    if (!modalEntry) return
    setSavingPayment(true)
    try {
      await api.post('/payments', {
        queueEntryId: modalEntry.id,
        amountPaid: parseFloat(payAmount) || 0,
        paymentMethod: payMethod,
      })
      const res = await api.get(`/payments/queue/${modalEntry.id}`)
      setModalPayment(res.data)
    } catch (err: any) {
      showMessageBox(err.response?.data || t.errorOccurred, 'error')
    } finally {
      setSavingPayment(false)
    }
  }

  const handleDischarge = async () => {
    if (!modalEntry) return
    if (!window.confirm(t.dischargeConfirm)) return
    setDischarging(true)
    try {
      await api.put(`/queue/${modalEntry.id}/discharge`)
      setModalEntry(null)
      fetchAll()
    } catch (err: any) {
      showMessageBox(err.response?.data || t.errorOccurred, 'error')
    } finally {
      setDischarging(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: TEXT_MUTED }}>{t.loading}</div>
  )

  const filteredEntries = entries.filter(e => {
    if (filter === 'completed') return e.status === 'completed'
    if (filter === 'all') return true
    return e.status !== 'completed' || !e.isPaid
  })

  const formatDischargedAt = (iso: string) =>
    new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).toLocaleString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif", background: '#F8FAFA', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 100, padding: '4px 16px', fontSize: 11, fontWeight: 600, color: '#EF4444', marginBottom: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />
              {isAr ? 'طوارئ' : 'Emergency'}
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>🚨 {t.title}</h2>
            <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6 }}>{t.subtitle}</p>
          </div>
          {department && (
            <button onClick={() => navigate('/emergency/check-in')}
              style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t.checkInNew}
            </button>
          )}
        </div>

        {!department ? (
          <div style={{ background: '#FFF8E1', border: '1px solid #FCD34D', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#B8892A', margin: '0 0 6px' }}>{t.noDeptTitle}</p>
            <p style={{ fontSize: 13, color: TEXT_MUTED, margin: '0 0 14px' }}>{t.noDeptBody}</p>
            <button onClick={() => navigate('/departments')}
              style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t.goToDepartments}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {([
                ['incomplete', t.tabIncomplete],
                ['completed', t.tabCompleted],
                ['all', t.tabAll],
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

            {filteredEntries.length === 0 ? (
              <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 40, textAlign: 'center', color: TEXT_MUTED }}>
                {entries.length === 0 ? t.noPatients : t.noEntriesForTab}
              </div>
            ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredEntries.map(e => (
              <div key={e.id}
                style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap', transition: 'all 0.15s ease' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK }}>{e.patientName}</span>
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 100,
                      background: e.status === 'waiting' ? '#FFF8E1' : e.status === 'completed' ? '#E8F5E9' : e.status === 'cancelled' ? '#F3F4F6' : '#EBF4FF',
                      color: e.status === 'waiting' ? '#F59E0B' : e.status === 'completed' ? '#22C55E' : e.status === 'cancelled' ? '#6B7280' : '#3B82F6',
                    }}>
                      {e.status === 'waiting' ? t.waiting : e.status === 'called' ? t.called : e.status === 'completed' ? `✅ ${t.tabCompleted}` : e.status}
                    </span>
                    {e.price != null && (
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 100,
                        background: e.isPaid ? '#E8F5E9' : '#FFF8E1', color: e.isPaid ? '#22C55E' : '#B8892A',
                      }}>
                        {e.isPaid ? t.statusPaid : t.statusUnpaid}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span>👨‍⚕️ {e.doctorName || t.noDoctor}</span>
                    <span>🕒 {t.since} {timeAgo(e.createdAt, isAr)}</span>
                    {e.price != null && <span style={{ fontFamily: "'Inter',sans-serif" }}>💰 {e.price} {getCurrencySymbol(lang)}</span>}
                    {e.dischargedAt && <span>🚪 {t.dischargedAtLabel}: {formatDischargedAt(e.dischargedAt)}</span>}
                  </div>
                  {e.notes && <div style={{ fontSize: 11.5, color: TEXT_MUTED, marginTop: 4, fontStyle: 'italic' }}>{e.notes}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: PRIMARY, fontFamily: "'Inter',sans-serif", marginInlineEnd: 6 }}>#{e.queueNumber}</span>
                  {canOpenFullFile && (
                    <button onClick={() => navigate(`/emergency/${e.id}`)}
                      style={{ background: 'transparent', color: TEXT_MUTED, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {t.fullFile}
                    </button>
                  )}
                  <button onClick={() => openModal(e, 'preview')}
                    style={{ background: PRIMARY_SOFT, color: PRIMARY, border: 'none', borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {t.preview}
                  </button>
                  {e.status !== 'completed' ? (
                    <button onClick={() => openModal(e, 'discharge')}
                      style={{ background: '#FFF5F5', color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {t.dischargeAction}
                    </button>
                  ) : e.price != null && !e.isPaid ? (
                    <button onClick={() => openModal(e, 'discharge')}
                      style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {t.collectPayment}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
            )}
          </>
        )}

        {modalEntry && (
          <div onClick={closeModal}
            style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,30,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
            <div onClick={ev => ev.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}
              style={{ background: CARD_BG, borderRadius: 16, padding: 22, maxWidth: 360, width: '100%' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, margin: '0 0 4px' }}>
                {modalMode === 'preview' ? t.previewTitle : modalEntry.status === 'completed' ? t.collectTitle : t.dischargeTitle}
              </h3>
              <p style={{ fontSize: 12.5, color: TEXT_MUTED, margin: '0 0 16px' }}>{modalEntry.patientName}</p>

              {modalLoading ? (
                <p style={{ fontSize: 13, color: TEXT_MUTED, textAlign: 'center', padding: '10px 0' }}>{t.loadingInfo}</p>
              ) : modalEntry.price == null ? (
                <p style={{ fontSize: 13, color: TEXT_MUTED, textAlign: 'center', padding: '10px 0' }}>{t.noCharge}</p>
              ) : (
                <div style={{ background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: TEXT_MUTED }}>{t.totalAmount}</span>
                    <span style={{ fontWeight: 700, color: TEXT_DARK }}>{modalEntry.price} {getCurrencySymbol(lang)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: TEXT_MUTED }}>{t.amountPaid}</span>
                    <span style={{ fontWeight: 700, color: TEXT_DARK }}>{modalPayment?.amountPaid ?? 0} {getCurrencySymbol(lang)}</span>
                  </div>
                  <span style={{
                    display: 'inline-block', marginTop: 4, fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                    background: modalPayment?.isPaid ? '#E8F5E9' : '#FFF8E1',
                    color: modalPayment?.isPaid ? '#22C55E' : '#B8892A',
                  }}>
                    {modalPayment?.isPaid ? t.statusPaid : t.statusUnpaid}
                  </span>
                </div>
              )}

              {modalMode === 'discharge' && !modalLoading && modalEntry.price != null && !modalPayment?.isPaid && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 6 }}>{t.amountPaid}</label>
                  <input type="number" value={payAmount} onChange={ev => setPayAmount(ev.target.value)}
                    style={{ width: '100%', padding: '9px 11px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: "'Inter',sans-serif", color: TEXT_DARK, background: CARD_BG, boxSizing: 'border-box', marginBottom: 10 }} />

                  <label style={{ fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 6 }}>{t.paymentMethodLabel}</label>
                  <select value={payMethod} onChange={ev => setPayMethod(ev.target.value)}
                    style={{ width: '100%', padding: '9px 11px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG, boxSizing: 'border-box', marginBottom: 12 }}>
                    <option value="cash">{t.cash}</option>
                    <option value="card">{t.card}</option>
                  </select>

                  <button onClick={handleRegisterPayment} disabled={savingPayment}
                    style={{ width: '100%', background: PRIMARY, color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: savingPayment ? 'not-allowed' : 'pointer', opacity: savingPayment ? 0.7 : 1 }}>
                    {savingPayment ? t.savingPayment : t.registerPayment}
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                {modalMode === 'discharge' && modalEntry.status !== 'completed' ? (
                  <button onClick={handleDischarge} disabled={discharging || modalLoading}
                    style={{ flex: 1, background: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: discharging ? 'not-allowed' : 'pointer', opacity: discharging ? 0.7 : 1 }}>
                    {discharging ? t.discharging : t.confirmDischarge}
                  </button>
                ) : null}
                <button onClick={closeModal} disabled={savingPayment || discharging}
                  style={{ flex: modalMode === 'preview' || modalEntry.status === 'completed' ? 1 : undefined, padding: '10px 18px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: TEXT_MUTED, cursor: 'pointer' }}>
                  {modalMode === 'preview' ? t.close : t.cancel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
