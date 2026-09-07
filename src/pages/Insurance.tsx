import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useColumnVisibility, ColumnToggleButton } from '../components/ColumnToggle'
import type { ColumnDef } from '../components/ColumnToggle'

const getStoredLang = (): 'ar' | 'en' => (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const PRIMARY     = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK   = '#2C3E3F'
const TEXT_MUTED  = '#6B8A8C'
const BORDER      = '#DCE5E5'
const CARD_BG     = '#FFFFFF'
const SUCCESS     = '#16A34A'
const SUCCESS_BG  = '#F0FDF4'
const WARNING     = '#F59E0B'
const WARNING_BG  = '#FFFBEB'
const DANGER      = '#EF4444'
const DANGER_BG   = '#FEF2F2'
const AMBER       = '#79674D'

const css = `
@keyframes fade-up { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
.ins-shell { animation:fade-up 0.4s ease both; }
.ins-shell * { box-sizing:border-box; }
.tab-btn { padding:8px 18px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; border:none; transition:all 0.2s; }
.tab-btn.active { background:${PRIMARY}; color:#FFF; }
.tab-btn:not(.active) { background:transparent; color:${TEXT_MUTED}; border:1px solid ${BORDER}; }
.tab-btn:not(.active):hover { background:${PRIMARY_SOFT}; color:${PRIMARY}; }
.tbl { width:100%; border-collapse:collapse; font-size:13px; }
.tbl th { text-align:right; padding:10px 14px; font-weight:600; font-size:11px; color:${TEXT_MUTED}; border-bottom:1px solid ${BORDER}; background:#F8FAFA; }
.tbl td { padding:11px 14px; border-bottom:1px solid ${BORDER}; color:${TEXT_DARK}; }
.tbl tr:last-child td { border-bottom:none; }
.tbl tr:hover td { background:#F8FAFA; }
.badge { padding:3px 10px; border-radius:100px; font-size:11px; font-weight:600; }
.form-input, .form-select { width:100%; padding:9px 12px; border:1px solid ${BORDER}; border-radius:10px; font-size:13px; color:${TEXT_DARK}; outline:none; font-family:inherit; background:${CARD_BG}; }
.form-input:focus, .form-select:focus { border-color:${PRIMARY}; box-shadow:0 0 0 3px ${PRIMARY}18; }
@media print {
  .no-print { display: none !important; }
  body { margin: 0; padding: 10px; }
}
`

const T = {
  ar: { font:"'Noto Kufi Arabic',sans-serif", dir:'rtl' as const,
    title:'التأمين الصحي', subtitle:'إدارة شركات التأمين والبوالص والمطالبات',
    tabs:['🏢 الشركات','📋 المطالبات'],
    companies:'شركات التأمين', addCompany:'إضافة شركة', companyName:'اسم الشركة',
    companyNameEn:'الاسم بالإنجليزي', phone:'الهاتف', email:'البريد الإلكتروني',
    contact:'المسؤول', coverage:'نسبة التغطية %', active:'نشطة',
    patients:'المرضى', actions:'إجراءات', save:'حفظ', cancel:'إلغاء',
    edit:'تعديل', delete:'حذف', confirm:'تأكيد الحذف؟',
    claims:'المطالبات', claimNo:'رقم المطالبة', patient:'المريض',
    company:'الشركة', total:'الإجمالي', insAmount:'حصة التأمين',
    patAmount:'حصة المريض', status:'الحالة', serviceDate:'تاريخ الخدمة',
    updateStatus:'تحديث الحالة', approvalNo:'رقم الموافقة', rejectionReason:'سبب الرفض',
    notes:'ملاحظات', filter:'فلترة', all:'الكل',
    pending:'معلق', submitted:'مُرسلة', approved:'موافق عليها',
    rejected:'مرفوضة', paid:'مدفوعة',
    stats:'الإحصائيات', pendingAmount:'مبالغ معلقة', paidAmount:'مبالغ مدفوعة',
    loading:'جاري التحميل...', noData:'لا توجد بيانات',
    errSave:'حدث خطأ', successSave:'تم الحفظ بنجاح',
    riyal:'د.أ',
    print: 'طباعة', exportPdf: 'تصدير PDF', exportExcel: 'تصدير Excel',
  },
  en: { font:"'Inter',sans-serif", dir:'ltr' as const,
    title:'Health Insurance', subtitle:'Manage insurance companies, policies and claims',
    tabs:['🏢 Companies','📋 Claims'],
    companies:'Insurance Companies', addCompany:'Add Company', companyName:'Company Name',
    companyNameEn:'Name in English', phone:'Phone', email:'Email',
    contact:'Contact Person', coverage:'Coverage Rate %', active:'Active',
    patients:'Patients', actions:'Actions', save:'Save', cancel:'Cancel',
    edit:'Edit', delete:'Delete', confirm:'Confirm delete?',
    claims:'Claims', claimNo:'Claim No.', patient:'Patient',
    company:'Company', total:'Total', insAmount:'Insurance Amount',
    patAmount:'Patient Amount', status:'Status', serviceDate:'Service Date',
    updateStatus:'Update Status', approvalNo:'Approval Number', rejectionReason:'Rejection Reason',
    notes:'Notes', filter:'Filter', all:'All',
    pending:'Pending', submitted:'Submitted', approved:'Approved',
    rejected:'Rejected', paid:'Paid',
    stats:'Statistics', pendingAmount:'Pending Amount', paidAmount:'Paid Amount',
    loading:'Loading...', noData:'No data available',
    errSave:'An error occurred', successSave:'Saved successfully',
    riyal:'JD',
    print: 'Print', exportPdf: 'Export PDF', exportExcel: 'Export Excel',
  },
}

const fmt = (n: number) => n?.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 }) ?? '0'

