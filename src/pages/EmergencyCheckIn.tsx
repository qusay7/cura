import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

interface Patient { id: string; fullName: string; patientNumber: number; phone?: string | null }
interface Department { id: string; name: string; type: number; isActive: boolean }

const T = {
  ar: {
    title: 'تسجيل دخول — طوارئ',
    subtitle: 'دخول سريع دون تحديد طبيب — يظهر لكل الأطباء المناوبين',
    noDeptTitle: '⚠️ لا يوجد قسم طوارئ',
    noDeptBody: 'يجب إنشاء قسم من نوع "طوارئ" أولاً من صفحة الأقسام.',
    goToDepartments: 'الذهاب لصفحة الأقسام',
    patientSearch: 'البحث عن مريض',
    searchPlaceholder: 'ابحث بالاسم أو رقم المريض أو الهاتف...',
    newPatient: '+ مريض جديد',
    back: '← رجوع للبحث',
    fullName: 'الاسم الكامل', phone: 'الهاتف', gender: 'الجنس', male: 'ذكر', female: 'أنثى',
    notes: 'ملاحظات الدخول (اختياري)', notesPlaceholder: 'سبب الحضور، شكوى المريض...',
    checkIn: '🚨 تسجيل الدخول', checkingIn: 'جارٍ التسجيل...',
    selectPatientFirst: '⚠️ الرجاء اختيار مريض أو إضافة مريض جديد',
    enterPatientName: '⚠️ الرجاء إدخال اسم المريض',
    errorOccurred: 'حدث خطأ',
    checkedIn: '✅ تم تسجيل الدخول — رقم',
    goToDashboard: 'الذهاب للوحة الطوارئ',
    checkInAnother: 'تسجيل مريض آخر',
  },
  en: {
    title: 'Emergency Check-In',
    subtitle: 'Fast check-in with no doctor assigned — visible to all on-duty doctors',
    noDeptTitle: '⚠️ No Emergency Department',
    noDeptBody: 'Create a department of type "Emergency" first from the Departments page.',
    goToDepartments: 'Go to Departments',
    patientSearch: 'Search Patient',
    searchPlaceholder: 'Search by name, patient ID or phone...',
    newPatient: '+ New Patient',
    back: '← Back to search',
    fullName: 'Full Name', phone: 'Phone', gender: 'Gender', male: 'Male', female: 'Female',
    notes: 'Check-in Notes (optional)', notesPlaceholder: 'Reason for visit, complaint...',
    checkIn: '🚨 Check In', checkingIn: 'Checking in...',
    selectPatientFirst: '⚠️ Please select a patient or add a new one',
    enterPatientName: '⚠️ Please enter patient name',
    errorOccurred: 'An error occurred',
    checkedIn: '✅ Checked in — number',
    goToDashboard: 'Go to Emergency Dashboard',
    checkInAnother: 'Check in another patient',
  },
}

