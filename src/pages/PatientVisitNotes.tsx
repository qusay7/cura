import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { ECGAnimation } from '../components/ECGAnimation'
import { useFocusTrap } from '../hooks/useFocusTrap'

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
    attachments: 'المرفقات', view: 'عرض', filterByDoctor: 'كل الأطباء',
    filterByDate: 'تصفية بالتاريخ', clearFilters: 'إلغاء التصفية',
    noResults: 'لا توجد زيارات مطابقة للتصفية', couldNotOpen: 'تعذّر فتح الملف', close: 'إغلاق',
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
    attachments: 'Attachments', view: 'View', filterByDoctor: 'All Doctors',
    filterByDate: 'Filter by date', clearFilters: 'Clear filters',
    noResults: 'No visits match the filters', couldNotOpen: 'Could not open file', close: 'Close',
  },
}

interface NoteAttachment {
  id: string; fileName: string; category: string | null; isImage: boolean
}

interface VisitNote {
  id: string; diagnosis?: string; prescription?: string; tests?: string
  notes?: string; nextVisitDate?: string; cost?: number
  doctorName?: string; appointmentDate?: string; source: 'appointment' | 'queue'
  createdAt: string; attachments?: NoteAttachment[]
}

export default function PatientVisitNotes() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [notes, setNotes] = useState<VisitNote[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [patientName, setPatientName] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterDoctor, setFilterDoctor] = useState('')
  const [previewItem, setPreviewItem] = useState<NoteAttachment | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState('')
  const previewPanelRef = useRef<HTMLDivElement>(null)
  const closePreview = () => {
    setPreviewItem(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }
  useFocusTrap(previewPanelRef, !!(previewItem && previewUrl), closePreview)

  const handleViewAttachment = async (item: NoteAttachment) => {
    setPreviewError('')
    try {
      const res = await api.get(`/attachments/${item.id}/file`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      setPreviewItem(item)
      setPreviewUrl(url)
    } catch {
      setPreviewError(t.couldNotOpen)
      setTimeout(() => setPreviewError(''), 3000)
    }
  }

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

  const doctorNames = Array.from(new Set(notes.map(n => n.doctorName).filter((d): d is string => !!d))).sort()

  const filteredNotes = notes.filter(note => {
    if (filterDoctor && note.doctorName !== filterDoctor) return false
    if (filterDate) {
      const visitDay = (note.appointmentDate || note.createdAt).slice(0, 10)
      if (visitDay !== filterDate) return false
    }
    return true
  })

  const hasActiveFilters = !!filterDate || !!filterDoctor

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

        {/* أدوات البحث */}
        {notes.length > 0 && (
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', marginBottom:20, background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:14, padding:14 }}>
            <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}
              style={{ padding:'8px 12px', border:`1px solid ${BORDER}`, borderRadius:9, fontSize:12.5, fontFamily:'inherit', color:TEXT_DARK, background:CARD_BG }} />
            <select value={filterDoctor} onChange={e=>setFilterDoctor(e.target.value)}
              style={{ padding:'8px 12px', border:`1px solid ${BORDER}`, borderRadius:9, fontSize:12.5, fontFamily:'inherit', color:TEXT_DARK, background:CARD_BG }}>
              <option value="">{t.filterByDoctor}</option>
              {doctorNames.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {hasActiveFilters && (
              <button onClick={()=>{ setFilterDate(''); setFilterDoctor('') }}
                style={{ background:'transparent', border:`1px solid ${BORDER}`, borderRadius:9, padding:'8px 14px', fontSize:12, color:TEXT_MUTED, cursor:'pointer' }}>
                ✕ {t.clearFilters}
              </button>
            )}
          </div>
        )}

        {/* القائمة */}
        {notes.length === 0 ? (
          <div style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:20, padding:'60px 24px', textAlign:'center' }}>
            <span style={{ fontSize:56, opacity:0.5 }}>🩺</span>
            <p style={{ fontSize:14, color:TEXT_MUTED, marginTop:16 }}>{t.noNotes}</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:20, padding:'60px 24px', textAlign:'center' }}>
            <span style={{ fontSize:56, opacity:0.5 }}>🔍</span>
            <p style={{ fontSize:14, color:TEXT_MUTED, marginTop:16 }}>{t.noResults}</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {filteredNotes.map((note, i) => (
              <div key={note.id} style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:20, overflow:'hidden' }}>

                {/* Header البطاقة */}
                <div style={{ padding:'14px 20px', background:PRIMARY_SOFT, borderBottom:`1px solid ${BORDER}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:PRIMARY, display:'flex', alignItems:'center', justifyContent:'center', color:'#FFF', fontSize:13, fontWeight:700 }}>
                      {filteredNotes.length - i}
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
                  {note.attachments && note.attachments.length > 0 && (
                    <div>
                      <p style={{ fontSize:10, fontWeight:700, color:TEXT_MUTED, margin:'0 0 6px', textTransform:'uppercase' }}>📎 {t.attachments}</p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {note.attachments.map(att => (
                          <button key={att.id} onClick={()=>handleViewAttachment(att)}
                            style={{ display:'flex', alignItems:'center', gap:6, background:PRIMARY_SOFT, border:`1px solid ${BORDER}`, borderRadius:9, padding:'6px 12px', fontSize:11.5, color:PRIMARY, fontWeight:600, cursor:'pointer', maxWidth:220 }}>
                            <span>{att.isImage ? '🖼️' : '📄'}</span>
                            <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{att.fileName}</span>
                            <span style={{ color:TEXT_MUTED, fontWeight:400 }}>👁️</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* نافذة معاينة المرفق */}
      {previewItem && previewUrl && (
        <div onClick={closePreview}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:20 }}>
          <div ref={previewPanelRef} role="dialog" aria-modal="true" aria-label={previewItem.fileName}
            tabIndex={-1} onClick={e=>e.stopPropagation()}
            style={{ maxWidth:'90vw', maxHeight:'90vh', background:'#FFF', borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:10, display:'flex', justifyContent:'flex-end' }}>
              <button onClick={closePreview} aria-label={t.close}
                style={{ background:'#F1F4F4', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:14 }}>✕</button>
            </div>
            {previewItem.isImage ? (
              <img src={previewUrl} alt={previewItem.fileName} style={{ maxWidth:'90vw', maxHeight:'80vh', objectFit:'contain' }} />
            ) : (
              <iframe src={previewUrl} title="preview" style={{ width:'80vw', height:'80vh', border:'none' }} />
            )}
          </div>
        </div>
      )}

      {previewError && (
        <div style={{ position:'fixed', bottom:20, insetInlineStart:'50%', transform:'translateX(-50%)', background:'#FFF5F5', border:'1px solid #FCA5A5', borderRadius:10, padding:'10px 18px', fontSize:12.5, color:'#EF4444', zIndex:2100 }}>
          ⚠️ {previewError}
        </div>
      )}
    </div>
  )
}
