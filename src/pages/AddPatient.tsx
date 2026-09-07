import { useState, useEffect, useId, isValidElement, cloneElement } from 'react'
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { ECGAnimation } from '../components/ECGAnimation'
import { PRIMARY_SOFT } from '../styles/theme'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const globalCss = `
.add-patient-shell { animation:fade-up 0.4s cubic-bezier(0.2,0.9,0.4,1.1) both; }
.add-patient-shell * { box-sizing:border-box; }
.form-input:focus,.form-select:focus,.form-textarea:focus { border-color:#5B8C8F !important; box-shadow:0 0 0 3px rgba(91,140,143,0.1) !important; }
.form-section { animation:slide-in 0.3s ease both; }
.form-section:nth-child(1){animation-delay:0.05s;}
.form-section:nth-child(2){animation-delay:0.1s;}
input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
input[type=number]{-moz-appearance:textfield;}
@media(max-width:768px){
  .add-patient-title{font-size:24px !important;}
  .form-container{padding:20px !important;}
  .form-grid{grid-template-columns:1fr !important;gap:16px !important;}
}
`

const PRIMARY      = '#5B8C8F'
const PRIMARY_DARK = '#4A7679'
const TEXT_DARK    = '#2C3E3F'
const TEXT_MUTED   = '#6B8A8C'
const BORDER       = '#DCE5E5'
const CARD_BG      = '#FFFFFF'
const ERROR_BG     = '#FDF5F5'
const ERROR_TEXT   = '#79674D'
const SUCCESS      = '#16A34A'
const SUCCESS_BG   = '#F0FDF4'

