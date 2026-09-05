import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useColumnVisibility, ColumnToggleButton, type ColumnDef } from '../components/ColumnToggle'
import { PRIMARY_SOFT } from '../styles/theme'
const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const PRIMARY      = '#5B8C8F'
const PRIMARY_DARK = '#4A7679'
const TEXT_DARK    = '#2C3E3F'
const TEXT_MUTED   = '#6B8A8C'
const BORDER       = '#DCE5E5'
const CARD_BG      = '#FFFFFF'
const SUCCESS      = '#16A34A'
const SUCCESS_BG   = '#F0FDF4'
const WARNING      = '#F59E0B'
const DANGER       = '#EF4444'
const DANGER_BG    = '#FEF2F2'
const AMBER        = '#C4A77D'

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&family=Noto+Kufi+Arabic:wght@400;500;600&display=swap');
@keyframes fade-up { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
.rep-shell { animation:fade-up 0.4s cubic-bezier(0.2,0.9,0.4,1.1) both; }
.rep-shell * { box-sizing:border-box; }
.stat-card { transition:all 0.2s ease; cursor:default; }
.stat-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(91,140,143,0.12) !important; }
.tab-btn { padding:8px 18px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; border:none; transition:all 0.2s; }
.tab-btn.active { background:${PRIMARY}; color:#FFF; }
.tab-btn:not(.active) { background:transparent; color:${TEXT_MUTED}; }
.tab-btn:not(.active):hover { background:${PRIMARY_SOFT}; color:${PRIMARY}; }
.tbl { width:100%; border-collapse:collapse; font-size:13px; }
.tbl th { text-align:right; padding:10px 14px; font-weight:600; font-size:11px; color:${TEXT_MUTED}; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid ${BORDER}; background:#F8FAFA; }
.tbl td { padding:11px 14px; border-bottom:1px solid ${BORDER}; color:${TEXT_DARK}; }
.tbl tr:last-child td { border-bottom:none; }
.tbl tr:hover td { background:#F8FAFA; }
.badge { padding:3px 10px; border-radius:100px; font-size:11px; font-weight:600; }
.filter-bar { background:${CARD_BG}; border:1px solid ${BORDER}; border-radius:14px; padding:14px 18px; margin-bottom:20px; display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap; }
.filter-field { display:flex; flex-direction:column; gap:5px; }
.filter-field label { font-size:11px; font-weight:700; color:${TEXT_MUTED}; text-transform:uppercase; letter-spacing:0.5px; }
.filter-field input, .filter-field select { padding:8px 12px; border:1px solid ${BORDER}; border-radius:9px; font-size:13px; color:${TEXT_DARK}; outline:none; font-family:inherit; }
.filter-field input:focus, .filter-field select:focus { border-color:${PRIMARY}; box-shadow:0 0 0 3px ${PRIMARY}18; }
.export-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:9px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid ${BORDER}; transition:all 0.2s; background:${CARD_BG}; color:${TEXT_DARK}; }
.export-btn:hover { border-color:${PRIMARY}; color:${PRIMARY}; background:${PRIMARY_SOFT}; }

@media(max-width:900px){
  .stats-grid { grid-template-columns:repeat(2,1fr) !important; }
  .charts-row { grid-template-columns:1fr !important; }
}
@media(max-width:480px){ .stats-grid { grid-template-columns:1fr !important; } }

/* ── Print / PDF Styles ── */
@media print {
  body { background:#FFF !important; }
  .no-print { display:none !important; }
  .rep-shell { padding:0 !important; animation:none !important; }
  .print-content { padding:20px !important; }
  .stat-card { break-inside:avoid; box-shadow:none !important; border:1px solid #DDD !important; }
  .tbl { font-size:11px; }
  .tbl th, .tbl td { padding:7px 10px; }
  h2 { font-size:20px !important; }
  .print-header { display:flex !important; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:12px; border-bottom:2px solid ${PRIMARY}; }
  .charts-row { grid-template-columns:1fr 1fr !important; }
  @page { size:A4; margin:15mm; }
}
`
const globalCss = `
@media print {
  .no-print { display: none !important; }
  body { margin: 0; padding: 10px; }
}
`
const T = {
  ar: {
    font:"'Noto Kufi Arabic',sans-serif", dir:'rtl' as const,
    title:'التقارير والإحصائيات', subtitle:'نظرة شاملة على أداء العيادة',
    tabs:['📊 الرئيسية','👨‍⚕️ الأطباء','👥 المرضى','📅 المواعيد','📋 تفصيلي','📆 نطاق مخصص'],
    riyal:'د.أ', loading:'جاري تحميل التقارير...',
    noData:'لا توجد بيانات', thisMonth:'هذا الشهر',
    totalPatients:'إجمالي المرضى', totalAppts:'إجمالي المواعيد',
    totalDoctors:'الأطباء النشطون', totalRevenue:'إجمالي الإيرادات',
    completed:'مكتملة', cancelled:'ملغية', scheduled:'مجدولة',
    completionRate:'نسبة الإنجاز', cancellationRate:'نسبة الإلغاء',
    monthlyTrend:'الاتجاه الشهري (12 شهر)', apptsByStatus:'المواعيد حسب الحالة',
    peakDays:'أيام الذروة', peakHours:'ساعات الذروة',
    topDoctors:'أداء الأطباء', topPatients:'أكثر المرضى زيارةً',
    visitTypes:'أنواع الزيارات', genderDist:'توزيع الجنس',
    avgWait:'متوسط وقت الانتظار', avgVisit:'متوسط مدة الزيارة',
    returning:'مرضى متكررون', returningRate:'نسبة الاحتفاظ',
    revenue:'الإيرادات', appts:'المواعيد',
    doctorName:'الطبيب', specialty:'التخصص',
    total:'الإجمالي', thisMonthAppts:'هذا الشهر',
    min:'دقيقة', from:'من', to:'إلى', apply:'تطبيق',
    newPatients:'مرضى جدد', activePatients:'مرضى نشطون',
    patientGrowth:'نمو المرضى شهرياً', ageGroups:'توزيع الفئات العمرية',
    absences:'الإجازات', today:'اليوم', thisWeek:'هذا الأسبوع',
    months: MONTHS_AR,
    // Filter & Export
    filter:'تصفية', filterDoctor:'الطبيب', filterPeriod:'الفترة',
    allDoctors:'كل الأطباء', periodAll:'كل الوقت', period30:'آخر 30 يوم',
    period90:'آخر 3 أشهر', period180:'آخر 6 أشهر', periodYear:'هذه السنة',
    exportPDF:'طباعة / PDF', exportExcel:'تصدير Excel',
    printTitle:'تقرير العيادة', printDate:'تاريخ التقرير',
    resetFilter:'إعادة تعيين',
  },
  en: {
    font:"'Inter',sans-serif", dir:'ltr' as const,
    title:'Reports & Analytics', subtitle:'Comprehensive overview of clinic performance',
    tabs:['📊 Overview','👨‍⚕️ Doctors','👥 Patients','📅 Appointments','📋 Detail','📆 Custom Range'],
    riyal:'JD', loading:'Loading reports...',
    noData:'No data available', thisMonth:'This Month',
    totalPatients:'Total Patients', totalAppts:'Total Appointments',
    totalDoctors:'Active Doctors', totalRevenue:'Total Revenue',
    completed:'Completed', cancelled:'Cancelled', scheduled:'Scheduled',
    completionRate:'Completion Rate', cancellationRate:'Cancellation Rate',
    monthlyTrend:'Monthly Trend (12 months)', apptsByStatus:'Appointments by Status',
    peakDays:'Peak Days', peakHours:'Peak Hours',
    topDoctors:'Doctor Performance', topPatients:'Top Patients by Visits',
    visitTypes:'Visit Types', genderDist:'Gender Distribution',
    avgWait:'Avg. Wait Time', avgVisit:'Avg. Visit Duration',
    returning:'Returning Patients', returningRate:'Retention Rate',
    revenue:'Revenue', appts:'Appointments',
    doctorName:'Doctor', specialty:'Specialty',
    total:'Total', thisMonthAppts:'This Month',
    min:'min', from:'From', to:'To', apply:'Apply',
    newPatients:'New Patients', activePatients:'Active Patients',
    patientGrowth:'Monthly Patient Growth', ageGroups:'Age Groups',
    absences:'Absences', today:'Today', thisWeek:'This Week',
    months: MONTHS_EN,
    // Filter & Export
    filter:'Filter', filterDoctor:'Doctor', filterPeriod:'Period',
    allDoctors:'All Doctors', periodAll:'All Time', period30:'Last 30 Days',
    period90:'Last 3 Months', period180:'Last 6 Months', periodYear:'This Year',
    exportPDF:'Print / PDF', exportExcel:'Export Excel',
    printTitle:'Clinic Report', printDate:'Report Date',
    resetFilter:'Reset',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number, d = 0) => n?.toLocaleString(undefined, { minimumFractionDigits:d, maximumFractionDigits:d }) ?? '0'
const growthColor = (n:number) => n>0?SUCCESS:n<0?DANGER:TEXT_MUTED
const growthBg    = (n:number) => n>0?SUCCESS_BG:n<0?DANGER_BG:PRIMARY_SOFT
const growthIcon  = (n:number) => n>0?'↑':n<0?'↓':'—'

// ─── Export to CSV/Excel ───────────────────────────────────────────────────────
const exportToExcel = (rows: any[][], filename: string) => {
  const bom = '\uFEFF'
  const csv = rows.map(r => r.map(c => `"${String(c??'').replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob([bom + csv], { type:'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename + '.csv'; a.click()
  URL.revokeObjectURL(url)
}

// ─── Components ───────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color, growth }: {
  icon:string; label:string; value:string; sub?:string; color?:string; growth?:number
}) => (
  <div className="stat-card" style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:18, padding:20, display:'flex', flexDirection:'column', gap:14 }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div style={{ width:46, height:46, borderRadius:14, background:PRIMARY_SOFT, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{icon}</div>
      {growth !== undefined && (
        <span style={{ fontSize:11, padding:'3px 9px', borderRadius:100, background:growthBg(growth), color:growthColor(growth), fontWeight:600 }}>
          {growthIcon(growth)} {Math.abs(growth)}%
        </span>
      )}
    </div>
    <div>
      <p style={{ fontSize:26, fontWeight:700, color:color||TEXT_DARK, margin:0 }}>{value}</p>
      <p style={{ fontSize:12, color:TEXT_MUTED, margin:'4px 0 0' }}>{label}</p>
      {sub && <p style={{ fontSize:11, color:PRIMARY, margin:'4px 0 0', fontWeight:500 }}>{sub}</p>}
    </div>
  </div>
)

const BarChart = ({ data, valueKey='count', labelKey='label', colorFn }: {
  data:any[]; valueKey?:string; labelKey?:string; colorFn?:(i:number)=>string
}) => {
  const max = Math.max(...data.map(d=>d[valueKey]??0), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:140, paddingTop:8 }}>
      {data.map((d,i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:9, color:TEXT_MUTED }}>{d[valueKey]>0?d[valueKey]:''}</span>
          <div style={{ width:'100%', borderRadius:'4px 4px 0 0', background:colorFn?colorFn(i):i===data.length-1?PRIMARY:`${PRIMARY}55`, height:`${Math.max((d[valueKey]??0)/max*100,d[valueKey]>0?4:0)}%`, transition:'height 0.8s ease' }} />
          <span style={{ fontSize:9, color:TEXT_MUTED, textAlign:'center' }}>{d[labelKey]}</span>
        </div>
      ))}
    </div>
  )
}

