import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import type { Patient, Doctor } from '../types'
import AppointmentCalendar from '../components/AppointmentCalendar'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

// ─── Global CSS ──────────────────────────────────────────────────────────────
const globalCss = `
@keyframes fade-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes pulse-gentle {
  0%, 100% { box-shadow: 0 0 0 0 rgba(91, 140, 143, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(91, 140, 143, 0); }
}

.quick-visit-shell { animation: fade-up 0.4s ease; }
.form-section { animation: slide-in 0.3s ease both; }
.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #5B8C8F !important;
  box-shadow: 0 0 0 3px rgba(91, 140, 143, 0.1) !important;
  outline: none;
}

.search-results { animation: fade-up 0.3s ease; }

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

.doctor-select {
  transition: all 0.2s ease;
}

.doctor-select:hover {
  border-color: #5B8C8F !important;
}

.disabled-calendar-message {
  background: linear-gradient(135deg, #F8FAFA 0%, #FFFFFF 100%);
  border: 2px dashed #DCE5E5;
  border-radius: 20px;
  padding: 60px 24px;
  text-align: center;
  transition: all 0.3s ease;
}

.appointment-summary {
  background: linear-gradient(135deg, #E8F0F0 0%, #F0F6F6 100%);
  border-radius: 16px;
  border: 1px solid #C5DEDF;
  animation: fade-in 0.3s ease-out;
}

/* Calendar Container Styles */
.calendar-container {
  background: white;
  border-radius: 16px;
  border: 1px solid #DCE5E5;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-top: 16px;
}

.calendar-container:hover {
  border-color: #5B8C8F;
  box-shadow: 0 4px 12px rgba(91, 140, 143, 0.1);
}

/* Fix for calendar internal styling */
.calendar-container .rbc-calendar {
  background: white;
  border-radius: 16px;
}

.calendar-container .rbc-toolbar {
  padding: 16px;
  background: #F8FAFA;
  border-bottom: 1px solid #DCE5E5;
  flex-wrap: wrap;
  gap: 12px;
}

.calendar-container .rbc-toolbar button {
  color: #2C3E3F;
  border: 1px solid #DCE5E5;
  background: white;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.calendar-container .rbc-toolbar button:hover {
  background: #E8F0F0;
  border-color: #5B8C8F;
  color: #5B8C8F;
}

.calendar-container .rbc-toolbar button.rbc-active {
  background: #5B8C8F;
  border-color: #5B8C8F;
  color: white;
}

.calendar-container .rbc-toolbar-label {
  font-weight: 600;
  color: #2C3E3F;
  font-size: 15px;
}

.calendar-container .rbc-month-view {
  border-radius: 0 0 16px 16px;
  overflow: hidden;
}

.calendar-container .rbc-header {
  padding: 12px 8px;
  background: #F8FAFA;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6B8A8C;
  border-bottom: 1px solid #DCE5E5;
}

.calendar-container .rbc-day-bg {
  transition: background 0.2s ease;
}

.calendar-container .rbc-day-bg:hover {
  background: #F8FAFA;
}

.calendar-container .rbc-off-range-bg {
  background: #FCFDFD;
}

.calendar-container .rbc-date-cell {
  padding: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #2C3E3F;
}

.calendar-container .rbc-date-cell.rbc-now {
  font-weight: 700;
  color: #5B8C8F;
}

.calendar-container .rbc-event {
  background: #5B8C8F;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 12px;
  transition: all 0.2s ease;
  border: none;
}

.calendar-container .rbc-event:hover {
  background: #4A7679;
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(91, 140, 143, 0.3);
}

.calendar-container .rbc-event-content {
  font-size: 11px;
  font-weight: 500;
}

.calendar-container .rbc-show-more {
  color: #5B8C8F;
  font-size: 11px;
  font-weight: 500;
  background: transparent;
  padding: 2px 4px;
}

.calendar-container .rbc-show-more:hover {
  color: #4A7679;
  text-decoration: underline;
}

.calendar-container .rbc-time-view {
  border-radius: 0 0 16px 16px;
  overflow: hidden;
}

.calendar-container .rbc-time-header-cell {
  background: #F8FAFA;
}

.calendar-container .rbc-time-gutter {
  background: #F8FAFA;
}

.calendar-container .rbc-timeslot-group {
  border-bottom: 1px solid #DCE5E5;
}

.calendar-container .rbc-time-slot {
  font-size: 11px;
  color: #6B8A8C;
}

.calendar-container .rbc-current-time-indicator {
  background-color: #F59E0B;
}

/* Two column layout for type and price */
.form-two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

@media(max-width: 768px) {
  .form-grid { grid-template-columns: 1fr !important; }
  .action-buttons { flex-direction: column !important; }
  .patient-info-grid { grid-template-columns: 1fr !important; }
  .stats-cards { grid-template-columns: repeat(2, 1fr) !important; }
  .calendar-container .rbc-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .calendar-container .rbc-toolbar button {
    padding: 8px 12px;
  }
  .calendar-container .rbc-toolbar-label {
    text-align: center;
    margin: 8px 0;
  }
  .form-two-columns {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
`

