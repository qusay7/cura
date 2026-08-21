import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useColumnVisibility, ColumnToggleButton, type ColumnDef } from '../components/ColumnToggle'

const getStoredLang = (): 'ar' | 'en' => (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const PRIMARY      = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK    = '#2C3E3F'
const TEXT_MUTED   = '#6B8A8C'
const BORDER       = '#DCE5E5'
const CARD_BG      = '#FFFFFF'
const SUCCESS      = '#16A34A'
const SUCCESS_BG   = '#F0FDF4'
const WARNING      = '#F59E0B'
const WARNING_BG   = '#FFFBEB'
const DANGER       = '#EF4444'
const DANGER_BG    = '#FEF2F2'

const T = {
  ar: {
    title:'المدفوعات', subtitle:'إدارة وتتبع مدفوعات الزيارات',
    riyal:'د.أ', loading:'جاري التحميل...',
    totalRevenue:'إجمالي الإيرادات', totalCollected:'المدفوع من المرضى',
    totalInsurance:'مستحق التأمين', pendingInsurance:'مستحقاتنا من التأمين',
    patientOwes:'مستحق على مرضى', patientCredit:'مستحق لمرضى',
    paidCount:'مدفوع', unpaidCount:'غير مدفوع',
    patient:'المريض', total:'الإجمالي', insAmount:'التأمين',
    patAmount:'المريض', paid:'مدفوع', amountPaid:'المدفوع',
    balance:'الفرق', method:'طريقة الدفع', date:'التاريخ',
    claim:'المطالبة', claimStatus:'حالة المطالبة',
    filter:'فلتر', all:'الكل', filterPaid:'مدفوع', filterUnpaid:'غير مدفوع',
    from:'من', to:'إلى', apply:'تطبيق', reset:'إعادة تعيين',
    noData:'لا توجد بيانات', viewAppointment:'عرض الموعد',
    cash:'نقداً', card:'بطاقة', partial:'جزئي', insurance:'تأمين',
    byMethod:'حسب طريقة الدفع',
    thisMonth:'هذا الشهر', monthRevenue:'إيرادات الشهر', monthCollected:'محصّل الشهر',
     print: 'طباعة',
    exportPdf: 'تصدير PDF',
    exportExcel: 'تصدير Excel',
  },
  en: {
    title:'Payments', subtitle:'Manage and track visit payments',
    riyal:'JD', loading:'Loading...',
    totalRevenue:'Total Revenue', totalCollected:'Paid by Patients',
    totalInsurance:'Insurance Due', pendingInsurance:'Owed by Insurance',
    patientOwes:'Patients Owe', patientCredit:'Patient Credits',
    paidCount:'Paid', unpaidCount:'Unpaid',
    patient:'Patient', total:'Total', insAmount:'Insurance',
    patAmount:'Patient', paid:'Paid', amountPaid:'Paid',
    balance:'Balance', method:'Method', date:'Date',
    claim:'Claim', claimStatus:'Claim Status',
    filter:'Filter', all:'All', filterPaid:'Paid', filterUnpaid:'Unpaid',
    from:'From', to:'To', apply:'Apply', reset:'Reset',
    noData:'No data available', viewAppointment:'View Appointment',
    cash:'Cash', card:'Card', partial:'Partial', insurance:'Insurance',
    byMethod:'By Payment Method',
    thisMonth:'This Month', monthRevenue:'Month Revenue', monthCollected:'Month Collected',
    print: 'Print',
    exportPdf: 'Export PDF',
    exportExcel: 'Export Excel',
  },
}

const fmt = (n:number) => n?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) ?? '0'
const globalCss = `
@media print {
  .no-print { display: none !important; }
  body { margin: 0; padding: 10px; }
}
`
export default function Payments() {
  const navigate = useNavigate()
  const [lang, setLang]         = useState<'ar'|'en'>(getStoredLang())
  const [data, setData]         = useState<any>(null)
  const [stats, setStats]       = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [filterPaid, setFilterPaid] = useState<string>('')
  const [fromDate, setFrom]     = useState('')
  const [toDate, setTo]         = useState('')
  const [page, setPage]         = useState(1)

const t    = T[lang]
const isAr = lang === 'ar'

// ✅ إعدادات الأعمدة
const columnDefs: ColumnDef[] = [
  { key: 'patient', label: t.patient, locked: true },
  { key: 'total', label: t.total },
  { key: 'insAmount', label: t.insAmount },
  { key: 'patAmount', label: t.patAmount },
  { key: 'amountPaid', label: t.amountPaid },
  { key: 'balance', label: t.balance },
  { key: 'method', label: t.method },
  { key: 'claimStatus', label: t.claimStatus },
  { key: 'date', label: t.date },
]
const { visibleKeys, toggle } = useColumnVisibility('payments-table', columnDefs)

  useEffect(() => {
    const onLang = (e:Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', onLang)
    fetchStats()
    return () => window.removeEventListener('cura-lang-change', onLang)
  }, [])

  useEffect(() => { fetchData() }, [filterPaid, page])

  const fetchStats = async () => {
    try {
      const r = await api.get('/payments/stats')
      setStats(r.data)
    } catch {}
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize:'20' })
      if (filterPaid==='paid')   params.set('isPaid','true')
      if (filterPaid==='unpaid') params.set('isPaid','false')
      if (fromDate) params.set('from', fromDate)
      if (toDate)   params.set('to', toDate)
      const r = await api.get(`/payments?${params}`)
      setData(r.data)
    } catch (err:any) {
      if (err?.response?.status===401) navigate('/login')
    } finally { setLoading(false) }
  }

  const applyFilter = () => { setPage(1); fetchData() }
  const resetFilter = () => { setFilterPaid(''); setFrom(''); setTo(''); setPage(1); setTimeout(fetchData,0) }

  const methodLabel = (m:string) => ({ cash:t.cash, card:t.card, partial:t.partial, insurance:t.insurance }[m] ?? m)
  const claimStatusColor = (s:string) => ({
    pending:  { bg:WARNING_BG,  color:WARNING },
    submitted:{ bg:PRIMARY_SOFT, color:PRIMARY },
    approved: { bg:SUCCESS_BG,  color:SUCCESS },
    rejected: { bg:DANGER_BG,   color:DANGER },
    paid:     { bg:SUCCESS_BG,  color:SUCCESS },
  }[s] ?? { bg:PRIMARY_SOFT, color:PRIMARY })

 return (
    <>
      <style>{globalCss}</style>
      <div dir={isAr?'rtl':'ltr'} style={{ background:'#F8FAFA', minHeight:'100vh', padding:24, fontFamily:isAr?"'Noto Kufi Arabic',sans-serif":"'Inter',sans-serif" }}>
             <div style={{ maxWidth:1300, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:PRIMARY_SOFT, border:`1px solid ${BORDER}`, borderRadius:100, padding:'4px 16px', fontSize:11, fontWeight:600, color:PRIMARY, marginBottom:12 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:PRIMARY }} /> 💳
          </div>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:30, fontWeight:500, color:TEXT_DARK, margin:0 }}>{t.title}</h2>
          <p style={{ fontSize:13, color:TEXT_MUTED, margin:'6px 0 0' }}>{t.subtitle}</p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            {[
              { icon:'💰', label:t.totalRevenue,     val:`${fmt(stats.totalRevenue)} ${t.riyal}`,    color:TEXT_DARK },
              { icon:'✅', label:t.totalCollected,    val:`${fmt(stats.totalCollected)} ${t.riyal}`,  color:SUCCESS },
              { icon:'🏥', label:t.pendingInsurance,  val:`${fmt(stats.pendingInsurance)} ${t.riyal}`,color:'#1D4ED8' },
              { icon:'⏳', label:t.patientOwes,       val:`${fmt(stats.patientOwes)} ${t.riyal}`,    color:DANGER },
            ].map((s,i)=>(
              <div key={i} style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:16, padding:18 }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
                <p style={{ fontSize:22, fontWeight:700, color:s.color, margin:0, fontFamily:"'Inter',monospace" }}>{s.val}</p>
                <p style={{ fontSize:11, color:TEXT_MUTED, margin:'4px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Stats Row 2 */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            {[
              { icon:'📅', label:t.monthRevenue,   val:`${fmt(stats.monthRevenue)} ${t.riyal}`,   color:PRIMARY },
              { icon:'📥', label:t.monthCollected, val:`${fmt(stats.monthCollected)} ${t.riyal}`, color:SUCCESS },
              { icon:'✔️', label:t.paidCount,      val:String(stats.paidCount),                   color:SUCCESS },
              { icon:'❌', label:t.unpaidCount,    val:String(stats.unpaidCount),                  color:DANGER },
            ].map((s,i)=>(
              <div key={i} style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:16, padding:18 }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
                <p style={{ fontSize:22, fontWeight:700, color:s.color, margin:0 }}>{s.val}</p>
                <p style={{ fontSize:11, color:TEXT_MUTED, margin:'4px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* طرق الدفع */}
        {stats?.byMethod?.length > 0 && (
          <div style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:16, padding:20, marginBottom:20 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:TEXT_DARK, margin:'0 0 14px' }}>📊 {t.byMethod}</h3>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {stats.byMethod.map((m:any,i:number)=>(
                <div key={i} style={{ background:PRIMARY_SOFT, borderRadius:12, padding:'10px 18px', display:'flex', gap:10, alignItems:'center' }}>
                  <span style={{ fontSize:13, fontWeight:700, color:PRIMARY }}>{methodLabel(m.method)}</span>
                  <span style={{ fontSize:12, color:TEXT_MUTED }}>{m.count} | {fmt(m.total)} {t.riyal}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* فلتر */}
        <div style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:14, padding:'14px 18px', marginBottom:20, display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
          <span style={{ fontSize:13, fontWeight:700, color:TEXT_DARK }}>🔍 {t.filter}</span>
          <select value={filterPaid} onChange={e=>setFilterPaid(e.target.value)}
            style={{ padding:'8px 12px', border:`1px solid ${BORDER}`, borderRadius:9, fontSize:13, color:TEXT_DARK, outline:'none', minWidth:120 }}>
            <option value="">{t.all}</option>
            <option value="paid">{t.filterPaid}</option>
            <option value="unpaid">{t.filterUnpaid}</option>
          </select>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:10, color:TEXT_MUTED, fontWeight:700 }}>{t.from}</label>
            <input type="date" value={fromDate} onChange={e=>setFrom(e.target.value)}
              style={{ padding:'8px 10px', border:`1px solid ${BORDER}`, borderRadius:9, fontSize:13, fontFamily:'Inter,sans-serif', outline:'none' }} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:10, color:TEXT_MUTED, fontWeight:700 }}>{t.to}</label>
            <input type="date" value={toDate} onChange={e=>setTo(e.target.value)}
              style={{ padding:'8px 10px', border:`1px solid ${BORDER}`, borderRadius:9, fontSize:13, fontFamily:'Inter,sans-serif', outline:'none' }} />
          </div>
          <button onClick={applyFilter} style={{ padding:'9px 18px', background:PRIMARY, color:'#FFF', border:'none', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer' }}>
            {t.apply}
          </button>
          <button onClick={resetFilter} style={{ padding:'9px 14px', background:'transparent', border:`1px solid ${BORDER}`, borderRadius:9, fontSize:12, cursor:'pointer', color:TEXT_MUTED }}>
            ✕ {t.reset}
          </button>
        </div>

      {/* ✅ أزرار الطباعة والتصدير والأعمدة */}
   <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }} className="no-print">
   <button onClick={() => window.print()}
    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_MUTED, cursor: 'pointer' }}>
    🖨️ {t.print}
   </button>
   <button onClick={() => {
    const rows = data?.payments?.map((p: any) => [
      p.patientName,
      fmt(p.totalAmount),
      fmt(p.insuranceAmount),
      fmt(p.patientAmount),
      fmt(p.amountPaid),
      fmt(p.patientBalance),
      methodLabel(p.paymentMethod),
      p.claimStatus || '—',
      p.createdAt,
    ]) || []
    api.post('/export/pdf', {
      title: t.title,
      columns: [t.patient, t.total, t.insAmount, t.patAmount, t.amountPaid, t.balance, t.method, t.claimStatus, t.date],
      rows,
      isRtl: isAr,
    }, { responseType: 'blob' }).then(r => {
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url; a.download = 'payments.pdf'; a.click()
      URL.revokeObjectURL(url)
    }).catch(() => alert(isAr ? 'فشل التصدير' : 'Export failed'))
  }}
    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_DARK, cursor: 'pointer' }}>
    📄 {t.exportPdf}
  </button>
  <button onClick={() => {
    const rows = data?.payments?.map((p: any) => [
      p.patientName,
      fmt(p.totalAmount),
      fmt(p.insuranceAmount),
      fmt(p.patientAmount),
      fmt(p.amountPaid),
      fmt(p.patientBalance),
      methodLabel(p.paymentMethod),
      p.claimStatus || '—',
      p.createdAt,
    ]) || []
    api.post('/export/excel', {
      title: t.title,
      columns: [t.patient, t.total, t.insAmount, t.patAmount, t.amountPaid, t.balance, t.method, t.claimStatus, t.date],
      rows,
      isRtl: isAr,
    }, { responseType: 'blob' }).then(r => {
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url; a.download = 'payments.xlsx'; a.click()
      URL.revokeObjectURL(url)
    }).catch(() => alert(isAr ? 'فشل التصدير' : 'Export failed'))
  }}
    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_DARK, cursor: 'pointer' }}>
    📊 {t.exportExcel}
  </button>
  <ColumnToggleButton columns={columnDefs} visibleKeys={visibleKeys} onToggle={toggle} isRtl={isAr} />