const T = {
  ar: {
    title:'إضافة مريض جديد', back:'رجوع', basicInfo:'البيانات الأساسية',
    additionalInfo:'معلومات إضافية', notes:'ملاحظات',
    fullName:'الاسم الكامل', fullNamePlaceholder:'أدخل الاسم الكامل للمريض',
    phone:'الهاتف', phonePlaceholder:'05xxxxxxxx',
    phone2:'هاتف 2', phone2Placeholder:'05xxxxxxxx',
    gender:'الجنس', genderPlaceholder:'اختر...', male:'ذكر', female:'أنثى',
    dateOfBirth:'تاريخ الميلاد', nationalId:'الرقم الوطني',
    nationalIdPlaceholder:'رقم الهوية أو الإقامة', bloodType:'فصيلة الدم',
    bloodTypePlaceholder:'اختر...', address:'العنوان', addressPlaceholder:'العنوان الكامل',
    email:'البريد الإلكتروني', emailPlaceholder:'patient@example.com',
    emergencyContact:'شخص الطوارئ', emergencyContactPlaceholder:'اسم الشخص',
    emergencyPhone:'هاتف الطوارئ', emergencyPhonePlaceholder:'05xxxxxxxx',
    allergies:'الحساسية', allergiesPlaceholder:'أدوية، أطعمة، ...',
    chronicDiseases:'أمراض مزمنة', chronicDiseasesPlaceholder:'ضغط، سكري، ...',
    occupation:'المهنة', occupationPlaceholder:'المهنة',
    maritalStatus:'الحالة الاجتماعية', maritalStatusPlaceholder:'اختر...',
    single:'أعزب', married:'متزوج', divorced:'مطلق', widowed:'أرمل',
    notesPlaceholder:'أي ملاحظات إضافية عن المريض...',
    submit:'حفظ المريض', cancel:'إلغاء', saving:'جارٍ الحفظ...',
    error:'حدث خطأ غير متوقع', required:'هذا الحقل مطلوب',
    emailInvalid:'البريد الإلكتروني غير صالح', phoneInvalid:'رقم الهاتف غير صالح',
    nationalIdInvalid:'الرقم الوطني غير صالح',
    loadingMessage:'جاري تجهيز النموذج', loadingSub:'يرجى الانتظار...',
    // ✅ Insurance
    insuranceSection:'🏥 التأمين الصحي (اختياري)',
    insuranceHint:'يمكنك إضافة بوليصة تأمين للمريض الآن أو لاحقاً من صفحة تفاصيل المريض',
    addInsurance:'إضافة بوليصة تأمين',
    noInsurance:'بدون تأمين الآن',
    insCompany:'شركة التأمين', insPolicy:'رقم البوليصة',
    insMembership:'رقم العضوية', insCoverage:'نسبة التغطية %',
    insStart:'تاريخ البداية', insEnd:'تاريخ الانتهاء',
    insPrimary:'بوليصة رئيسية', insNotes:'ملاحظات',
    patientSaved:'✅ تم حفظ المريض بنجاح!',
    addInsuranceNow:'إضافة تأمين الآن',
    skipInsurance:'تخطي — انتهيت',
    savingInsurance:'جارٍ حفظ التأمين...',
    insuranceSaved:'تم حفظ التأمين بنجاح',
  },
  en: {
    title:'Add New Patient', back:'Back', basicInfo:'Basic Information',
    additionalInfo:'Additional Information', notes:'Notes',
    fullName:'Full Name', fullNamePlaceholder:"Enter patient's full name",
    phone:'Phone', phonePlaceholder:'05xxxxxxxx',
    phone2:'Phone 2', phone2Placeholder:'05xxxxxxxx',
    gender:'Gender', genderPlaceholder:'Select...', male:'Male', female:'Female',
    dateOfBirth:'Date of Birth', nationalId:'National ID',
    nationalIdPlaceholder:'ID or Iqama number', bloodType:'Blood Type',
    bloodTypePlaceholder:'Select...', address:'Address', addressPlaceholder:'Full address',
    email:'Email', emailPlaceholder:'patient@example.com',
    emergencyContact:'Emergency Contact', emergencyContactPlaceholder:'Contact person name',
    emergencyPhone:'Emergency Phone', emergencyPhonePlaceholder:'05xxxxxxxx',
    allergies:'Allergies', allergiesPlaceholder:'Medications, foods, ...',
    chronicDiseases:'Chronic Diseases', chronicDiseasesPlaceholder:'Hypertension, Diabetes, ...',
    occupation:'Occupation', occupationPlaceholder:'Occupation',
    maritalStatus:'Marital Status', maritalStatusPlaceholder:'Select...',
    single:'Single', married:'Married', divorced:'Divorced', widowed:'Widowed',
    notesPlaceholder:'Any additional notes about the patient...',
    submit:'Save Patient', cancel:'Cancel', saving:'Saving...',
    error:'An unexpected error occurred', required:'This field is required',
    emailInvalid:'Invalid email address', phoneInvalid:'Invalid phone number',
    nationalIdInvalid:'Invalid national ID',
    loadingMessage:'Preparing Form', loadingSub:'Please wait...',
    // ✅ Insurance
    insuranceSection:'🏥 Health Insurance (Optional)',
    insuranceHint:"You can add an insurance policy now or later from the patient's detail page",
    addInsurance:'Add Insurance Policy',
    noInsurance:'No Insurance Now',
    insCompany:'Insurance Company', insPolicy:'Policy Number',
    insMembership:'Membership Number', insCoverage:'Coverage Rate %',
    insStart:'Start Date', insEnd:'End Date',
    insPrimary:'Primary Policy', insNotes:'Notes',
    patientSaved:'✅ Patient saved successfully!',
    addInsuranceNow:'Add Insurance Now',
    skipInsurance:'Skip — Done',
    savingInsurance:'Saving insurance...',
    insuranceSaved:'Insurance saved successfully',
  },
}

