// أضف هذا كـ Component داخل PatientDetail.tsx
// أو استخدمه كتبويب منفصل في صفحة تفاصيل المريض

import { useEffect, useState } from 'react'
import api from '../api/axios'

const PRIMARY      = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK    = '#2C3E3F'
const TEXT_MUTED   = '#6B8A8C'
const BORDER       = '#DCE5E5'
const SUCCESS      = '#16A34A'
const SUCCESS_BG   = '#F0FDF4'
const DANGER       = '#EF4444'
const DANGER_BG    = '#FEF2F2'
const WARNING      = '#F59E0B'
const WARNING_BG   = '#FFFBEB'
const CARD_BG      = '#FFFFFF'

interface Props {
  patientId: string
  lang: 'ar' | 'en'
  isAr: boolean
}

export function PatientInsuranceTab({ patientId, lang, isAr }: Props) {
  const [insurances, setInsurances]   = useState<any[]>([])
  const [companies, setCompanies]     = useState<any[]>([])
  const [showForm, setShowForm]       = useState(false)
  const [alert, setAlert]             = useState<{type:'ok'|'err',msg:string}|null>(null)
  const [form, setForm] = useState({
    insuranceCompanyId:'', policyNumber:'', membershipNumber:'',
    coverageRate:'', maxCoverageAmount:'',
    startDate:'', endDate:'', isPrimary:true, notes:'',
  })

  const t = {
    ar: {
      title:'التأمين الصحي', add:'إضافة بوليصة', company:'شركة التأمين',
      policy:'رقم البوليصة', membership:'رقم العضوية', coverage:'نسبة التغطية %',
      maxCoverage:'الحد الأقصى', start:'تاريخ البداية', end:'تاريخ الانتهاء',
      primary:'بوليصة رئيسية', notes:'ملاحظات', save:'حفظ', cancel:'إلغاء',
      delete:'حذف', confirm:'تأكيد الحذف؟', noData:'لا توجد بوالص تأمين',
      expired:'منتهية', active:'سارية', primaryBadge:'رئيسية',
      claimsCount:'مطالبات', patientPays:'يدفع المريض',
    },
    en: {
      title:'Health Insurance', add:'Add Policy', company:'Insurance Company',
      policy:'Policy Number', membership:'Membership Number', coverage:'Coverage Rate %',
      maxCoverage:'Max Coverage', start:'Start Date', end:'End Date',
      primary:'Primary Policy', notes:'Notes', save:'Save', cancel:'Cancel',
      delete:'Delete', confirm:'Confirm delete?', noData:'No insurance policies',
      expired:'Expired', active:'Active', primaryBadge:'Primary',
      claimsCount:'Claims', patientPays:'Patient pays',
    },
  }[lang]

  useEffect(() => { fetchData() }, [patientId])

  const fetchData = async () => {
    try {
      const [ins, comp] = await Promise.all([
        api.get(`/insurance/patient/${patientId}`),
        api.get('/insurance/companies'),
      ])
      setInsurances(ins.data); setCompanies(comp.data)
    } catch {}
  }

  const showAlrt = (type:'ok'|'err', msg:string) => {
    setAlert({type,msg}); setTimeout(()=>setAlert(null),3000)
  }

  const handleSave = async () => {
    try {
      await api.post(`/insurance/patient?lang=${lang}`, {
        patientId,
        insuranceCompanyId: form.insuranceCompanyId,
        policyNumber: form.policyNumber,
        membershipNumber: form.membershipNumber || null,
        coverageRate: form.coverageRate ? Number(form.coverageRate) : null,
        maxCoverageAmount: form.maxCoverageAmount ? Number(form.maxCoverageAmount) : null,
        startDate: form.startDate,
        endDate: form.endDate,
        isPrimary: form.isPrimary,
        notes: form.notes || null,
      })
      showAlrt('ok', isAr?'تم إضافة البوليصة':'Policy added')
      setShowForm(false)
      setForm({ insuranceCompanyId:'', policyNumber:'', membershipNumber:'', coverageRate:'', maxCoverageAmount:'', startDate:'', endDate:'', isPrimary:true, notes:'' })
      fetchData()
    } catch (err:any) { showAlrt('err', err.response?.data || (isAr?'حدث خطأ':'Error')) }
  }

  const handleDelete = async (id:string) => {
    if (!window.confirm(t.confirm)) return
    try {
      await api.delete(`/insurance/patient/${id}?lang=${lang}`)
      showAlrt('ok', isAr?'تم الحذف':'Deleted'); fetchData()
    } catch (err:any) { showAlrt('err', err.response?.data || (isAr?'حدث خطأ':'Error')) }
  }

  return (
    <div dir={isAr?'rtl':'ltr'}>
      {alert && (
        <div style={{marginBottom:12,padding:'10px 16px',borderRadius:10,background:alert.type==='ok'?SUCCESS_BG:DANGER_BG,color:alert.type==='ok'?SUCCESS:DANGER,fontSize:13,fontWeight:600}}>
          {alert.type==='ok'?'✅':'❌'} {alert.msg}
        </div>
      )}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h4 style={{fontSize:15,fontWeight:700,color:TEXT_DARK,margin:0}}>🏥 {t.title}</h4>
        <button onClick={()=>setShowForm(!showForm)}
          style={{padding:'8px 16px',background:PRIMARY,color:'#FFF',border:'none',borderRadius:9,fontSize:12,fontWeight:600,cursor:'pointer'}}>
          + {t.add}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{background:'#F8FAFA',border:`1px solid ${BORDER}`,borderRadius:14,padding:18,marginBottom:16}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:TEXT_MUTED,display:'block',marginBottom:4}}>{t.company} *</label>
              <select value={form.insuranceCompanyId} onChange={e=>setForm({...form,insuranceCompanyId:e.target.value})}
                style={{width:'100%',padding:'8px 10px',border:`1px solid ${BORDER}`,borderRadius:8,fontSize:13,color:TEXT_DARK,outline:'none'}}>
                <option value="">{isAr?'اختر شركة...':'Select company...'}</option>
                {companies.map(c=><option key={c.id} value={c.id}>{c.name} ({c.coverageRate}%)</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:TEXT_MUTED,display:'block',marginBottom:4}}>{t.policy} *</label>
              <input value={form.policyNumber} onChange={e=>setForm({...form,policyNumber:e.target.value})}
                style={{width:'100%',padding:'8px 10px',border:`1px solid ${BORDER}`,borderRadius:8,fontSize:13,fontFamily:'Inter,sans-serif',outline:'none'}} />
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:TEXT_MUTED,display:'block',marginBottom:4}}>{t.membership}</label>
              <input value={form.membershipNumber} onChange={e=>setForm({...form,membershipNumber:e.target.value})}
                style={{width:'100%',padding:'8px 10px',border:`1px solid ${BORDER}`,borderRadius:8,fontSize:13,fontFamily:'Inter,sans-serif',outline:'none'}} />
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:TEXT_MUTED,display:'block',marginBottom:4}}>{t.coverage}</label>
              <input type="number" min="0" max="100" value={form.coverageRate} onChange={e=>setForm({...form,coverageRate:e.target.value})}
                placeholder={isAr?'اتركه فارغاً لنسبة الشركة':'Leave empty for company rate'}
                style={{width:'100%',padding:'8px 10px',border:`1px solid ${BORDER}`,borderRadius:8,fontSize:13,fontFamily:'Inter,sans-serif',outline:'none'}} />
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:TEXT_MUTED,display:'block',marginBottom:4}}>{t.start} *</label>
              <input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}
                style={{width:'100%',padding:'8px 10px',border:`1px solid ${BORDER}`,borderRadius:8,fontSize:13,fontFamily:'Inter,sans-serif',outline:'none'}} />
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:TEXT_MUTED,display:'block',marginBottom:4}}>{t.end} *</label>
              <input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}
                style={{width:'100%',padding:'8px 10px',border:`1px solid ${BORDER}`,borderRadius:8,fontSize:13,fontFamily:'Inter,sans-serif',outline:'none'}} />
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <input type="checkbox" id="isPrimary" checked={form.isPrimary} onChange={e=>setForm({...form,isPrimary:e.target.checked})} />
            <label htmlFor="isPrimary" style={{fontSize:13,color:TEXT_DARK,cursor:'pointer'}}>{t.primary}</label>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={handleSave} style={{padding:'8px 18px',background:PRIMARY,color:'#FFF',border:'none',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer'}}>
              💾 {t.save}
            </button>
            <button onClick={()=>setShowForm(false)} style={{padding:'8px 14px',background:'transparent',border:`1px solid ${BORDER}`,borderRadius:9,fontSize:13,cursor:'pointer',color:TEXT_MUTED}}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Insurance List */}
      {insurances.length === 0 ? (
        <p style={{color:TEXT_MUTED,fontSize:13,textAlign:'center',padding:'30px 0'}}>{t.noData}</p>
      ) : insurances.map((ins,i) => {
        const expired = ins.isExpired
        const patientPays = Math.round(100 - ins.coverageRate)
        return (
          <div key={i} style={{border:`1px solid ${expired?DANGER:ins.isPrimary?PRIMARY:BORDER}`,borderRadius:14,padding:16,marginBottom:12,background:expired?DANGER_BG:ins.isPrimary?`${PRIMARY}08`:CARD_BG}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8}}>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                  <span style={{fontSize:15,fontWeight:700,color:TEXT_DARK}}>{ins.companyName}</span>
                  {ins.isPrimary && <span style={{padding:'2px 8px',borderRadius:100,fontSize:10,fontWeight:700,background:PRIMARY,color:'#FFF'}}>{t.primaryBadge}</span>}
                  <span style={{padding:'2px 8px',borderRadius:100,fontSize:10,fontWeight:600,background:expired?DANGER_BG:SUCCESS_BG,color:expired?DANGER:SUCCESS}}>
                    {expired?t.expired:t.active}
                  </span>
                </div>
                <div style={{fontSize:12,color:TEXT_MUTED,display:'flex',gap:16,flexWrap:'wrap'}}>
                  <span>📋 {ins.policyNumber}</span>
                  {ins.membershipNumber && <span>🪪 {ins.membershipNumber}</span>}
                  <span>📅 {ins.startDate} → {ins.endDate}</span>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:16}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:20,fontWeight:700,color:PRIMARY}}>{ins.coverageRate}%</div>
                  <div style={{fontSize:10,color:TEXT_MUTED}}>{isAr?'يدفع التأمين':'Insurance pays'}</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:20,fontWeight:700,color:WARNING}}>{patientPays}%</div>
                  <div style={{fontSize:10,color:TEXT_MUTED}}>{t.patientPays}</div>
                </div>
                <button onClick={()=>handleDelete(ins.id)}
                  style={{padding:'6px 12px',border:`1px solid ${DANGER}`,borderRadius:8,background:'transparent',color:DANGER,fontSize:12,cursor:'pointer'}}>
                  🗑️
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}