</div>

{/* جدول المدفوعات */}
<div style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:18, overflow:'hidden' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:60, color:TEXT_MUTED }}>{t.loading}</div>
          ) : data?.payments?.length > 0 ? (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                      <tr style={{ background:'#F8FAFA' }}>
                        {columnDefs.filter(col => visibleKeys.has(col.key)).map((h,i)=>(
                          <th key={i} style={{ padding:'10px 14px', fontWeight:600, fontSize:11, color:TEXT_MUTED, textAlign:'right', borderBottom:`1px solid ${BORDER}`, whiteSpace:'nowrap' }}>{h.label}</th>
                        ))}
                        <th style={{ padding:'10px 14px', fontWeight:600, fontSize:11, color:TEXT_MUTED, textAlign:'right', borderBottom:`1px solid ${BORDER}`, whiteSpace:'nowrap' }}></th>
                      </tr>
                </thead>
               <tbody>
  {data.payments.map((p:any, i:number) => {
    const bal = p.patientBalance
    const cs  = p.claimStatus ? claimStatusColor(p.claimStatus) : null
    const cellData = [
      { key: 'patient', val: p.patientName, style: { fontWeight:500, color:TEXT_DARK } },
      { key: 'total', val: `${fmt(p.totalAmount)} ${t.riyal}`, style: { fontFamily:"'Inter',monospace" } },
      { key: 'insAmount', val: `${fmt(p.insuranceAmount)} ${t.riyal}`, style: { color:'#16A34A', fontFamily:"'Inter',monospace" } },
      { key: 'patAmount', val: `${fmt(p.patientAmount)} ${t.riyal}`, style: { color:WARNING, fontFamily:"'Inter',monospace" } },
      { key: 'amountPaid', val: `${fmt(p.amountPaid)} ${t.riyal}`, style: { color:SUCCESS, fontWeight:600, fontFamily:"'Inter',monospace" } },
      { key: 'balance', val: <span style={{ padding:'3px 8px', borderRadius:100, fontSize:11, fontWeight:600, background: bal>=0?SUCCESS_BG:DANGER_BG, color: bal>=0?SUCCESS:DANGER }}>{bal>=0?'+':''}{fmt(bal)} {t.riyal}</span>, style: {} },
      { key: 'method', val: methodLabel(p.paymentMethod), style: { color:TEXT_MUTED } },
      { key: 'claimStatus', val: cs ? <span style={{ padding:'3px 8px', borderRadius:100, fontSize:11, fontWeight:600, background:cs.bg, color:cs.color }}>{p.claimStatus}</span> : '—', style: {} },
      { key: 'date', val: p.createdAt, style: { color:TEXT_MUTED, fontSize:11, fontFamily:"'Inter',monospace" } },
    ]
    return (
      <tr key={i} style={{ borderBottom:`1px solid ${BORDER}` }}
        onMouseEnter={e=>e.currentTarget.style.background='#F8FAFA'}
        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
        {cellData.filter(c => visibleKeys.has(c.key)).map((cell, idx) => (
          <td key={idx} style={{ padding:'11px 14px', ...cell.style }}>{cell.val}</td>
        ))}
        <td style={{ padding:'11px 14px' }}>
          <button onClick={()=>navigate(`/appointments/${p.appointmentId}`)}
            style={{ padding:'5px 10px', border:`1px solid ${BORDER}`, borderRadius:8, background:'transparent', color:PRIMARY, fontSize:11, cursor:'pointer' }}>
            📅
          </button>
        </td>
      </tr>
    )
  })}
</tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'60px 0', color:TEXT_MUTED }}>
              <span style={{ fontSize:40, opacity:0.4 }}>💳</span>
              <p style={{ fontSize:13, marginTop:12 }}>{t.noData}</p>
            </div>
          )}

          {/* Pagination */}
          {data?.pages > 1 && (
            <div style={{ display:'flex', gap:8, justifyContent:'center', padding:'16px 0', borderTop:`1px solid ${BORDER}` }}>
              {Array.from({length:data.pages},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPage(p)}
                  style={{ width:32, height:32, borderRadius:8, border:`1px solid ${p===page?PRIMARY:BORDER}`, background:p===page?PRIMARY:CARD_BG, color:p===page?'#FFF':TEXT_DARK, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
   </div>
    </>
  )
}