export default function EmergencyCheckIn() {
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const navigate = useNavigate()
  const t = T[lang]
  const isAr = lang === 'ar'

  const [department, setDepartment] = useState<Department | null>(null)
  const [deptLoading, setDeptLoading] = useState(true)

  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isNewPatient, setIsNewPatient] = useState(false)
  const [newPatient, setNewPatient] = useState({ fullName: '', phone: '', gender: '' })
  const [notes, setNotes] = useState('')

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ queueNumber: number } | null>(null)

  useEffect(() => {
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  useEffect(() => {
    Promise.all([
      api.get('/departments').then(res => res.data).catch(() => []),
      api.get('/patients').then(res => res.data).catch(() => []),
    ]).then(([depts, pats]) => {
      setDepartment((depts as Department[]).find(d => d.type === 1 && d.isActive) || null)
      setPatients(pats)
      setDeptLoading(false)
    })
  }, [])

  const handleSearch = useCallback((term: string) => {
    if (!term.trim()) { setSearchResults([]); return }
    const q = term.toLowerCase().trim()
    setSearchResults(patients.filter(p =>
      p.fullName.toLowerCase().includes(q) ||
      p.patientNumber.toString().includes(q) ||
      (p.phone && p.phone.toLowerCase().includes(q))
    ))
  }, [patients])

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchTerm), 250)
    return () => clearTimeout(timer)
  }, [searchTerm, handleSearch])

  const resetPatientPick = () => {
    setSelectedPatient(null)
    setIsNewPatient(false)
    setSearchTerm('')
    setSearchResults([])
    setNewPatient({ fullName: '', phone: '', gender: '' })
  }

  const handleSubmit = async () => {
    setError('')
    if (!selectedPatient && !isNewPatient) { setError(t.selectPatientFirst); return }
    if (isNewPatient && !newPatient.fullName.trim()) { setError(t.enterPatientName); return }
    if (!department) return

    setSaving(true)
    try {
      let patientId: string
      if (selectedPatient) {
        patientId = selectedPatient.id
      } else {
        const payload: Record<string, any> = { fullName: newPatient.fullName.trim() }
        if (newPatient.phone.trim()) payload.phone = newPatient.phone.trim()
        if (newPatient.gender) payload.gender = newPatient.gender
        const pRes = await api.post('/patients', payload)
        patientId = pRes.data.id
      }

      const res = await api.post('/queue', {
        patientId,
        departmentId: department.id,
        notes: notes.trim() || null,
      })
      setResult({ queueNumber: res.data.queueNumber })
    } catch (err: any) {
      setError(err.response?.data || t.errorOccurred)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13.5, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG, boxSizing: 'border-box' }

  if (deptLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: TEXT_MUTED }}>...</div>
  )

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif", background: '#F8FAFA', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 100, padding: '4px 16px', fontSize: 11, fontWeight: 600, color: '#EF4444', marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />
            {isAr ? 'طوارئ' : 'Emergency'}
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>
            🚨 {t.title}
          </h2>
          <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6 }}>{t.subtitle}</p>
        </div>

        {!department ? (
          <div style={{ background: '#FFF8E1', border: '1px solid #FCD34D', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#B8892A', margin: '0 0 6px' }}>{t.noDeptTitle}</p>
            <p style={{ fontSize: 13, color: TEXT_MUTED, margin: '0 0 14px' }}>{t.noDeptBody}</p>
            <button onClick={() => navigate('/departments')}
              style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t.goToDepartments}
            </button>
          </div>
        ) : result ? (
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <p style={{ fontSize: 15, color: TEXT_DARK, margin: '0 0 4px' }}>{t.checkedIn}</p>
            <p style={{ fontSize: 32, fontWeight: 700, color: PRIMARY, fontFamily: "'Inter',sans-serif", margin: '0 0 20px' }}>{result.queueNumber}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => navigate('/emergency/dashboard')}
                style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {t.goToDashboard}
              </button>
              <button onClick={() => { setResult(null); resetPatientPick(); setNotes('') }}
                style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, color: TEXT_MUTED, cursor: 'pointer' }}>
                {t.checkInAnother}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24 }}>
            {error && (
              <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#EF4444' }}>
                ⚠️ {error}
              </div>
            )}

            {!selectedPatient && !isNewPatient && (
              <>
                <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 8 }}>{t.patientSearch}</label>
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t.searchPlaceholder} style={{ ...inputStyle, marginBottom: 10 }} autoFocus />
                {searchResults.length > 0 && (
                  <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, marginBottom: 14, maxHeight: 220, overflowY: 'auto' }}>
                    {searchResults.map(p => (
                      <div key={p.id} onClick={() => { setSelectedPatient(p); setSearchTerm(''); setSearchResults([]) }}
                        style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, color: TEXT_DARK, fontWeight: 600 }}>{p.fullName}</span>
                        <span style={{ fontSize: 11.5, color: TEXT_MUTED, fontFamily: "'Inter',sans-serif" }}>#{p.patientNumber} {p.phone ? `· ${p.phone}` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => setIsNewPatient(true)}
                  style={{ background: PRIMARY_SOFT, color: PRIMARY, border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                  {t.newPatient}
                </button>
              </>
            )}

            {selectedPatient && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: PRIMARY_SOFT, borderRadius: 12, padding: '10px 14px', marginBottom: 18 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: TEXT_DARK }}>👤 {selectedPatient.fullName} <span style={{ fontWeight: 400, color: TEXT_MUTED, fontFamily: "'Inter',sans-serif" }}>#{selectedPatient.patientNumber}</span></span>
                <button onClick={resetPatientPick} style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline' }}>{t.back}</button>
              </div>
            )}

            {isNewPatient && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>{t.newPatient}</label>
                  <button onClick={resetPatientPick} style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline' }}>{t.back}</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                  <input value={newPatient.fullName} onChange={e => setNewPatient({ ...newPatient, fullName: e.target.value })} placeholder={t.fullName} style={inputStyle} autoFocus />
                  <input value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} placeholder={t.phone} style={inputStyle} />
                  <select value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })} style={inputStyle}>
                    <option value="">{t.gender}</option>
                    <option value="male">{t.male}</option>
                    <option value="female">{t.female}</option>
                  </select>
                </div>
              </div>
            )}

            {(selectedPatient || isNewPatient) && (
              <>
                <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 6 }}>{t.notes}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t.notesPlaceholder} rows={3}
                  style={{ ...inputStyle, resize: 'none', marginBottom: 18 }} />

                <button onClick={handleSubmit} disabled={saving}
                  style={{ width: '100%', background: '#EF4444', color: '#FFF', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? t.checkingIn : t.checkIn}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
