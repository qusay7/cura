import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'
import { getCurrencySymbol, formatTimeString } from '../utils/i18n'
import { hasPermission } from '../utils/permissions'
import { showMessageBox } from '../utils/messageBox'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

interface Doctor { id: string; fullName: string; isActive: boolean }

interface ActivityItem {
  id: string
  source: 'appointment' | 'emergency'
  appointmentId?: string | null
  queueEntryId?: string | null
  doctorId?: string | null
  doctorName?: string | null
  patientName: string
  date: string
  time: string
  status: string
  price?: number | null
  amountPaid?: number | null
  remaining?: number | null
}

interface Summary {
  total: number
  totalValue: number
  totalPaid: number
  totalRemaining: number
  completed: number
  cancelled: number
  pages: number
  page: number
  pageSize: number
}

interface PaymentInfo { hasPayment: boolean; amountPaid?: number; isPaid?: boolean }

const todayStr = () => new Date().toISOString().split('T')[0]

const T = {
  ar: {
    title: '📋 سجل الحركة اليومية', subtitle: 'كل الزيارات — مواعيد وطوارئ — بقيمتها وحالة الدفع، بمكان واحد',
    from: 'من', to: 'إلى', doctor: 'الطبيب', status: 'الحالة', allDoctors: 'كل الأطباء', allStatuses: 'كل الحالات',
    today: 'اليوم', yesterday: 'أمس', thisWeek: 'هذا الأسبوع', resetFilter: 'إعادة تعيين',
    scheduled: 'مجدول', confirmed: 'مؤكد', waiting: 'انتظار', called: 'مُستدعى', completed: 'مكتمل', cancelled: 'ملغي',
    typeAppt: '📅 موعد', typeEr: '🚨 طوارئ',
    patient: 'المريض', type: 'النوع', time: 'الوقت', value: 'القيمة', paid: 'المدفوع', remaining: 'المتبقي',
    noItems: 'لا توجد حركات بهذا الفلتر', loading: 'جارٍ التحميل...',
    totalCount: 'عدد الزيارات', totalValueLabel: 'إجمالي القيمة', totalPaidLabel: 'إجمالي المدفوع', totalRemainingLabel: 'إجمالي المتبقي',
    previewTitle: 'معاينة الفاتورة', totalAmount: 'المبلغ المستحق', amountPaidLabel: 'المبلغ المدفوع', noCharge: 'لا توجد مستحقات بعد',
    statusPaid: '✅ مدفوعة بالكامل', statusUnpaid: '⏳ غير مدفوعة',
    paymentMethodLabel: 'طريقة الدفع', cash: 'نقدي', card: 'بطاقة',
    registerPayment: '💳 تسجيل دفعة', savingPayment: 'جارٍ الحفظ...', fullFile: '📋 الملف الكامل',
    close: 'إغلاق', errorOccurred: 'حدث خطأ', loadingInfo: 'جارٍ التحميل...',
  },
  en: {
    title: '📋 Daily Activity Log', subtitle: 'Every visit — appointments and ER — with value and payment status, in one place',
    from: 'From', to: 'To', doctor: 'Doctor', status: 'Status', allDoctors: 'All doctors', allStatuses: 'All statuses',
    today: 'Today', yesterday: 'Yesterday', thisWeek: 'This week', resetFilter: 'Reset',
    scheduled: 'Scheduled', confirmed: 'Confirmed', waiting: 'Waiting', called: 'Called', completed: 'Completed', cancelled: 'Cancelled',
    typeAppt: '📅 Appointment', typeEr: '🚨 Emergency',
    patient: 'Patient', type: 'Type', time: 'Time', value: 'Value', paid: 'Paid', remaining: 'Remaining',
    noItems: 'No activity for this filter', loading: 'Loading...',
    totalCount: 'Visits', totalValueLabel: 'Total Value', totalPaidLabel: 'Total Paid', totalRemainingLabel: 'Total Remaining',
    previewTitle: 'Bill Preview', totalAmount: 'Amount due', amountPaidLabel: 'Amount paid', noCharge: 'No charges yet',
    statusPaid: '✅ Fully paid', statusUnpaid: '⏳ Not paid',
    paymentMethodLabel: 'Payment method', cash: 'Cash', card: 'Card',
    registerPayment: '💳 Register Payment', savingPayment: 'Saving...', fullFile: '📋 Full file',
    close: 'Close', errorOccurred: 'An error occurred', loadingInfo: 'Loading...',
  },
}

