import { useEffect, useState } from 'react'
import api from '../api/axios'
import SearchableSelect from '../components/SearchableSelect'
import { useColumnVisibility, ColumnToggleButton } from '../components/ColumnToggle'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const globalCss = `
@keyframes fade-up { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
@keyframes soft-pulse { 0%,100%{opacity:0.6;} 50%{opacity:1;} }
@keyframes spin { to { transform:rotate(360deg); } }
.settle-shell { animation: fade-up 0.35s ease both; }
.settle-tabs { display:flex; gap:6px; background:#FFF; padding:5px; border-radius:16px; border:1px solid #DCE5E5; width:fit-content; margin-bottom:24px; flex-wrap:wrap; }
.settle-tab { padding:9px 20px; border-radius:12px; font-size:13px; font-weight:600; cursor:pointer; border:none; background:transparent; color:#6B8A8C; transition:all 0.2s ease; }
.settle-tab.active { background:#5B8C8F; color:#FFF; box-shadow:0 4px 12px rgba(91,140,143,0.25); }
.settle-tab:not(.active):hover { background:#E8F0F0; color:#5B8C8F; }
@media(max-width:768px){ .settle-tabs{ width:100%; } .settle-tab{ flex:1; } }

/* ✅ رأس الطباعة — مخفي بالشاشة العادية، يظهر بس وقت الطباعة (زر 🖨️ طباعة) */
.print-only-header { display: none; }
@media print {
  .print-only-header { display: flex !important; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 2px solid #DCE5E5; }
}
`

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const SUCCESS = '#22C55E'
const SUCCESS_BG = '#E8F5E9'
const WARNING = '#B8892A'
const WARNING_BG = '#FFF8E1'
const DANGER = '#EF4444'

const T = {
  ar: {
    title: 'التسويات المالية', subtitle: 'ذمم المرضى، مستحقات الأطباء، ومطالبات التأمين',
    tabDues: 'ذمم المرضى', tabDoctor: 'مخالصة الأطباء', tabInsurance: 'مخالصة التأمين', tabHistory: 'سجل التسويات',
    loading: 'جاري التحميل...', noData: 'لا توجد بيانات',
    patient: 'المريض', total: 'الإجمالي', paid: 'المدفوع', balance: 'المتبقي', date: 'التاريخ',
    selectDoctor: 'اختر طبيباً', selectCompany: 'اختر شركة تأمين',
    periodFrom: 'من تاريخ', periodTo: 'إلى تاريخ', search: 'بحث',
    visitType: 'نوع الزيارة', commission: 'الحصة', claimNumber: 'رقم المطالبة', insuranceAmount: 'مبلغ التأمين',
    totalPending: 'إجمالي المستحق', itemsCount: 'عدد البنود',
    registerSettlement: 'تسجيل التسوية', paymentMethod: 'طريقة الدفع/التحويل', notes: 'ملاحظات',
    cash: 'نقدي', bankTransfer: 'تحويل بنكي', check: 'شيك',
    confirmSettle: 'متأكد تبي تسجّل هذي التسوية؟ العملية لا يمكن التراجع عنها.',
    settled: 'تم تسجيل التسوية بنجاح ✅', noPending: 'لا توجد مستحقات لهذي الفترة',
    type: 'النوع', doctorType: 'طبيب', insuranceType: 'تأمين', status: 'الحالة',
    period: 'الفترة', amount: 'المبلغ', method: 'الطريقة',
    print: 'طباعة', exportPdf: 'تصدير PDF', exportExcel: 'تصدير Excel',
    saving: 'جارٍ الحفظ...',
    // ✅ محطة التأمين الموحّدة
    statusPending: 'معلّقة (لسا ما أُرسلت)', statusSubmitted: 'مُرسلة (بانتظار الرد)',
    statusApproved: 'موافَق عليها (جاهزة للتحصيل)', statusPaid: 'مدفوعة',
    submitBatch: 'إرسال الدفعة', submitBatchHint: 'يحوّل كل المطالبات المعلّقة بهذي الفترة لحالة "مُرسلة" دفعة وحدة',
    updateStatus: 'تحديث الحالة', approve: 'موافقة', reject: 'رفض',
    approvalNumber: 'رقم الموافقة', rejectionReason: 'سبب الرفض',
    confirmSubmitBatch: 'متأكد تبي ترسل كل هذي المطالبات دفعة وحدة؟',
    noClaimsForStatus: 'لا توجد مطالبات بهذي الحالة للفترة المحددة',
    cancel: 'إلغاء',
    // ✅ فلترة وسداد ذمم المرضى
    searchPatient: 'دوّر باسم المريض...', payAction: 'دفع',
    payDueTitle: 'سداد المستحق', amountToPayNow: 'المبلغ المدفوع الآن',
    remainingAfterThis: 'المتبقي بعد هذي الدفعة', paySuccess: 'تم تسجيل الدفعة بنجاح ✅',
  },
  en: {
    title: 'Financial Settlements', subtitle: 'Patient dues, doctor payouts, and insurance claims',
    tabDues: 'Patient Dues', tabDoctor: 'Doctor Payouts', tabInsurance: 'Insurance Settlements', tabHistory: 'Settlement History',
    loading: 'Loading...', noData: 'No data',
    patient: 'Patient', total: 'Total', paid: 'Paid', balance: 'Balance', date: 'Date',
    selectDoctor: 'Select a doctor', selectCompany: 'Select insurance company',
    periodFrom: 'From', periodTo: 'To', search: 'Search',
    visitType: 'Visit Type', commission: 'Commission', claimNumber: 'Claim #', insuranceAmount: 'Insurance Amount',
    totalPending: 'Total Pending', itemsCount: 'Items',
    registerSettlement: 'Register Settlement', paymentMethod: 'Payment/Transfer Method', notes: 'Notes',
    cash: 'Cash', bankTransfer: 'Bank Transfer', check: 'Check',
    confirmSettle: 'Are you sure you want to register this settlement? This cannot be undone.',
    settled: 'Settlement registered successfully ✅', noPending: 'No pending items for this period',
    type: 'Type', doctorType: 'Doctor', insuranceType: 'Insurance', status: 'Status',
    period: 'Period', amount: 'Amount', method: 'Method',
    print: 'Print', exportPdf: 'Export PDF', exportExcel: 'Export Excel',
    saving: 'Saving...',
    statusPending: 'Pending (not sent yet)', statusSubmitted: 'Submitted (awaiting response)',
    statusApproved: 'Approved (ready to collect)', statusPaid: 'Paid',
    submitBatch: 'Submit Batch', submitBatchHint: 'Moves all pending claims in this period to "submitted" in one action',
    updateStatus: 'Update Status', approve: 'Approve', reject: 'Reject',
    approvalNumber: 'Approval Number', rejectionReason: 'Rejection Reason',
    confirmSubmitBatch: 'Are you sure you want to submit all these claims at once?',
    noClaimsForStatus: 'No claims with this status for the selected period',
    cancel: 'Cancel',
    searchPatient: 'Search patient name...', payAction: 'Pay',
    payDueTitle: 'Settle Due', amountToPayNow: 'Amount to Pay Now',
    remainingAfterThis: 'Remaining after this payment', paySuccess: 'Payment recorded successfully ✅',
  },
}