// ─── DatePicker ───────────────────────────────────────────────────────────────
const DatePicker = ({ value, onChange, isAr }: { value:string; onChange:(v:string)=>void; isAr:boolean }) => {
  const parts = value ? value.split('-') : ['','','']
  const [year, setYear]   = useState(parts[0])
  const [month, setMonth] = useState(parts[1])
  const [day, setDay]     = useState(parts[2])
  const update = (y:string,m:string,d:string) => { if(y&&m&&d) onChange(`${y}-${m}-${d}`); else onChange('') }
  const months = isAr
    ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
    : ['January','February','March','April','May','June','July','August','September','October','November','December']
  const currentYear = new Date().getFullYear()
  const years = Array.from({length:100},(_,i)=>currentYear-i)
  const days  = Array.from({length:31},(_,i)=>i+1)
  const sel: React.CSSProperties = { flex:1, padding:'10px 12px', border:`1px solid ${BORDER}`, borderRadius:12, fontSize:13, color:TEXT_DARK, background:CARD_BG, outline:'none', cursor:'pointer' }
  return (
    <div style={{display:'flex',gap:8}}>
      <select value={day}   onChange={e=>{setDay(e.target.value);update(year,month,e.target.value)}}   style={sel}>
        <option value="">{isAr?'يوم':'Day'}</option>
        {days.map(d=><option key={d} value={String(d).padStart(2,'0')}>{d}</option>)}
      </select>
      <select value={month} onChange={e=>{setMonth(e.target.value);update(year,e.target.value,day)}}   style={{...sel,flex:2}}>
        <option value="">{isAr?'الشهر':'Month'}</option>
        {months.map((m,i)=><option key={i} value={String(i+1).padStart(2,'0')}>{m}</option>)}
      </select>
      <select value={year}  onChange={e=>{setYear(e.target.value);update(e.target.value,month,day)}}   style={sel}>
        <option value="">{isAr?'سنة':'Year'}</option>
        {years.map(y=><option key={y} value={String(y)}>{y}</option>)}
      </select>
    </div>
  )
}

const FormLoadingScreen = ({ msg, subMsg }: { msg:string; subMsg:string }) => (
  <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.95)',backdropFilter:'blur(8px)',zIndex:9999}}>
    <div style={{textAlign:'center',padding:'2rem',maxWidth:400,width:'100%'}}>
      <div style={{background:PRIMARY_SOFT,borderRadius:20,padding:'20px 24px',marginBottom:'1.5rem',border:`1px solid ${BORDER}`}}>
        <ECGAnimation height={100} showLetters={true} speed={0.7} />
      </div>
      <h3 style={{fontSize:18,fontWeight:600,color:TEXT_DARK,marginBottom:8}}>{msg}</h3>
      <p style={{fontSize:13,color:TEXT_MUTED,marginBottom:24}}>{subMsg}</p>
      <div style={{display:'flex',justifyContent:'center',gap:8}}>
        {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:PRIMARY,animation:`pulse-soft 1.5s ${i*0.2}s infinite`}} />)}
      </div>
    </div>
  </div>
)

const FormField = ({ label, required, children, error }: { label:string; required?:boolean; children:React.ReactNode; error?:string }) => {
  const fieldId = useId()
  const errorId = `${fieldId}-error`
  const child = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, {
        id: fieldId,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
        'aria-required': required || undefined,
      })
    : children
  return (
    <div style={{marginBottom:20}}>
      <label htmlFor={fieldId} style={{display:'block',fontSize:12,fontWeight:600,color:TEXT_MUTED,marginBottom:8,letterSpacing:'0.5px'}}>
        {label} {required && <span style={{color:ERROR_TEXT}}>*</span>}
      </label>
      {child}
      {error && <p id={errorId} role="alert" style={{fontSize:11,color:ERROR_TEXT,marginTop:5,marginBottom:0}}>{error}</p>}
    </div>
  )
}

