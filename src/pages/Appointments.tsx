import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import type { Appointment } from '../types'
import { ECGAnimation } from '../components/ECGAnimation'
import { hasPermission } from '../utils/permissions'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

// ─── Global CSS with Comfortable Colors ──────────────────────────────────────
const globalCss = `
@keyframes fade-up { 
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes soft-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes pulse-soft {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}
@keyframes slide-in {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.appointments-shell { animation: fade-up 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) both; }

/* Table row animation */
.appointment-row {
  animation: slide-in 0.3s ease both;
}
.appointment-row:nth-child(1){ animation-delay:0.02s }
.appointment-row:nth-child(2){ animation-delay:0.04s }
.appointment-row:nth-child(3){ animation-delay:0.06s }
.appointment-row:nth-child(4){ animation-delay:0.08s }
.appointment-row:nth-child(5){ animation-delay:0.10s }

.appointments-shell * { box-sizing:border-box; }

/* Custom scrollbar */
.appointments-shell ::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.appointments-shell ::-webkit-scrollbar-track {
  background: #E8EDEE;
  border-radius: 4px;
}
.appointments-shell ::-webkit-scrollbar-thumb {
  background: #8BAFB1;
  border-radius: 4px;
}

/* Table styles */
.appointments-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.appointments-table th {
  position: sticky;
  top: 0;
  background: #F8FAFA;
  z-index: 10;
}
.appointments-table td {
  transition: background 0.2s ease;
}

/* Search input styles */
.search-input:focus {
  border-color: #5B8C8F !important;
  box-shadow: 0 0 0 3px rgba(91, 140, 143, 0.1) !important;
}

@media(max-width: 768px) {
  .appointments-table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .appointments-title { font-size: 24px !important; }
  .appointments-header { flex-direction: column !important; align-items: stretch !important; }
  .search-filters { flex-direction: column !important; }
}
`

// Comfortable color palette
const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const SUCCESS = '#4A7679'
const INFO = '#8BAFB1'
const DANGER = '#C4A77D'

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  ar: {
    title: 'المواعيد',
    addAppointment: 'حجز موعد',
    patient: 'المريض',
    doctor: 'الطبيب',
    date: 'التاريخ',
    type: 'النوع',
    price: 'السعر',
    status: 'الحالة',
    noAppointments: 'لا يوجد مواعيد',
    patientNumber: 'رقم المريض',
    scheduled: 'مجدول',
    confirmed: 'مؤكد',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    riyal: 'ر.س',
    loadingMessage: 'جاري تحميل المواعيد',
    loadingSub: 'يرجى الانتظار أثناء تحميل جدول المواعيد',
    today: 'اليوم',
    tomorrow: 'غداً',
    week: 'هذا الأسبوع',
    filterAll: 'الكل',
    filterUpcoming: 'القادمة',
    filterToday: 'اليوم',
    searchPatient: '🔍 بحث عن مريض...',
    searchDoctor: '🔍 بحث عن طبيب...',
    clearSearch: 'مسح',
    allDoctors: 'جميع الأطباء',
    allPatients: 'جميع المرضى',
  },
  en: {
    title: 'Appointments',
    addAppointment: 'Book Appointment',
    patient: 'Patient',
    doctor: 'Doctor',
    date: 'Date',
    type: 'Type',
    price: 'Price',
    status: 'Status',
    noAppointments: 'No appointments found',
    patientNumber: 'Patient ID',
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    riyal: 'SAR',
    loadingMessage: 'Loading Appointments',
    loadingSub: 'Please wait while we load appointment data',
    today: 'Today',
    tomorrow: 'Tomorrow',
    week: 'This Week',
    filterAll: 'All',
    filterUpcoming: 'Upcoming',
    filterToday: 'Today',
    searchPatient: '🔍 Search patient...',
    searchDoctor: '🔍 Search doctor...',
    clearSearch: 'Clear',
    allDoctors: 'All Doctors',
    allPatients: 'All Patients',
  },
}