const ProgressBar = ({ label, value, total, color, badge }: { label:string; value:number; total:number; color:string; badge?:string }) => (
  <div style={{ marginBottom:12 }}>
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
      <span style={{ fontSize:13, color:TEXT_DARK }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:600, color }}>{badge??value} ({total>0?Math.round(value/total*100):0}%)</span>
    </div>
    <div style={{ height:8, borderRadius:100, background:`${color}20`, overflow:'hidden' }}>
      <div style={{ height:'100%', borderRadius:100, background:color, width:`${total>0?Math.min(value/total*100,100):0}%`, transition:'width 1s ease' }} />
    </div>
  </div>
)

const Spinner = () => (
  <div style={{ textAlign:'center', padding:60 }}>
    <div style={{ width:40, height:40, borderRadius:'50%', border:`3px solid ${PRIMARY_SOFT}`, borderTopColor:PRIMARY, animation:'spin 0.8s linear infinite', margin:'0 auto 14px' }} />
  </div>
)

const Card = ({ title, children, action }: { title:string; children:React.ReactNode; action?:React.ReactNode }) => (
  <div style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:18, padding:22, marginBottom:20 }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
      <h3 style={{ fontSize:15, fontWeight:700, color:TEXT_DARK, margin:0 }}>{title}</h3>
      {action}
    </div>
    {children}
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
export default function Reports() {
  const navigate = useNavigate()
  const printRef = useRef<HTMLDivElement>(null)
  const [lang, setLang]       = useState<'ar'|'en'>(getStoredLang())
  const [tab, setTab]         = useState(0)
  const [data, setData]       = useState<any>(null)
  const [ptData, setPtData]   = useState<any>(null)
  const [apData, setApData]   = useState<any>(null)
  const [rgData, setRgData]   = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState<any[]>([])

  // ── Filter state ──
  const [filterDoctor, setFilterDoctor] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('all')
  const [fromDate, setFrom]   = useState('')
  const [toDate, setTo]       = useState('')
  const [rgLoading, setRgLoading] = useState(false)

  // ── Detail tab state ──
  const [detailData, setDetailData]   = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailPage, setDetailPage]   = useState(1)
  const [dtDate, setDtDate]           = useState('')
  const [dtFrom, setDtFrom]           = useState('')
  const [dtTo, setDtTo]               = useState('')
  const [dtDoctor, setDtDoctor]       = useState('')
  const [dtStatus, setDtStatus]       = useState('')
  const [dtMode, setDtMode]           = useState<'appointments'|'patients'>('appointments')

  const t    = T[lang]
  const isAr = lang === 'ar'
