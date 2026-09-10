import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'
import { hasPermission } from '../utils/permissions'
import { isHour12 } from '../utils/i18n'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const PRIMARY_DARK = '#4A7679'
const ERROR_BG = '#FDF5F5'
const ERROR_TEXT = '#79674D'
const SUCCESS = '#4A7679'

interface QueueEntry {
  id: string
  queueNumber: number
  status: 'waiting' | 'called' | 'completed' | 'cancelled'
  patientName: string
  patientPhone?: string
  doctorName?: string
  notes?: string
  createdAt: string
}

interface Patient { 
  id: string; 
  fullName: string; 
  patientNumber: number; 
  phone?: string | null; 
  gender?: string | null; 
  dateOfBirth?: string | null 
}

interface Doctor { 
  id: string; 
  fullName: string; 
  isActive: boolean; 
  specialty?: string 
}

interface Stats { 
  total: number; 
  waiting: number; 
  called: number; 
  completed: number; 
  nextNumber: number 
}

const statusConfig = {
  waiting:   { ar: 'انتظار',  en: 'Waiting',  bg: '#FFF8E1', color: '#F59E0B', border: '#FCD34D' },
  called:    { ar: 'مُستدعى', en: 'Called',    bg: '#EBF4FF', color: '#3B82F6', border: '#93C5FD' },
  completed: { ar: 'منتهى',   en: 'Completed', bg: '#E8F5E9', color: '#22C55E', border: '#86EFAC' },
  cancelled: { ar: 'ملغى',    en: 'Cancelled', bg: '#FFF5F5', color: '#EF4444', border: '#FCA5A5' },
}

// Translations
const T = {
  ar: {
    title: 'قائمة الانتظار',
    subtitle: 'نظام إدارة الدور',
    stats: {
      total: 'الإجمالي',
      waiting: 'انتظار',
      called: 'مُستدعى',
      completed: 'منتهى',
    },
    filters: {
      all: 'الكل',
      waiting: '⏳ انتظار',
      called: '📢 مُستدعى',
      completed: '✅ منتهى',
    },
    buttons: {
      add: '+ إضافة دور',
      close: '✕ إغلاق',
      search: 'بحث',
      save: '💾 تسجيل الدور',
      cancel: 'إلغاء',
      call: '📢 استدعاء',
      complete: '✅ إنهاء',
      cancelAppointment: '✕ إلغاء',
      addPatient: '+ إضافة مريض جديد',
      back: 'رجوع',
    },
    labels: {
      patientSearch: 'البحث عن مريض',
      patientName: 'الاسم الكامل',
      patientNumber: 'رقم المريض',
      phone: 'الهاتف',
      gender: 'الجنس',
      male: 'ذكر',
      female: 'أنثى',
      dateOfBirth: 'تاريخ الميلاد',
      doctor: 'الطبيب',
      doctorRequired: 'إلزامي',
      notes: 'ملاحظات',
      selectDoctor: 'اختر الطبيب...',
      selectPatient: 'اختر مريضاً...',
      searchPlaceholder: 'ابحث بالاسم أو رقم المريض أو الهاتف...',
      notesPlaceholder: 'ملاحظات إضافية...',
      newPatient: 'مريض جديد',
      patientInfo: 'بيانات المريض',
      quickAdd: 'إضافة مريض جديد بسرعة',
    },
    messages: {
      loading: 'جارٍ التحميل...',
      noPatients: 'لا يوجد مرضى في قائمة الانتظار',
      noDoctors: '⚠️ لا يوجد أطباء نشطون حالياً',
      selectDoctorFirst: '⚠️ الرجاء اختيار الطبيب',
      selectPatientFirst: '⚠️ الرجاء اختيار مريض أو إضافة مريض جديد',
      enterPatientName: '⚠️ الرجاء إدخال اسم المريض',
      errorLoading: 'تعذّر تحميل البيانات',
      errorOccurred: 'حدث خطأ',
      patientAdded: '✅ تم إضافة المريض',
      queueAdded: '✅ تم إضافة المريض إلى قائمة الانتظار',
    },
  },
  en: {
    title: 'Queue',
    subtitle: 'Queue Management System',
    stats: {
      total: 'Total',
      waiting: 'Waiting',
      called: 'Called',
      completed: 'Completed',
    },
    filters: {
      all: 'All',
      waiting: '⏳ Waiting',
      called: '📢 Called',
      completed: '✅ Completed',
    },
    buttons: {
      add: '+ Add to Queue',
      close: '✕ Close',
      search: 'Search',
      save: '💾 Save to Queue',
      cancel: 'Cancel',
      call: '📢 Call',
      complete: '✅ Complete',
      cancelAppointment: '✕ Cancel',
      addPatient: '+ Add New Patient',
      back: 'Back',
    },
    labels: {
      patientSearch: 'Search Patient',
      patientName: 'Full Name',
      patientNumber: 'Patient ID',
      phone: 'Phone',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      dateOfBirth: 'Date of Birth',
      doctor: 'Doctor',
      doctorRequired: 'Required',
      notes: 'Notes',
      selectDoctor: 'Select doctor...',
      selectPatient: 'Select patient...',
      searchPlaceholder: 'Search by name, patient ID or phone...',
      notesPlaceholder: 'Additional notes...',
      newPatient: 'New Patient',
      patientInfo: 'Patient Information',
      quickAdd: 'Quick Add New Patient',
    },
    messages: {
      loading: 'Loading...',
      noPatients: 'No patients in queue',
      noDoctors: '⚠️ No active doctors available',
      selectDoctorFirst: '⚠️ Please select a doctor',
      selectPatientFirst: '⚠️ Please select a patient or add a new one',
      enterPatientName: '⚠️ Please enter patient name',
      errorLoading: 'Failed to load data',
      errorOccurred: 'An error occurred',
      patientAdded: '✅ Patient added successfully',
      queueAdded: '✅ Patient added to queue successfully',
    },
  },
}

