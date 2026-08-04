import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { ECGAnimation } from '../components/ECGAnimation'
import { hasPermission } from '../utils/permissions'
import { PatientInsuranceTab } from '../components/PatientInsuranceTab'
import PatientAttachmentsTab from '../components/PatientAttachmentsTab'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const globalCss = `
@keyframes fade-up { 
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes soft-pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
@keyframes pulse-soft { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
@keyframes slide-in { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
.patient-detail-shell { animation: fade-up 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) both; }
.info-section { animation: slide-in 0.3s ease both; }
.info-section:nth-child(1) { animation-delay: 0.05s; }
.info-section:nth-child(2) { animation-delay: 0.1s; }
.info-section:nth-child(3) { animation-delay: 0.15s; }
.patient-detail-shell * { box-sizing:border-box; }
.patient-detail-shell ::-webkit-scrollbar { width: 5px; }
.patient-detail-shell ::-webkit-scrollbar-track { background: #E8EDEE; border-radius: 4px; }
.patient-detail-shell ::-webkit-scrollbar-thumb { background: #8BAFB1; border-radius: 4px; }
.ptab-btn { padding:8px 18px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; border:1px solid #DCE5E5; background:transparent; color:#6B8A8C; }
.ptab-btn.active { background:#5B8C8F; color:#FFF; border-color:#5B8C8F; }
.ptab-btn:not(.active):hover { background:#E8F0F0; color:#5B8C8F; }
@media(max-width: 768px) {
  .patient-detail-title { font-size: 24px !important; }
  .info-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
  .action-buttons { flex-direction: column !important; }
}
`

const PRIMARY      = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK    = '#2C3E3F'
const TEXT_MUTED   = '#6B8A8C'
const BORDER       = '#DCE5E5'
const CARD_BG      = '#FFFFFF'
const SUCCESS      = '#4A7679'
const DANGER       = '#C4A77D'

const T = {
  ar: {
    back: 'رجوع', edit: 'تعديل', delete: 'حذف',
    basicInfo: 'البيانات الأساسية', additionalInfo: 'معلومات إضافية',
    notes: 'ملاحظات', status: 'الحالة', registrationDate: 'تاريخ التسجيل',
    active: 'نشط', stopped: 'موقوف', fullName: 'الاسم', phone: 'الهاتف',
    phone2: 'هاتف 2', gender: 'الجنس', male: 'ذكر', female: 'أنثى',
    dateOfBirth: 'تاريخ الميلاد', age: 'العمر', nationalId: 'الرقم الوطني',
    bloodType: 'فصيلة الدم', maritalStatus: 'الحالة الاجتماعية',
    occupation: 'المهنة', address: 'العنوان', email: 'البريد الإلكتروني',
    emergencyContact: 'شخص الطوارئ', emergencyPhone: 'هاتف الطوارئ',
    allergies: 'الحساسية', chronicDiseases: 'أمراض مزمنة',
    deleteConfirm: 'هل أنت متأكد من حذف هذا المريض؟',
    deleteError: 'حدث خطأ أثناء الحذف', notFound: 'المريض غير موجود',
    loadingMessage: 'جاري تحميل بيانات المريض',
    loadingSub: 'يرجى الانتظار أثناء تحميل المعلومات', yearsOld: 'سنة',
    // Tabs
    tabInfo: '📋 البيانات', tabInsurance: '🏥 التأمين', tabAttachments: '📎 المرفقات',
  },
  en: {
    back: 'Back', edit: 'Edit', delete: 'Delete',
    basicInfo: 'Basic Information', additionalInfo: 'Additional Information',
    notes: 'Notes', status: 'Status', registrationDate: 'Registration Date',
    active: 'Active', stopped: 'Stopped', fullName: 'Full Name', phone: 'Phone',
    phone2: 'Phone 2', gender: 'Gender', male: 'Male', female: 'Female',
    dateOfBirth: 'Date of Birth', age: 'Age', nationalId: 'National ID',
    bloodType: 'Blood Type', maritalStatus: 'Marital Status',
    occupation: 'Occupation', address: 'Address', email: 'Email',
    emergencyContact: 'Emergency Contact', emergencyPhone: 'Emergency Phone',
    allergies: 'Allergies', chronicDiseases: 'Chronic Diseases',
    deleteConfirm: 'Are you sure you want to delete this patient?',
    deleteError: 'An error occurred while deleting', notFound: 'Patient not found',
    loadingMessage: 'Loading Patient Data',
    loadingSub: 'Please wait while we load patient information', yearsOld: 'years',
    // Tabs
    tabInfo: '📋 Info', tabInsurance: '🏥 Insurance', tabAttachments: '📎 Attachments',
  },
}