export default function ActivityLog() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const t = T[lang]
  const isAr = lang === 'ar'

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [dtFrom, setDtFrom] = useState(todayStr())
  const [dtTo, setDtTo] = useState(todayStr())
  const [dtDoctor, setDtDoctor] = useState('')
  const [dtStatus, setDtStatus] = useState('')

  const [items, setItems] = useState<ActivityItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const canOpenFullFile = hasPermission('emergency.manage')

  // ✅ معاينة/تحصيل دفعة زيارة طوارئ مباشرة من السجل — بدون فتح الملف الطبي
  // الكامل، نفس أسلوب لوحة الطوارئ (Preview/Discharge)
  const [modalEntry, setModalEntry] = useState<ActivityItem | null>(null)
  const [modalPayment, setModalPayment] = useState<PaymentInfo | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [savingPayment, setSavingPayment] = useState(false)

  useEffect(() => {
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  useEffect(() => {
    api.get('/doctors').then(res => setDoctors((res.data as Doctor[]).filter(d => d.isActive))).catch(() => {})
  }, [])

  const fetchLog = useCallback(async () => {
    setLoading(true)
    try {
      // ✅ حقلي "من"/"إلى" بينعكسوا بصرياً بالـ RTL (أول عنصر بالـ DOM يطلع
      // يمين)، فسهل حدا يحط تاريخ أحدث بخانة "من" بالغلط — نطبّع الترتيب هون
      // دايماً بدل ما نرسل مدى معكوس يرجع نتيجة فاضية بصمت
      const [effFrom, effTo] = dtFrom && dtTo && dtFrom > dtTo ? [dtTo, dtFrom] : [dtFrom, dtTo]
      const params = new URLSearchParams()
      if (effFrom) params.set('from', effFrom)
      if (effTo) params.set('to', effTo)
      if (dtDoctor) params.set('doctorId', dtDoctor)
      if (dtStatus) params.set('status', dtStatus)
      params.set('pageSize', '200')
      const res = await api.get(`/reports/activity-log?${params}`)
      setItems(res.data.items)
      setSummary(res.data.summary)
    } catch (err: any) {
      setItems([])
      setSummary(null)
      showMessageBox(err.response?.data || err.message || t.errorOccurred, 'error')
    } finally {
      setLoading(false)
    }
  }, [dtFrom, dtTo, dtDoctor, dtStatus])

  useEffect(() => { fetchLog() }, [fetchLog])

  const setQuickRange = (range: 'today' | 'yesterday' | 'week') => {
    const now = new Date()
    const fmt = (d: Date) => d.toISOString().split('T')[0]
    if (range === 'today') { setDtFrom(fmt(now)); setDtTo(fmt(now)) }
    if (range === 'yesterday') { const y = new Date(now.getTime() - 86400000); setDtFrom(fmt(y)); setDtTo(fmt(y)) }
    if (range === 'week') { const w = new Date(now.getTime() - 6 * 86400000); setDtFrom(fmt(w)); setDtTo(fmt(now)) }
  }

  const statusLabel = (s: string) => (t as any)[s] ?? s
  const statusColor = (s: string) => {
    if (s === 'completed') return { bg: '#E8F5E9', fg: '#22C55E' }
    if (s === 'cancelled') return { bg: '#F3F4F6', fg: '#6B7280' }
    if (s === 'waiting' || s === 'scheduled') return { bg: '#FFF8E1', fg: '#F59E0B' }
    return { bg: '#EBF4FF', fg: '#3B82F6' }
  }

  const openPaymentModal = async (item: ActivityItem) => {
    setModalEntry(item)
    setModalLoading(true)
    setModalPayment(null)
    try {
      const res = await api.get(`/payments/queue/${item.queueEntryId}`)
      setModalPayment(res.data)
      setPayAmount(item.price != null ? String(item.price) : '')
      setPayMethod('cash')
    } catch {
      setModalPayment({ hasPayment: false })
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => { if (!savingPayment) setModalEntry(null) }

  const handleRegisterPayment = async () => {
    if (!modalEntry) return
    setSavingPayment(true)
    try {
      await api.post('/payments', {
        queueEntryId: modalEntry.queueEntryId,
        amountPaid: parseFloat(payAmount) || 0,
        paymentMethod: payMethod,
      })
      setModalEntry(null)
      fetchLog()
    } catch (err: any) {
      showMessageBox(err.response?.data || t.errorOccurred, 'error')
    } finally {
      setSavingPayment(false)
    }
  }

  const handleRowClick = (item: ActivityItem) => {
    if (item.source === 'appointment') { navigate(`/visit/${item.appointmentId}`); return }
    openPaymentModal(item)
  }

  const inputStyle: React.CSSProperties = { padding: '8px 11px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif", background: '#F8FAFA', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>{t.title}</h2>
        <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6, marginBottom: 20 }}>{t.subtitle}</p>

        {/* Filters */}
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED }}>{t.from}</label>
            <input type="date" value={dtFrom} onChange={e => setDtFrom(e.target.value)} style={{ ...inputStyle, fontFamily: "'Inter',sans-serif" }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED }}>{t.to}</label>
            <input type="date" value={dtTo} onChange={e => setDtTo(e.target.value)} style={{ ...inputStyle, fontFamily: "'Inter',sans-serif" }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED }}>{t.doctor}</label>
            <select value={dtDoctor} onChange={e => setDtDoctor(e.target.value)} style={{ ...inputStyle, minWidth: 160 }}>
              <option value="">{t.allDoctors}</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED }}>{t.status}</label>
            <select value={dtStatus} onChange={e => setDtStatus(e.target.value)} style={{ ...inputStyle, minWidth: 130 }}>
              <option value="">{t.allStatuses}</option>
              {['scheduled', 'confirmed', 'waiting', 'called', 'completed', 'cancelled'].map(s => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setQuickRange('today')} style={{ background: PRIMARY_SOFT, color: PRIMARY, border: 'none', borderRadius: 9, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{t.today}</button>
            <button onClick={() => setQuickRange('yesterday')} style={{ background: PRIMARY_SOFT, color: PRIMARY, border: 'none', borderRadius: 9, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{t.yesterday}</button>
            <button onClick={() => setQuickRange('week')} style={{ background: PRIMARY_SOFT, color: PRIMARY, border: 'none', borderRadius: 9, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{t.thisWeek}</button>
          </div>
          {(dtDoctor || dtStatus) && (
            <button onClick={() => { setDtDoctor(''); setDtStatus('') }}
              style={{ padding: '8px 12px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: TEXT_MUTED }}>
              ✕ {t.resetFilter}
            </button>
          )}
        </div>

        {/* Summary */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              [t.totalCount, summary.total, TEXT_DARK],
              [t.totalValueLabel, `${summary.totalValue} ${getCurrencySymbol(lang)}`, PRIMARY],
              [t.totalPaidLabel, `${summary.totalPaid} ${getCurrencySymbol(lang)}`, '#22C55E'],
              [t.totalRemainingLabel, `${summary.totalRemaining} ${getCurrencySymbol(lang)}`, summary.totalRemaining > 0 ? '#EF4444' : TEXT_MUTED],
            ].map(([label, value, color], i) => (
              <div key={i} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 6 }}>{label as string}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: color as string, fontFamily: "'Inter',sans-serif" }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED }}>{t.loading}</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED }}>{t.noItems}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFA' }}>
                    {[t.patient, t.doctor, t.type, t.time, t.status, t.value, t.paid, t.remaining].map((h, i) => (
                      <th key={i} style={{ textAlign: isAr ? 'right' : 'left', padding: '10px 14px', fontWeight: 600, fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const sc = statusColor(item.status)
                    return (
                      <tr key={item.id} onClick={() => handleRowClick(item)}
                        style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFA')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, fontWeight: 600, color: TEXT_DARK }}>{item.patientName}</td>
                        <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, color: TEXT_MUTED }}>{item.doctorName || '—'}</td>
                        <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}>{item.source === 'appointment' ? t.typeAppt : t.typeEr}</td>
                        <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, fontFamily: "'Inter',sans-serif", color: TEXT_MUTED }}>{item.date} {formatTimeString(item.time)}</td>
                        <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: sc.bg, color: sc.fg }}>{statusLabel(item.status)}</span>
                        </td>
                        <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, fontFamily: "'Inter',sans-serif" }}>{item.price != null ? `${item.price} ${getCurrencySymbol(lang)}` : '—'}</td>
                        <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, fontFamily: "'Inter',sans-serif", color: '#22C55E' }}>{item.amountPaid != null ? `${item.amountPaid} ${getCurrencySymbol(lang)}` : '—'}</td>
                        <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, fontFamily: "'Inter',sans-serif", fontWeight: 700, color: (item.remaining ?? 0) > 0 ? '#EF4444' : TEXT_MUTED }}>{item.remaining != null ? `${item.remaining} ${getCurrencySymbol(lang)}` : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ER payment modal */}
        {modalEntry && (
          <div onClick={closeModal}
            style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,30,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
            <div onClick={ev => ev.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}
              style={{ background: CARD_BG, borderRadius: 16, padding: 22, maxWidth: 360, width: '100%' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, margin: '0 0 4px' }}>{t.previewTitle}</h3>
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
                    <span style={{ color: TEXT_MUTED }}>{t.amountPaidLabel}</span>
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

              {!modalLoading && modalEntry.price != null && !modalPayment?.isPaid && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 6 }}>{t.amountPaidLabel}</label>
                  <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', ...inputStyle, fontFamily: "'Inter',sans-serif", marginBottom: 10 }} />

                  <label style={{ fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 6 }}>{t.paymentMethodLabel}</label>
                  <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', ...inputStyle, marginBottom: 12 }}>
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
                {canOpenFullFile && (
                  <button onClick={() => navigate(`/emergency/${modalEntry.queueEntryId}`)}
                    style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: TEXT_DARK, cursor: 'pointer', fontWeight: 600 }}>
                    {t.fullFile}
                  </button>
                )}
                <button onClick={closeModal} disabled={savingPayment}
                  style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: TEXT_MUTED, cursor: 'pointer' }}>
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
