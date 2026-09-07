import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { ECGAnimation } from '../components/ECGAnimation'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'

const T = {
  ar: {
    back: 'رجوع', title: 'سجل الزيارات',
    diagnosis: 'التشخيص', prescription: 'الوصفة الطبية',
    tests: 'الفحوصات', notes: 'ملاحظات', nextVisit: 'الزيارة القادمة',
    cost: 'التكلفة', doctor: 'الطبيب', source: 'المصدر',
    appointment: 'موعد', queue: 'دور',
    noNotes: 'لا توجد زيارات مسجلة بعد', loading: 'جاري التحميل...',
    riyal: 'د.أ', visitDate: 'تاريخ الزيارة',
    loadFailed: 'تعذّر تحميل سجل الزيارات',
  },
  en: {
    back: 'Back', title: 'Visit History',
    diagnosis: 'Diagnosis', prescription: 'Prescription',
    tests: 'Tests & Imaging', notes: 'Notes', nextVisit: 'Next Visit',
    cost: 'Cost', doctor: 'Doctor', source: 'Source',
    appointment: 'Appointment', queue: 'Queue',
    noNotes: 'No visits recorded yet', loading: 'Loading...',
    riyal: 'JD', visitDate: 'Visit Date',
    loadFailed: 'Failed to load visit history',
  },
}

interface VisitNote {
  id: string; diagnosis?: string; prescription?: string; tests?: string
  notes?: string; nextVisitDate?: string; cost?: number
  doctorName?: string; appointmentDate?: string; source: 'appointment' | 'queue'
  createdAt: string
}