interface Doctor { id: string; fullName: string }
interface InsuranceCompany { id: string; name: string }

export default function Settlements() {
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [tab, setTab] = useState<'dues' | 'doctor' | 'insurance' | 'history'>('dues')
  const [clinic, setClinic] = useState<{ name: string; logo: string | null } | null>(null)

  const t = T[lang]
  const isAr = lang === 'ar'

  useEffect(() => {
    const id = 'cura-settle-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = globalCss; document.head.appendChild(s)
    }
    const onLang = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', onLang)

    // ✅ نجيب اسم العيادة وشعارها — يُستخدمان برأس الطباعة بس (ما نعرضهم بالشاشة العادية)
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (user.clinicId) {
        api.get(`/clinics/${user.clinicId}`)
          .then(res => setClinic({ name: res.data.name, logo: res.data.logo || null }))
          .catch(() => {})
      }
    } catch { /* تجاهل */ }

    return () => window.removeEventListener('cura-lang-change', onLang)
  }, [])

  const apiOrigin = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')

  return (
    <div className="settle-shell" style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif", direction: isAr ? 'rtl' : 'ltr', background: '#F8FAFA', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* ✅ رأس الطباعة — يظهر بس عند الطباعة (زر 🖨️ طباعة) */}
        {clinic && (
          <div className="print-only-header">
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>{clinic.name}</p>
              <p style={{ fontSize: 11, color: TEXT_MUTED, margin: '2px 0 0' }}>{t.title}</p>
            </div>
            {clinic.logo && <img src={`${apiOrigin}${clinic.logo}`} alt="logo" style={{ width: 56, height: 56, objectFit: 'contain' }} />}
          </div>
        )}

        <div className="no-print" style={{ marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 100, padding: '4px 16px', fontSize: 11, fontWeight: 600, color: PRIMARY, marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, animation: 'soft-pulse 2s infinite' }} />
            {isAr ? 'التقارير المالية' : 'Financial Reports'}
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display','Georgia',serif", fontSize: 28, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>
            💵 {t.title}
          </h2>
          <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6 }}>{t.subtitle}</p>
        </div>

             <div className="settle-tabs"> 
          <button className={`settle-tab${tab === 'dues' ? ' active' : ''}`} onClick={() => setTab('dues')} > 💳 {t.tabDues} </button> 
          <button className={`settle-tab${tab === 'doctor' ? ' active' : ''}`} onClick={() => setTab('doctor')} > 👨‍⚕️ {t.tabDoctor} </button> 
          <button className={`settle-tab${tab === 'insurance' ? ' active' : ''}`} onClick={() => setTab('insurance')} > 🏥 {t.tabInsurance} </button> 
          <button className={`settle-tab${tab === 'history' ? ' active' : ''}`} onClick={() => setTab('history')} > 📜 {t.tabHistory} </button> 
          </div>


            {tab === 'dues' && ( <PatientDuesTab t={t} isAr={isAr} /> )} 
            {tab === 'doctor' && ( <PartySettlementTab t={t} isAr={isAr} lang={lang} mode="doctor" /> )} 
            {tab === 'insurance' && ( <InsuranceHubTab t={t} isAr={isAr} lang={lang} /> )} 
            {tab === 'history' && ( <HistoryTab t={t} isAr={isAr} /> )}


         
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// تبويب: ذمم المرضى (عرض بس)
// ═══════════════════════════════════════════
function PatientDuesTab({ t, isAr }: { t: typeof T['ar']; isAr: boolean }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ totalDue: number; count: number; items: any[] } | null>(null)
  const [nameFilter, setNameFilter] = useState('')
  const [payItem, setPayItem] = useState<any>(null)

  // ✅ إظهار/إخفاء الأعمدة — محفوظة بالمتصفح، تفضل زي ما ضبطتها
  const columnDefs = [
    { key: 'patient', label: t.patient, locked: true },
    { key: 'total', label: t.total },
    { key: 'paid', label: t.paid },
    { key: 'balance', label: t.balance },
    { key: 'date', label: t.date },
    { key: 'action', label: t.payAction, locked: true },
  ]
  const { visibleKeys, toggle } = useColumnVisibility('patient-dues', columnDefs)

  const fetchDues = () => {
    setLoading(true)
    api.get('/settlements/patients-dues')
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDues() }, [])

  const filteredItems = (data?.items ?? []).filter(d =>
    !nameFilter.trim() || d.patientName?.toLowerCase().includes(nameFilter.trim().toLowerCase())
  )
  const filteredTotal = filteredItems.reduce((sum, d) => sum + (d.balance || 0), 0)

  if (loading) return <LoadingBox t={t} />

  // ✅ نبني كل صف كـ"قاموس" حسب مفتاح العمود، ونفلتر بالنهاية على الأعمدة الظاهرة بس
  const visibleColumnDefs = columnDefs.filter(c => visibleKeys.has(c.key))
  const buildRow = (d: any) => {
    const cellsByKey: Record<string, React.ReactNode> = {
      patient: d.patientName,
      total: `${d.total?.toFixed(2)}`,
      paid: `${d.paid?.toFixed(2)}`,
      balance: <span style={{ color: DANGER, fontWeight: 700 }}>{d.balance?.toFixed(2)}</span>,
      date: new Date(d.date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US'),
      action: (
        <button onClick={() => setPayItem(d)}
          style={{ background: PRIMARY_SOFT, color: PRIMARY, border: 'none', borderRadius: 8, padding: '5px 14px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
          💳 {t.payAction}
        </button>
      ),
    }
    return visibleColumnDefs.map(c => cellsByKey[c.key])
  }

  return (
    <div>
      <SummaryCards items={[
        { label: t.totalPending, value: `${filteredTotal.toFixed(2)}`, color: DANGER },
        { label: t.itemsCount, value: String(filteredItems.length), color: PRIMARY },
      ]} />

      {/* ✅ فلترة باسم المريض */}
      <div style={{ marginBottom: 12 }}>
        <input value={nameFilter} onChange={e => setNameFilter(e.target.value)} placeholder={t.searchPatient}
          style={{ width: '100%', maxWidth: 320, padding: '9px 14px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG }} />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 8 }}>
        <ColumnToggleButton columns={columnDefs} visibleKeys={visibleKeys} onToggle={toggle} isRtl={isAr} />
      </div>
      <ExportBar t={t} lang={isAr ? 'ar' : 'en'} endpoint="/settlements/patients-dues/export" />
      <DataTable
        empty={t.noData}
        columns={visibleColumnDefs.map(c => c.label)}
        rows={filteredItems.map(buildRow)}
      />

      {payItem && (
        <PayDueModal item={payItem} t={t} isAr={isAr} onClose={() => setPayItem(null)}
          onSuccess={() => { setPayItem(null); fetchDues() }} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// نافذة سداد مستحق مريض — تتعامل مع الحالتين (دفعة موجودة جزئية، أو موعد بلا دفعة أصلاً)
// ═══════════════════════════════════════════
function PayDueModal({ item, t, isAr, onClose, onSuccess }: { item: any; t: typeof T['ar']; isAr: boolean; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const paidNow = parseFloat(amount) || 0
  const remaining = Math.max(0, item.balance - paidNow)

  const submit = async () => {
    setSaving(true); setError('')
    try {
      if (item.hasPaymentRecord) {
        await api.put(`/payments/${item.id}`, {
          amountPaid: item.paid + paidNow,
          paymentMethod,
          rowVersion: item.rowVersion,
        })
      } else {
        await api.post('/payments', {
          appointmentId: item.appointmentId,
          totalAmount: item.total,
          insuranceAmount: 0,
          amountPaid: paidNow,
          paymentMethod,
        })
      }
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || t.noData)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div onClick={() => !saving && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: CARD_BG, borderRadius: 18, padding: 22, maxWidth: 380, width: '100%' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, marginBottom: 4 }}>💳 {t.payDueTitle}</h3>
        <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 16 }}>{item.patientName}</p>

        {error && <Alert type="err" text={error} />}

        <div style={{ background: PRIMARY_SOFT, borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
            <span style={{ color: TEXT_MUTED }}>{t.total}</span>
            <span style={{ fontWeight: 600, color: TEXT_DARK }}>{item.total.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
            <span style={{ color: TEXT_MUTED }}>{t.paid}</span>
            <span style={{ fontWeight: 600, color: TEXT_DARK }}>{item.paid.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: TEXT_DARK }}>{t.balance}</span>
            <span style={{ color: DANGER }}>{item.balance.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.amountToPayNow}</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
            style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "'Inter',sans-serif", color: TEXT_DARK }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.paymentMethod}</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG }}>
            <option value="cash">{t.cash}</option>
            <option value="card">{isAr ? 'بطاقة' : 'Card'}</option>
            <option value="bank_transfer">{t.bankTransfer}</option>
          </select>
        </div>

        {paidNow > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '9px 12px', background: remaining > 0 ? WARNING_BG : SUCCESS_BG, borderRadius: 10, marginBottom: 16 }}>
            <span style={{ color: TEXT_MUTED }}>{t.remainingAfterThis}</span>
            <span style={{ fontWeight: 700, color: remaining > 0 ? WARNING : '#166534' }}>{remaining.toFixed(2)}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={submit} disabled={saving || paidNow <= 0}
            style={{ flex: 1, background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 12, padding: '11px', fontSize: 13.5, fontWeight: 700, cursor: (saving || paidNow <= 0) ? 'not-allowed' : 'pointer', opacity: (saving || paidNow <= 0) ? 0.6 : 1 }}>
            {saving ? t.saving : `✅ ${t.payAction}`}
          </button>
          <button onClick={onClose} disabled={saving}
            style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '11px 16px', fontSize: 12.5, fontWeight: 500, color: TEXT_MUTED, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// تبويب: مخالصة الطبيب أو التأمين (نفس المنطق بالضبط)
// ═══════════════════════════════════════════
function PartySettlementTab({ t, isAr, lang, mode }: { t: typeof T['ar']; isAr: boolean; lang: 'ar' | 'en'; mode: 'doctor' | 'insurance' }) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [companies, setCompanies] = useState<InsuranceCompany[]>([])
  const [partyId, setPartyId] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [pending, setPending] = useState<{ total: number; count: number; items: any[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [recalculating, setRecalculating] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ✅ إظهار/إخفاء الأعمدة — checkbox و"المستحق" أعمدة أساسية ما تختفي
  const columnDefs = mode === 'doctor'
    ? [
        { key: 'check', label: isAr ? 'تحديد' : 'Select', locked: true },
        { key: 'date', label: t.date },
        { key: 'patient', label: t.patient },
        { key: 'type', label: t.visitType },
        { key: 'commission', label: t.commission, locked: true },
      ]
    : [
        { key: 'check', label: isAr ? 'تحديد' : 'Select', locked: true },
        { key: 'date', label: t.date },
        { key: 'claimNumber', label: t.claimNumber },
        { key: 'patient', label: t.patient },
        { key: 'amount', label: t.insuranceAmount, locked: true },
      ]
  const { visibleKeys, toggle } = useColumnVisibility(`party-settlement-${mode}`, columnDefs)
  const [amountPaidNow, setAmountPaidNow] = useState('')

  useEffect(() => {
    if (mode === 'doctor') api.get('/doctors').then(res => setDoctors(res.data.filter((d: any) => d.isActive))).catch(() => {})
    else api.get('/insurance/companies').then(res => setCompanies(res.data)).catch(() => {})
  }, [mode])

  // ✅ لمواعيد اكتملت قبل ما تُحدَّد نسبة الطبيب — يعيد احتساب حصته الآن بالنسبة الحالية
  const handleRecalculate = async () => {
    if (!partyId) return
    setRecalculating(true); setError(''); setSuccess('')
    try {
      const res = await api.post(`/appointments/recalculate-commissions?doctorId=${partyId}`)
      setSuccess(res.data.message)
      fetchPending()
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || t.noData)
    } finally {
      setRecalculating(false)
    }
  }

  const fetchPending = async () => {
    if (!partyId) return
    setLoading(true); setError(''); setSuccess('')
    try {
      const params = new URLSearchParams()
      if (periodStart) params.set('from', periodStart)
      if (periodEnd) params.set('to', periodEnd)
      const url = mode === 'doctor'
        ? `/settlements/doctor/${partyId}/pending?${params}`
        : `/settlements/insurance/${partyId}/pending?${params}`
      const res = await api.get(url)
      setPending({
        total: mode === 'doctor' ? res.data.totalCommission : res.data.totalInsuranceAmount,
        count: res.data.count,
        items: res.data.items,
      })
      // ✅ كل البنود مفعّلة افتراضياً — الموظف يفك أي بند ما يبيه يشمله
      setSelectedIds(new Set(res.data.items.map((it: any) => it.id)))
      setAmountPaidNow('')
    } catch {
      setError(t.noData)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectedItems = (pending?.items ?? []).filter(it => selectedIds.has(it.id))
  const selectedTotal = selectedItems.reduce((sum, it) => sum + (mode === 'doctor' ? (it.doctorCommissionAmount || 0) : (it.insuranceAmount || 0)), 0)

  const handleSettle = async () => {
    if (selectedItems.length === 0) return
    if (!window.confirm(t.confirmSettle)) return
    setSaving(true); setError('')
    try {
      const payload: any = {
        doctorId: mode === 'doctor' ? partyId : undefined,
        insuranceCompanyId: mode === 'insurance' ? partyId : undefined,
        periodStart: periodStart || '2000-01-01',
        periodEnd: periodEnd || new Date().toISOString().split('T')[0],
        paymentMethod,
        notes: notes || undefined,
        amountPaidNow: amountPaidNow ? parseFloat(amountPaidNow) : undefined,
      }
      if (mode === 'doctor') payload.appointmentIds = selectedItems.map(it => it.id)
      else payload.claimIds = selectedItems.map(it => it.id)

      const res = await api.post(`/settlements/${mode}`, payload)
      setSuccess(res.data.status === 'partial'
        ? `${t.settled} (${isAr ? 'دفعة جزئية' : 'partial payment'}: ${res.data.amountPaid?.toFixed(2)} / ${res.data.totalAmount?.toFixed(2)})`
        : t.settled)
      setPending(null)
      setNotes('')
      setAmountPaidNow('')
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || t.noPending)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* فورم الاختيار */}
      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>
              {mode === 'doctor' ? t.selectDoctor : t.selectCompany}
            </label>
            <SearchableSelect
              isRtl={isAr}
              value={partyId}
              onChange={setPartyId}
              placeholder={mode === 'doctor' ? t.selectDoctor : t.selectCompany}
              options={(mode === 'doctor' ? doctors.map(d => ({ value: d.id, label: d.fullName })) : companies.map(c => ({ value: c.id, label: c.name })))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.periodFrom}</label>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "'Inter',sans-serif", color: TEXT_DARK }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.periodTo}</label>
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "'Inter',sans-serif", color: TEXT_DARK }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={fetchPending} disabled={!partyId || loading}
              style={{ width: '100%', background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: (!partyId || loading) ? 'not-allowed' : 'pointer', opacity: (!partyId || loading) ? 0.6 : 1 }}>
              🔍 {t.search}
            </button>
          </div>
        </div>

        {/* ✅ زر إعادة الاحتساب — للمواعيد اللي اكتملت قبل ما تُحدَّد نسبة الطبيب */}
        {mode === 'doctor' && partyId && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${BORDER}` }}>
            <button onClick={handleRecalculate} disabled={recalculating}
              style={{ background: 'transparent', border: `1px solid ${PRIMARY}50`, color: PRIMARY, borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: recalculating ? 'not-allowed' : 'pointer', opacity: recalculating ? 0.6 : 1 }}>
              {recalculating ? '⏳ ...' : (isAr ? '🔄 إعادة احتساب الحصص الناقصة لهذا الطبيب' : '🔄 Recalculate Missing Commissions')}
            </button>
            <p style={{ fontSize: 10.5, color: TEXT_MUTED, marginTop: 6 }}>
              {isAr
                ? 'للمواعيد المكتملة قبل ما تُحدَّد نسبة الطبيب — يحسبها الآن بالنسبة الحالية'
                : 'For completed visits before the commission rate was set — calculates them using the current rate'}
            </p>
          </div>
        )}
      </div>

      {error && <Alert type="err" text={error} />}
      {success && <Alert type="ok" text={success} />}

      {loading ? <LoadingBox t={t} /> : pending && (
        <>
          <SummaryCards items={[
            { label: isAr ? 'المحدَّد للتسوية' : 'Selected for settlement', value: `${selectedTotal.toFixed(2)}`, color: selectedTotal > 0 ? SUCCESS : TEXT_MUTED },
            { label: isAr ? 'بنود محدَّدة' : 'Selected items', value: `${selectedItems.length}/${pending.count}`, color: PRIMARY },
          ]} />

          {pending.count > 0 && (
            <>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 8 }}>
                <ColumnToggleButton columns={columnDefs} visibleKeys={visibleKeys} onToggle={toggle} isRtl={isAr} />
              </div>
              <ExportBar t={t} lang={lang} endpoint={`/settlements/doctor/${partyId}/pending/export?from=${periodStart}&to=${periodEnd}`} />
              <DataTable
                empty={t.noPending}
                columns={columnDefs.filter(c => visibleKeys.has(c.key)).map(c => c.label)}
                rows={pending.items.map(item => {
                  const checkbox = (
                    <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)}
                      style={{ width: 15, height: 15, accentColor: PRIMARY, cursor: 'pointer' }} />
                  )
                  const cellsByKey: Record<string, React.ReactNode> = mode === 'doctor'
                    ? {
                        check: checkbox,
                        date: new Date(item.appointmentDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-US'),
                        patient: item.patientName,
                        type: item.type || '—',
                        commission: <span style={{ fontWeight: 700, color: SUCCESS }}>{item.doctorCommissionAmount?.toFixed(2)}</span>,
                      }
                    : {
                        check: checkbox,
                        date: new Date(item.serviceDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-US'),
                        claimNumber: item.claimNumber,
                        patient: item.patientName,
                        amount: <span style={{ fontWeight: 700, color: SUCCESS }}>{item.insuranceAmount?.toFixed(2)}</span>,
                      }
                  return columnDefs.filter(c => visibleKeys.has(c.key)).map(c => cellsByKey[c.key])
                })}
              />

              {/* فورم تسجيل التسوية */}
              <div style={{ background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18, marginTop: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>
                      {isAr ? 'المبلغ المدفوع الآن' : 'Amount paid now'}
                    </label>
                    <input type="number" value={amountPaidNow} onChange={e => setAmountPaidNow(e.target.value)}
                      placeholder={selectedTotal.toFixed(2)}
                      style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "'Inter',sans-serif", color: TEXT_DARK, background: CARD_BG }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.paymentMethod}</label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG }}>
                      <option value="cash">{t.cash}</option>
                      <option value="bank_transfer">{t.bankTransfer}</option>
                      <option value="check">{t.check}</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.notes}</label>
                    <input value={notes} onChange={e => setNotes(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG }} />
                  </div>
                </div>
                {amountPaidNow && parseFloat(amountPaidNow) < selectedTotal && (
                  <p style={{ fontSize: 11, color: WARNING, marginBottom: 12 }}>
                    ⚠️ {isAr ? `دفعة جزئية — سيبقى ${(selectedTotal - parseFloat(amountPaidNow)).toFixed(2)} مستحق` : `Partial payment — ${(selectedTotal - parseFloat(amountPaidNow)).toFixed(2)} will remain due`}
                  </p>
                )}
                <button onClick={handleSettle} disabled={saving || selectedItems.length === 0}
                  style={{ background: SUCCESS, color: '#FFF', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 13.5, fontWeight: 700, cursor: (saving || selectedItems.length === 0) ? 'not-allowed' : 'pointer', opacity: (saving || selectedItems.length === 0) ? 0.7 : 1 }}>
                  {saving ? t.saving : `✅ ${t.registerSettlement}`}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// تبويب: سجل التسويات
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// تبويب: محطة التأمين الموحّدة — دورة حياة المطالبة كاملة بمكان واحد
// معلّقة → (إرسال دفعة) → مُرسلة → (تحديث فردي) → موافَق عليها → (تسوية) → مدفوعة
// ═══════════════════════════════════════════
function InsuranceHubTab({ t, isAr, lang }: { t: typeof T['ar']; isAr: boolean; lang: 'ar' | 'en' }) {
  const [companies, setCompanies] = useState<InsuranceCompany[]>([])
  const [companyId, setCompanyId] = useState('')
  const [status, setStatus] = useState<'pending' | 'submitted' | 'approved' | 'paid'>('pending')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [data, setData] = useState<{ totalAmount: number; count: number; items: any[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // فورم المخالصة (يظهر بس بحالة "موافَق عليها")
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [amountPaidNow, setAmountPaidNow] = useState('')

  // ✅ إظهار/إخفاء الأعمدة — تختلف شوي حسب الحالة المعروضة (تحديد بحالة الموافقة، إجراء بحالة الإرسال)
  const columnDefs = [
    ...(status === 'approved' ? [{ key: 'check', label: isAr ? 'تحديد' : 'Select', locked: true }] : []),
    { key: 'date', label: t.date },
    { key: 'claimNumber', label: t.claimNumber },
    { key: 'patient', label: t.patient },
    { key: 'amount', label: t.insuranceAmount, locked: true },
    ...(status === 'submitted' ? [{ key: 'action', label: t.updateStatus, locked: true }] : []),
  ]
  const { visibleKeys, toggle } = useColumnVisibility(`insurance-hub-${status}`, columnDefs)

  // نافذة تحديث حالة مطالبة فردية (تظهر بس بحالة "مُرسلة")
  const [statusModalClaim, setStatusModalClaim] = useState<any>(null)
  const [newStatus, setNewStatus] = useState<'approved' | 'rejected'>('approved')
  const [approvalNo, setApprovalNo] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    api.get('/insurance/companies').then(res => setCompanies(res.data)).catch(() => {})
  }, [])

  const fetchClaims = async () => {
    if (!companyId) return
    setLoading(true); setError(''); setSuccess('')
    try {
      const params = new URLSearchParams({ status })
      if (periodStart) params.set('from', periodStart)
      if (periodEnd) params.set('to', periodEnd)
      const res = await api.get(`/settlements/insurance/${companyId}/claims?${params}`)
      setData(res.data)
      setSelectedIds(new Set(res.data.items.map((it: any) => it.id)))
      setAmountPaidNow('')
    } catch {
      setError(t.noClaimsForStatus)
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (companyId) fetchClaims() }, [status])

  const handleSubmitBatch = async () => {
    if (!window.confirm(t.confirmSubmitBatch)) return
    setBusy(true); setError(''); setSuccess('')
    try {
      const res = await api.post('/settlements/insurance/submit-batch', {
        insuranceCompanyId: companyId,
        periodStart: periodStart || '2000-01-01',
        periodEnd: periodEnd || new Date().toISOString().split('T')[0],
      })
      setSuccess(res.data.message)
      fetchClaims()
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || t.noClaimsForStatus)
    } finally {
      setBusy(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectedItems = (data?.items ?? []).filter((it: any) => selectedIds.has(it.id))
  const selectedTotal = selectedItems.reduce((sum: number, it: any) => sum + (it.insuranceAmount || 0), 0)

  const handleSettle = async () => {
    if (selectedItems.length === 0) return
    if (!window.confirm(t.confirmSettle)) return
    setBusy(true); setError('')
    try {
      const res = await api.post('/settlements/insurance', {
        insuranceCompanyId: companyId,
        periodStart: periodStart || '2000-01-01',
        periodEnd: periodEnd || new Date().toISOString().split('T')[0],
        paymentMethod, notes: notes || undefined,
        claimIds: selectedItems.map((it: any) => it.id),
        amountPaidNow: amountPaidNow ? parseFloat(amountPaidNow) : undefined,
      })
      setSuccess(res.data.status === 'partial'
        ? `${t.settled} (${isAr ? 'دفعة جزئية' : 'partial payment'}: ${res.data.amountPaid?.toFixed(2)} / ${res.data.totalAmount?.toFixed(2)})`
        : t.settled)
      setData(null)
      setNotes('')
      setAmountPaidNow('')
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || t.noPending)
    } finally {
      setBusy(false)
    }
  }

  const openStatusModal = (claim: any) => {
    setStatusModalClaim(claim)
    setNewStatus('approved')
    setApprovalNo('')
    setRejectReason('')
  }

  const submitStatusUpdate = async () => {
    if (!statusModalClaim) return
    setBusy(true)
    try {
      await api.put(`/insurance/claims/${statusModalClaim.id}/status?lang=${lang}`, {
        status: newStatus,
        approvalNumber: newStatus === 'approved' ? approvalNo : undefined,
        rejectionReason: newStatus === 'rejected' ? rejectReason : undefined,
      })
      setStatusModalClaim(null)
      fetchClaims()
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || t.noClaimsForStatus)
    } finally {
      setBusy(false)
    }
  }

  const statusTabs: { key: typeof status; label: string; icon: string }[] = [
    { key: 'pending', label: t.statusPending, icon: '📥' },
    { key: 'submitted', label: t.statusSubmitted, icon: '📤' },
    { key: 'approved', label: t.statusApproved, icon: '✅' },
    { key: 'paid', label: t.statusPaid, icon: '💰' },
  ]

  return (
    <div>
      {/* اختيار الشركة والفترة */}
      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.selectCompany}</label>
            <SearchableSelect isRtl={isAr} value={companyId} onChange={v => { setCompanyId(v); setData(null) }}
              placeholder={t.selectCompany} options={companies.map(c => ({ value: c.id, label: c.name }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.periodFrom}</label>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "'Inter',sans-serif", color: TEXT_DARK }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.periodTo}</label>
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "'Inter',sans-serif", color: TEXT_DARK }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={fetchClaims} disabled={!companyId || loading}
              style={{ width: '100%', background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: (!companyId || loading) ? 'not-allowed' : 'pointer', opacity: (!companyId || loading) ? 0.6 : 1 }}>
              🔍 {t.search}
            </button>
          </div>
        </div>
      </div>

      {companyId && (
        <>
          {/* فلتر الحالة — نفس فكرة "خط سير المطالبة" */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {statusTabs.map(st => (
              <button key={st.key} onClick={() => setStatus(st.key)}
                style={{
                  padding: '8px 16px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${status === st.key ? PRIMARY : BORDER}`,
                  background: status === st.key ? PRIMARY_SOFT : CARD_BG,
                  color: status === st.key ? PRIMARY : TEXT_MUTED,
                }}>
                {st.icon} {st.label}
              </button>
            ))}
          </div>

          {error && <Alert type="err" text={error} />}
          {success && <Alert type="ok" text={success} />}

          {loading ? <LoadingBox t={t} /> : data && (
            <>
              <SummaryCards items={status === 'approved' ? [
                { label: isAr ? 'المحدَّد للتسوية' : 'Selected for settlement', value: `${selectedTotal.toFixed(2)}`, color: selectedTotal > 0 ? SUCCESS : TEXT_MUTED },
                { label: isAr ? 'بنود محدَّدة' : 'Selected items', value: `${selectedItems.length}/${data.count}`, color: PRIMARY },
              ] : [
                { label: t.totalPending, value: `${data.totalAmount.toFixed(2)}`, color: data.count > 0 ? SUCCESS : TEXT_MUTED },
                { label: t.itemsCount, value: String(data.count), color: PRIMARY },
              ]} />

              {data.count > 0 && (
                <>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 8 }}>
                    <ColumnToggleButton columns={columnDefs} visibleKeys={visibleKeys} onToggle={toggle} isRtl={isAr} />
                  </div>
                  <ExportBar t={t} lang={lang} endpoint={`/settlements/insurance/${companyId}/claims/export?status=${status}&from=${periodStart}&to=${periodEnd}`} />
                  <DataTable
                    empty={t.noClaimsForStatus}
                    columns={columnDefs.filter(c => visibleKeys.has(c.key)).map(c => c.label)}
                    rows={data.items.map((c: any) => {
                      const cellsByKey: Record<string, React.ReactNode> = {
                        check: (
                          <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)}
                            style={{ width: 15, height: 15, accentColor: PRIMARY, cursor: 'pointer' }} />
                        ),
                        date: new Date(c.serviceDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-US'),
                        claimNumber: c.claimNumber,
                        patient: c.patientName,
                        amount: <span style={{ fontWeight: 700, color: SUCCESS }}>{c.insuranceAmount?.toFixed(2)}</span>,
                        action: (
                          <button onClick={() => openStatusModal(c)}
                            style={{ background: PRIMARY_SOFT, color: PRIMARY, border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
                            {t.updateStatus}
                          </button>
                        ),
                      }
                      return columnDefs.filter(c2 => visibleKeys.has(c2.key)).map(c2 => cellsByKey[c2.key])
                    })}
                  />

                  {/* إجراء جماعي — يختلف حسب الحالة المعروضة */}
                  {status === 'pending' && (
                    <div style={{ background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18, marginTop: 16 }}>
                      <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 12 }}>📤 {t.submitBatchHint}</p>
                      <button onClick={handleSubmitBatch} disabled={busy}
                        style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 13, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}>
                        {busy ? t.saving : `📤 ${t.submitBatch}`}
                      </button>
                    </div>
                  )}

                  {status === 'approved' && (
                    <div style={{ background: SUCCESS_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18, marginTop: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>
                            {isAr ? 'المبلغ المدفوع الآن' : 'Amount paid now'}
                          </label>
                          <input type="number" value={amountPaidNow} onChange={e => setAmountPaidNow(e.target.value)}
                            placeholder={selectedTotal.toFixed(2)}
                            style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "'Inter',sans-serif", color: TEXT_DARK, background: CARD_BG }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.paymentMethod}</label>
                          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG }}>
                            <option value="cash">{t.cash}</option>
                            <option value="bank_transfer">{t.bankTransfer}</option>
                            <option value="check">{t.check}</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.notes}</label>
                          <input value={notes} onChange={e => setNotes(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG }} />
                        </div>
                      </div>
                      {amountPaidNow && parseFloat(amountPaidNow) < selectedTotal && (
                        <p style={{ fontSize: 11, color: WARNING, marginBottom: 12 }}>
                          ⚠️ {isAr ? `دفعة جزئية — سيبقى ${(selectedTotal - parseFloat(amountPaidNow)).toFixed(2)} مستحق` : `Partial payment — ${(selectedTotal - parseFloat(amountPaidNow)).toFixed(2)} will remain due`}
                        </p>
                      )}
                      <button onClick={handleSettle} disabled={busy || selectedItems.length === 0}
                        style={{ background: SUCCESS, color: '#FFF', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 13.5, fontWeight: 700, cursor: (busy || selectedItems.length === 0) ? 'not-allowed' : 'pointer', opacity: (busy || selectedItems.length === 0) ? 0.7 : 1 }}>
                        {busy ? t.saving : `✅ ${t.registerSettlement}`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* نافذة تحديث حالة مطالبة فردية */}
      {statusModalClaim && (
        <div onClick={() => !busy && setStatusModalClaim(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: CARD_BG, borderRadius: 18, padding: 22, maxWidth: 380, width: '100%' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, marginBottom: 4 }}>{t.updateStatus}</h3>
            <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 16 }}>{statusModalClaim.claimNumber} · {statusModalClaim.patientName}</p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button onClick={() => setNewStatus('approved')}
                style={{ flex: 1, padding: '9px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: `2px solid ${newStatus === 'approved' ? SUCCESS : BORDER}`, background: newStatus === 'approved' ? SUCCESS_BG : CARD_BG, color: newStatus === 'approved' ? '#166534' : TEXT_MUTED }}>
                ✅ {t.approve}
              </button>
              <button onClick={() => setNewStatus('rejected')}
                style={{ flex: 1, padding: '9px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: `2px solid ${newStatus === 'rejected' ? DANGER : BORDER}`, background: newStatus === 'rejected' ? '#FFF5F5' : CARD_BG, color: newStatus === 'rejected' ? DANGER : TEXT_MUTED }}>
                ✕ {t.reject}
              </button>
            </div>

            {newStatus === 'approved' ? (
              <input value={approvalNo} onChange={e => setApprovalNo(e.target.value)} placeholder={t.approvalNumber}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK, marginBottom: 16 }} />
            ) : (
              <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder={t.rejectionReason}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK, marginBottom: 16 }} />
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={submitStatusUpdate} disabled={busy}
                style={{ flex: 1, background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}>
                {busy ? t.saving : t.updateStatus}
              </button>
              <button onClick={() => setStatusModalClaim(null)} disabled={busy}
                style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 16px', fontSize: 12.5, color: TEXT_MUTED, cursor: 'pointer' }}>
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HistoryTab({ t, isAr }: { t: typeof T['ar']; isAr: boolean }) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [filter, setFilter] = useState<'' | 'doctor' | 'insurance'>('')

  const columnDefs = [
    { key: 'type', label: t.type },
    { key: 'party', label: isAr ? 'الطرف' : 'Party' },
    { key: 'period', label: t.period },
    { key: 'amount', label: t.amount, locked: true },
    { key: 'method', label: t.method },
    { key: 'date', label: t.date },
  ]
  const { visibleKeys, toggle } = useColumnVisibility('settlement-history', columnDefs)

  useEffect(() => {
    setLoading(true)
    api.get(`/settlements${filter ? `?type=${filter}` : ''}`)
      .then(res => setItems(res.data))
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['', 'doctor', 'insurance'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '7px 16px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              border: `1.5px solid ${filter === f ? PRIMARY : BORDER}`,
              background: filter === f ? PRIMARY_SOFT : CARD_BG,
              color: filter === f ? PRIMARY : TEXT_MUTED,
            }}>
            {f === '' ? (isAr ? 'الكل' : 'All') : f === 'doctor' ? t.doctorType : t.insuranceType}
          </button>
        ))}
      </div>

      {loading ? <LoadingBox t={t} /> : (
        <>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 8 }}>
            <ColumnToggleButton columns={columnDefs} visibleKeys={visibleKeys} onToggle={toggle} isRtl={isAr} />
          </div>
          <ExportBar t={t} lang={isAr ? 'ar' : 'en'} endpoint={`/settlements/export${filter ? `?type=${filter}` : ''}`} />
          <DataTable
            empty={t.noData}
            columns={columnDefs.filter(c => visibleKeys.has(c.key)).map(c => c.label)}
            rows={items.map(s => {
              const cellsByKey: Record<string, React.ReactNode> = {
                type: s.type === 'doctor' ? `👨‍⚕️ ${t.doctorType}` : `🏥 ${t.insuranceType}`,
                party: s.doctorName || s.insuranceCompanyName || '—',
                period: `${new Date(s.periodStart).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')} — ${new Date(s.periodEnd).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}`,
                amount: <span style={{ fontWeight: 700, color: SUCCESS }}>{s.totalAmount?.toFixed(2)}</span>,
                method: s.paymentMethod === 'cash' ? t.cash : s.paymentMethod === 'bank_transfer' ? t.bankTransfer : s.paymentMethod === 'check' ? t.check : (s.paymentMethod || '—'),
                date: new Date(s.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US'),
              }
              return columnDefs.filter(c => visibleKeys.has(c.key)).map(c => cellsByKey[c.key])
            })}
          />
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// مكوّنات مشتركة
// ═══════════════════════════════════════════
function LoadingBox({ t }: { t: typeof T['ar'] }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: TEXT_MUTED }}>
      <div style={{ width: 32, height: 32, margin: '0 auto 12px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: PRIMARY, animation: 'spin 0.8s linear infinite' }} />
      {t.loading}
    </div>
  )
}

function Alert({ type, text }: { type: 'ok' | 'err'; text: string }) {
  const ok = type === 'ok'
  return (
    <div style={{ background: ok ? SUCCESS_BG : '#FFF5F5', border: `1px solid ${ok ? '#86EFAC' : '#FCA5A5'}`, borderRadius: 12, padding: '11px 16px', marginBottom: 16, fontSize: 13, color: ok ? '#166534' : DANGER }}>
      {ok ? '✅' : '⚠️'} {text}
    </div>
  )
}

function SummaryCards({ items }: { items: { label: string; value: string; color: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length},1fr)`, gap: 14, marginBottom: 18 }}>
      {items.map((it, i) => (
        <div key={i} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18 }}>
          <p style={{ fontSize: 11.5, color: TEXT_MUTED, margin: '0 0 6px' }}>{it.label}</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: it.color, margin: 0, fontFamily: "'Inter',sans-serif" }}>{it.value}</p>
        </div>
      ))}
    </div>
  )
}

function ExportBar({ t, endpoint, lang }: { t: typeof T['ar']; endpoint: string; lang: 'ar' | 'en' }) {
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null)

  const download = async (format: 'pdf' | 'excel') => {
    setDownloading(format)
    try {
      const sep = endpoint.includes('?') ? '&' : '?'
      const res = await api.get(`${endpoint}${sep}format=${format}&lang=${lang}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `report.${format === 'excel' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch {
      alert(lang === 'ar' ? 'تعذّر التصدير' : 'Export failed')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 12 }}>
      <button onClick={() => window.print()}
        style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_MUTED, cursor: 'pointer' }}>
        🖨️ {t.print}
      </button>
      <button onClick={() => download('pdf')} disabled={downloading !== null}
        style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_DARK, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading === 'excel' ? 0.5 : 1 }}>
        {downloading === 'pdf' ? '⏳' : '📄'} {t.exportPdf}
      </button>
      <button onClick={() => download('excel')} disabled={downloading !== null}
        style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_DARK, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading === 'pdf' ? 0.5 : 1 }}>
        {downloading === 'excel' ? '⏳' : '📊'} {t.exportExcel}
      </button>
    </div>
  )
}

function DataTable({ columns, rows, empty }: { columns: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (rows.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', background: CARD_BG, borderRadius: 16, border: `1px solid ${BORDER}` }}>
        <p style={{ fontSize: 13, color: TEXT_MUTED }}>{empty}</p>
      </div>
    )
  }
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} style={{ padding: '12px 14px', textAlign: 'start', fontSize: 11.5, fontWeight: 700, color: TEXT_MUTED, background: '#F8FAFA', borderBottom: `1px solid ${BORDER}` }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '11px 14px', fontSize: 12.5, color: TEXT_DARK, borderBottom: `1px solid ${BORDER}` }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}