interface PatientDetail {
  id: string; patientNumber: number; fullName: string; phone: string | null
  phone2: string | null; gender: string | null; dateOfBirth: string | null
  nationalId: string | null; bloodType: string | null; address: string | null
  email: string | null; emergencyContact: string | null; emergencyPhone: string | null
  allergies: string | null; chronicDiseases: string | null; occupation: string | null
  maritalStatus: string | null; notes: string | null; stopped: boolean; createdAt: string
}

const calculateAge = (dateOfBirth?: string | null): number | null => {
  if (!dateOfBirth) return null
  const birthDate = new Date(dateOfBirth)
  if (isNaN(birthDate.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

const PatientLoadingScreen = ({ msg, subMsg }: { msg: string; subMsg: string }) => (
  <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.95)', backdropFilter:'blur(8px)', zIndex:9999 }}>
    <div style={{ textAlign:'center', padding:'2rem', maxWidth:400, width:'100%' }}>
      <div style={{ background:PRIMARY_SOFT, borderRadius:20, padding:'20px 24px', marginBottom:'1.5rem', border:`1px solid ${BORDER}` }}>
        <ECGAnimation height={100} showLetters={true} speed={0.7} />
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, fontSize:9, color:TEXT_MUTED }}>
          <span>👤 FETCHING DATA</span><span>⚡ LOADING</span><span>📊 SECURE</span>
        </div>
      </div>
      <h3 style={{ fontSize:18, fontWeight:600, color:TEXT_DARK, marginBottom:8, fontFamily:"'Playfair Display',serif" }}>{msg}</h3>
      <p style={{ fontSize:13, color:TEXT_MUTED, marginBottom:24 }}>{subMsg}</p>
      <div style={{ display:'flex', justifyContent:'center', gap:8 }}>
        {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:'50%', background:PRIMARY, animation:`pulse-soft 1.5s ${i*0.2}s infinite` }} />)}
      </div>
    </div>
  </div>
)

const InfoRow = ({ label, value, isAr }: { label:string; value:string|null|undefined; isAr:boolean }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'8px 0', borderBottom:`1px solid ${BORDER}` }}>
    <span style={{ fontSize:12, color:TEXT_MUTED, fontWeight:500, minWidth:isAr?'auto':120 }}>{label}</span>
    <span style={{ fontSize:13, color:TEXT_DARK, fontWeight:500, textAlign:isAr?'left':'right', wordBreak:'break-word', maxWidth:'60%' }}>
      {value && value.trim()!==''?value:'—'}
    </span>
  </div>
)

const InfoSection = ({ title, children }: { title:string; children:React.ReactNode }) => (
  <div className="info-section" style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:20, padding:'20px' }}>
    <h3 style={{ fontSize:16, fontWeight:600, color:TEXT_DARK, margin:'0 0 16px 0', paddingBottom:10, borderBottom:`2px solid ${PRIMARY_SOFT}`, display:'inline-block' }}>{title}</h3>
    <div style={{ marginTop:8 }}>{children}</div>
  </div>
)

const StatusBadge = ({ stopped, isAr }: { stopped:boolean; isAr:boolean }) => {
  const t = T[isAr?'ar':'en']
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:100, fontSize:12, fontWeight:500, background:stopped?`${DANGER}15`:`${SUCCESS}15`, color:stopped?DANGER:SUCCESS }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:stopped?DANGER:SUCCESS }} />
      {stopped?t.stopped:t.active}
    </span>
  )
}