// ✅ إعدادات الأعمدة
const columnDefs: ColumnDef[] = [
  { key: 'name', label: t.doctorName, locked: true },
  { key: 'specialty', label: t.specialty },
  { key: 'total', label: t.total },
  { key: 'completed', label: t.completed },
  { key: 'cancelled', label: t.cancelled },
  { key: 'completionRate', label: t.completionRate },
  { key: 'revenue', label: t.revenue },
  { key: 'thisMonth', label: t.thisMonthAppts },
]
const { visibleKeys, toggle } = useColumnVisibility('reports-table', columnDefs)
  useEffect(() => {
    const id = 'cura-rep-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id=id; s.textContent=css; document.head.appendChild(s)
    }
    const onLang = (e:Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', onLang)
    return () => window.removeEventListener('cura-lang-change', onLang)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const [main, docs] = await Promise.all([
          api.get('/reports'),
          api.get('/doctors'),
        ])
        setData(main.data)
        setDoctors(docs.data.filter((d:any)=>d.isActive))

        try { const pt = await api.get('/reports/patients'); setPtData(pt.data) } catch {}
        try { const ap = await api.get('/reports/appointments'); setApData(ap.data) } catch {}

      } catch (err: any) {
        if (err?.response?.status === 401) navigate('/login')
      } finally { setLoading(false) }
    }
    load()
  }, [])

  // ── Period filter → auto-fill dates ──
  useEffect(() => {
    const now  = new Date()
    const fmt2 = (d:Date) => d.toISOString().split('T')[0]
    if (filterPeriod === '30')  { setFrom(fmt2(new Date(now.getTime()-30*86400000))); setTo(fmt2(now)) }
    if (filterPeriod === '90')  { setFrom(fmt2(new Date(now.getTime()-90*86400000))); setTo(fmt2(now)) }
    if (filterPeriod === '180') { setFrom(fmt2(new Date(now.getTime()-180*86400000))); setTo(fmt2(now)) }
    if (filterPeriod === 'year'){ setFrom(`${now.getFullYear()}-01-01`); setTo(fmt2(now)) }
    if (filterPeriod === 'all') { setFrom(''); setTo('') }
  }, [filterPeriod])

  const fetchDetail = async (p = 1) => {
    setDetailLoading(true)
    try {
      const params = new URLSearchParams()
      if (dtDate) params.set('date', dtDate)
      if (dtFrom) params.set('from', dtFrom)
      if (dtTo)   params.set('to', dtTo)
      if (dtDoctor) params.set('doctorId', dtDoctor)
      if (dtStatus) params.set('status', dtStatus)
      params.set('page', String(p))
      params.set('pageSize', '50')
      const endpoint = dtMode === 'patients' ? '/reports/patients-detail' : '/reports/detail'
      const r = await api.get(`${endpoint}?${params}`)
      setDetailData(r.data)
      setDetailPage(p)
    } catch {} finally { setDetailLoading(false) }
  }

  const exportDetail = () => {
    if (!detailData?.items?.length) return
    const isPatients = dtMode === 'patients'
    const headers = isPatients
      ? ['#', isAr?'المريض':'Patient', isAr?'الهاتف':'Phone', isAr?'الجنس':'Gender', isAr?'العمر':'Age', isAr?'الزيارات':'Visits', isAr?'مكتملة':'Completed', isAr?'المدفوع':'Spent', isAr?'أول زيارة':'First Visit', isAr?'آخر زيارة':'Last Visit']
      : ['#', isAr?'المريض':'Patient', isAr?'الطبيب':'Doctor', isAr?'التاريخ':'Date', isAr?'الوقت':'Time', isAr?'الحالة':'Status', isAr?'النوع':'Type', isAr?'السعر':'Price', 'Check-in', 'Check-out', isAr?'المدة':'Duration']
    const rows = [headers, ...detailData.items.map((item: any, i: number) =>
      isPatients
        ? [i+1, item.fullName, item.phone||'', item.gender||'', item.age||'', item.totalVisits, item.completedVisits, `${item.totalSpent} ${t.riyal}`, item.firstVisit||'', item.lastVisit||'']
        : [i+1, item.patientName, item.doctorName, item.date, item.time, item.status, item.type||'', `${item.price||0} ${t.riyal}`, item.checkIn||'', item.checkOut||'', item.durationMin||'']
    )]
    exportToExcel(rows, isAr ? (isPatients?'تفاصيل-المرضى':'تفاصيل-المواعيد') : (isPatients?'patients-detail':'appointments-detail'))
  }

  const applyRange = async () => {
    if (!fromDate || !toDate) return
    setRgLoading(true)
    try { const r = await api.get(`/reports/range?from=${fromDate}&to=${toDate}`); setRgData(r.data) }
    catch {} finally { setRgLoading(false) }
  }

  // ── Filter data locally by doctor ──
  const filtered = (items:any[], key='doctorName') =>
    filterDoctor ? items?.filter((d:any)=>d[key]===filterDoctor||d.doctorId===filterDoctor) : items

  // ── PDF Print ──
  const handlePrint = () => window.print()

  // ── Excel Export helpers ──
  const exportDoctors = () => {
    if (!data?.doctorPerformance) return
    const rows = [
      [t.doctorName, t.specialty, t.total, t.completed, t.cancelled, t.completionRate, t.revenue, t.thisMonthAppts],
      ...data.doctorPerformance.map((d:any) => [d.doctorName, d.specialty||'', d.totalAppts, d.completedAppts, d.cancelledAppts, `${d.completionRate}%`, `${d.revenue} ${t.riyal}`, d.thisMonthAppts])
    ]
    exportToExcel(rows, isAr?'تقرير-الأطباء':'doctors-report')
  }

  const exportPatients = () => {
    if (!data?.topPatients) return
    const rows = [
      ['#', isAr?'المريض':'Patient', isAr?'الزيارات':'Visits', isAr?'إجمالي المدفوع':'Total Spent', isAr?'آخر زيارة':'Last Visit'],
      ...data.topPatients.map((p:any,i:number) => [i+1, p.patientName, p.visits, `${p.totalSpent} ${t.riyal}`, p.lastVisit?.substring(0,10)])
    ]
    exportToExcel(rows, isAr?'تقرير-المرضى':'patients-report')
  }

  const exportOverview = () => {
    if (!data) return
    const rows = [
      [isAr?'البيان':'Metric', isAr?'القيمة':'Value'],
      [t.totalPatients, data.totalPatients],
      [t.totalAppts, data.totalAppointments],
      [t.totalDoctors, data.totalDoctors],
      [t.totalRevenue, `${data.totalRevenue} ${t.riyal}`],
      [t.completionRate, `${data.completionRate}%`],
      [t.cancellationRate, `${data.cancellationRate}%`],
      [t.avgWait, `${data.avgWaitMinutes} ${t.min}`],
      [t.avgVisit, `${data.avgVisitMinutes} ${t.min}`],
      [t.returning, `${data.returningPatients} (${data.returningRate}%)`],
    ]
    exportToExcel(rows, isAr?'تقرير-عام':'overview-report')
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:12, fontFamily:t.font }}>
      <Spinner /><p style={{ color:TEXT_MUTED, fontSize:14 }}>{t.loading}</p>
    </div>
  )

  // ── Filtered doctor performance ──
  const doctorPerf = filterDoctor
    ? data?.doctorPerformance?.filter((d:any) => d.doctorName === doctors.find(x=>x.id===filterDoctor)?.fullName)
    : data?.doctorPerformance

  return (
    <div className="rep-shell" dir={t.dir} style={{ background:'#F8FAFA', minHeight:'100vh', padding:24, fontFamily:t.font }}>
      <div ref={printRef} style={{ maxWidth:1400, margin:'0 auto' }} className="print-content">

        {/* Print Header (visible only when printing) */}
        <div className="print-header" style={{ display:'none' }}>
          <div>
            <h2 style={{ margin:0, color:PRIMARY, fontFamily:"'DM Serif Display',serif" }}>{t.printTitle}</h2>
            <p style={{ margin:'4px 0 0', color:TEXT_MUTED, fontSize:12 }}>{t.printDate}: {new Date().toLocaleDateString(isAr?'ar-JO':'en-GB')}</p>
          </div>
          <div style={{ fontSize:24 }}>🏥</div>
        </div>

        {/* Header */}
        <div style={{ marginBottom:20 }} className="no-print">
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:PRIMARY_SOFT, border:`1px solid ${BORDER}`, borderRadius:100, padding:'4px 16px', fontSize:11, fontWeight:600, color:PRIMARY, marginBottom:12 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:PRIMARY }} />
            {isAr?'لوحة الإحصائيات':'Analytics Dashboard'}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
            <div>
              <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:30, fontWeight:500, color:TEXT_DARK, margin:0 }}>{t.title}</h2>
              <p style={{ fontSize:13, color:TEXT_MUTED, margin:'6px 0 0' }}>{t.subtitle}</p>
            </div>
            {/* Export Buttons */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button className="export-btn" onClick={handlePrint}>🖨️ {t.exportPDF}</button>
              <button className="export-btn" onClick={exportOverview}>📊 {t.exportExcel}</button>
              {tab===1 && <button className="export-btn" onClick={exportDoctors}>👨‍⚕️ {t.exportExcel}</button>}
              {tab===0 && <button className="export-btn" onClick={exportPatients}>👥 {t.exportExcel}</button>}
            </div>
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="filter-bar no-print">
          <span style={{ fontSize:13, fontWeight:700, color:TEXT_DARK }}>🔍 {t.filter}</span>

          <div className="filter-field">
            <label>{t.filterDoctor}</label>
            <select value={filterDoctor} onChange={e=>setFilterDoctor(e.target.value)} style={{ minWidth:160 }}>
              <option value="">{t.allDoctors}</option>
              {doctors.map(d=><option key={d.id} value={d.id}>{d.fullName}</option>)}
            </select>
          </div>

          <div className="filter-field">
            <label>{t.filterPeriod}</label>
            <select value={filterPeriod} onChange={e=>setFilterPeriod(e.target.value)} style={{ minWidth:140 }}>
              <option value="all">{t.periodAll}</option>
              <option value="30">{t.period30}</option>
              <option value="90">{t.period90}</option>
              <option value="180">{t.period180}</option>
              <option value="year">{t.periodYear}</option>
            </select>
          </div>

          {filterPeriod !== 'all' && (
            <>
              <div className="filter-field">
                <label>{t.from}</label>
                <input type="date" value={fromDate} onChange={e=>setFrom(e.target.value)} style={{ fontFamily:'Inter,sans-serif' }} />
              </div>
              <div className="filter-field">
                <label>{t.to}</label>
                <input type="date" value={toDate} onChange={e=>setTo(e.target.value)} style={{ fontFamily:'Inter,sans-serif' }} />
              </div>
              <button onClick={applyRange} disabled={rgLoading||!fromDate||!toDate}
                style={{ padding:'9px 18px', background:PRIMARY, color:'#FFF', border:'none', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', opacity:rgLoading?0.7:1 }}>
                {rgLoading ? '...' : t.apply}
              </button>
            </>
          )}

          {(filterDoctor || filterPeriod !== 'all') && (
            <button onClick={()=>{setFilterDoctor('');setFilterPeriod('all');setRgData(null)}}
              style={{ padding:'9px 14px', background:'transparent', border:`1px solid ${BORDER}`, borderRadius:9, fontSize:12, fontWeight:600, cursor:'pointer', color:TEXT_MUTED }}>
              ✕ {t.resetFilter}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, background:CARD_BG, padding:5, borderRadius:14, border:`1px solid ${BORDER}`, width:'fit-content', marginBottom:24, flexWrap:'wrap' }} className="no-print">
          {t.tabs.map((tb,i) => (
            <button key={i} className={`tab-btn${tab===i?' active':''}`} onClick={()=>setTab(i)}>{tb}</button>
          ))}
        </div>

        {/* Range result banner */}
        {rgData && filterPeriod !== 'all' && (
          <div style={{ background:PRIMARY_SOFT, border:`1px solid ${PRIMARY}40`, borderRadius:12, padding:'10px 16px', marginBottom:16, fontSize:13, color:PRIMARY, fontWeight:500 }}>
            📆 {t.from}: {fromDate} — {t.to}: {toDate} |
            {t.totalAppts}: {rgData.totalAppointments} |
            {t.revenue}: {fmt(rgData.revenue)} {t.riyal}
          </div>
        )}

        {/* ════════ TAB 0 — Overview ════════ */}
        {tab===0 && data && (
          <div>
            <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
              <StatCard icon="👥" label={t.totalPatients} value={fmt(data.totalPatients)} sub={`+${data.newPatientsThisMonth} ${t.thisMonth}`} growth={data.patientsGrowth} />
              <StatCard icon="📅" label={t.totalAppts} value={fmt(data.totalAppointments)} sub={`${data.appointmentsThisMonth} ${t.thisMonth}`} />
              <StatCard icon="👨‍⚕️" label={t.totalDoctors} value={fmt(data.totalDoctors)} />
              <StatCard icon="💰" label={t.totalRevenue} value={`${fmt(data.totalRevenue)} ${t.riyal}`} sub={`${fmt(data.revenueThisMonth)} ${t.riyal} ${t.thisMonth}`} color={SUCCESS} growth={data.revenueGrowth} />
            </div>
            <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
              <StatCard icon="✅" label={t.completionRate} value={`${data.completionRate}%`} color={SUCCESS} />
              <StatCard icon="❌" label={t.cancellationRate} value={`${data.cancellationRate}%`} color={DANGER} />
              <StatCard icon="⏱" label={t.avgWait} value={`${data.avgWaitMinutes} ${t.min}`} />
              <StatCard icon="🔄" label={t.returning} value={`${data.returningPatients}`} sub={`${data.returningRate}% ${t.returningRate}`} color={PRIMARY} />
            </div>

            <div className="charts-row" style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:20 }}>
              <Card title={`📈 ${t.monthlyTrend}`}>
                {data.monthlyTrend?.length>0
                  ? <BarChart valueKey="count" labelKey="monthLabel" data={data.monthlyTrend.map((d:any)=>({...d,monthLabel:t.months[d.month-1]?.substring(0,3)}))} />
                  : <p style={{color:TEXT_MUTED,fontSize:13,textAlign:'center',padding:'30px 0'}}>{t.noData}</p>}
              </Card>
              <Card title={`📊 ${t.apptsByStatus}`}>
                <ProgressBar label={t.completed} value={data.completedCount} total={data.totalAppointments} color={SUCCESS} />
                <ProgressBar label={t.scheduled} value={data.scheduledCount} total={data.totalAppointments} color={PRIMARY} />
                <ProgressBar label={t.cancelled} value={data.cancelledCount} total={data.totalAppointments} color={DANGER} />
              </Card>
            </div>

            <div className="charts-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
              <Card title={`📅 ${t.peakDays}`}>
                {data.byDayOfWeek?.length>0
                  ? <BarChart valueKey="count" labelKey="dayAr" data={data.byDayOfWeek}
                      colorFn={i=>{const max=Math.max(...data.byDayOfWeek.map((d:any)=>d.count));return data.byDayOfWeek[i]?.count===max?PRIMARY:`${PRIMARY}55`}} />
                  : <p style={{color:TEXT_MUTED,fontSize:13,textAlign:'center',padding:'30px 0'}}>{t.noData}</p>}
              </Card>
              <Card title={`⏰ ${t.peakHours}`}>
                {data.byHour?.length>0
                  ? <BarChart valueKey="count" labelKey="hour" data={data.byHour.map((d:any)=>({...d,hour:`${String(d.hour).padStart(2,'0')}h`}))} />
                  : <p style={{color:TEXT_MUTED,fontSize:13,textAlign:'center',padding:'30px 0'}}>{t.noData}</p>}
              </Card>
            </div>

            <div className="charts-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
              <Card title={`🩺 ${t.visitTypes}`}>
                {data.visitTypes?.map((vt:any,i:number)=><ProgressBar key={i} label={vt.type} value={vt.count} total={data.totalAppointments} color={[PRIMARY,SUCCESS,WARNING,DANGER,AMBER][i%5]} />)}
              </Card>
              <Card title={`⚧ ${t.genderDist}`}>
                {data.genderDist?.map((g:any,i:number)=><ProgressBar key={i} label={g.gender} value={g.count} total={data.totalPatients} color={[PRIMARY,WARNING,SUCCESS][i%3]} />)}
              </Card>
            </div>

            <Card title={`🏆 ${t.topPatients}`} action={<button className="export-btn no-print" onClick={exportPatients}>📥 CSV</button>}>
              <div style={{ overflowX:'auto' }}>
                <table className="tbl">
                  <thead><tr>
                    <th>#</th><th>{isAr?'المريض':'Patient'}</th>
                    <th>{isAr?'الزيارات':'Visits'}</th>
                    <th>{isAr?'إجمالي المدفوع':'Total Spent'}</th>
                    <th>{isAr?'آخر زيارة':'Last Visit'}</th>
                  </tr></thead>
                  <tbody>
                    {data.topPatients?.map((p:any,i:number)=>(
                      <tr key={i}>
                        <td><span style={{width:24,height:24,borderRadius:'50%',background:i<3?[WARNING,'#C0C0C0','#CD7F32'][i]:PRIMARY_SOFT,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:i<3?'#FFF':TEXT_MUTED}}>{i+1}</span></td>
                        <td style={{fontWeight:500}}>{p.patientName}</td>
                        <td><span className="badge" style={{background:PRIMARY_SOFT,color:PRIMARY}}>{p.visits}</span></td>
                        <td style={{color:SUCCESS,fontWeight:600}}>{fmt(p.totalSpent)} {t.riyal}</td>
                        <td style={{color:TEXT_MUTED}}>{p.lastVisit?.substring(0,10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ════════ TAB 1 — Doctors ════════ */}
        {tab===1 && data && (
          <Card title={`👨‍⚕️ ${t.topDoctors}`} action={<button className="export-btn no-print" onClick={exportDoctors}>📥 CSV</button>}>
            <div style={{ overflowX:'auto' }}>
              <table className="tbl">
                <thead><tr>
                  <th>{t.doctorName}</th><th>{t.specialty}</th>
                  <th>{t.total}</th><th>{t.completed}</th><th>{t.cancelled}</th>
                  <th>{t.completionRate}</th><th>{t.revenue}</th><th>{t.thisMonthAppts}</th>
                </tr></thead>
                <tbody>
                  {(doctorPerf??[]).map((d:any,i:number)=>(
                    <tr key={i}>
                      <td style={{fontWeight:600}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:32,height:32,borderRadius:10,background:PRIMARY_SOFT,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>👨‍⚕️</div>
                          {d.doctorName}
                        </div>
                      </td>
                      <td style={{color:TEXT_MUTED}}>{d.specialty||'—'}</td>
                      <td><span className="badge" style={{background:PRIMARY_SOFT,color:PRIMARY}}>{d.totalAppts}</span></td>
                      <td><span className="badge" style={{background:SUCCESS_BG,color:SUCCESS}}>{d.completedAppts}</span></td>
                      <td><span className="badge" style={{background:DANGER_BG,color:DANGER}}>{d.cancelledAppts}</span></td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{flex:1,height:6,borderRadius:100,background:`${SUCCESS}20`,overflow:'hidden'}}>
                            <div style={{height:'100%',borderRadius:100,background:SUCCESS,width:`${d.completionRate}%`}} />
                          </div>
                          <span style={{fontSize:12,fontWeight:600,color:SUCCESS}}>{d.completionRate}%</span>
                        </div>
                      </td>
                      <td style={{color:SUCCESS,fontWeight:600}}>{fmt(d.revenue)} {t.riyal}</td>
                      <td style={{color:PRIMARY,fontWeight:600}}>{d.thisMonthAppts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ════════ TAB 2 — Patients ════════ */}
        {tab===2 && ptData && (
          <div>
            <div className="stats-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
              <StatCard icon="👥" label={t.totalPatients} value={fmt(ptData.total)} />
              <StatCard icon="✨" label={t.newPatients} value={fmt(ptData.newThisMonth)} sub={t.thisMonth} />
              <StatCard icon="🔄" label={t.returning} value={fmt(ptData.returning)} />
              <StatCard icon="💚" label={t.activePatients} value={fmt(ptData.active)} />
            </div>
            <div className="charts-row" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
              <Card title={`📈 ${t.patientGrowth}`}>
                {ptData.monthly?.length>0
                  ? <BarChart valueKey="newPatients" labelKey="monthLabel" data={ptData.monthly.map((d:any)=>({...d,monthLabel:t.months[d.month-1]?.substring(0,3)}))} />
                  : <p style={{color:TEXT_MUTED,fontSize:13,textAlign:'center',padding:'30px 0'}}>{t.noData}</p>}
              </Card>
              <Card title={`⚧ ${t.genderDist}`}>
                {ptData.genderDist?.map((g:any,i:number)=><ProgressBar key={i} label={g.gender} value={g.count} total={ptData.total} color={[PRIMARY,WARNING,SUCCESS][i%3]} />)}
              </Card>
            </div>
            <Card title={`👶 ${t.ageGroups}`}>
              {ptData.ageDist?.map((a:any,i:number)=><ProgressBar key={i} label={a.ageGroup} value={a.count} total={ptData.total} color={[PRIMARY,SUCCESS,WARNING,DANGER,AMBER][i%5]} />)}
            </Card>
          </div>
        )}

        {/* ════════ TAB 3 — Appointments ════════ */}
        {tab===3 && apData && (
          <div>
            <div className="stats-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
              <StatCard icon="📅" label={t.totalAppts} value={fmt(apData.total)} />
              <StatCard icon="✅" label={t.completed} value={fmt(apData.completed)} color={SUCCESS} />
              <StatCard icon="❌" label={t.cancelled} value={fmt(apData.cancelled)} color={DANGER} />
              <StatCard icon="⏱" label={t.avgVisit} value={`${apData.avgVisitMinutes} ${t.min}`} />
            </div>
            <div className="charts-row" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
              <Card title={`📊 ${t.apptsByStatus}`}>
                {apData.byStatus?.map((s:any,i:number)=><ProgressBar key={i} label={s.status} value={s.count} total={apData.total} color={[SUCCESS,PRIMARY,DANGER,WARNING][i%4]} />)}
              </Card>
              <Card title={`🩺 ${t.visitTypes}`}>
                {apData.byType?.map((vt:any,i:number)=><ProgressBar key={i} label={vt.type} value={vt.count} total={apData.total} color={[PRIMARY,SUCCESS,WARNING,DANGER,AMBER][i%5]} />)}
              </Card>
            </div>
            <div className="charts-row" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
              <Card title={`📅 ${t.peakDays}`}>
                {apData.byDayOfWeek?.map((d:any,i:number)=><ProgressBar key={i} label={d.day} value={d.count} total={apData.total} color={PRIMARY} />)}
              </Card>
              <Card title={`⏰ ${t.peakHours}`}>
                {apData.byHour?.map((h:any,i:number)=><ProgressBar key={i} label={h.hour} value={h.count} total={apData.total} color={PRIMARY} />)}
              </Card>
            </div>
          </div>
        )}

        {/* ════════ TAB 4 — Detail ════════ */}
        {tab===4 && (
          <div>
            {/* Mode Toggle */}
            <div style={{display:'flex',gap:8,marginBottom:16}}>
              <button onClick={()=>{setDtMode('appointments');setDetailData(null)}}
style={{padding:'8px 18px',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',background:dtMode==='appointments'?PRIMARY:CARD_BG,color:dtMode==='appointments'?'#FFF':TEXT_MUTED,border:dtMode==='appointments'?`1px solid ${PRIMARY}`:`1px solid ${BORDER}`}}>                📅 {isAr?'مواعيد':'Appointments'}
              </button>
              <button onClick={()=>{setDtMode('patients');setDetailData(null)}}
style={{padding:'8px 18px',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',background:dtMode==='patients'?PRIMARY:CARD_BG,color:dtMode==='patients'?'#FFF':TEXT_MUTED,border:dtMode==='patients'?`1px solid ${PRIMARY}`:`1px solid ${BORDER}`}}>                👥 {isAr?'مرضى':'Patients'}
              </button>
            </div>

            <Card title={`📋 ${isAr?(dtMode==='patients'?'تفاصيل المرضى':'تفاصيل المواعيد'):(dtMode==='patients'?'Patients Detail':'Appointments Detail')}`}
              action={<button className="export-btn no-print" onClick={exportDetail}>📥 CSV</button>}>

              {/* Filters */}
              <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${BORDER}`}}>
                {dtMode==='appointments' && (
                  <div className="filter-field">
                    <label>{isAr?'يوم محدد':'Specific Date'}</label>
                    <input type="date" value={dtDate} onChange={e=>{setDtDate(e.target.value);if(e.target.value){setDtFrom('');setDtTo('')}}} style={{fontFamily:'Inter,sans-serif'}} />
                  </div>
                )}
                <div className="filter-field">
                  <label>{t.from}</label>
                  <input type="date" value={dtFrom} onChange={e=>{setDtFrom(e.target.value);setDtDate('')}} style={{fontFamily:'Inter,sans-serif'}} />
                </div>
                <div className="filter-field">
                  <label>{t.to}</label>
                  <input type="date" value={dtTo} onChange={e=>{setDtTo(e.target.value);setDtDate('')}} style={{fontFamily:'Inter,sans-serif'}} />
                </div>
                <div className="filter-field">
                  <label>{t.filterDoctor}</label>
                  <select value={dtDoctor} onChange={e=>setDtDoctor(e.target.value)} style={{minWidth:140}}>
                    <option value="">{t.allDoctors}</option>
                    {doctors.map(d=><option key={d.id} value={d.id}>{d.fullName}</option>)}
                  </select>
                </div>
                {dtMode==='appointments' && (
                  <div className="filter-field">
                    <label>{isAr?'الحالة':'Status'}</label>
                    <select value={dtStatus} onChange={e=>setDtStatus(e.target.value)} style={{minWidth:120}}>
                      <option value="">{isAr?'الكل':'All'}</option>
                      <option value="scheduled">{isAr?'مجدول':'Scheduled'}</option>
                      <option value="confirmed">{isAr?'مؤكد':'Confirmed'}</option>
                      <option value="completed">{isAr?'مكتمل':'Completed'}</option>
                      <option value="cancelled">{isAr?'ملغي':'Cancelled'}</option>
                    </select>
                  </div>
                )}
                <button onClick={()=>fetchDetail(1)} disabled={detailLoading}
                  style={{padding:'9px 18px',background:PRIMARY,color:'#FFF',border:'none',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer',opacity:detailLoading?0.7:1,alignSelf:'flex-end'}}>
                  {detailLoading?'...':`🔍 ${t.apply}`}
                </button>
                {(dtDate||dtFrom||dtTo||dtDoctor||dtStatus) && (
                  <button onClick={()=>{setDtDate('');setDtFrom('');setDtTo('');setDtDoctor('');setDtStatus('');setDetailData(null)}}
                    style={{padding:'9px 14px',background:'transparent',border:`1px solid ${BORDER}`,borderRadius:9,fontSize:12,fontWeight:600,cursor:'pointer',color:TEXT_MUTED,alignSelf:'flex-end'}}>
                    ✕ {t.resetFilter}
                  </button>
                )}
              </div>

              {/* Summary */}
              {detailData?.summary && dtMode==='appointments' && (
                <div className="stats-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
                  <StatCard icon="📅" label={isAr?'الإجمالي':'Total'} value={fmt(detailData.summary.total)} />
                  <StatCard icon="✅" label={t.completed} value={fmt(detailData.summary.completed)} color={SUCCESS} />
                  <StatCard icon="❌" label={t.cancelled} value={fmt(detailData.summary.cancelled)} color={DANGER} />
                  <StatCard icon="💰" label={t.revenue} value={`${fmt(detailData.summary.totalRevenue)} ${t.riyal}`} color={SUCCESS} />
                </div>
              )}
              {detailData?.total !== undefined && dtMode==='patients' && (
                <div style={{marginBottom:12,fontSize:13,color:TEXT_MUTED}}>
                  {isAr?'إجمالي النتائج':'Total results'}: <strong style={{color:TEXT_DARK}}>{detailData.total}</strong>
                </div>
              )}

              {/* Table */}
              {detailLoading ? (
                <div style={{textAlign:'center',padding:40}}><div style={{width:32,height:32,borderRadius:'50%',border:`3px solid ${PRIMARY_SOFT}`,borderTopColor:PRIMARY,animation:'spin 0.8s linear infinite',margin:'0 auto'}} /></div>
              ) : detailData?.items?.length > 0 ? (
                <div style={{overflowX:'auto'}}>
                  {dtMode==='appointments' ? (
                    <table className="tbl">
                      <thead><tr>
                        <th>#</th>
                        <th>{isAr?'المريض':'Patient'}</th>
                        <th>{isAr?'الطبيب':'Doctor'}</th>
                        <th>{isAr?'التاريخ':'Date'}</th>
                        <th>{isAr?'الوقت':'Time'}</th>
                        <th>{isAr?'الحالة':'Status'}</th>
                        <th>{isAr?'النوع':'Type'}</th>
                        <th>{isAr?'السعر':'Price'}</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>{isAr?'المدة':'Duration'}</th>
                      </tr></thead>
                      <tbody>
                        {detailData.items.map((item:any, i:number) => (
                          <tr key={i}>
                            <td style={{color:TEXT_MUTED,fontSize:11}}>{(detailPage-1)*50+i+1}</td>
                            <td style={{fontWeight:500}}>
                              <div>#{item.patientNumber} {item.patientName}</div>
                            </td>
                            <td style={{color:TEXT_MUTED}}>{item.doctorName}</td>
                            <td style={{fontFamily:'Inter,sans-serif'}}>{item.date}</td>
                            <td style={{fontFamily:'Inter,sans-serif'}}>{item.time}</td>
                            <td>
                              <span className="badge" style={{
                                background:item.status==='completed'?SUCCESS_BG:item.status==='cancelled'?DANGER_BG:PRIMARY_SOFT,
                                color:item.status==='completed'?SUCCESS:item.status==='cancelled'?DANGER:PRIMARY
                              }}>{item.status}</span>
                            </td>
                            <td style={{color:TEXT_MUTED}}>{item.type||'—'}</td>
                            <td style={{color:SUCCESS,fontWeight:600}}>{item.price!=null?`${item.price} ${t.riyal}`:'—'}</td>
                            <td style={{fontFamily:'Inter,sans-serif',color:TEXT_MUTED}}>{item.checkIn||'—'}</td>
                            <td style={{fontFamily:'Inter,sans-serif',color:TEXT_MUTED}}>{item.checkOut||'—'}</td>
                            <td style={{color:item.durationMin?PRIMARY:TEXT_MUTED}}>{item.durationMin?`${item.durationMin} ${t.min}`:'—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="tbl">
                      <thead><tr>
                        <th>#</th>
                        <th>{isAr?'المريض':'Patient'}</th>
                        <th>{isAr?'الهاتف':'Phone'}</th>
                        <th>{isAr?'الجنس':'Gender'}</th>
                        <th>{isAr?'العمر':'Age'}</th>
                        <th>{isAr?'الزيارات':'Visits'}</th>
                        <th>{isAr?'مكتملة':'Completed'}</th>
                        <th>{isAr?'إجمالي المدفوع':'Total Spent'}</th>
                        <th>{isAr?'أول زيارة':'First Visit'}</th>
                        <th>{isAr?'آخر زيارة':'Last Visit'}</th>
                      </tr></thead>
                      <tbody>
                        {detailData.items.map((item:any, i:number) => (
                          <tr key={i}>
                            <td style={{color:TEXT_MUTED,fontSize:11}}>{(detailPage-1)*50+i+1}</td>
                            <td style={{fontWeight:500}}>{item.fullName}</td>
                            <td style={{color:TEXT_MUTED,fontFamily:'Inter,sans-serif'}}>{item.phone||'—'}</td>
                            <td style={{color:TEXT_MUTED}}>{item.gender||'—'}</td>
                            <td style={{color:TEXT_MUTED}}>{item.age!=null?`${item.age} ${isAr?'سنة':'y'}`:'—'}</td>
                            <td><span className="badge" style={{background:PRIMARY_SOFT,color:PRIMARY}}>{item.totalVisits}</span></td>
                            <td><span className="badge" style={{background:SUCCESS_BG,color:SUCCESS}}>{item.completedVisits}</span></td>
                            <td style={{color:SUCCESS,fontWeight:600}}>{fmt(item.totalSpent)} {t.riyal}</td>
                            <td style={{color:TEXT_MUTED,fontFamily:'Inter,sans-serif'}}>{item.firstVisit||'—'}</td>
                            <td style={{color:TEXT_MUTED,fontFamily:'Inter,sans-serif'}}>{item.lastVisit||'—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Pagination */}
                  {detailData.pages > 1 && (
                    <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:16,flexWrap:'wrap'}}>
                      {Array.from({length:detailData.pages},(_,i)=>i+1).map(p=>(
                        <button key={p} onClick={()=>fetchDetail(p)}
                          style={{width:32,height:32,borderRadius:8,border:`1px solid ${p===detailPage?PRIMARY:BORDER}`,background:p===detailPage?PRIMARY:CARD_BG,color:p===detailPage?'#FFF':TEXT_DARK,fontSize:12,fontWeight:600,cursor:'pointer'}}>
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : detailData ? (
                <p style={{color:TEXT_MUTED,fontSize:13,textAlign:'center',padding:'30px 0'}}>{t.noData}</p>
              ) : (
                <p style={{color:TEXT_MUTED,fontSize:13,textAlign:'center',padding:'30px 0'}}>
                  {isAr?'اختر الفلاتر واضغط بحث':'Select filters and click search'}
                </p>
              )}
            </Card>
          </div>
        )}

        {/* ════════ TAB 5 — Custom Range ════════ */}
        {tab===5 && (
          <Card title={`📆 ${t.tabs[5]}`}>
            <div style={{display:'flex',gap:14,alignItems:'flex-end',flexWrap:'wrap',marginBottom:16}}>
              <div className="filter-field">
                <label>{t.from}</label>
                <input type="date" value={fromDate} onChange={e=>setFrom(e.target.value)} style={{fontFamily:'Inter,sans-serif'}} />
              </div>
              <div className="filter-field">
                <label>{t.to}</label>
                <input type="date" value={toDate} onChange={e=>setTo(e.target.value)} style={{fontFamily:'Inter,sans-serif'}} />
              </div>
              <button onClick={applyRange} disabled={rgLoading||!fromDate||!toDate}
                style={{padding:'9px 18px',background:PRIMARY,color:'#FFF',border:'none',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer',opacity:rgLoading?0.7:1}}>
                {rgLoading?'...':t.apply}
              </button>
            </div>
            {rgData && (
              <div>
                <div className="stats-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:20}}>
                  <StatCard icon="📅" label={t.totalAppts} value={fmt(rgData.totalAppointments)} />
                  <StatCard icon="✅" label={t.completed} value={fmt(rgData.completed)} color={SUCCESS} />
                  <StatCard icon="❌" label={t.cancelled} value={fmt(rgData.cancelled)} color={DANGER} />
                  <StatCard icon="💰" label={t.revenue} value={`${fmt(rgData.revenue)} ${t.riyal}`} color={SUCCESS} />
                </div>
                <Card title={`📈 ${isAr?'المواعيد اليومية':'Daily Appointments'}`}>
                  {rgData.byDay?.length>0
                    ? <BarChart valueKey="count" labelKey="date" data={rgData.byDay.map((d:any)=>({...d,date:d.date?.substring(5)}))} />
                    : <p style={{color:TEXT_MUTED,fontSize:13,textAlign:'center',padding:'30px 0'}}>{t.noData}</p>}
                </Card>
                <Card title={`👨‍⚕️ ${t.topDoctors}`}>
                  {rgData.doctorPerformance?.map((d:any,i:number)=>(
                    <ProgressBar key={i} label={d.doctorName} value={d.revenue} total={rgData.revenue||1}
                      badge={`${fmt(d.revenue)} ${t.riyal} (${d.totalAppts} ${isAr?'موعد':'appts'})`}
                      color={[PRIMARY,SUCCESS,WARNING,DANGER][i%4]} />
                  ))}
                </Card>
              </div>
            )}
          </Card>
        )}

      </div>
    </div>
  )
}