// ─── Loading Screen with ECG ─────────────────────────────────────────────────
const AppointmentsLoadingScreen = ({ msg, subMsg }: { msg: string; subMsg: string }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(8px)',
    zIndex: 9999,
  }}>
    <div style={{
      textAlign: 'center',
      padding: '2rem',
      maxWidth: 400,
      width: '100%',
    }}>
      <div style={{
        background: PRIMARY_SOFT,
        borderRadius: 20,
        padding: '20px 24px',
        marginBottom: '1.5rem',
        border: `1px solid ${BORDER}`,
      }}>
        <ECGAnimation height={100} showLetters={true} speed={0.7} />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 12,
          fontSize: 9,
          color: TEXT_MUTED,
          letterSpacing: '0.5px',
        }}>
          <span>📅 FETCHING DATA</span>
          <span>⚡ LOADING</span>
          <span>📊 SECURE</span>
        </div>
      </div>

      <h3 style={{
        fontSize: 18,
        fontWeight: 600,
        color: TEXT_DARK,
        marginBottom: 8,
        fontFamily: "'Playfair Display', serif",
      }}>
        {msg}
      </h3>
      <p style={{
        fontSize: 13,
        color: TEXT_MUTED,
        marginBottom: 24,
      }}>
        {subMsg}
      </p>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
      }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: PRIMARY,
              animation: `pulse-soft 1.5s ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  </div>
)

// ─── Status Badge Component ─────────────────────────────────────────────────
const StatusBadge = ({ status, lang }: { status: string; lang: 'ar' | 'en' }) => {
  const t = T[lang]
  
  const getStatusConfig = () => {
    switch (status) {
      case 'scheduled':
        return { color: INFO, bg: `${INFO}15`, label: t.scheduled, icon: '⏰' }
      case 'confirmed':
        return { color: SUCCESS, bg: `${SUCCESS}15`, label: t.confirmed, icon: '✓' }
      case 'completed':
        return { color: PRIMARY, bg: `${PRIMARY}15`, label: t.completed, icon: '✔️' }
      case 'cancelled':
        return { color: DANGER, bg: `${DANGER}15`, label: t.cancelled, icon: '✕' }
      default:
        return { color: TEXT_MUTED, bg: `${TEXT_MUTED}15`, label: status, icon: '📋' }
    }
  }

  const config = getStatusConfig()

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '4px 10px',
      borderRadius: 100,
      fontSize: 11,
      fontWeight: 500,
      background: config.bg,
      color: config.color,
    }}>
      <span style={{ fontSize: 10 }}>{config.icon}</span>
      {config.label}
    </span>
  )
}

// ─── Filter Bar Component (معدل مع البحث) ───────────────────────────────────
const FilterBar = ({ 
  currentFilter, 
  onFilterChange, 
  searchPatient,
  onSearchPatientChange,
  searchDoctor,
  onSearchDoctorChange,
  lang 
}: { 
  currentFilter: string; 
  onFilterChange: (filter: string) => void;
  searchPatient: string;
  onSearchPatientChange: (value: string) => void;
  searchDoctor: string;
  onSearchDoctorChange: (value: string) => void;
  lang: 'ar' | 'en' 
}) => {
  const t = T[lang]
  const isAr = lang === 'ar'
  
  const filters = [
    { value: 'all', label: t.filterAll, icon: '📋' },
    { value: 'upcoming', label: t.filterUpcoming, icon: '⏰' },
    { value: 'today', label: t.filterToday, icon: '📅' },
  ]

  return (
    <div style={{ marginBottom: 20 }}>
      {/* فلتر الحالة */}
      <div style={{
        display: 'flex',
        gap: 8,
        background: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
      }}>
        {filters.map(filter => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: currentFilter === filter.value ? 600 : 500,
              background: currentFilter === filter.value ? PRIMARY_SOFT : 'transparent',
              color: currentFilter === filter.value ? PRIMARY : TEXT_MUTED,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: 12 }}>{filter.icon}</span>
            <span>{filter.label}</span>
          </button>
        ))}
      </div>

      {/* حقول البحث */}
      <div className="search-filters" style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        {/* بحث المريض */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={searchPatient}
            onChange={(e) => onSearchPatientChange(e.target.value)}
            placeholder={t.searchPatient}
            className="search-input"
            style={{
              width: '100%',
              background: CARD_BG,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: '10px 16px 10px 40px',
              fontSize: 13,
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
              color: TEXT_DARK,
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
          />
          <span style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            left: 14,
            fontSize: 14,
            color: TEXT_MUTED,
          }}>👤</span>
          {searchPatient && (
            <button
              onClick={() => onSearchPatientChange('')}
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                right: 12,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                color: TEXT_MUTED,
                padding: 4,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* بحث الطبيب */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={searchDoctor}
            onChange={(e) => onSearchDoctorChange(e.target.value)}
            placeholder={t.searchDoctor}
            className="search-input"
            style={{
              width: '100%',
              background: CARD_BG,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: '10px 16px 10px 40px',
              fontSize: 13,
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
              color: TEXT_DARK,
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
          />
          <span style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            left: 14,
            fontSize: 14,
            color: TEXT_MUTED,
          }}>👨‍⚕️</span>
          {searchDoctor && (
            <button
              onClick={() => onSearchDoctorChange('')}
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                right: 12,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                color: TEXT_MUTED,
                padding: 4,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Appointments Component ────────────────────────────────────────────
export default function Appointments() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchPatient, setSearchPatient] = useState('')
  const [searchDoctor, setSearchDoctor] = useState('')
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())

  // Inject global styles
  useEffect(() => {
    const styleId = 'cura-appointments-css'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = globalCss + `
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `
      document.head.appendChild(style)
    }

    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)

    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  // Fetch appointments
  const fetchAppointments = () => {
    const startTime = Date.now()
    const minLoadingTime = 800

    api.get('/appointments')
      .then(res => {
        console.log('📊 Raw appointments data:', res.data)
        
        if (res.data && Array.isArray(res.data)) {
          if (res.data.length > 0) {
            console.log('📋 First appointment fields:', Object.keys(res.data[0]))
          }
          setAppointments(res.data)
        } else {
          setAppointments([])
        }
      })
      .catch((err) => {
        console.error('Error fetching appointments:', err)
        navigate('/login')
      })
      .finally(() => {
        const elapsed = Date.now() - startTime
        if (elapsed < minLoadingTime) {
          setTimeout(() => setLoading(false), minLoadingTime - elapsed)
        } else {
          setLoading(false)
        }
      })
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  // ✅ دالة للحصول على اسم المريض (للبحث)
  const getPatientName = (appointment: Appointment): string => {
    return appointment.patientName || ''
  }

  // ✅ دالة للحصول على اسم الطبيب (للبحث)
  const getDoctorName = (appointment: Appointment): string => {
    // 1. جرب doctorName أولاً
    if (appointment.doctorName && appointment.doctorName.trim() !== '') {
      return appointment.doctorName
    }
    
    // 2. جرب doctor ككائن
    const doctorObj = (appointment as any).doctor
    if (doctorObj && typeof doctorObj === 'object' && doctorObj !== null) {
      if (doctorObj.fullName && typeof doctorObj.fullName === 'string') {
        return doctorObj.fullName
      }
      if (doctorObj.name && typeof doctorObj.name === 'string') {
        return doctorObj.name
      }
    }
    
    return '—'
  }

  // Filter appointments
  const getFilteredAppointments = () => {
    const today = new Date().toDateString()
    let filtered = appointments
    
    // فلتر حسب الحالة
    switch (filter) {
      case 'today':
        filtered = filtered.filter(a => 
          new Date(a.appointmentDate).toDateString() === today
        )
        break
      case 'upcoming':
        filtered = filtered.filter(a => 
          new Date(a.appointmentDate) > new Date() && a.status !== 'cancelled'
        )
        break
      default:
        break
    }
    
    // فلتر حسب اسم المريض (بحث)
    if (searchPatient.trim() !== '') {
      const searchTerm = searchPatient.toLowerCase().trim()
      filtered = filtered.filter(a => 
        getPatientName(a).toLowerCase().includes(searchTerm) ||
        a.patientNumber?.toString().includes(searchTerm)
      )
    }
    
    // فلتر حسب اسم الطبيب (بحث)
    if (searchDoctor.trim() !== '') {
      const searchTerm = searchDoctor.toLowerCase().trim()
      filtered = filtered.filter(a => 
        getDoctorName(a).toLowerCase().includes(searchTerm)
      )
    }
    
    return filtered
  }

  const filteredAppointments = getFilteredAppointments()
  const t = T[lang]
  const isAr = lang === 'ar'

  if (loading) {
    return (
      <AppointmentsLoadingScreen 
        msg={t.loadingMessage} 
        subMsg={t.loadingSub}
      />
    )
  }

  // Format date nicely
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return `${t.today} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `${t.tomorrow} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    return date.toLocaleString(isAr ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div 
      className="appointments-shell" 
      style={{
        direction: isAr ? 'rtl' : 'ltr',
        background: '#F8FAFA',
        minHeight: '100vh',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div className="appointments-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: PRIMARY_SOFT,
              border: `1px solid ${BORDER}`,
              borderRadius: 100,
              padding: '4px 16px',
              fontSize: 11,
              fontWeight: 600,
              color: PRIMARY,
              letterSpacing: '0.3px',
              marginBottom: 12,
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: PRIMARY,
                animation: 'soft-pulse 2s infinite',
              }} />
              {isAr ? 'جدول المواعيد' : 'Schedule'}
            </div>
            <h2 className="appointments-title" style={{
              fontFamily: "'DM Serif Display', 'Georgia', serif",
              fontSize: 32,
              fontWeight: 500,
              color: TEXT_DARK,
              margin: 0,
              letterSpacing: '-0.3px',
            }}>
              {t.title}
            </h2>
            <p style={{
              fontSize: 14,
              color: TEXT_MUTED,
              marginTop: 8,
            }}>
              📊 {filteredAppointments.length} {isAr ? 'موعد' : 'appointments'}
              {filter !== 'all' && ` (${filter === 'today' ? t.today : filter === 'upcoming' ? t.filterUpcoming : ''})`}
              {(searchPatient || searchDoctor) && (
                <span style={{ marginRight: 8, fontSize: 11, color: PRIMARY }}>
                  • {isAr ? 'نتائج البحث' : 'search results'}
                </span>
              )}
            </p>
          </div>
{hasPermission('appointments.create') && (

          <button
            onClick={() => navigate('/appointments/add')}
            style={{
              background: PRIMARY,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 12,
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(91, 140, 143, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4A7679'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = PRIMARY
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <span style={{ fontSize: 16 }}>+</span>
            {t.addAppointment}
          </button>
        )}
      </div>

        {/* ── Filter Bar with Search ── */}
        <FilterBar 
          currentFilter={filter} 
          onFilterChange={setFilter}
          searchPatient={searchPatient}
          onSearchPatientChange={setSearchPatient}
          searchDoctor={searchDoctor}
          onSearchDoctorChange={setSearchDoctor}
          lang={lang}
        />

        {/* ── Appointments Table ── */}
        <div className="appointments-table-container" style={{
          background: CARD_BG,
          border: `1px solid ${BORDER}`,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="appointments-table" style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: 600,
            }}>
              <thead>
                <tr style={{
                  borderBottom: `1px solid ${BORDER}`,
                  background: PRIMARY_SOFT,
                }}>
                  <th style={{ padding: '14px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>
                    {t.patient}
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>
                    {t.doctor}
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>
                    {t.date}
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>
                    {t.type}
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>
                    {t.price}
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>
                    {t.status}
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>
                   {isAr ? 'إجراءات' : 'Actions'}
                      </th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                    }}>
                      <span style={{ fontSize: 48, opacity: 0.5 }}>📅</span>
                      <p style={{
                        fontSize: 14,
                        color: TEXT_MUTED,
                        marginTop: 12,
                      }}>
                        {t.noAppointments}
                      </p>
                      {(searchPatient || searchDoctor || filter !== 'all') && (
                        <button
                          onClick={() => {
                            setFilter('all')
                            setSearchPatient('')
                            setSearchDoctor('')
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: PRIMARY,
                            fontSize: 12,
                            cursor: 'pointer',
                            marginTop: 8,
                            textDecoration: 'underline',
                          }}
                        >
                          {isAr ? 'مسح جميع الفلاتر' : 'Clear all filters'}
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <tr 
                      key={appointment.id} 
                      className="appointment-row"
                      style={{
                        borderBottom: `1px solid ${BORDER}`,
                        transition: 'background 0.2s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = PRIMARY_SOFT
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                      onClick={() => navigate(`/appointments/${appointment.id}`)}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: TEXT_DARK,
                          margin: 0,
                          marginBottom: 2,
                        }}>
                          {appointment.patientName}
                        </p>
                        <p style={{
                          fontSize: 10,
                          color: TEXT_MUTED,
                          margin: 0,
                        }}>
                          #{appointment.patientNumber}
                        </p>
                       </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: TEXT_MUTED }}>
                        {getDoctorName(appointment)}
                       </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: TEXT_MUTED }}>
                        {formatDate(appointment.appointmentDate)}
                       </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: TEXT_MUTED }}>
                        {appointment.type || '—'}
                       </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500, color: TEXT_DARK }}>
                        {appointment.price ? `${appointment.price} ${t.riyal}` : '—'}
                       </td>
                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge status={appointment.status} lang={lang} />
                       </td>
                       <td style={{ padding: '14px 16px' }}>
  <div style={{ display: 'flex', gap: 8 }}>
    {/* زر التعديل */}
    {hasPermission('appointments.edit') && (
  <button
    onClick={(e) => {
      e.stopPropagation()
      navigate(`/appointments/${appointment.id}/edit`)
    }}
    style={{
      background: PRIMARY_SOFT,
      border: `1px solid ${BORDER}`,
      borderRadius: 8,
      padding: '6px 12px',
      fontSize: 12,
      color: PRIMARY,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = PRIMARY
      e.currentTarget.style.color = '#FFFFFF'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = PRIMARY_SOFT
      e.currentTarget.style.color = PRIMARY
    }}
  >
    ✏️ {isAr ? 'تعديل' : 'Edit'}
  </button>
)}
  </div>
</td>
                    </tr>
                    
                    
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Summary Stats ── */}
        {filteredAppointments.length > 0 && (
          <div style={{
            display: 'flex',
            gap: 16,
            marginTop: 20,
            padding: '12px 16px',
            background: PRIMARY_SOFT,
            borderRadius: 16,
            border: `1px solid ${BORDER}`,
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>📊</span>
              <span style={{ fontSize: 12, color: TEXT_MUTED }}>
                {isAr ? 'إجمالي القادمة' : 'Total Upcoming'}:
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: PRIMARY }}>
                {filteredAppointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length}
              </span>
            </div>
            <div style={{ width: 1, background: BORDER }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>💰</span>
              <span style={{ fontSize: 12, color: TEXT_MUTED }}>
                {isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}:
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: PRIMARY }}>
                {filteredAppointments
                  .filter(a => a.status === 'completed')
                  .reduce((sum, a) => {
                    const price = typeof a.price === 'string' ? parseFloat(a.price) : (a.price || 0)
                    return sum + (isNaN(price) ? 0 : price)
                  }, 0)} {t.riyal}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}