// Global CSS
const globalCss = `
@keyframes fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.queue-shell { animation: fade-up 0.4s ease; }
.search-results { animation: fade-up 0.3s ease; }
.form-section { animation: slide-in 0.3s ease both; }

.patient-info-card {
  background: linear-gradient(135deg, #F8FAFA 0%, #FFFFFF 100%);
  border: 1px solid #DCE5E5;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.patient-info-card:hover {
  border-color: #5B8C8F;
  box-shadow: 0 4px 12px rgba(91, 140, 143, 0.1);
}

.patient-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 12px;
}

.patient-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.patient-info-label {
  font-size: 10px;
  font-weight: 600;
  color: #6B8A8C;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.patient-info-value {
  font-size: 14px;
  font-weight: 500;
  color: #2C3E3F;
}

.form-input:focus, .form-select:focus {
  border-color: #5B8C8F !important;
  box-shadow: 0 0 0 3px rgba(91, 140, 143, 0.1) !important;
  outline: none;
}

@media(max-width: 768px) {
  .patient-info-grid { grid-template-columns: 1fr !important; }
  .form-grid { grid-template-columns: 1fr !important; }
}
`

export default function Queue() {
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [entries, setEntries]         = useState<QueueEntry[]>([])
  const [patients, setPatients]       = useState<Patient[]>([])
  const [doctors, setDoctors]         = useState<Doctor[]>([])
  const [stats, setStats]             = useState<Stats | null>(null)
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Search & Patient Selection
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isNewPatient, setIsNewPatient] = useState(false)

  const [newPatient, setNewPatient] = useState({
    fullName: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
  })

  const [form, setForm] = useState({ doctorId: '', notes: '' })
  const [validationErrors, setValidationErrors] = useState<{ doctorId?: string; patient?: string }>({})

  const [savingQuick, setSavingQuick] = useState(false)

  const t = T[lang]
  const isAr = lang === 'ar'

  useEffect(() => {
    const styleId = 'cura-queue-css'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = globalCss
      document.head.appendChild(style)
    }

    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)

    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      const [qRes, pRes, dRes, sRes] = await Promise.all([
        api.get('/queue/today'),
        api.get('/patients'),
        api.get('/doctors'),
        api.get('/queue/stats'),
      ])
      setEntries(qRes.data)
      setPatients(pRes.data)
      setDoctors(dRes.data.filter((d: Doctor) => d.isActive))
      setStats(sRes.data)
    } catch {
      setError(t.messages.errorLoading)
    } finally {
      setLoading(false)
    }
  }, [t.messages.errorLoading])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  // Search handler
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const term = searchTerm.toLowerCase().trim()
    const results = patients.filter(patient =>
      patient.fullName.toLowerCase().includes(term) ||
      patient.patientNumber.toString().includes(term) ||
      (patient.phone && patient.phone.toLowerCase().includes(term))
    )
    setSearchResults(results)
    setSearching(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length > 0) {
        handleSearch()
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, patients])

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsNewPatient(false)
    setSearchTerm('')
    setSearchResults([])
    setValidationErrors(prev => ({ ...prev, patient: undefined }))
  }

  const handleNewPatient = () => {
    setIsNewPatient(true)
    setSelectedPatient(null)
    setSearchResults([])
    setSearchTerm('')
    setNewPatient({
      fullName: '',
      phone: '',
      gender: '',
      dateOfBirth: '',
    })
    setValidationErrors(prev => ({ ...prev, patient: undefined }))
  }

  const handleNewPatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewPatient({ ...newPatient, [e.target.name]: e.target.value })
    if (e.target.name === 'fullName' && e.target.value.trim()) {
      setValidationErrors(prev => ({ ...prev, patient: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const errors: { doctorId?: string; patient?: string } = {}
    
    if (!form.doctorId) {
      errors.doctorId = t.messages.selectDoctorFirst
    }
    
    if (!selectedPatient && !isNewPatient) {
      errors.patient = t.messages.selectPatientFirst
    }
    
    if (isNewPatient && !newPatient.fullName.trim()) {
      errors.patient = t.messages.enterPatientName
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    let patientId: string

    if (selectedPatient) {
      patientId = selectedPatient.id
    }
    else if (isNewPatient) {
      setSavingQuick(true)
      try {
        const patientPayload: Record<string, any> = {
          fullName: newPatient.fullName.trim()
        }
        if (newPatient.phone && newPatient.phone.trim()) {
          patientPayload.phone = newPatient.phone.trim()
        }
        if (newPatient.gender && newPatient.gender.trim()) {
          patientPayload.gender = newPatient.gender
        }
        if (newPatient.dateOfBirth && newPatient.dateOfBirth.trim()) {
          patientPayload.dateOfBirth = newPatient.dateOfBirth
        }
        
        const patientResponse = await api.post('/patients', patientPayload)
        patientId = patientResponse.data.id
        setPatients(prev => [...prev, patientResponse.data])
        setSuccess(`${t.messages.patientAdded} ${patientResponse.data.fullName} — #${patientResponse.data.patientNumber}`)
        setTimeout(() => setSuccess(''), 4000)
      } catch (err: any) {
        setError(err.response?.data || t.messages.errorOccurred)
        setSavingQuick(false)
        return
      }
      setSavingQuick(false)
    } else {
      setError(t.messages.selectPatientFirst)
      return
    }
    
    setSaving(true)
    setError('')
    try {
      const res = await api.post('/queue', {
        patientId: patientId,
        doctorId: form.doctorId,
        notes: form.notes || null,
      })
      setSuccess(res.data.message || t.messages.queueAdded)
      setForm({ doctorId: '', notes: '' })
      setValidationErrors({})
      setSelectedPatient(null)
      setIsNewPatient(false)
      setShowForm(false)
      fetchAll()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err: any) {
      setError(err.response?.data || t.messages.errorOccurred)
    } finally {
      setSaving(false)
    }
  }

  const handleAction = async (id: string, action: 'call' | 'complete' | 'cancel') => {
    try {
      await api.put(`/queue/${id}/${action}`)
      fetchAll()
    } catch {
      setError(t.messages.errorOccurred)
    }
  }

  const filtered = filterStatus === 'all'
    ? entries
    : entries.filter(e => e.status === filterStatus)

  const isDoctorSelected = !!form.doctorId
  const isPatientSelected = !!selectedPatient || isNewPatient
  const isFormValid = isPatientSelected && isDoctorSelected && (!isNewPatient || (isNewPatient && newPatient.fullName.trim()))

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')
  }

  const formatGender = (gender: string | null | undefined) => {
    if (gender === 'male') return t.labels.male
    if (gender === 'female') return t.labels.female
    return gender || '—'
  }

  const formatPhone = (phone: string | null | undefined) => {
    return phone || '—'
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', color: TEXT_MUTED }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${PRIMARY_SOFT}`, borderTopColor: PRIMARY, animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p>{t.messages.loading}</p>
      </div>
    </div>
  )

  return (
    <div className="queue-shell" dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif", background: '#F8FAFA', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 100, padding: '4px 16px', fontSize: 11, fontWeight: 600, color: PRIMARY, marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY }} />
            {t.title}
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>
            🔢 {t.subtitle}
          </h2>
          <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6 }}>
            {new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: t.stats.total, value: stats.total, icon: '📋', bg: PRIMARY_SOFT, color: PRIMARY },
              { label: t.stats.waiting, value: stats.waiting, icon: '⏳', bg: '#FFF8E1', color: '#F59E0B' },
              { label: t.stats.called, value: stats.called, icon: '📢', bg: '#EBF4FF', color: '#3B82F6' },
              { label: t.stats.completed, value: stats.completed, icon: '✅', bg: '#E8F5E9', color: '#22C55E' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 20px' }}>
                <div style={{ fontSize: 20 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: '4px 0' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: TEXT_MUTED }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div style={{ background: ERROR_BG, border: `1px solid ${ERROR_TEXT}40`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', color: ERROR_TEXT }}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
          </div>
        )}
        {success && (
          <div style={{ background: PRIMARY_SOFT, border: `1px solid ${PRIMARY}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: TEXT_DARK }}>
            {success}
          </div>
        )}

        {/* Validation Summary */}
        {showForm && !isFormValid && (
          <div style={{ background: '#FFF8E1', border: '1px solid #FCD34D', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#F59E0B', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠️</span>
              {!isPatientSelected && t.messages.selectPatientFirst}
              {isPatientSelected && !isDoctorSelected && t.messages.selectDoctorFirst}
              {isNewPatient && !newPatient.fullName.trim() && t.messages.enterPatientName}
            </p>
          </div>
        )}

        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { value: 'all', label: t.filters.all },
              { value: 'waiting', label: t.filters.waiting },
              { value: 'called', label: t.filters.called },
              { value: 'completed', label: t.filters.completed },
            ].map(f => (
              <button key={f.value} onClick={() => setFilterStatus(f.value)} style={{
                padding: '6px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                border: `1px solid ${filterStatus === f.value ? PRIMARY : BORDER}`,
                background: filterStatus === f.value ? PRIMARY : '#FFF',
                color: filterStatus === f.value ? '#FFF' : TEXT_MUTED,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                {f.label}
              </button>
            ))}
          </div>
          {hasPermission('queue.manage') && (
          <button onClick={() => {
            setShowForm(!showForm)
            if (!showForm) {
              setSelectedPatient(null)
              setIsNewPatient(false)
              setSearchTerm('')
              setSearchResults([])
              setValidationErrors({})
            }
          }} style={{
            background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 12,
            padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.2s ease'
          }}>
            {showForm ? t.buttons.close : t.buttons.add}
          </button>
          )}
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="form-section" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: TEXT_DARK, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>➕</span> {t.buttons.add}
            </h3>
            
            <form onSubmit={handleAdd}>
              {/* Patient Search Section */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 6 }}>
                  {t.labels.patientSearch} <span style={{ color: '#EF4444' }}>*</span>
                </label>
                
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t.labels.searchPlaceholder}
                    className="form-input"
                    style={{ flex: 1, padding: '12px 16px', border: `1px solid ${validationErrors.patient ? '#EF4444' : BORDER}`, borderRadius: 12, fontSize: 14 }}
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={searching}
                    style={{ 
                      padding: '12px 24px', background: PRIMARY, color: 'white', 
                      border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = PRIMARY_DARK}
                    onMouseLeave={(e) => e.currentTarget.style.background = PRIMARY}
                  >
                    {searching ? '...' : t.buttons.search}
                  </button>
                </div>

                {validationErrors.patient && !selectedPatient && !isNewPatient && (
                  <p style={{ fontSize: 11, color: '#EF4444', marginBottom: 12 }}>
                    ⚠️ {validationErrors.patient}
                  </p>
                )}

                {searchResults.length > 0 && !selectedPatient && !isNewPatient && (
                  <div className="search-results" style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ background: PRIMARY_SOFT, padding: '10px 16px', fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>
                      {t.labels.selectPatient} ({searchResults.length})
                    </div>
                    {searchResults.map(patient => (
                      <div 
                        key={patient.id} 
                        onClick={() => handleSelectPatient(patient)} 
                        style={{ 
                          padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', 
                          transition: 'background 0.2s', display: 'flex', justifyContent: 'space-between', 
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = PRIMARY_SOFT}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <strong style={{ fontSize: 14 }}>{patient.fullName}</strong>
                          <span style={{ fontSize: 11, color: TEXT_MUTED, marginRight: 8, background: '#F0F0F0', padding: '2px 6px', borderRadius: 20 }}>
                            #{patient.patientNumber}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: TEXT_MUTED }}>{formatPhone(patient.phone)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {!selectedPatient && !isNewPatient && searchResults.length === 0 && searchTerm && !searching && (
                  <button 
                    type="button" 
                    onClick={handleNewPatient} 
                    style={{ 
                      width: '100%', padding: '14px', background: PRIMARY_SOFT, 
                      border: `2px dashed ${PRIMARY}`, borderRadius: 12, color: PRIMARY, 
                      cursor: 'pointer', marginTop: 8, fontWeight: 600, fontSize: 14,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#E0ECEC'; e.currentTarget.style.borderColor = PRIMARY_DARK }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = PRIMARY_SOFT; e.currentTarget.style.borderColor = PRIMARY }}
                  >
                    {t.buttons.addPatient}
                  </button>
                )}

                {/* Selected Patient Info */}
                {selectedPatient && !isNewPatient && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ 
                      background: `linear-gradient(135deg, ${SUCCESS}10 0%, ${PRIMARY_SOFT} 100%)`, 
                      border: `1px solid ${SUCCESS}`, borderRadius: 12, padding: '12px 16px', 
                      marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <span style={{ fontSize: 20, marginLeft: 8 }}>✅</span>
                        <strong style={{ fontSize: 14 }}>{selectedPatient.fullName}</strong>
                        <span style={{ fontSize: 12, color: TEXT_MUTED, marginRight: 8 }}>#{selectedPatient.patientNumber}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSelectedPatient(null)} 
                        style={{ background: 'none', border: 'none', color: ERROR_TEXT, cursor: 'pointer', fontSize: 18 }}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="patient-info-card">
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>👤</span> {t.labels.patientInfo}
                      </h4>
                      <div className="patient-info-grid">
                        <div className="patient-info-item">
                          <span className="patient-info-label">{t.labels.patientName}</span>
                          <span className="patient-info-value">{selectedPatient.fullName || '—'}</span>
                        </div>
                        <div className="patient-info-item">
                          <span className="patient-info-label">{t.labels.patientNumber}</span>
                          <span className="patient-info-value">#{selectedPatient.patientNumber}</span>
                        </div>
                        <div className="patient-info-item">
                          <span className="patient-info-label">{t.labels.phone}</span>
                          <span className="patient-info-value">{formatPhone(selectedPatient.phone)}</span>
                        </div>
                        <div className="patient-info-item">
                          <span className="patient-info-label">{t.labels.gender}</span>
                          <span className="patient-info-value">{formatGender(selectedPatient.gender)}</span>
                        </div>
                        <div className="patient-info-item">
                          <span className="patient-info-label">{t.labels.dateOfBirth}</span>
                          <span className="patient-info-value">{formatDate(selectedPatient.dateOfBirth)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* New Patient Form */}
                {isNewPatient && (
                  <div style={{ marginTop: 16, padding: 20, background: PRIMARY_SOFT, borderRadius: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>✨</span> {t.labels.newPatient}
                      </h4>
                      <button 
                        type="button" 
                        onClick={() => setIsNewPatient(false)} 
                        style={{ background: 'none', border: 'none', color: ERROR_TEXT, cursor: 'pointer', fontSize: 16 }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                      <input 
                        name="fullName" 
                        value={newPatient.fullName} 
                        onChange={handleNewPatientChange} 
                        placeholder={`${t.labels.patientName} *`} 
                        className="form-input"
                        style={{ padding: '12px', border: `1px solid ${!newPatient.fullName.trim() && validationErrors.patient ? '#EF4444' : BORDER}`, borderRadius: 10, fontSize: 13 }}
                      />
                      <input 
                        name="phone" 
                        value={newPatient.phone} 
                        onChange={handleNewPatientChange} 
                        placeholder={t.labels.phone} 
                        className="form-input"
                        style={{ padding: '12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13 }}
                      />
                      <select 
                        name="gender" 
                        value={newPatient.gender} 
                        onChange={handleNewPatientChange} 
                        className="form-select"
                        style={{ padding: '12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, background: '#FFF' }}
                      >
                        <option value="">{t.labels.gender}</option>
                        <option value="male">{t.labels.male}</option>
                        <option value="female">{t.labels.female}</option>
                      </select>
                      <input 
                        type="date" 
                        name="dateOfBirth" 
                        value={newPatient.dateOfBirth} 
                        onChange={handleNewPatientChange} 
                        className="form-input"
                        style={{ padding: '12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13 }}
                      />
                    </div>
                    {isNewPatient && !newPatient.fullName.trim() && validationErrors.patient && (
                      <p style={{ fontSize: 11, color: '#EF4444', marginTop: 12, marginBottom: 0 }}>
                        ⚠️ {t.messages.enterPatientName}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Doctor Selection */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 6 }}>
                  {t.labels.doctor} <span style={{ color: '#EF4444' }}>*</span> <span style={{ fontSize: 10, color: '#EF4444' }}>({t.labels.doctorRequired})</span>
                </label>
                <select
                  value={form.doctorId}
                  onChange={e => {
                    setForm(p => ({ ...p, doctorId: e.target.value }))
                    if (validationErrors.doctorId) setValidationErrors(prev => ({ ...prev, doctorId: undefined }))
                  }}
                  className="form-select"
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 12,
                    border: validationErrors.doctorId ? `1px solid #EF4444` : `1px solid ${BORDER}`,
                    fontSize: 14, background: '#FFF', cursor: 'pointer',
                  }}
                >
                  <option value="">{t.labels.selectDoctor}</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      👨‍⚕️ {d.fullName} {d.specialty ? `— ${d.specialty}` : ''}
                    </option>
                  ))}
                </select>
                {validationErrors.doctorId && (
                  <p style={{ fontSize: 11, color: '#EF4444', marginTop: 4, marginBottom: 0 }}>
                    ⚠️ {validationErrors.doctorId}
                  </p>
                )}
                {doctors.length === 0 && (
                  <p style={{ fontSize: 11, color: '#F59E0B', marginTop: 4, marginBottom: 0 }}>
                    {t.messages.noDoctors}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: 6 }}>{t.labels.notes}</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder={t.labels.notesPlaceholder}
                  className="form-input"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${BORDER}`, fontSize: 14 }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  type="submit" 
                  disabled={saving || savingQuick || !isFormValid || doctors.length === 0} 
                  style={{
                    flex: 1, background: (saving || savingQuick || !isFormValid || doctors.length === 0) ? '#B0C4C6' : PRIMARY,
                    color: '#FFF', border: 'none', borderRadius: 12,
                    padding: '12px 24px', fontSize: 14, fontWeight: 600,
                    cursor: (saving || savingQuick || !isFormValid || doctors.length === 0) ? 'not-allowed' : 'pointer',
                    opacity: (saving || savingQuick || !isFormValid || doctors.length === 0) ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {saving || savingQuick ? `${t.messages.loading}...` : t.buttons.save}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false)
                    setValidationErrors({})
                    setSelectedPatient(null)
                    setIsNewPatient(false)
                    setSearchTerm('')
                    setSearchResults([])
                    setForm({ doctorId: '', notes: '' })
                  }} 
                  style={{
                    padding: '12px 32px', background: 'transparent', border: `1px solid ${BORDER}`,
                    borderRadius: 12, fontSize: 14, fontWeight: 500, color: TEXT_MUTED, cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = PRIMARY_SOFT; e.currentTarget.style.borderColor = PRIMARY }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = BORDER }}
                >
                  {t.buttons.cancel}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Queue List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: TEXT_MUTED }}>
              <div style={{ fontSize: 48, opacity: 0.4 }}>🔢</div>
              <p style={{ fontSize: 14, marginTop: 12 }}>{t.messages.noPatients}</p>
            </div>
          ) : filtered.map(entry => {
            const cfg = statusConfig[entry.status]
            return (
              <div key={entry.id} style={{
                background: '#FFF', border: `1px solid ${BORDER}`, borderRadius: 16,
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                transition: 'all 0.2s ease'
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, background: PRIMARY_SOFT,
                  border: `2px solid ${PRIMARY}`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: PRIMARY }}>{entry.queueNumber}</span>
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>{entry.patientName}</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                    {entry.doctorName && <span style={{ fontSize: 12, color: TEXT_MUTED }}>👨‍⚕️ {entry.doctorName}</span>}
                    {entry.patientPhone && <span style={{ fontSize: 12, color: TEXT_MUTED }}>📞 {entry.patientPhone}</span>}
                    {entry.notes && <span style={{ fontSize: 12, color: TEXT_MUTED }}>📝 {entry.notes}</span>}
                    <span style={{ fontSize: 11, color: TEXT_MUTED }}>
  {new Date(entry.createdAt + 'Z') // ✅ أضف Z ليُعرف أنه UTC
    .toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: isHour12()
    })}
</span>
                  </div>
                </div>

                <span style={{
                  padding: '4px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                  background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0,
                }}>
                  {isAr ? cfg.ar : cfg.en}
                </span>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {hasPermission('queue.manage') && entry.status === 'waiting' && (
                    <button onClick={() => handleAction(entry.id, 'call')} style={{
                      background: '#EBF4FF', color: '#3B82F6', border: '1px solid #93C5FD',
                      borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}>
                      {t.buttons.call}
                    </button>
                  )}
                  {hasPermission('queue.manage') && entry.status === 'called' && (
                    <button onClick={() => handleAction(entry.id, 'complete')} style={{
                      background: '#E8F5E9', color: '#22C55E', border: '1px solid #86EFAC',
                      borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}>
                      {t.buttons.complete}
                    </button>
                  )}
                  {hasPermission('queue.manage') && (entry.status === 'waiting' || entry.status === 'called') && (
                    <button onClick={() => handleAction(entry.id, 'cancel')} style={{
                      background: '#FFF5F5', color: '#EF4444', border: '1px solid #FCA5A5',
                      borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}>
                      {t.buttons.cancelAppointment}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}