import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import type { Patient, Doctor } from '../types'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

// ─── Global CSS ──────────────────────────────────────────────────────────────
const globalCss = `
@keyframes fade-up { 
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slide-in {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.quick-visit-shell { animation: fade-up 0.4s ease; }
.form-section { animation: slide-in 0.3s ease both; }
.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #5B8C8F !important;
  box-shadow: 0 0 0 3px rgba(91, 140, 143, 0.1) !important;
}

.search-results { animation: fade-up 0.3s ease; }

.patient-info-card {
  background: #F8FAFA;
  border: 1px solid #DCE5E5;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
}

.patient-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
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
  font-size: 13px;
  font-weight: 500;
  color: #2C3E3F;
}

@media(max-width: 768px) {
  .form-grid { grid-template-columns: 1fr !important; }
  .action-buttons { flex-direction: column !important; }
  .patient-info-grid { grid-template-columns: 1fr !important; }
}
`

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const ERROR_BG = '#FDF5F5'
const ERROR_TEXT = '#C4A77D'
const SUCCESS = '#4A7679'

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  ar: {
    title: 'زيارة سريعة',
    back: 'رجوع',
    step1: 'الخطوة 1: البحث عن مريض',
    step1Desc: 'ابحث عن مريض موجود أو أضف مريض جديد',
    searchPlaceholder: 'ابحث بالاسم أو رقم المريض...',
    search: 'بحث',
    noResults: 'لا توجد نتائج',
    addNewPatient: '+ إضافة مريض جديد',
    existingPatients: 'المرضى الموجودين',
    newPatient: 'مريض جديد',
    step2: 'الخطوة 2: معلومات الزيارة',
    patientInfo: 'بيانات المريض',
    doctor: 'الطبيب',
    doctorPlaceholder: 'اختر الطبيب...',
    dateTime: 'تاريخ ووقت الزيارة',
    type: 'نوع الزيارة',
    typeCheckup: 'كشف',
    typeFollowup: 'متابعة',
    typeConsultation: 'استشارة',
    typeEmergency: 'طوارئ',
    price: 'السعر',
    notes: 'ملاحظات الزيارة',
    save: 'حفظ الزيارة',
    saving: 'جارٍ الحفظ...',
    cancel: 'إلغاء',
    error: 'حدث خطأ غير متوقع',
    required: 'يرجى تعبئة جميع الحقول المطلوبة',
    fullName: 'الاسم الكامل',
    phone: 'الهاتف',
    patientNumber: 'رقم المريض',
    gender: 'الجنس',
    male: 'ذكر',
    female: 'أنثى',
    dateOfBirth: 'تاريخ الميلاد',
    selectPatient: 'اختر مريضاً...',
    loadingMessage: 'جاري تحميل البيانات',
    loadingSub: 'يرجى الانتظار...',
  },
  en: {
    title: 'Quick Visit',
    back: 'Back',
    step1: 'Step 1: Search Patient',
    step1Desc: 'Search for existing patient or add a new one',
    searchPlaceholder: 'Search by name or patient ID...',
    search: 'Search',
    noResults: 'No results found',
    addNewPatient: '+ Add New Patient',
    existingPatients: 'Existing Patients',
    newPatient: 'New Patient',
    step2: 'Step 2: Visit Information',
    patientInfo: 'Patient Information',
    doctor: 'Doctor',
    doctorPlaceholder: 'Select doctor...',
    dateTime: 'Visit Date & Time',
    type: 'Visit Type',
    typeCheckup: 'Checkup',
    typeFollowup: 'Follow-up',
    typeConsultation: 'Consultation',
    typeEmergency: 'Emergency',
    price: 'Price',
    notes: 'Visit Notes',
    save: 'Save Visit',
    saving: 'Saving...',
    cancel: 'Cancel',
    error: 'An unexpected error occurred',
    required: 'Please fill all required fields',
    fullName: 'Full Name',
    phone: 'Phone',
    patientNumber: 'Patient ID',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    dateOfBirth: 'Date of Birth',
    selectPatient: 'Select a patient...',
    loadingMessage: 'Loading Data',
    loadingSub: 'Please wait...',
  },
}