export default function PatientVisitNotes() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [notes, setNotes] = useState<VisitNote[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [patientName, setPatientName] = useState('')

  useEffect(() => {
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notesRes, patientRes] = await Promise.all([
          api.get(`/visitnotes/patient/${patientId}`),
          api.get(`/patients/${patientId}`),
        ])
        setNotes(notesRes.data)
        setPatientName(patientRes.data.fullName)
      } catch (err: any) {
        if (err?.response?.status === 401) { navigate('/patients'); return }
        setLoadFailed(true)
        setTimeout(() => navigate('/patients'), 2000)
      }
      finally { setLoading(false) }
    }
    fetchData()
  }, [patientId])

  const t = T[lang]
  const isAr = lang === 'ar'

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isAr?'ar-SA':undefined, { year:'numeric', month:'long', day:'numeric' })
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center', maxWidth:300 }}>
        <div style={{ background:PRIMARY_SOFT, borderRadius:20, padding:'20px 24px', marginBottom:16, border:`1px solid ${BORDER}` }}>
          <ECGAnimation height={80} showLetters={false} speed={0.7} />
        </div>
        <p style={{ color:TEXT_MUTED, fontSize:14 }}>{t.loading}</p>
      </div>
    </div>
  )

  if (loadFailed) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center', background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:20, padding:40 }}>
        <span style={{ fontSize:40, opacity:0.5 }}>⚠️</span>
        <p style={{ fontSize:14, color:TEXT_MUTED, marginTop:16 }}>{t.loadFailed}</p>
      </div>
    </div>
  )

  return (
    <div dir={isAr?'rtl':'ltr'} style={{ background:'#F8FAFA', minHeight:'100vh', padding:24, fontFamily:isAr?"'Cairo',sans-serif":"'Inter',sans-serif" }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <button onClick={()=>navigate(-1)}
            style={{ display:'inline-flex', alignItems:'center', gap:6, background:'none', border:'none', color:TEXT_MUTED, fontSize:13, cursor:'pointer', marginBottom:16 }}
            onMouseEnter={e=>e.currentTarget.style.color=PRIMARY} onMouseLeave={e=>e.currentTarget.style.color=TEXT_MUTED}>
            ← {t.back}
          </button>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:PRIMARY_SOFT, border:`1px solid ${BORDER}`, borderRadius:100, padding:'4px 16px', fontSize:11, fontWeight:600, color:PRIMARY, marginBottom:10 }}>
            🩺 {t.title}
          </div>
          <h2 style={{ fontFamily:"'DM Serif Display','Georgia',serif", fontSize:28, fontWeight:500, color:TEXT_DARK, margin:0 }}>
            {patientName}
          </h2>
          <p style={{ fontSize:13, color:TEXT_MUTED, margin:'4px 0 0' }}>
            📊 {notes.length} {isAr ? 'زيارة مسجلة' : 'recorded visits'}
          </p>
        </div>

        {/* القائمة */}
        {notes.length === 0 ? (
          <div style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:20, padding:'60px 24px', textAlign:'center' }}>
            <span style={{ fontSize:56, opacity:0.5 }}>🩺</span>
            <p style={{ fontSize:14, color:TEXT_MUTED, marginTop:16 }}>{t.noNotes}</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {notes.map((note, i) => (
              <div key={note.id} style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:20, overflow:'hidden' }}>

                {/* Header البطاقة */}
                <div style={{ padding:'14px 20px', background:PRIMARY_SOFT, borderBottom:`1px solid ${BORDER}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:PRIMARY, display:'flex', alignItems:'center', justifyContent:'center', color:'#FFF', fontSize:13, fontWeight:700 }}>
                      {notes.length - i}
                    </div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:TEXT_DARK, margin:0 }}>
                        {note.appointmentDate ? formatDate(note.appointmentDate) : formatDate(note.createdAt)}
                      </p>
                      {note.doctorName && <p style={{ fontSize:11, color:TEXT_MUTED, margin:0 }}>👨‍⚕️ {note.doctorName}</p>}
                    </div>
                  </div>
                  <span style={{ fontSize:11, padding:'3px 10px', borderRadius:100, fontWeight:600,
                    background: note.source==='appointment' ? '#E8F5E9' : '#FFF8E1',
                    color: note.source==='appointment' ? '#16A34A' : '#D97706',
                    border: `1px solid ${note.source==='appointment' ? '#86EFAC' : '#FCD34D'}`,
                  }}>
                    {note.source==='appointment' ? `📅 ${t.appointment}` : `🔢 ${t.queue}`}
                  </span>
                </div>

                {/* محتوى البطاقة */}
                <div style={{ padding:'16px 20px', display:'grid', gap:10 }}>
                  {note.diagnosis && (
                    <div style={{ background:'#F8FAFA', borderRadius:10, padding:'10px 14px', border:`1px solid ${BORDER}` }}>
                      <p style={{ fontSize:10, fontWeight:700, color:PRIMARY, margin:'0 0 3px', textTransform:'uppercase' }}>🔬 {t.diagnosis}</p>
                      <p style={{ fontSize:13, color:TEXT_DARK, margin:0 }}>{note.diagnosis}</p>
                    </div>
                  )}
                  {note.prescription && (
                    <div style={{ background:'#F0FDF4', borderRadius:10, padding:'10px 14px', border:'1px solid #86EFAC' }}>
                      <p style={{ fontSize:10, fontWeight:700, color:'#16A34A', margin:'0 0 3px', textTransform:'uppercase' }}>💊 {t.prescription}</p>
                      <p style={{ fontSize:13, color:TEXT_DARK, margin:0 }}>{note.prescription}</p>
                    </div>
                  )}
                  {note.tests && (
                    <div style={{ background:'#EFF6FF', borderRadius:10, padding:'10px 14px', border:'1px solid #BFDBFE' }}>
                      <p style={{ fontSize:10, fontWeight:700, color:'#1D4ED8', margin:'0 0 3px', textTransform:'uppercase' }}>🧪 {t.tests}</p>
                      <p style={{ fontSize:13, color:TEXT_DARK, margin:0 }}>{note.tests}</p>
                    </div>
                  )}
                  {note.notes && (
                    <div style={{ background:'#FFFBEB', borderRadius:10, padding:'10px 14px', border:'1px solid #FCD34D' }}>
                      <p style={{ fontSize:10, fontWeight:700, color:'#D97706', margin:'0 0 3px', textTransform:'uppercase' }}>📝 {t.notes}</p>
                      <p style={{ fontSize:13, color:TEXT_DARK, margin:0 }}>{note.notes}</p>
                    </div>
                  )}
                  {(note.nextVisitDate || note.cost != null) && (
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                      {note.nextVisitDate && (
                        <div style={{ flex:1, minWidth:120, background:PRIMARY_SOFT, borderRadius:10, padding:'8px 12px', border:`1px solid ${BORDER}` }}>
                          <p style={{ fontSize:9, fontWeight:700, color:PRIMARY, margin:'0 0 2px', textTransform:'uppercase' }}>📅 {t.nextVisit}</p>
                          <p style={{ fontSize:13, fontWeight:600, color:TEXT_DARK, margin:0 }}>
                            {formatDate(note.nextVisitDate)}
                          </p>
                        </div>
                      )}
                      {note.cost != null && (
                        <div style={{ flex:1, minWidth:120, background:'#F0FDF4', borderRadius:10, padding:'8px 12px', border:'1px solid #86EFAC' }}>
                          <p style={{ fontSize:9, fontWeight:700, color:'#16A34A', margin:'0 0 2px', textTransform:'uppercase' }}>💰 {t.cost}</p>
                          <p style={{ fontSize:13, fontWeight:600, color:TEXT_DARK, margin:0 }}>{note.cost} {t.riyal}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
