import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const PRIMARY      = '#5B8C8F'
const PRIMARY_DARK = '#4A7679'
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
const AMBER        = '#C4A77D'

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&family=Noto+Kufi+Arabic:wght@400;500;600&display=swap');
@keyframes fade-up { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
@keyframes spin { to{transform:rotate(360deg);} }
@keyframes bar-grow { from{width:0;}to{width:var(--w);} }
@keyframes count-up { from{opacity:0;}to{opacity:1;} }
.rep-shell { animation:fade-up 0.4s cubic-bezier(0.2,0.9,0.4,1.1) both; }
.rep-shell * { box-sizing:border-box; }
.stat-card { transition:all 0.2s ease; cursor:default; }
.stat-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(91,140,143,0.12) !important; }
.tab-btn { padding:8px 18px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; border:none; transition:all 0.2s; }
.tab-btn.active { background:${PRIMARY}; color:#FFF; }
.tab-btn:not(.active) { background:transparent; color:${TEXT_MUTED}; }
.tab-btn:not(.active):hover { background:${PRIMARY_SOFT}; color:${PRIMARY}; }
.bar-animate { animation:bar-grow 0.8s ease forwards; }
.tbl { width:100%; border-collapse:collapse; font-size:13px; }
.tbl th { text-align:right; padding:10px 14px; font-weight:600; font-size:11px; color:${TEXT_MUTED}; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid ${BORDER}; background:#F8FAFA; }
.tbl td { padding:11px 14px; border-bottom:1px solid ${BORDER}; color:${TEXT_DARK}; }
.tbl tr:last-child td { border-bottom:none; }
.tbl tr:hover td { background:#F8FAFA; }
.badge { padding:3px 10px; border-radius:100px; font-size:11px; font-weight:600; }
@media(max-width:900px){
  .stats-grid { grid-template-columns:repeat(2,1fr) !important; }
  .charts-row { grid-template-columns:1fr !important; }
}
@media(max-width:480px){
  .stats-grid { grid-template-columns:1fr !important; }
}
`

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const T = {
  ar: {
    font:"'Noto Kufi Arabic',sans-serif", dir:'rtl' as const,
    title:'التقارير والإحصائيات', subtitle:'نظرة شاملة على أداء العيادة',
    tabs:['📊 الرئيسية','👨‍⚕️ الأطباء','👥 المرضى','📅 المواعيد','📆 نطاق مخصص'],
    riyal:'د.أ', loading:'جاري تحميل التقارير...',
    noData:'لا توجد بيانات', thisMonth:'هذا الشهر', lastMonth:'الشهر الماضي',
    growth:'نمو', vs:'مقارنةً بالشهر الماضي',
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
    absences:'الإجازات', absencesByType:'الإجازات حسب النوع',
    today:'اليوم', thisWeek:'هذا الأسبوع',
    months: MONTHS_AR,
  },
  en: {
    font:"'Inter',sans-serif", dir:'ltr' as const,
    title:'Reports & Analytics', subtitle:'Comprehensive overview of clinic performance',
    tabs:['📊 Overview','👨‍⚕️ Doctors','👥 Patients','📅 Appointments','📆 Custom Range'],
    riyal:'JD', loading:'Loading reports...',
    noData:'No data available', thisMonth:'This Month', lastMonth:'Last Month',
    growth:'Growth', vs:'vs last month',
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
    absences:'Absences', absencesByType:'Absences by Type',
    today:'Today', thisWeek:'This Week',
    months: MONTHS_EN,
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number, decimals = 0) => n?.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) ?? '0'
const growthColor = (n: number) => n > 0 ? SUCCESS : n < 0 ? DANGER : TEXT_MUTED
const growthBg    = (n: number) => n > 0 ? SUCCESS_BG : n < 0 ? DANGER_BG : PRIMARY_SOFT
const growthIcon  = (n: number) => n > 0 ? '↑' : n < 0 ? '↓' : '—'

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color, growth, isAr }: {
  icon: string; label: string; value: string; sub?: string
  color?: string; growth?: number; isAr?: boolean
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
      <p style={{ fontSize:26, fontWeight:700, color:color||TEXT_DARK, margin:0, letterSpacing:'-0.5px' }}>{value}</p>
      <p style={{ fontSize:12, color:TEXT_MUTED, margin:'4px 0 0' }}>{label}</p>
      {sub && <p style={{ fontSize:11, color:PRIMARY, margin:'4px 0 0', fontWeight:500 }}>{sub}</p>}
    </div>
  </div>
)

// ─── Bar Chart ───────────────────────────────────────────────────────────────
const BarChart = ({ data, lang, valueKey='count', labelKey='label', colorFn }: {
  data: any[]; lang:'ar'|'en'; valueKey?: string; labelKey?: string; colorFn?: (i:number)=>string
}) => {
  const max = Math.max(...data.map(d => d[valueKey] ?? 0), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:140, paddingTop:8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:9, color:TEXT_MUTED, fontWeight:500 }}>{d[valueKey] > 0 ? d[valueKey] : ''}</span>
          <div style={{ width:'100%', borderRadius:'4px 4px 0 0', background:colorFn ? colorFn(i) : i===data.length-1 ? PRIMARY : `${PRIMARY}55`, height:`${Math.max((d[valueKey]??0)/max*100, d[valueKey]>0?4:0)}%`, transition:'height 0.8s ease' }} />
          <span style={{ fontSize:9, color:TEXT_MUTED, textAlign:'center', lineHeight:1.2 }}>{d[labelKey]}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ label, value, total, color, badge }: { label:string; value:number; total:number; color:string; badge?:string }) => (
  <div style={{ marginBottom:12 }}>
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
      <span style={{ fontSize:13, color:TEXT_DARK }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:600, color }}>{badge ?? value} ({total>0?Math.round(value/total*100):0}%)</span>
    </div>
    <div style={{ height:8, borderRadius:100, background:`${color}20`, overflow:'hidden' }}>
      <div style={{ height:'100%', borderRadius:100, background:color, width:`${total>0?Math.min(value/total*100,100):0}%`, transition:'width 1s ease' }} />
    </div>
  </div>
)

// ─── Spinner ─────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ textAlign:'center', padding:60 }}>
    <div style={{ width:40, height:40, borderRadius:'50%', border:`3px solid ${PRIMARY_SOFT}`, borderTopColor:PRIMARY, animation:'spin 0.8s linear infinite', margin:'0 auto 14px' }} />
  </div>
)

// ─── Section Card ─────────────────────────────────────────────────────────────
const Card = ({ title, children }: { title:string; children:React.ReactNode }) => (
  <div style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:18, padding:22, marginBottom:20 }}>
    <h3 style={{ fontSize:15, fontWeight:700, color:TEXT_DARK, margin:'0 0 18px' }}>{title}</h3>
    {children}
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
export default function Reports() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<'ar'|'en'>(getStoredLang())
  const [tab, setTab]   = useState(0)
  const [data, setData] = useState<any>(null)
  const [drData, setDrData]  = useState<any>(null)  // doctor tab
  const [ptData, setPtData]  = useState<any>(null)  // patients tab
  const [apData, setApData]  = useState<any>(null)  // appointments tab
  const [rgData, setRgData]  = useState<any>(null)  // range tab
  const [loading, setLoading] = useState(true)
  const [fromDate, setFrom]   = useState('')
  const [toDate, setTo]       = useState('')
  const [rgLoading, setRgLoading] = useState(false)

  const t    = T[lang]
  const isAr = lang === 'ar'

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
        const [main, dr, pt, ap] = await Promise.all([
          api.get('/reports'),
          api.get('/reports/appointments'),
          api.get('/reports/patients'),
          api.get('/reports/appointments'),
        ])
        setData(main.data); setDrData(dr.data); setPtData(pt.data); setApData(ap.data)
      } catch { navigate('/login') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const applyRange = async () => {
    if (!fromDate || !toDate) return
    setRgLoading(true)
    try { const r = await api.get(`/reports/range?from=${fromDate}&to=${toDate}`); setRgData(r.data) }
    catch {} finally { setRgLoading(false) }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:12, fontFamily:t.font }}>
      <Spinner />
      <p style={{ color:TEXT_MUTED, fontSize:14 }}>{t.loading}</p>
    </div>
  )

  return (
    <div className="rep-shell" dir={t.dir} style={{ background:'#F8FAFA', minHeight:'100vh', padding:24, fontFamily:t.font }}>
      <div style={{ maxWidth:1400, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:PRIMARY_SOFT, border:`1px solid ${BORDER}`, borderRadius:100, padding:'4px 16px', fontSize:11, fontWeight:600, color:PRIMARY, marginBottom:12 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:PRIMARY }} />
            {isAr ? 'لوحة الإحصائيات' : 'Analytics Dashboard'}
          </div>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:30, fontWeight:500, color:TEXT_DARK, margin:0 }}>{t.title}</h2>
          <p style={{ fontSize:13, color:TEXT_MUTED, margin:'6px 0 0' }}>{t.subtitle}</p>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, background:CARD_BG, padding:5, borderRadius:14, border:`1px solid ${BORDER}`, width:'fit-content', marginBottom:24, flexWrap:'wrap' }}>
          {t.tabs.map((tb, i) => (
            <button key={i} className={`tab-btn${tab===i?' active':''}`} onClick={()=>setTab(i)}>{tb}</button>
          ))}
        </div>

        {/* ════════ TAB 0 — Overview ════════ */}
        {tab===0 && data && (
          <div>
            {/* Stats Grid */}
            <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
              <StatCard icon="👥" label={t.totalPatients} value={fmt(data.totalPatients)}
                sub={`+${data.newPatientsThisMonth} ${t.thisMonth}`} growth={data.patientsGrowth} isAr={isAr} />
              <StatCard icon="📅" label={t.totalAppts} value={fmt(data.totalAppointments)}
                sub={`${data.appointmentsThisMonth} ${t.thisMonth}`} isAr={isAr} />
              <StatCard icon="👨‍⚕️" label={t.totalDoctors} value={fmt(data.totalDoctors)} isAr={isAr} />
              <StatCard icon="💰" label={t.totalRevenue} value={`${fmt(data.totalRevenue)} ${t.riyal}`}
                sub={`${fmt(data.revenueThisMonth)} ${t.riyal} ${t.thisMonth}`}
                color={SUCCESS} growth={data.revenueGrowth} isAr={isAr} />
            </div>

            {/* Secondary stats */}
            <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
              <StatCard icon="✅" label={t.completionRate} value={`${data.completionRate}%`} color={SUCCESS} isAr={isAr} />
              <StatCard icon="❌" label={t.cancellationRate} value={`${data.cancellationRate}%`} color={DANGER} isAr={isAr} />
              <StatCard icon="⏱" label={t.avgWait} value={`${data.avgWaitMinutes} ${t.min}`} isAr={isAr} />
              <StatCard icon="🕐" label={t.avgVisit} value={`${data.avgVisitMinutes} ${t.min}`} isAr={isAr} />
            </div>

            {/* Today / Week */}
            <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
              <StatCard icon="🌅" label={t.today} value={fmt(data.appointmentsToday)}
                sub={`${fmt(data.revenueToday)} ${t.riyal}`} isAr={isAr} />
              <StatCard icon="📆" label={t.thisWeek} value={fmt(data.appointmentsThisWeek)}
                sub={`${fmt(data.revenueThisWeek)} ${t.riyal}`} isAr={isAr} />
              <StatCard icon="🔄" label={t.returning} value={fmt(data.returningPatients)}
                sub={`${data.returningRate}% ${t.returningRate}`} color={PRIMARY} isAr={isAr} />
              <StatCard icon="🚫" label={t.absences} value={fmt(data.absencesCount)} isAr={isAr} />
            </div>

            {/* Charts row */}
            <div className="charts-row" style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:20 }}>
              <Card title={`📈 ${t.monthlyTrend}`}>
                {data.monthlyTrend?.length > 0 ? (
                  <BarChart lang={lang} valueKey="count" labelKey="monthLabel"
                    data={data.monthlyTrend.map((d:any) => ({
                      ...d,
                      monthLabel: t.months[d.month-1]?.substring(0,3)
                    }))} />
                ) : <p style={{ color:TEXT_MUTED, fontSize:13, textAlign:'center', padding:'30px 0' }}>{t.noData}</p>}
              </Card>
              <Card title={`📊 ${t.apptsByStatus}`}>
                <ProgressBar label={t.completed} value={data.completedCount} total={data.totalAppointments} color={SUCCESS} />
                <ProgressBar label={t.scheduled} value={data.scheduledCount} total={data.totalAppointments} color={PRIMARY} />
                <ProgressBar label={t.cancelled} value={data.cancelledCount} total={data.totalAppointments} color={DANGER} />
              </Card>
            </div>

            {/* Peak days & hours */}
            <div className="charts-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
              <Card title={`📅 ${t.peakDays}`}>
                {data.byDayOfWeek?.length > 0 ? (
                  <BarChart lang={lang} valueKey="count" labelKey="dayAr"
                    data={data.byDayOfWeek}
                    colorFn={(i) => {
                      const max = Math.max(...data.byDayOfWeek.map((d:any)=>d.count))
                      return data.byDayOfWeek[i]?.count === max ? PRIMARY : `${PRIMARY}55`
                    }} />
                ) : <p style={{ color:TEXT_MUTED, fontSize:13, textAlign:'center', padding:'30px 0' }}>{t.noData}</p>}
              </Card>
              <Card title={`⏰ ${t.peakHours}`}>
                {data.byHour?.length > 0 ? (
                  <BarChart lang={lang} valueKey="count" labelKey="hour"
                    data={data.byHour.map((d:any)=>({ ...d, hour: `${String(d.hour).padStart(2,'0')}h` }))} />
                ) : <p style={{ color:TEXT_MUTED, fontSize:13, textAlign:'center', padding:'30px 0' }}>{t.noData}</p>}
              </Card>
            </div>

            {/* Visit types & Gender */}
            <div className="charts-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
              <Card title={`🩺 ${t.visitTypes}`}>
                {data.visitTypes?.map((vt:any, i:number) => (
                  <ProgressBar key={i} label={vt.type} value={vt.count} total={data.totalAppointments} color={[PRIMARY, SUCCESS, WARNING, DANGER, AMBER][i%5]} />
                ))}
              </Card>
              <Card title={`⚧ ${t.genderDist}`}>
                {data.genderDist?.map((g:any, i:number) => (
                  <ProgressBar key={i} label={g.gender} value={g.count} total={data.totalPatients} color={[PRIMARY, WARNING, SUCCESS][i%3]} />
                ))}
              </Card>
            </div>

            {/* Top patients */}
            <Card title={`🏆 ${t.topPatients}`}>
              <div style={{ overflowX:'auto' }}>
                <table className="tbl">
                  <thead><tr>
                    <th>#</th>
                    <th>{isAr?'المريض':'Patient'}</th>
                    <th>{isAr?'الزيارات':'Visits'}</th>
                    <th>{isAr?'إجمالي المدفوع':'Total Spent'}</th>
                    <th>{isAr?'آخر زيارة':'Last Visit'}</th>
                  </tr></thead>
                  <tbody>
                    {data.topPatients?.map((p:any, i:number) => (
                      <tr key={i}>
                        <td><span style={{ width:24, height:24, borderRadius:'50%', background:i<3?[WARNING,'#C0C0C0','#CD7F32'][i]:PRIMARY_SOFT, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:i<3?'#FFF':TEXT_MUTED }}>{i+1}</span></td>
                        <td style={{ fontWeight:500 }}>{p.patientName}</td>
                        <td><span className="badge" style={{ background:PRIMARY_SOFT, color:PRIMARY }}>{p.visits}</span></td>
                        <td style={{ color:SUCCESS, fontWeight:600 }}>{fmt(p.totalSpent)} {t.riyal}</td>
                        <td style={{ color:TEXT_MUTED }}>{p.lastVisit?.substring(0,10)}</td>
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
          <Card title={`👨‍⚕️ ${t.topDoctors}`}>
            <div style={{ overflowX:'auto' }}>
              <table className="tbl">
                <thead><tr>
                  <th>{t.doctorName}</th>
                  <th>{t.specialty}</th>
                  <th>{t.total}</th>
                  <th>{t.completed}</th>
                  <th>{t.cancelled}</th>
                  <th>{t.completionRate}</th>
                  <th>{t.revenue}</th>
                  <th>{t.thisMonthAppts}</th>
                </tr></thead>
                <tbody>
                  {data.doctorPerformance?.map((d:any, i:number) => (
                    <tr key={i}>
                      <td style={{ fontWeight:600 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:32, height:32, borderRadius:10, background:PRIMARY_SOFT, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>👨‍⚕️</div>
                          {d.doctorName}
                        </div>
                      </td>
                      <td style={{ color:TEXT_MUTED }}>{d.specialty || '—'}</td>
                      <td><span className="badge" style={{ background:PRIMARY_SOFT, color:PRIMARY }}>{d.totalAppts}</span></td>
                      <td><span className="badge" style={{ background:SUCCESS_BG, color:SUCCESS }}>{d.completedAppts}</span></td>
                      <td><span className="badge" style={{ background:DANGER_BG, color:DANGER }}>{d.cancelledAppts}</span></td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:6, borderRadius:100, background:`${SUCCESS}20`, overflow:'hidden' }}>
                            <div style={{ height:'100%', borderRadius:100, background:SUCCESS, width:`${d.completionRate}%` }} />
                          </div>
                          <span style={{ fontSize:12, fontWeight:600, color:SUCCESS }}>{d.completionRate}%</span>
                        </div>
                      </td>
                      <td style={{ color:SUCCESS, fontWeight:600 }}>{fmt(d.revenue)} {t.riyal}</td>
                      <td style={{ color:PRIMARY, fontWeight:600 }}>{d.thisMonthAppts}</td>
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
            <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
              <StatCard icon="👥" label={t.totalPatients} value={fmt(ptData.total)} isAr={isAr} />
              <StatCard icon="✨" label={t.newPatients} value={fmt(ptData.newThisMonth)} sub={t.thisMonth} isAr={isAr} />
              <StatCard icon="🔄" label={t.returning} value={fmt(ptData.returning)} isAr={isAr} />
              <StatCard icon="💚" label={t.activePatients} value={fmt(ptData.active)} isAr={isAr} />
            </div>
            <div className="charts-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
              <Card title={`📈 ${t.patientGrowth}`}>
                {ptData.monthly?.length > 0 ? (
                  <BarChart lang={lang} valueKey="newPatients" labelKey="monthLabel"
                    data={ptData.monthly.map((d:any) => ({ ...d, monthLabel: t.months[d.month-1]?.substring(0,3) }))} />
                ) : <p style={{ color:TEXT_MUTED, fontSize:13, textAlign:'center', padding:'30px 0' }}>{t.noData}</p>}
              </Card>
              <Card title={`⚧ ${t.genderDist}`}>
                {ptData.genderDist?.map((g:any, i:number) => (
                  <ProgressBar key={i} label={g.gender} value={g.count} total={ptData.total} color={[PRIMARY, WARNING, SUCCESS][i%3]} />
                ))}
              </Card>
            </div>
            <Card title={`👶 ${t.ageGroups}`}>
              {ptData.ageDist?.map((a:any, i:number) => (
                <ProgressBar key={i} label={a.ageGroup} value={a.count} total={ptData.total} color={[PRIMARY, SUCCESS, WARNING, DANGER, AMBER][i%5]} />
              ))}
            </Card>
          </div>
        )}

        {/* ════════ TAB 3 — Appointments ════════ */}
        {tab===3 && apData && (
          <div>
            <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
              <StatCard icon="📅" label={t.totalAppts} value={fmt(apData.total)} isAr={isAr} />
              <StatCard icon="✅" label={t.completed} value={fmt(apData.completed)} color={SUCCESS} isAr={isAr} />
              <StatCard icon="❌" label={t.cancelled} value={fmt(apData.cancelled)} color={DANGER} isAr={isAr} />
              <StatCard icon="⏱" label={t.avgVisit} value={`${apData.avgVisitMinutes} ${t.min}`} isAr={isAr} />
            </div>
            <div className="charts-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
              <Card title={`📊 ${t.apptsByStatus}`}>
                {apData.byStatus?.map((s:any, i:number) => (
                  <ProgressBar key={i} label={s.status} value={s.count} total={apData.total} color={[SUCCESS, PRIMARY, DANGER, WARNING][i%4]} />
                ))}
              </Card>
              <Card title={`🩺 ${t.visitTypes}`}>
                {apData.byType?.map((vt:any, i:number) => (
                  <ProgressBar key={i} label={vt.type} value={vt.count} total={apData.total} color={[PRIMARY, SUCCESS, WARNING, DANGER, AMBER][i%5]} />
                ))}
              </Card>
            </div>
            <div className="charts-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <Card title={`📅 ${t.peakDays}`}>
                {apData.byDayOfWeek?.map((d:any, i:number) => (
                  <ProgressBar key={i} label={d.day} value={d.count} total={apData.total} color={PRIMARY} />
                ))}
              </Card>
              <Card title={`⏰ ${t.peakHours}`}>
                {apData.byHour?.map((h:any, i:number) => (
                  <ProgressBar key={i} label={h.hour} value={h.count} total={apData.total} color={PRIMARY} />
                ))}
              </Card>
            </div>
          </div>
        )}

        {/* ════════ TAB 4 — Custom Range ════════ */}
        {tab===4 && (
          <div>
            <Card title={`📆 ${t.tabs[4]}`}>
              <div style={{ display:'flex', gap:14, alignItems:'flex-end', flexWrap:'wrap', marginBottom:16 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:TEXT_MUTED, textTransform:'uppercase' }}>{t.from}</label>
                  <input type="date" value={fromDate} onChange={e=>setFrom(e.target.value)}
                    style={{ padding:'9px 12px', border:`1px solid ${BORDER}`, borderRadius:10, fontSize:14, fontFamily:'Inter,sans-serif', color:TEXT_DARK, outline:'none' }} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:TEXT_MUTED, textTransform:'uppercase' }}>{t.to}</label>
                  <input type="date" value={toDate} onChange={e=>setTo(e.target.value)}
                    style={{ padding:'9px 12px', border:`1px solid ${BORDER}`, borderRadius:10, fontSize:14, fontFamily:'Inter,sans-serif', color:TEXT_DARK, outline:'none' }} />
                </div>
                <button onClick={applyRange} disabled={rgLoading||!fromDate||!toDate}
                  style={{ padding:'10px 22px', background:PRIMARY, color:'#FFF', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', opacity:rgLoading?0.7:1 }}>
                  {rgLoading ? '...' : t.apply}
                </button>
              </div>
              {rgData && (
                <div>
                  <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
                    <StatCard icon="📅" label={t.totalAppts} value={fmt(rgData.totalAppointments)} isAr={isAr} />
                    <StatCard icon="✅" label={t.completed} value={fmt(rgData.completed)} color={SUCCESS} isAr={isAr} />
                    <StatCard icon="❌" label={t.cancelled} value={fmt(rgData.cancelled)} color={DANGER} isAr={isAr} />
                    <StatCard icon="💰" label={t.revenue} value={`${fmt(rgData.revenue)} ${t.riyal}`} color={SUCCESS} isAr={isAr} />
                  </div>
                  <Card title={`📈 ${isAr?'المواعيد اليومية':'Daily Appointments'}`}>
                    {rgData.byDay?.length > 0 ? (
                      <BarChart lang={lang} valueKey="count" labelKey="date"
                        data={rgData.byDay.map((d:any)=>({...d, date:d.date?.substring(5)}))} />
                    ) : <p style={{ color:TEXT_MUTED, fontSize:13, textAlign:'center', padding:'30px 0' }}>{t.noData}</p>}
                  </Card>
                  <Card title={`👨‍⚕️ ${t.topDoctors}`}>
                    {rgData.doctorPerformance?.map((d:any, i:number) => (
                      <ProgressBar key={i} label={d.doctorName} value={d.revenue} total={rgData.revenue||1}
                        badge={`${fmt(d.revenue)} ${t.riyal} (${d.totalAppts} ${isAr?'موعد':'appts'})`}
                        color={[PRIMARY, SUCCESS, WARNING, DANGER][i%4]} />
                    ))}
                  </Card>
                </div>
              )}
            </Card>
          </div>
        )}

      </div>
    </div>
  )
}