const FormSection = ({ title, children }: { title:string; children:React.ReactNode }) => (
  <div className="form-section" style={{background:CARD_BG,border:`1px solid ${BORDER}`,borderRadius:20,padding:'20px'}}>
    <h3 style={{fontSize:16,fontWeight:600,color:TEXT_DARK,margin:'0 0 16px 0',paddingBottom:10,borderBottom:`2px solid ${PRIMARY_SOFT}`,display:'inline-block'}}>{title}</h3>
    <div style={{marginTop:8}}>{children}</div>
  </div>
)

const inputStyle = (isAr:boolean): React.CSSProperties => ({
  width:'100%', background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:12,
  padding:'10px 14px', fontSize:14, fontFamily:isAr?"'Cairo',sans-serif":"'Inter',sans-serif",
  color:TEXT_DARK, outline:'none', transition:'all 0.2s ease',
})

export default function AddPatient() {
  const navigate = useNavigate()
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [lang, setLang]         = useState<'ar'|'en'>(getStoredLang())

  // ✅ Step: 'form' | 'insurance'
  const [step, setStep]         = useState<'form'|'insurance'>('form')
  const [savedPatientId, setSavedPatientId] = useState<string|null>(null)
  const [companies, setCompanies]  = useState<any[]>([])
  const [insLoading, setInsLoading] = useState(false)
  const [insForm, setInsForm] = useState({
    insuranceCompanyId:'', policyNumber:'', membershipNumber:'',
    coverageRate:'', startDate:'', endDate:'', isPrimary:true, notes:'',
  })

  const [form, setForm] = useState({
    fullName:'', phone:'', phone2:'', gender:'', dateOfBirth:'',
    nationalId:'', bloodType:'', address:'', email:'',
    emergencyContact:'', emergencyPhone:'', allergies:'',
    chronicDiseases:'', occupation:'', maritalStatus:'', notes:'',
  })
  const [validationErrors, setValidationErrors] = useState<Record<string,string>>({})
  useUnsavedChangesWarning(form)

  useEffect(() => {
    const styleId = 'cura-add-patient-css'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style'); style.id=styleId; style.textContent=globalCss; document.head.appendChild(style)
    }
    const handleLangChange = (e:Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    // جلب شركات التأمين مسبقاً
    api.get('/insurance/companies').then(r=>setCompanies(r.data)).catch(()=>{})
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  const handleChange = (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => {
    const {name,value} = e.target
    setForm(prev=>({...prev,[name]:value}))
    if (validationErrors[name]) setValidationErrors(prev=>({...prev,[name]:''}))
  }

  const validateForm = (): boolean => {
    const errors: Record<string,string> = {}
    const t = T[lang]
    if (!form.fullName.trim()) errors.fullName = t.required
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = t.emailInvalid
    if (form.phone && !/^[\d\s\+-]{8,}$/.test(form.phone.replace(/\s/g,''))) errors.phone = t.phoneInvalid
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setError(''); setLoading(true)
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([_,v])=>v!==''))
      const res = await api.post('/patients', payload)
      setSavedPatientId(res.data.id || res.data.Id)
      setStep('insurance')  // ✅ انتقل لخطوة التأمين
    } catch (err:any) {
      const errData = err.response?.data
      if (typeof errData==='string') setError(errData)
      else if (errData?.errors) setError(Object.values(errData.errors).flat().join('، ') as string)
      else setError(T[lang].error)
    } finally { setLoading(false) }
  }

  const handleSaveInsurance = async () => {
    if (!savedPatientId || !insForm.insuranceCompanyId || !insForm.policyNumber || !insForm.startDate || !insForm.endDate) return
    setInsLoading(true)
    try {
      await api.post(`/insurance/patient?lang=${lang}`, {
        patientId: savedPatientId,
        insuranceCompanyId: insForm.insuranceCompanyId,
        policyNumber: insForm.policyNumber,
        membershipNumber: insForm.membershipNumber || null,
        coverageRate: insForm.coverageRate ? Number(insForm.coverageRate) : null,
        startDate: insForm.startDate,
        endDate: insForm.endDate,
        isPrimary: insForm.isPrimary,
        notes: insForm.notes || null,
      })
      navigate('/patients')
    } catch (err:any) {
      setError(err.response?.data || T[lang].error)
    } finally { setInsLoading(false) }
  }

  const t    = T[lang]
  const isAr = lang === 'ar'
  const bloodTypes = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
  const maritalStatuses = [{value:'single',label:t.single},{value:'married',label:t.married},{value:'divorced',label:t.divorced},{value:'widowed',label:t.widowed}]

  // ✅ خطوة التأمين
  if (step === 'insurance') {
    return (
      <div className="add-patient-shell" dir={isAr?'rtl':'ltr'} style={{background:'#F8FAFA',minHeight:'100vh',padding:24,fontFamily:isAr?"'Noto Kufi Arabic',sans-serif":"'Inter',sans-serif"}}>
        <div style={{maxWidth:700,margin:'0 auto'}}>
          {/* Success Banner */}
          <div style={{background:SUCCESS_BG,border:`1px solid ${SUCCESS}`,borderRadius:16,padding:'16px 20px',marginBottom:24,display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:28}}>✅</span>
            <div>
              <p style={{fontSize:15,fontWeight:700,color:SUCCESS,margin:0}}>{t.patientSaved}</p>
              <p style={{fontSize:12,color:TEXT_MUTED,margin:'4px 0 0'}}>{t.insuranceHint}</p>
            </div>
          </div>

          <FormSection title={t.insuranceSection}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <FormField label={t.insCompany + ' *'}>
                <select value={insForm.insuranceCompanyId} onChange={e=>setInsForm({...insForm,insuranceCompanyId:e.target.value})}
                  style={{...inputStyle(isAr),cursor:'pointer'}}>
                  <option value="">{isAr?'اختر شركة...':'Select company...'}</option>
                  {companies.map(c=><option key={c.id} value={c.id}>{c.name} ({c.coverageRate}%)</option>)}
                </select>
              </FormField>
              <FormField label={t.insPolicy + ' *'}>
                <input value={insForm.policyNumber} onChange={e=>setInsForm({...insForm,policyNumber:e.target.value})}
                  style={{...inputStyle(false)}} placeholder="INS-2026-XXXX" />
              </FormField>
              <FormField label={t.insMembership}>
                <input value={insForm.membershipNumber} onChange={e=>setInsForm({...insForm,membershipNumber:e.target.value})}
                  style={{...inputStyle(false)}} />
              </FormField>
              <FormField label={t.insCoverage}>
                <input type="number" min="0" max="100" value={insForm.coverageRate}
                  onChange={e=>setInsForm({...insForm,coverageRate:e.target.value})}
                  style={{...inputStyle(false)}} placeholder={isAr?'اتركه فارغاً لنسبة الشركة':'Leave empty for company rate'} />
              </FormField>
              <FormField label={t.insStart + ' *'}>
                <input type="date" value={insForm.startDate} onChange={e=>setInsForm({...insForm,startDate:e.target.value})}
                  style={{...inputStyle(false)}} />
              </FormField>
              <FormField label={t.insEnd + ' *'}>
                <input type="date" value={insForm.endDate} onChange={e=>setInsForm({...insForm,endDate:e.target.value})}
                  style={{...inputStyle(false)}} />
              </FormField>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
              <input type="checkbox" id="isPrimary" checked={insForm.isPrimary} onChange={e=>setInsForm({...insForm,isPrimary:e.target.checked})} />
              <label htmlFor="isPrimary" style={{fontSize:13,color:TEXT_DARK,cursor:'pointer'}}>{t.insPrimary}</label>
            </div>

            {error && <div style={{background:ERROR_BG,border:`1px solid ${ERROR_TEXT}40`,borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:13,color:ERROR_TEXT}}>⚠️ {error}</div>}

            <div style={{display:'flex',gap:10}}>
              <button onClick={handleSaveInsurance} disabled={insLoading||!insForm.insuranceCompanyId||!insForm.policyNumber||!insForm.startDate||!insForm.endDate}
                style={{flex:1,padding:'11px',background:PRIMARY,color:'#FFF',border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',opacity:insLoading?0.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                {insLoading ? <><span style={{width:14,height:14,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#FFF',animation:'spin 0.8s linear infinite'}} />{t.savingInsurance}</> : `💾 ${t.addInsuranceNow}`}
              </button>
              <button onClick={()=>navigate('/patients')}
                style={{padding:'11px 22px',background:'transparent',border:`1px solid ${BORDER}`,borderRadius:10,fontSize:13,cursor:'pointer',color:TEXT_MUTED}}>
                {t.skipInsurance}
              </button>
            </div>
          </FormSection>
        </div>
      </div>
    )
  }

  // ✅ خطوة النموذج الأساسي
  return (
    <div className="add-patient-shell" dir={isAr?'rtl':'ltr'} style={{background:'#F8FAFA',minHeight:'100vh',padding:'24px'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <button onClick={()=>navigate('/patients')}
            style={{display:'inline-flex',alignItems:'center',gap:6,background:'none',border:'none',color:TEXT_MUTED,fontSize:13,cursor:'pointer',marginBottom:16}}
            onMouseEnter={e=>e.currentTarget.style.color=PRIMARY} onMouseLeave={e=>e.currentTarget.style.color=TEXT_MUTED}>
            ← {t.back}
          </button>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:PRIMARY_SOFT,border:`1px solid ${BORDER}`,borderRadius:100,padding:'4px 16px',fontSize:11,fontWeight:600,color:PRIMARY,marginBottom:12}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:PRIMARY,animation:'soft-pulse 2s infinite'}} />
            {isAr?'مريض جديد':'New Patient'}
          </div>
          <h2 className="add-patient-title" style={{fontFamily:"'DM Serif Display','Georgia',serif",fontSize:28,fontWeight:500,color:TEXT_DARK,margin:0}}>{t.title}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:24}}>
            <FormSection title={t.basicInfo}>
              <FormField label={t.fullName} required error={validationErrors.fullName}>
                <input name="fullName" value={form.fullName} onChange={handleChange} placeholder={t.fullNamePlaceholder} className="form-input" style={inputStyle(isAr)} />
              </FormField>
              <FormField label={t.phone} error={validationErrors.phone}>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder={t.phonePlaceholder} className="form-input" style={inputStyle(isAr)} />
              </FormField>
              <FormField label={t.phone2}>
                <input type="tel" name="phone2" value={form.phone2} onChange={handleChange} placeholder={t.phone2Placeholder} className="form-input" style={inputStyle(isAr)} />
              </FormField>
              <FormField label={t.gender}>
                <select name="gender" value={form.gender} onChange={handleChange} className="form-select" style={{...inputStyle(isAr),cursor:'pointer'}}>
                  <option value="">{t.genderPlaceholder}</option>
                  <option value="male">{t.male}</option>
                  <option value="female">{t.female}</option>
                </select>
              </FormField>
              <FormField label={t.dateOfBirth}>
                <DatePicker value={form.dateOfBirth} onChange={val=>setForm(prev=>({...prev,dateOfBirth:val}))} isAr={isAr} />
              </FormField>
              <FormField label={t.nationalId} error={validationErrors.nationalId}>
                <input name="nationalId" value={form.nationalId} onChange={handleChange} placeholder={t.nationalIdPlaceholder} className="form-input" style={inputStyle(isAr)} />
              </FormField>
              <FormField label={t.bloodType}>
                <select name="bloodType" value={form.bloodType} onChange={handleChange} className="form-select" style={{...inputStyle(isAr),cursor:'pointer'}}>
                  <option value="">{t.bloodTypePlaceholder}</option>
                  {bloodTypes.map(bt=><option key={bt} value={bt}>{bt}</option>)}
                </select>
              </FormField>
              <FormField label={t.maritalStatus}>
                <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange} className="form-select" style={{...inputStyle(isAr),cursor:'pointer'}}>
                  <option value="">{t.maritalStatusPlaceholder}</option>
                  {maritalStatuses.map(ms=><option key={ms.value} value={ms.value}>{ms.label}</option>)}
                </select>
              </FormField>
              <FormField label={t.occupation}>
                <input name="occupation" value={form.occupation} onChange={handleChange} placeholder={t.occupationPlaceholder} className="form-input" style={inputStyle(isAr)} />
              </FormField>
            </FormSection>

            <FormSection title={t.additionalInfo}>
              <FormField label={t.address}>
                <input name="address" value={form.address} onChange={handleChange} placeholder={t.addressPlaceholder} className="form-input" style={inputStyle(isAr)} />
              </FormField>
              <FormField label={t.email} error={validationErrors.email}>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder={t.emailPlaceholder} className="form-input" style={inputStyle(isAr)} />
              </FormField>
              <FormField label={t.emergencyContact}>
                <input name="emergencyContact" value={form.emergencyContact} onChange={handleChange} placeholder={t.emergencyContactPlaceholder} className="form-input" style={inputStyle(isAr)} />
              </FormField>
              <FormField label={t.emergencyPhone}>
                <input type="tel" name="emergencyPhone" value={form.emergencyPhone} onChange={handleChange} placeholder={t.emergencyPhonePlaceholder} className="form-input" style={inputStyle(isAr)} />
              </FormField>
              <FormField label={t.allergies}>
                <input name="allergies" value={form.allergies} onChange={handleChange} placeholder={t.allergiesPlaceholder} className="form-input" style={inputStyle(isAr)} />
              </FormField>
              <FormField label={t.chronicDiseases}>
                <input name="chronicDiseases" value={form.chronicDiseases} onChange={handleChange} placeholder={t.chronicDiseasesPlaceholder} className="form-input" style={inputStyle(isAr)} />
              </FormField>
            </FormSection>
          </div>

          <div style={{marginTop:24}}>
            <FormSection title={t.notes}>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={4} placeholder={t.notesPlaceholder} className="form-textarea"
                style={{...inputStyle(isAr),resize:'vertical'}} />
            </FormSection>
          </div>

          {error && (
            <div style={{background:ERROR_BG,border:`1px solid ${ERROR_TEXT}40`,borderRadius:12,padding:'12px 16px',marginTop:24,display:'flex',alignItems:'center',gap:10}}>
              <span>⚠️</span><span style={{fontSize:13,color:ERROR_TEXT}}>{error}</span>
            </div>
          )}

          <div style={{display:'flex',gap:12,marginTop:24,paddingTop:8}}>
            <button type="submit" disabled={loading}
              style={{flex:1,background:PRIMARY,color:'#FFF',border:'none',borderRadius:12,padding:'12px',fontSize:14,fontWeight:600,cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}
              onMouseEnter={e=>{if(!loading)e.currentTarget.style.background=PRIMARY_DARK}}
              onMouseLeave={e=>{if(!loading)e.currentTarget.style.background=PRIMARY}}>
              {loading ? <><span style={{width:14,height:14,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#FFF',animation:'spin 0.8s linear infinite'}} />{t.saving}</> : t.submit}
            </button>
            <button type="button" onClick={()=>navigate('/patients')}
              style={{padding:'12px 32px',background:'transparent',border:`1px solid ${BORDER}`,borderRadius:12,fontSize:14,fontWeight:500,color:TEXT_MUTED,cursor:'pointer'}}
              onMouseEnter={e=>e.currentTarget.style.background=PRIMARY_SOFT}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}