const PRIMARY_DARK = '#4A7679'
const ERROR_BG = '#FDF5F5'
const ERROR_TEXT = '#79674D'
const SUCCESS = '#4A7679'
const WARNING = '#F59E0B'

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
    dateTime: 'اختر موعد الزيارة',
    selectDoctorFirst: 'اختر الطبيب أولاً',
    selectDoctorHint: 'يرجى اختيار الطبيب من القائمة أعلاه لعرض المواعيد المتاحة',
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
    selectedAppointment: 'الموعد المحدد',
    change: 'تغيير',
    backToPatients: 'رجوع',
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
    dateTime: 'Select Appointment Time',
    selectDoctorFirst: 'Select Doctor First',
    selectDoctorHint: 'Please select a doctor from above to see available time slots',
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
    selectedAppointment: 'Selected Appointment',
    change: 'Change',
    backToPatients: 'Back',
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
  
  const [visitForm, setVisitForm] = useState({
    doctorId: '',
    appointmentDate: '',
    appointmentPrice: undefined as number | undefined,
    type: '',
    price: '',
    notes: '',
  })

  const handleSlotSelect = (dateTime: string, price?: number) => {
    setVisitForm(prev => ({
      ...prev,
      appointmentDate: dateTime,
      appointmentPrice: price
    }))
  }

  const checkDoctorAvailability = async (doctorId: string, appointmentDate: string) => {
    try {
      const response = await api.get(`/appointments?doctorId=${doctorId}`)
      const doctorAppointments = response.data || []
      
      const newAppointmentTime = new Date(appointmentDate).getTime()
      const minGap = 20 * 60 * 1000
      
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

    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

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

  useEffect(() => {
    if (visitForm.doctorId && visitForm.appointmentDate) {
      setVisitForm(prev => ({ ...prev, appointmentDate: '', appointmentPrice: undefined }))
    }
  }, [visitForm.doctorId])

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
          setError(T[lang].required)
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
        setError(T[lang].required)
        setLoading(false)
        return
      }

      if (!visitForm.doctorId) {
        setError(T[lang].required)
        setLoading(false)
        return
      }
      
      if (!visitForm.appointmentDate) {
        setError(T[lang].required)
        setLoading(false)
        return
      }

      const selectedDate = new Date(visitForm.appointmentDate)
      const now = new Date()
      if (selectedDate <= now) {
        setError(lang === 'ar' ? 'تاريخ الموعد يجب أن يكون في المستقبل' : 'Appointment date must be in the future')
        setLoading(false)
        return
      }

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
      
      const finalPrice = visitForm.appointmentPrice ?? (visitForm.price ? parseFloat(visitForm.price) : undefined)
      if (finalPrice) {
        appointmentPayload.price = finalPrice
      }
      
      if (visitForm.notes && visitForm.notes.trim()) {
        appointmentPayload.notes = visitForm.notes.trim()
      }
      
      await api.post('/appointments', appointmentPayload)
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Error details:', err.response?.data)
      const errorMessage = err.response?.data?.message || err.response?.data?.title || T[lang].error
      setError(typeof errorMessage === 'string' ? errorMessage : T[lang].error)
    } finally {
      setLoading(false)
    }
  }

  const t = T[lang]
  const isAr = lang === 'ar'
  const isDoctorSelected = !!visitForm.doctorId

  const typeOptions = [
    { value: 'كشف', label: t.typeCheckup, icon: '🩺' },
    { value: 'متابعة', label: t.typeFollowup, icon: '📋' },
    { value: 'استشارة', label: t.typeConsultation, icon: '💬' },
    { value: 'طوارئ', label: t.typeEmergency, icon: '🚨' },
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
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button 
            onClick={() => navigate('/appointments')} 
            style={{ 
              background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 13, 
              cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6,
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = PRIMARY}
            onMouseLeave={(e) => e.currentTarget.style.color = TEXT_MUTED}
          >
            <span>←</span> {t.back}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 24, background: PRIMARY_SOFT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${BORDER}`
            }}>
              <span style={{ fontSize: 24 }}>⚡</span>
            </div>
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>
                {t.title}
              </h2>
              <p style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4 }}>
                {isAr ? 'تسجيل زيارة سريعة للمرضى' : 'Quick patient visit registration'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Search Patient */}
          <div className="form-section" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: TEXT_DARK, marginBottom: 4 }}>{t.step1}</h3>
            <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 16 }}>{t.step1Desc}</p>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="form-input"
                style={{ flex: 1, padding: '12px 16px', border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 14 }}
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
                {searching ? '...' : t.search}
              </button>
            </div>

            {searchResults.length > 0 && !selectedPatient && !isNewPatient && (
              <div className="search-results" style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ background: PRIMARY_SOFT, padding: '10px 16px', fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>
                  {t.existingPatients} ({searchResults.length})
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
                      <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 8, background: '#F0F0F0', padding: '2px 6px', borderRadius: 20 }}>
                        #{patient.patientNumber}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED }}>{patient.phone || '—'}</div>
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
                {t.addNewPatient}
              </button>
            )}

            {selectedPatient && !isNewPatient && (
              <div style={{ marginTop: 16 }}>
                <div style={{ 
                  background: `linear-gradient(135deg, ${SUCCESS}10 0%, ${PRIMARY_SOFT} 100%)`, 
                  border: `1px solid ${SUCCESS}`, borderRadius: 12, padding: '12px 16px', 
                  marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: 20, marginRight: 8 }}>✅</span>
                    <strong style={{ fontSize: 14 }}>{selectedPatient.fullName}</strong>
                    <span style={{ fontSize: 12, color: TEXT_MUTED, marginLeft: 8 }}>#{selectedPatient.patientNumber}</span>
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
              <div style={{ marginTop: 16, padding: 20, background: PRIMARY_SOFT, borderRadius: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>✨</span> {t.newPatient}
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
                    placeholder={t.fullName} 
                    className="form-input"
                    style={{ padding: '12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13 }}
                  />
                  <input 
                    name="phone" 
                    value={newPatient.phone} 
                    onChange={handleNewPatientChange} 
                    placeholder={t.phone} 
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
                    <option value="">{t.gender}</option>
                    <option value="male">{t.male}</option>
                    <option value="female">{t.female}</option>
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
              </div>
            )}
          </div>

          {/* Step 2: Visit Information - Reorganized Layout */}
          {(selectedPatient || isNewPatient) && (
            <div className="form-section" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: TEXT_DARK, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📝</span> {t.step2}
              </h3>
              
              {/* Doctor Selection - At the top */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT_MUTED, marginBottom: 8 }}>
                  {t.doctor} <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select 
                  name="doctorId" 
                  value={visitForm.doctorId} 
                  onChange={handleVisitChange} 
                  required 
                  className="doctor-select"
                  style={{ 
                    width: '100%', padding: '14px 16px', border: `1px solid ${BORDER}`, 
                    borderRadius: 12, fontSize: 14, background: '#FFF', cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <option value="">{t.doctorPlaceholder}</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      👨‍⚕️ {d.fullName} {d.specialty ? `— ${d.specialty}` : ''}
                    </option>
                  ))}
                </select>
                {doctors.length === 0 && (
                  <p style={{ fontSize: 11, color: WARNING, marginTop: 6 }}>⚠️ لا يوجد أطباء نشطون</p>
                )}
              </div>
              
              {/* Calendar Section - Below doctor */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT_MUTED, marginBottom: 8 }}>
                  {t.dateTime} <span style={{ color: '#EF4444' }}>*</span>
                </label>
                
                {!isDoctorSelected ? (
                  <div className="disabled-calendar-message">
                    <div style={{
                      width: '64px', height: '64px', background: PRIMARY_SOFT,
                      borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', margin: '0 auto 16px auto'
                    }}>
                      <span style={{ fontSize: '32px' }}>📅</span>
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px 0', color: PRIMARY }}>
                      {t.selectDoctorFirst}
                    </p>
                    <p style={{ fontSize: '13px', margin: 0, color: TEXT_MUTED }}>
                      {t.selectDoctorHint}
                    </p>
                  </div>
                ) : (
                  <div className="calendar-container" style={{ animation: 'fade-in 0.3s ease-out' }}>
                    <AppointmentCalendar
                      doctorId={visitForm.doctorId}
                      onSelectSlot={handleSlotSelect}
                    />
                  </div>
                )}
              </div>
              
              {/* Appointment Summary - Shows after selecting time */}
              {visitForm.appointmentDate && isDoctorSelected && (
                <div className="appointment-summary" style={{
                  marginBottom: '24px', padding: '16px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '44px', height: '44px', background: PRIMARY,
                      borderRadius: '12px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', boxShadow: '0 2px 8px rgba(91,140,143,0.2)'
                    }}>
                      <span style={{ fontSize: '22px' }}>✅</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: PRIMARY, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {t.selectedAppointment}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT_DARK }}>
                        {new Date(visitForm.appointmentDate).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {visitForm.appointmentPrice && (
                        <div style={{ fontSize: '12px', color: PRIMARY, marginTop: '4px', fontWeight: 500 }}>
                          💰 {visitForm.appointmentPrice} {isAr ? 'د.أ' : 'JD'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setVisitForm(prev => ({ ...prev, appointmentDate: '', appointmentPrice: undefined }))}
                    style={{
                      background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: '10px',
                      padding: '8px 18px', fontSize: '13px', fontWeight: 500,
                      cursor: 'pointer', transition: 'all 0.2s ease', color: TEXT_MUTED
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#FFE5E5'
                      e.currentTarget.style.borderColor = ERROR_TEXT
                      e.currentTarget.style.color = ERROR_TEXT
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FFFFFF'
                      e.currentTarget.style.borderColor = BORDER
                      e.currentTarget.style.color = TEXT_MUTED
                    }}
                  >
                    🔄 {t.change}
                  </button>
                </div>
              )}
              
              {/* Two Columns for Type and Price */}
              <div className="form-two-columns">
                {/* Visit Type */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT_MUTED, marginBottom: 8 }}>{t.type}</label>
                  <select 
                    name="type" 
                    value={visitForm.type} 
                    onChange={handleVisitChange} 
                    className="form-select"
                    style={{ width: '100%', padding: '12px 16px', border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 14, background: '#FFF', cursor: 'pointer' }}
                  >
                    <option value="">{t.type}</option>
                    {typeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Price */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT_MUTED, marginBottom: 8 }}>{t.price}</label>
                  <input 
                    type="number" 
                    name="price" 
                    value={visitForm.price} 
                    onChange={handleVisitChange} 
                    min="0" 
                    step="0.01" 
                    placeholder={t.price}
                    disabled={!!visitForm.appointmentPrice}
                    className="form-input"
                    style={{ 
                      width: '100%', padding: '12px 16px', border: `1px solid ${BORDER}`, borderRadius: 12, 
                      fontSize: 14, opacity: visitForm.appointmentPrice ? 0.6 : 1,
                      background: visitForm.appointmentPrice ? '#F8FAFA' : '#FFFFFF',
                      cursor: visitForm.appointmentPrice ? 'not-allowed' : 'text'
                    }} 
                  />
                  {visitForm.appointmentPrice && (
                    <p style={{ fontSize: 11, color: PRIMARY, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>ℹ️</span> {isAr ? 'السعر محدد من التقويم' : 'Price set by calendar'}
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT_MUTED, marginBottom: 8 }}>{t.notes}</label>
                <textarea 
                  name="notes" 
                  value={visitForm.notes} 
                  onChange={handleVisitChange} 
                  rows={3} 
                  placeholder={t.notes} 
                  className="form-textarea"
                  style={{ width: '100%', padding: '12px 16px', border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} 
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{ 
              background: ERROR_BG, border: `1px solid ${ERROR_TEXT}40`, borderRadius: 12, 
              padding: '14px 18px', marginTop: 20, color: ERROR_TEXT, display: 'flex', 
              alignItems: 'center', gap: 10
            }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={{ fontSize: 13 }}>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          {(selectedPatient || isNewPatient) && (
            <div className="action-buttons" style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button 
                type="submit" 
                disabled={loading || !visitForm.appointmentDate || !isDoctorSelected} 
                style={{ 
                  flex: 1, background: PRIMARY, color: 'white', border: 'none', borderRadius: 12, 
                  padding: '14px', fontSize: 14, fontWeight: 600, 
                  cursor: (loading || !visitForm.appointmentDate || !isDoctorSelected) ? 'not-allowed' : 'pointer', 
                  opacity: (loading || !visitForm.appointmentDate || !isDoctorSelected) ? 0.6 : 1,
                  transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
                onMouseEnter={(e) => { if (!loading && visitForm.appointmentDate && isDoctorSelected) e.currentTarget.style.background = PRIMARY_DARK }}
                onMouseLeave={(e) => { if (!loading && visitForm.appointmentDate && isDoctorSelected) e.currentTarget.style.background = PRIMARY }}
              >
                {loading ? (
                  <>
                    <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', border: `2px solid white`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                    {t.saving}
                  </>
                ) : (
                  <>💾 {t.save}</>
                )}
              </button>
              
              <button 
                type="button" 
                onClick={() => navigate('/appointments')} 
                style={{ 
                  padding: '14px 32px', background: 'transparent', border: `1px solid ${BORDER}`, 
                  borderRadius: 12, fontSize: 14, fontWeight: 500, color: TEXT_MUTED, cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = PRIMARY_SOFT; e.currentTarget.style.borderColor = PRIMARY }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = BORDER }}
              >
                {t.cancel}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}