const statusColors: Record<string,{bg:string,color:string}> = {
  pending:   { bg:WARNING_BG,  color:WARNING },
  submitted: { bg:PRIMARY_SOFT, color:PRIMARY },
  approved:  { bg:SUCCESS_BG,  color:SUCCESS },
  rejected:  { bg:DANGER_BG,   color:DANGER },
  paid:      { bg:'#F0FDF4',   color:'#15803D' },
}

export default function Insurance() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<'ar'|'en'>(getStoredLang())
  const [tab, setTab]   = useState(0)
  const [companies, setCompanies] = useState<any[]>([])
  const [claims, setClaims]       = useState<any[]>([])
  const [stats, setStats]         = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [notification, setNotification] = useState<{type:'ok'|'err',msg:string}|null>(null)
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null)

  // ✅ Column definitions للمطالبات
  const columnDefs: ColumnDef[] = [
    { key: 'claimNo', label: T[lang].claimNo, locked: true },
    { key: 'patient', label: T[lang].patient },
    { key: 'company', label: T[lang].company },
    { key: 'total', label: T[lang].total },
    { key: 'insAmount', label: T[lang].insAmount },
    { key: 'patAmount', label: T[lang].patAmount },
    { key: 'serviceDate', label: T[lang].serviceDate },
    { key: 'status', label: T[lang].status, locked: true },
  ]
  const { visibleKeys, toggle } = useColumnVisibility('insurance-claims-columns', columnDefs)

  // Company form
  const [showCF, setShowCF] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [cf, setCf] = useState({ name:'', nameEn:'', phone:'', email:'', contact:'', coverage:80, isActive:true })

  // Claims filter
  const [claimStatus, setClaimStatus] = useState('')
  const [claimPage, setClaimPage]     = useState(1)
  const [claimTotal, setClaimTotal]   = useState(0)
  const [claimPages, setClaimPages]   = useState(1)

  // Update status modal
  const [showUSM, setShowUSM] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<any>(null)
  const [newStatus, setNewStatus]   = useState('')
  const [approvalNo, setApprovalNo] = useState('')
  const [rejReason, setRejReason]   = useState('')
  const [statusNotes, setStatusNotes] = useState('')

  const t    = T[lang]
  const isAr = lang === 'ar'

  useEffect(() => {
    const id = 'cura-ins-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id=id; s.textContent=css; document.head.appendChild(s)
    }
    const onLang = (e:Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', onLang)
    fetchAll()
    return () => window.removeEventListener('cura-lang-change', onLang)
  }, [])

  useEffect(() => { if (tab===1) fetchClaims() }, [tab, claimStatus, claimPage])

   const showAlert = (type:'ok'|'err', msg:string) => {
   setNotification({type,msg}); setTimeout(()=>setNotification(null),3000)
 }

  const fetchAll = async () => {
    try {
      const [comp, st] = await Promise.all([
        api.get('/insurance/companies'),
        api.get('/insurance/claims/stats'),
      ])
      setCompanies(comp.data); setStats(st.data)
    } catch (err:any) {
      if (err?.response?.status===401) navigate('/login')
    } finally { setLoading(false) }
  }

  const fetchClaims = async () => {
    try {
      const params = new URLSearchParams({ page:String(claimPage), pageSize:'20' })
      if (claimStatus) params.set('status', claimStatus)
      const r = await api.get(`/insurance/claims?${params}`)
      setClaims(r.data.claims); setClaimTotal(r.data.total)
      setClaimPages(r.data.pages)
    } catch {}
  }

  const handleSaveCompany = async () => {
    try {
      if (editId) {
        await api.put(`/insurance/companies/${editId}?lang=${lang}`, { ...cf, coverageRate:cf.coverage })
      } else {
        await api.post(`/insurance/companies?lang=${lang}`, { name:cf.name, nameEn:cf.nameEn, phone:cf.phone, email:cf.email, contactName:cf.contact, coverageRate:cf.coverage, isActive:true })
      }
      showAlert('ok', t.successSave)
      setShowCF(false); setEditId(null)
      setCf({ name:'', nameEn:'', phone:'', email:'', contact:'', coverage:80, isActive:true })
      fetchAll()
    } catch (err:any) {
      showAlert('err', err.response?.data || t.errSave)
    }
  }

  const handleDeleteCompany = async (id:string) => {
    if (!window.confirm(t.confirm)) return
    try {
      await api.delete(`/insurance/companies/${id}?lang=${lang}`)
      showAlert('ok', t.successSave); fetchAll()
    } catch (err:any) { showAlert('err', err.response?.data || t.errSave) }
  }

  const handleUpdateStatus = async () => {
    if (!selectedClaim || !newStatus) return
    try {
      await api.put(`/insurance/claims/${selectedClaim.id}/status?lang=${lang}`, {
        status: newStatus, approvalNumber: approvalNo||null,
        rejectionReason: rejReason||null, notes: statusNotes||null,
      })
      showAlert('ok', t.successSave)
      setShowUSM(false); setSelectedClaim(null)
      setNewStatus(''); setApprovalNo(''); setRejReason(''); setStatusNotes('')
      fetchClaims()
    } catch (err:any) { showAlert('err', err.response?.data || t.errSave) }
  }

  // ✅ Export function
  const handleExport = async (format: 'pdf' | 'excel') => {
    setDownloading(format)
    try {
      const rows = claims.map(c => ({
        claimNo: c.claimNumber,
        patient: c.patientName,
        company: c.companyName,
        total: fmt(c.totalAmount),
        insAmount: fmt(c.insuranceAmount),
        patAmount: fmt(c.patientAmount),
        serviceDate: c.serviceDate,
        status: t[c.status as keyof typeof t] || c.status,
      }))

      const response = await api.post(
        `/export/${format}`,
        {
          title: t.claims,
          columns: columnDefs.filter(c => visibleKeys.has(c.key)).map(c => c.label),
          rows: rows.map(r =>
            columnDefs.filter(c => visibleKeys.has(c.key)).map(c => String(r[c.key as keyof typeof r] || '—'))
          ),
          isRtl: isAr,
        },
        { responseType: 'blob' }
      )

      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `claims.${format === 'excel' ? 'xlsx' : 'pdf'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert(isAr ? 'فشل التصدير' : 'Export failed')
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',fontFamily:t.font}}>
      <div style={{width:36,height:36,borderRadius:'50%',border:`3px solid ${PRIMARY_SOFT}`,borderTopColor:PRIMARY,animation:'spin 0.8s linear infinite'}} />
    </div>
  )

  return (
    <div className="ins-shell" dir={t.dir} style={{background:'#F8FAFA',minHeight:'100vh',padding:24,fontFamily:t.font}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>

        {/* Alert */}
        {/* Alert */}
{notification && (
  <div style={{position:'fixed',top:20,right:20,zIndex:9999,padding:'12px 20px',borderRadius:12,background:notification.type==='ok'?SUCCESS_BG:DANGER_BG,border:`1px solid ${notification.type==='ok'?SUCCESS:DANGER}`,color:notification.type==='ok'?SUCCESS:DANGER,fontWeight:600,fontSize:13}}>
    {notification.type==='ok'?'✅':'❌'} {notification.msg}
  </div>
)}

        {/* Header */}
        <div style={{marginBottom:24}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:PRIMARY_SOFT,border:`1px solid ${BORDER}`,borderRadius:100,padding:'4px 16px',fontSize:11,fontWeight:600,color:PRIMARY,marginBottom:12}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:PRIMARY}} /> {isAr?'نظام التأمين الصحي':'Health Insurance System'}
          </div>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,fontWeight:500,color:TEXT_DARK,margin:0}}>{t.title}</h2>
          <p style={{fontSize:13,color:TEXT_MUTED,margin:'6px 0 0'}}>{t.subtitle}</p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:14,marginBottom:24}}>
            {[
              {icon:'📋',label:isAr?'إجمالي المطالبات':'Total Claims',value:stats.total,color:TEXT_DARK},
              {icon:'⏳',label:t.pending,value:stats.pending,color:WARNING},
              {icon:'✅',label:t.approved,value:stats.approved,color:SUCCESS},
              {icon:'💰',label:t.paidAmount,value:`${fmt(stats.paidAmount)} ${t.riyal}`,color:SUCCESS},
              {icon:'🔄',label:t.pendingAmount,value:`${fmt(stats.pendingAmount)} ${t.riyal}`,color:WARNING},
            ].map((s,i)=>(
              <div key={i} style={{background:CARD_BG,border:`1px solid ${BORDER}`,borderRadius:16,padding:16}}>
                <div style={{fontSize:22,marginBottom:8}}>{s.icon}</div>
                <p style={{fontSize:20,fontWeight:700,color:s.color,margin:0}}>{s.value}</p>
                <p style={{fontSize:11,color:TEXT_MUTED,margin:'4px 0 0'}}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{display:'flex',gap:8,marginBottom:20}} className="no-print">
          {t.tabs.map((tb,i)=>(
            <button key={i} className={`tab-btn${tab===i?' active':''}`} onClick={()=>setTab(i)}>{tb}</button>
          ))}
        </div>

        {/* ════ TAB 0 — Companies ════ */}
        {tab===0 && (
          <div style={{background:CARD_BG,border:`1px solid ${BORDER}`,borderRadius:18,padding:22}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}} className="no-print">
              <h3 style={{fontSize:16,fontWeight:700,color:TEXT_DARK,margin:0}}>🏢 {t.companies}</h3>
              <div style={{display:'flex',gap:8}}>
                  <button onClick={() => window.print()}
                    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_MUTED, cursor: 'pointer' }}>
                    🖨️ {t.print}
                  </button>
                  <button onClick={() => handleExport('pdf')} disabled={downloading !== null}
                    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_DARK, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading === 'excel' ? 0.5 : 1 }}>
                    {downloading === 'pdf' ? '⏳' : '📄'} {t.exportPdf}
                  </button>
                  <button onClick={() => handleExport('excel')} disabled={downloading !== null}
                    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_DARK, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading === 'pdf' ? 0.5 : 1 }}>
                    {downloading === 'excel' ? '⏳' : '📊'} {t.exportExcel}
                  </button>
                  <ColumnToggleButton columns={columnDefs} visibleKeys={visibleKeys} onToggle={toggle} isRtl={isAr} />
                </div>
              <button onClick={()=>{setShowCF(true);setEditId(null);setCf({name:'',nameEn:'',phone:'',email:'',contact:'',coverage:80,isActive:true})}}
                style={{padding:'9px 18px',background:PRIMARY,color:'#FFF',border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                + {t.addCompany}
              </button>
            </div>

            {/* Company Form */}
            {showCF && (
              <div style={{background:'#F8FAFA',border:`1px solid ${BORDER}`,borderRadius:14,padding:20,marginBottom:20}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                  <div>
                    <label style={{fontSize:11,fontWeight:700,color:TEXT_MUTED,display:'block',marginBottom:5}}>{t.companyName} *</label>
                    <input className="form-input" value={cf.name} onChange={e=>setCf({...cf,name:e.target.value})} placeholder={t.companyName} />
                  </div>
                  <div>
                    <label style={{fontSize:11,fontWeight:700,color:TEXT_MUTED,display:'block',marginBottom:5}}>{t.companyNameEn}</label>
                    <input className="form-input" value={cf.nameEn} onChange={e=>setCf({...cf,nameEn:e.target.value})} placeholder="e.g. Mediterranean Insurance" style={{fontFamily:'Inter,sans-serif'}} />
                  </div>
                  <div>
                    <label style={{fontSize:11,fontWeight:700,color:TEXT_MUTED,display:'block',marginBottom:5}}>{t.phone}</label>
                    <input className="form-input" value={cf.phone} onChange={e=>setCf({...cf,phone:e.target.value})} placeholder="+962..." style={{fontFamily:'Inter,sans-serif'}} />
                  </div>
                  <div>
                    <label style={{fontSize:11,fontWeight:700,color:TEXT_MUTED,display:'block',marginBottom:5}}>{t.email}</label>
                    <input className="form-input" value={cf.email} onChange={e=>setCf({...cf,email:e.target.value})} placeholder="insurance@company.com" style={{fontFamily:'Inter,sans-serif'}} />
                  </div>
                  <div>
                    <label style={{fontSize:11,fontWeight:700,color:TEXT_MUTED,display:'block',marginBottom:5}}>{t.contact}</label>
                    <input className="form-input" value={cf.contact} onChange={e=>setCf({...cf,contact:e.target.value})} placeholder={t.contact} />
                  </div>
                  <div>
                    <label style={{fontSize:11,fontWeight:700,color:TEXT_MUTED,display:'block',marginBottom:5}}>{t.coverage}</label>
                    <input className="form-input" type="number" min="0" max="100" value={cf.coverage} onChange={e=>setCf({...cf,coverage:Number(e.target.value)})} style={{fontFamily:'Inter,sans-serif'}} />
                  </div>
                </div>
                <div style={{display:'flex',gap:10}}>
                  <button onClick={handleSaveCompany} style={{padding:'9px 20px',background:PRIMARY,color:'#FFF',border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                    💾 {t.save}
                  </button>
                  <button onClick={()=>setShowCF(false)} style={{padding:'9px 20px',background:'transparent',border:`1px solid ${BORDER}`,borderRadius:10,fontSize:13,cursor:'pointer',color:TEXT_MUTED}}>
                    {t.cancel}
                  </button>
                </div>
              </div>
            )}

            {/* Companies Table */}
            <div style={{overflowX:'auto'}}>
              <table className="tbl">
                <thead><tr>
                  <th>{t.companyName}</th><th>{t.coverage}</th>
                  <th>{t.contact}</th><th>{t.phone}</th>
                  <th>{t.patients}</th><th>{t.active}</th><th>{t.actions}</th>
                </tr></thead>
                <tbody>
                  {companies.map((c,i)=>(
                    <tr key={i}>
                      <td>
                        <div style={{fontWeight:600}}>{c.name}</div>
                        {c.nameEn && <div style={{fontSize:11,color:TEXT_MUTED,fontFamily:'Inter,sans-serif'}}>{c.nameEn}</div>}
                      </td>
                      <td>
                        <span className="badge" style={{background:PRIMARY_SOFT,color:PRIMARY}}>{c.coverageRate}%</span>
                      </td>
                      <td style={{color:TEXT_MUTED}}>{c.contactName||'—'}</td>
                      <td style={{color:TEXT_MUTED,fontFamily:'Inter,sans-serif'}}>{c.phone||'—'}</td>
                      <td><span className="badge" style={{background:PRIMARY_SOFT,color:PRIMARY}}>{c.patientsCount}</span></td>
                      <td>
                        <span className="badge" style={{background:c.isActive?SUCCESS_BG:DANGER_BG,color:c.isActive?SUCCESS:DANGER}}>
                          {c.isActive?(isAr?'نشطة':'Active'):(isAr?'غير نشطة':'Inactive')}
                        </span>
                      </td>
                      <td className="no-print">
                        <div style={{display:'flex',gap:8}}>
                          <button onClick={()=>{setEditId(c.id);setCf({name:c.name,nameEn:c.nameEn||'',phone:c.phone||'',email:c.email||'',contact:c.contactName||'',coverage:c.coverageRate,isActive:c.isActive});setShowCF(true)}}
                            style={{padding:'5px 12px',border:`1px solid ${PRIMARY}`,borderRadius:8,background:'transparent',color:PRIMARY,fontSize:12,cursor:'pointer'}}>
                            ✏️ {t.edit}
                          </button>
                          <button onClick={()=>handleDeleteCompany(c.id)}
                            style={{padding:'5px 12px',border:`1px solid ${DANGER}`,borderRadius:8,background:'transparent',color:DANGER,fontSize:12,cursor:'pointer'}}>
                            🗑️ {t.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {companies.length===0 && (
                    <tr><td colSpan={7} style={{textAlign:'center',color:TEXT_MUTED,padding:40}}>{t.noData}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════ TAB 1 — Claims ════ */}
        {tab===1 && (
          <div style={{background:CARD_BG,border:`1px solid ${BORDER}`,borderRadius:18,padding:22}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}} className="no-print">
              <h3 style={{fontSize:16,fontWeight:700,color:TEXT_DARK,margin:0}}>📋 {t.claims}</h3>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                <div>
                  <label style={{fontSize:12,color:TEXT_MUTED,marginRight:8}}>{t.filter}:</label>
                  <select className="form-select" value={claimStatus} onChange={e=>{setClaimStatus(e.target.value);setClaimPage(1)}} style={{width:'auto',minWidth:130}}>
                    <option value="">{t.all}</option>
                    <option value="pending">{t.pending}</option>
                    <option value="submitted">{t.submitted}</option>
                    <option value="approved">{t.approved}</option>
                    <option value="rejected">{t.rejected}</option>
                    <option value="paid">{t.paid}</option>
                  </select>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={() => window.print()}
                    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_MUTED, cursor: 'pointer' }}>
                    🖨️ {t.print}
                  </button>
                  <button onClick={() => handleExport('pdf')} disabled={downloading !== null}
                    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_DARK, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading === 'excel' ? 0.5 : 1 }}>
                    {downloading === 'pdf' ? '⏳' : '📄'} {t.exportPdf}
                  </button>
                  <button onClick={() => handleExport('excel')} disabled={downloading !== null}
                    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_DARK, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading === 'pdf' ? 0.5 : 1 }}>
                    {downloading === 'excel' ? '⏳' : '📊'} {t.exportExcel}
                  </button>
                  <ColumnToggleButton columns={columnDefs} visibleKeys={visibleKeys} onToggle={toggle} isRtl={isAr} />
                </div>
              </div>
            </div>

            <div style={{overflowX:'auto'}}>
              <table className="tbl">
                <thead><tr>
                  {columnDefs.filter(c => visibleKeys.has(c.key)).map(col => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th className="no-print">{t.actions}</th>
                </tr></thead>
                <tbody>
                  {claims.map((c,i)=>{
                    const sc = statusColors[c.status] || {bg:PRIMARY_SOFT,color:PRIMARY}
                    const cellsByKey: Record<string, React.ReactNode> = {
                      claimNo: <span style={{fontFamily:'Inter,sans-serif',fontWeight:600,fontSize:12}}>{c.claimNumber}</span>,
                      patient: <span style={{fontWeight:500}}>{c.patientName}</span>,
                      company: <span style={{color:TEXT_MUTED}}>{c.companyName}</span>,
                      total: <span style={{fontFamily:'Inter,sans-serif'}}>{fmt(c.totalAmount)} {t.riyal}</span>,
                      insAmount: <span style={{color:SUCCESS,fontWeight:600,fontFamily:'Inter,sans-serif'}}>{fmt(c.insuranceAmount)} {t.riyal}</span>,
                      patAmount: <span style={{color:WARNING,fontWeight:600,fontFamily:'Inter,sans-serif'}}>{fmt(c.patientAmount)} {t.riyal}</span>,
                      serviceDate: <span style={{color:TEXT_MUTED,fontFamily:'Inter,sans-serif'}}>{c.serviceDate}</span>,
                      status: <span className="badge" style={{background:sc.bg,color:sc.color}}>{t[c.status as keyof typeof t]||c.status}</span>,
                    }
                    return (
                      <tr key={i}>
                        {columnDefs.filter(c2 => visibleKeys.has(c2.key)).map(col => (
                          <td key={col.key}>{cellsByKey[col.key]}</td>
                        ))}
                        <td className="no-print">
                          <button onClick={()=>{setSelectedClaim(c);setNewStatus(c.status);setApprovalNo(c.approvalNumber||'');setRejReason(c.rejectionReason||'');setStatusNotes(c.notes||'');setShowUSM(true)}}
                            style={{padding:'5px 12px',border:`1px solid ${PRIMARY}`,borderRadius:8,background:'transparent',color:PRIMARY,fontSize:12,cursor:'pointer'}}>
                            🔄 {t.updateStatus}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {claims.length===0 && (
                    <tr><td colSpan={columnDefs.length + 1} style={{textAlign:'center',color:TEXT_MUTED,padding:40}}>{t.noData}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {claimPages > 1 && (
              <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:16}} className="no-print">
                {Array.from({length:claimPages},(_,i)=>i+1).map(p=>(
                  <button key={p} onClick={()=>setClaimPage(p)}
                    style={{width:32,height:32,borderRadius:8,border:`1px solid ${p===claimPage?PRIMARY:BORDER}`,background:p===claimPage?PRIMARY:CARD_BG,color:p===claimPage?'#FFF':TEXT_DARK,fontSize:12,fontWeight:600,cursor:'pointer'}}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ Update Status Modal ════ */}
        {showUSM && selectedClaim && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9998}} onClick={()=>setShowUSM(false)}>
            <div style={{background:CARD_BG,borderRadius:20,padding:28,width:480,maxWidth:'95vw'}} onClick={e=>e.stopPropagation()}>
              <h3 style={{fontSize:16,fontWeight:700,color:TEXT_DARK,margin:'0 0 20px'}}>{t.updateStatus} — {selectedClaim.claimNumber}</h3>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:TEXT_MUTED,display:'block',marginBottom:5}}>{t.status}</label>
                  <select className="form-select" value={newStatus} onChange={e=>setNewStatus(e.target.value)}>
                    <option value="pending">{t.pending}</option>
                    <option value="submitted">{t.submitted}</option>
                    <option value="approved">{t.approved}</option>
                    <option value="rejected">{t.rejected}</option>
                    <option value="paid">{t.paid}</option>
                  </select>
                </div>
                {(newStatus==='approved'||newStatus==='submitted') && (
                  <div>
                    <label style={{fontSize:11,fontWeight:700,color:TEXT_MUTED,display:'block',marginBottom:5}}>{t.approvalNo}</label>
                    <input className="form-input" value={approvalNo} onChange={e=>setApprovalNo(e.target.value)} style={{fontFamily:'Inter,sans-serif'}} />
                  </div>
                )}
                {newStatus==='rejected' && (
                  <div>
                    <label style={{fontSize:11,fontWeight:700,color:TEXT_MUTED,display:'block',marginBottom:5}}>{t.rejectionReason}</label>
                    <input className="form-input" value={rejReason} onChange={e=>setRejReason(e.target.value)} />
                  </div>
                )}
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:TEXT_MUTED,display:'block',marginBottom:5}}>{t.notes}</label>
                  <textarea className="form-input" value={statusNotes} onChange={e=>setStatusNotes(e.target.value)} rows={2} style={{resize:'none'}} />
                </div>
              </div>
              <div style={{display:'flex',gap:10,marginTop:20}}>
                <button onClick={handleUpdateStatus} style={{flex:1,padding:'10px',background:PRIMARY,color:'#FFF',border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                  💾 {t.save}
                </button>
                <button onClick={()=>setShowUSM(false)} style={{padding:'10px 20px',background:'transparent',border:`1px solid ${BORDER}`,borderRadius:10,fontSize:13,cursor:'pointer',color:TEXT_MUTED}}>
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}