const AgeBadge = ({ dateOfBirth, lang }: { dateOfBirth?:string|null; lang:'ar'|'en' }) => {
  const t = T[lang]
  const age = calculateAge(dateOfBirth)
  if (age===null) return <span style={{ fontSize:13, color:TEXT_MUTED }}>—</span>
  let color=PRIMARY, bg=PRIMARY_SOFT
  if (age<12){color='#22C55E';bg='#E8F5E9'}
  else if (age<18){color='#F59E0B';bg='#FFF8E1'}
  else if (age>=60){color='#EF4444';bg='#FFF5F5'}
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:100, fontSize:13, fontWeight:600, background:bg, color }}>
      <span style={{ fontSize:12 }}>🎂</span> {age} {t.yearsOld}
    </span>
  )
}

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<PatientDetail|null>(null)
  const [loading, setLoading]  = useState(true)
  const [lang, setLang]        = useState<'ar'|'en'>(getStoredLang())
  const [activeTab, setActiveTab] = useState<'info'|'insurance'|'attachments'>('info')  // ✅ تبويبات

  useEffect(() => {
    const styleId = 'cura-patient-detail-css'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style'); style.id=styleId; style.textContent=globalCss; document.head.appendChild(style)
    }
    const handleLangChange = (e:Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  useEffect(() => {
    const fetchPatient = async () => {
      const startTime = Date.now()
      try {
        const response = await api.get(`/patients/${id}`)
        setPatient(response.data)
      } catch {
        setTimeout(()=>navigate('/patients'), 2000)
      } finally {
        const elapsed = Date.now()-startTime
        setTimeout(()=>setLoading(false), Math.max(0, 800-elapsed))
      }
    }
    fetchPatient()
  }, [id, navigate])

  const handleDelete = async () => {
    const t = T[lang]
    if (!confirm(t.deleteConfirm)) return
    try { await api.delete(`/patients/${id}`); navigate('/patients') }
    catch { alert(t.deleteError) }
  }

  const t    = T[lang]
  const isAr = lang === 'ar'

  const formatGender = (gender:string|null) => gender==='male'?t.male:gender==='female'?t.female:gender
  const formatDate   = (dateStr:string|null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString(isAr?'ar-SA':'en-US', { year:'numeric', month:'long', day:'numeric' })
  }

  if (loading) return <PatientLoadingScreen msg={t.loadingMessage} subMsg={t.loadingSub} />

  if (!patient) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'50vh' }}>
      <div style={{ textAlign:'center', background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:20, padding:'40px' }}>
        <span style={{ fontSize:48, opacity:0.5 }}>👤</span>
        <p style={{ fontSize:14, color:TEXT_MUTED, marginTop:16 }}>{t.notFound}</p>
      </div>
    </div>
  )

  const age = calculateAge(patient.dateOfBirth)

  return (
    <div className="patient-detail-shell" style={{ direction:isAr?'rtl':'ltr', background:'#F8FAFA', minHeight:'100vh', padding:'24px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16, marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <button onClick={()=>navigate('/patients')}
              style={{ display:'inline-flex', alignItems:'center', gap:6, background:'none', border:'none', color:TEXT_MUTED, fontSize:13, cursor:'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.color=PRIMARY} onMouseLeave={e=>e.currentTarget.style.color=TEXT_MUTED}>
              ← {t.back}
            </button>
            <div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:PRIMARY_SOFT, border:`1px solid ${BORDER}`, borderRadius:100, padding:'4px 12px', fontSize:10, fontWeight:600, color:PRIMARY, marginBottom:8 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:PRIMARY, animation:'soft-pulse 2s infinite' }} />
                #{patient.patientNumber}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                <h2 className="patient-detail-title" style={{ fontFamily:"'DM Serif Display','Georgia',serif", fontSize:28, fontWeight:500, color:TEXT_DARK, margin:0 }}>
                  {patient.fullName}
                </h2>
                {age!==null && <AgeBadge dateOfBirth={patient.dateOfBirth} lang={lang} />}
              </div>
            </div>
          </div>
          <div className="action-buttons" style={{ display:'flex', gap:10 }}>
            {hasPermission('patients.edit') && (
              <button onClick={()=>navigate(`/patients/${id}/edit`)}
                style={{ background:PRIMARY, color:'#FFF', border:'none', borderRadius:10, padding:'8px 20px', fontSize:13, fontWeight:500, cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.background='#4A7679'} onMouseLeave={e=>e.currentTarget.style.background=PRIMARY}>
                ✏️ {t.edit}
              </button>
            )}
            {hasPermission('patients.delete') && (
              <button onClick={handleDelete}
                style={{ background:'transparent', border:`1px solid ${DANGER}40`, borderRadius:10, padding:'8px 20px', fontSize:13, fontWeight:500, color:DANGER, cursor:'pointer' }}
                onMouseEnter={e=>{e.currentTarget.style.background=`${DANGER}10`;e.currentTarget.style.borderColor=DANGER}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor=`${DANGER}40`}}>
                🗑️ {t.delete}
              </button>
            )}
          </div>
        </div>

        {/* ✅ Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:24 }}>
          <button className={`ptab-btn${activeTab==='info'?' active':''}`} onClick={()=>setActiveTab('info')}>
            {t.tabInfo}
          </button>
          <button className={`ptab-btn${activeTab==='insurance'?' active':''}`} onClick={()=>setActiveTab('insurance')}>
            {t.tabInsurance}
          </button>
          <button className={`ptab-btn${activeTab==='attachments'?' active':''}`} onClick={()=>setActiveTab('attachments')}>
            {t.tabAttachments}
          </button>
        </div>

        {/* ✅ Tab: Info */}
        {activeTab==='info' && (
          <>
            <div className="info-grid" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:24 }}>
              <InfoSection title={t.basicInfo}>
                <InfoRow label={t.fullName}      value={patient.fullName}                    isAr={isAr} />
                <InfoRow label={t.phone}         value={patient.phone}                       isAr={isAr} />
                <InfoRow label={t.phone2}        value={patient.phone2}                      isAr={isAr} />
                <InfoRow label={t.gender}        value={formatGender(patient.gender)}        isAr={isAr} />
                <InfoRow label={t.dateOfBirth}   value={formatDate(patient.dateOfBirth)}     isAr={isAr} />
                <InfoRow label={t.age}           value={age!==null?`${age} ${t.yearsOld}`:null} isAr={isAr} />
                <InfoRow label={t.nationalId}    value={patient.nationalId}                  isAr={isAr} />
                <InfoRow label={t.bloodType}     value={patient.bloodType}                   isAr={isAr} />
                <InfoRow label={t.maritalStatus} value={patient.maritalStatus}               isAr={isAr} />
                <InfoRow label={t.occupation}    value={patient.occupation}                  isAr={isAr} />
              </InfoSection>
              <InfoSection title={t.additionalInfo}>
                <InfoRow label={t.address}          value={patient.address}          isAr={isAr} />
                <InfoRow label={t.email}            value={patient.email}            isAr={isAr} />
                <InfoRow label={t.emergencyContact} value={patient.emergencyContact} isAr={isAr} />
                <InfoRow label={t.emergencyPhone}   value={patient.emergencyPhone}   isAr={isAr} />
                <InfoRow label={t.allergies}        value={patient.allergies}        isAr={isAr} />
                <InfoRow label={t.chronicDiseases}  value={patient.chronicDiseases}  isAr={isAr} />
              </InfoSection>
            </div>

            {patient.notes && patient.notes.trim()!=='' && (
              <div style={{ marginTop:24 }}>
                <InfoSection title={t.notes}>
                  <p style={{ fontSize:13, color:TEXT_MUTED, lineHeight:1.6, margin:0, padding:'4px 0' }}>{patient.notes}</p>
                </InfoSection>
              </div>
            )}

            <div style={{ marginTop:24 }}>
              <div style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:16, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
                <div>
                  <p style={{ fontSize:11, color:TEXT_MUTED, marginBottom:4 }}>{t.registrationDate}</p>
                  <p style={{ fontSize:13, fontWeight:500, color:TEXT_DARK }}>{formatDate(patient.createdAt)}</p>
                </div>
                <div>
                  <p style={{ fontSize:11, color:TEXT_MUTED, marginBottom:4 }}>{t.status}</p>
                  <StatusBadge stopped={patient.stopped} isAr={isAr} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ✅ Tab: Insurance */}
        {activeTab==='insurance' && (
          <div style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:20, padding:24 }}>
            <PatientInsuranceTab patientId={patient.id} lang={lang} isAr={isAr} />
          </div>
        )}

        {/* ✅ Tab: Attachments */}
        {activeTab==='attachments' && (
          <PatientAttachmentsTab patientId={patient.id} lang={lang} />
        )}

      </div>
    </div>
  )
}