export default function QuickVisit() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [allPatients, setAllPatients] = useState<Patient[]>([])
  
  // البحث عن المريض
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isNewPatient, setIsNewPatient] = useState(false)
  
  // بيانات المريض الجديد
  const [newPatient, setNewPatient] = useState({
    fullName: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
  })
  
  // بيانات الزيارة
  const [visitForm, setVisitForm] = useState({
    doctorId: '',
    appointmentDate: '',
    type: '',
    price: '',
    notes: '',
  })

  // دالة للحصول على الوقت الحالي + دقائق
  const getCurrentTimePlusMinutes = (minutes: number = 2) => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + minutes)
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const mins = String(now.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${mins}`
  }

  // ✅ دالة للتحقق من عدم وجود موعد متداخل لنفس الطبيب
  const checkDoctorAvailability = async (doctorId: string, appointmentDate: string) => {
    try {
      // جلب جميع مواعيد الطبيب
      const response = await api.get(`/appointments?doctorId=${doctorId}`)
      const doctorAppointments = response.data || []
      
      const newAppointmentTime = new Date(appointmentDate).getTime()
      const minGap = 20 * 60 * 1000 // 20 دقيقة بالملي ثانية
      
      for (const apt of doctorAppointments) {
        const existingTime = new Date(apt.appointmentDate).getTime()
        const timeDiff = Math.abs(newAppointmentTime - existingTime)
        
        if (timeDiff < minGap) {
          const existingTimeFormatted = new Date(existingTime).toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })
          return {
            available: false,
            message: `${lang === 'ar' ? 'الطبيب لديه موعد في الساعة' : 'Doctor has an appointment at'} ${existingTimeFormatted}، ${lang === 'ar' ? 'يجب أن يكون الفارق 20 دقيقة على الأقل' : 'minimum gap is 20 minutes'}`
          }
        }
      }
      
      return { available: true, message: '' }
    } catch (error) {
      console.error('Error checking availability:', error)
      return { available: true, message: '' }
    }
  }

  // تحميل البيانات
  useEffect(() => {
    const styleId = 'cura-quick-visit-css'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = globalCss
      document.head.appendChild(style)
    }

    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)

    Promise.all([
      api.get('/doctors'),
      api.get('/patients')
    ])
      .then(([doctorsRes, patientsRes]) => {
        setDoctors(doctorsRes.data.filter((d: Doctor) => d.isActive))
        setAllPatients(patientsRes.data)
      })
      .catch((err) => {
        console.error('Error loading data:', err)
        setError(T[lang].error)
      })
      .finally(() => setLoadingData(false))

    setVisitForm(prev => ({
      ...prev,
      appointmentDate: getCurrentTimePlusMinutes(2)
    }))

    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  // البحث المحلي
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const term = searchTerm.toLowerCase().trim()
    const results = allPatients.filter(patient =>
      patient.fullName.toLowerCase().includes(term) ||
      patient.patientNumber.toString().includes(term) ||
      (patient.phone && patient.phone.toLowerCase().includes(term))
    )
    setSearchResults(results)
    setSearching(false)
  }

  // بحث فوري مع تأخير
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length > 0) {
        handleSearch()
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, allPatients])

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsNewPatient(false)
    setSearchTerm('')
    setSearchResults([])
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
  }

  const handleNewPatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewPatient({ ...newPatient, [e.target.name]: e.target.value })
  }

  const handleVisitChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setVisitForm({ ...visitForm, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let patientId: string

      if (selectedPatient) {
        patientId = selectedPatient.id
      }
      else if (isNewPatient) {
        if (!newPatient.fullName.trim()) {
          setError('الاسم الكامل مطلوب')
          setLoading(false)
          return
        }
        
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
      } else {
        setError('الرجاء اختيار مريض أو إضافة مريض جديد')
        setLoading(false)
        return
      }

      if (!visitForm.doctorId) {
        setError('الرجاء اختيار الطبيب')
        setLoading(false)
        return
      }
      
      if (!visitForm.appointmentDate) {
        setError('الرجاء تحديد تاريخ ووقت الزيارة')
        setLoading(false)
        return
      }

      // التحقق من أن التاريخ في المستقبل
      const selectedDate = new Date(visitForm.appointmentDate)
      const now = new Date()
      if (selectedDate <= now) {
        setError('تاريخ الموعد يجب أن يكون في المستقبل')
        setLoading(false)
        return
      }

      // ✅ التحقق من توفر الطبيب (عدم تداخل المواعيد)
      const availability = await checkDoctorAvailability(visitForm.doctorId, visitForm.appointmentDate)
      if (!availability.available) {
        setError(availability.message)
        setLoading(false)
        return
      }

      const appointmentPayload: Record<string, any> = {
        patientId: patientId,
        doctorId: visitForm.doctorId,
        appointmentDate: visitForm.appointmentDate, 
        status: 'scheduled'
      }
      
      if (visitForm.type && visitForm.type.trim()) {
        appointmentPayload.type = visitForm.type
      }
      if (visitForm.price && visitForm.price.trim()) {
        appointmentPayload.price = parseFloat(visitForm.price)
      }
      if (visitForm.notes && visitForm.notes.trim()) {
        appointmentPayload.notes = visitForm.notes.trim()
      }
      
      await api.post('/appointments', appointmentPayload)
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Error details:', err.response?.data)
      const errorMessage = err.response?.data?.message || err.response?.data?.title || T[lang].error
      setError(typeof errorMessage === 'string' ? errorMessage : 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  const t = T[lang]
  const isAr = lang === 'ar'
  const minDateTime = getCurrentTimePlusMinutes(2)

  const typeOptions = [
    { value: 'كشف', label: t.typeCheckup },
    { value: 'متابعة', label: t.typeFollowup },
    { value: 'استشارة', label: t.typeConsultation },
    { value: 'طوارئ', label: t.typeEmergency },
  ]

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')
  }

  const formatGender = (gender: string | null) => {
    if (gender === 'male') return t.male
    if (gender === 'female') return t.female
    return gender || '—'
  }

  if (loadingData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${PRIMARY_SOFT}`, borderTopColor: PRIMARY, animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: TEXT_MUTED, marginTop: 16 }}>{t.loadingMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="quick-visit-shell" style={{ direction: isAr ? 'rtl' : 'ltr', background: '#F8FAFA', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => navigate('/appointments')} style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
            ← {t.back}
          </button>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, fontWeight: 500, color: TEXT_DARK }}>{t.title}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Search Patient */}
          <div className="form-section" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: TEXT_DARK, marginBottom: 8 }}>{t.step1}</h3>
            <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 16 }}>{t.step1Desc}</p>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                style={{ flex: 1, padding: '10px 14px', border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 14 }}
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching}
                style={{ padding: '10px 24px', background: PRIMARY, color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer' }}
              >
                {searching ? '...' : t.search}
              </button>
            </div>

            {searchResults.length > 0 && !selectedPatient && !isNewPatient && (
              <div className="search-results" style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16, maxHeight: 300, overflowY: 'auto' }}>
                <div style={{ background: PRIMARY_SOFT, padding: '10px 14px', fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>{t.existingPatients}</div>
                {searchResults.map(patient => (
                  <div key={patient.id} onClick={() => handleSelectPatient(patient)} style={{ padding: '12px 14px', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = PRIMARY_SOFT}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div><strong>{patient.fullName}</strong><span style={{ fontSize: 12, color: TEXT_MUTED, marginLeft: 8 }}>#{patient.patientNumber}</span></div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED }}>{patient.phone || '—'}</div>
                  </div>
                ))}
              </div>
            )}

            {!selectedPatient && !isNewPatient && searchResults.length === 0 && searchTerm && !searching && (
              <button type="button" onClick={handleNewPatient} style={{ width: '100%', padding: '12px', background: PRIMARY_SOFT, border: `1px dashed ${PRIMARY}`, borderRadius: 12, color: PRIMARY, cursor: 'pointer', marginTop: 8 }}>
                {t.addNewPatient}
              </button>
            )}

            {selectedPatient && !isNewPatient && (
              <div style={{ marginTop: 16 }}>
                <div style={{ background: `${SUCCESS}10`, border: `1px solid ${SUCCESS}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{selectedPatient.fullName}</strong>
                    <span style={{ fontSize: 12, color: TEXT_MUTED, marginLeft: 8 }}>#{selectedPatient.patientNumber}</span>
                  </div>
                  <button type="button" onClick={() => setSelectedPatient(null)} style={{ background: 'none', border: 'none', color: ERROR_TEXT, cursor: 'pointer' }}>✕</button>
                </div>

                <div className="patient-info-card">
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>👤</span> {t.patientInfo}
                  </h4>
                  <div className="patient-info-grid">
                    <div className="patient-info-item">
                      <span className="patient-info-label">{t.fullName}</span>
                      <span className="patient-info-value">{selectedPatient.fullName || '—'}</span>
                    </div>
                    <div className="patient-info-item">
                      <span className="patient-info-label">{t.patientNumber}</span>
                      <span className="patient-info-value">#{selectedPatient.patientNumber}</span>
                    </div>
                    <div className="patient-info-item">
                      <span className="patient-info-label">{t.phone}</span>
                      <span className="patient-info-value">{selectedPatient.phone || '—'}</span>
                    </div>
                    <div className="patient-info-item">
                      <span className="patient-info-label">{t.gender}</span>
                      <span className="patient-info-value">{formatGender(selectedPatient.gender)}</span>
                    </div>
                    <div className="patient-info-item">
                      <span className="patient-info-label">{t.dateOfBirth}</span>
                      <span className="patient-info-value">{formatDate(selectedPatient.dateOfBirth)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isNewPatient && (
              <div style={{ marginTop: 16, padding: 16, background: PRIMARY_SOFT, borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>{t.newPatient}</h4>
                  <button type="button" onClick={() => setIsNewPatient(false)} style={{ background: 'none', border: 'none', color: ERROR_TEXT, cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <input name="fullName" value={newPatient.fullName} onChange={handleNewPatientChange} placeholder={t.fullName} style={{ padding: '10px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13 }} />
                  <input name="phone" value={newPatient.phone} onChange={handleNewPatientChange} placeholder={t.phone} style={{ padding: '10px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13 }} />
                  <select name="gender" value={newPatient.gender} onChange={handleNewPatientChange} style={{ padding: '10px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13 }}>
                    <option value="">{t.gender}</option>
                    <option value="male">{t.male}</option>
                    <option value="female">{t.female}</option>
                  </select>
                  <input type="date" name="dateOfBirth" value={newPatient.dateOfBirth} onChange={handleNewPatientChange} style={{ padding: '10px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13 }} />
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Visit Information */}
          {(selectedPatient || isNewPatient) && (
            <div className="form-section" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: TEXT_DARK, marginBottom: 16 }}>{t.step2}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.doctor} *</label>
                  <select name="doctorId" value={visitForm.doctorId} onChange={handleVisitChange} required style={{ width: '100%', padding: '10px 14px', border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 14 }}>
                    <option value="">{t.doctorPlaceholder}</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.fullName} {d.specialty ? `— ${d.specialty}` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.dateTime} *</label>
                  <input 
                    type="datetime-local" 
                    name="appointmentDate" 
                    value={visitForm.appointmentDate} 
                    onChange={handleVisitChange} 
                    min={minDateTime} 
                    required 
                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 14 }} 
                  />
                  <p style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 4 }}>
                    {isAr ? 'الوقت الحالي + 2 دقيقة' : 'Current time + 2 minutes'}
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.type}</label>
                  <select name="type" value={visitForm.type} onChange={handleVisitChange} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 14 }}>
                    <option value="">{t.type}</option>
                    {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.price}</label>
                  <input type="number" name="price" value={visitForm.price} onChange={handleVisitChange} min="0" step="0.01" placeholder="0.00" style={{ width: '100%', padding: '10px 14px', border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 14 }} />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.notes}</label>
                <textarea name="notes" value={visitForm.notes} onChange={handleVisitChange} rows={3} placeholder={t.notes} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 14, resize: 'vertical' }} />
              </div>
            </div>
          )}

          {error && <div style={{ background: ERROR_BG, border: `1px solid ${ERROR_TEXT}40`, borderRadius: 12, padding: '12px', marginTop: 20, color: ERROR_TEXT }}>{error}</div>}

          {(selectedPatient || isNewPatient) && (
            <div className="action-buttons" style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button type="submit" disabled={loading} style={{ flex: 1, background: PRIMARY, color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', border: `2px solid white`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} /> : t.save}
              </button>
              <button type="button" onClick={() => navigate('/appointments')} style={{ padding: '12px 32px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 14, fontWeight: 500, color: TEXT_MUTED, cursor: 'pointer' }}>
                {t.cancel}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}