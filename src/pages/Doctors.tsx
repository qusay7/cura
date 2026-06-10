import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import type { Doctor } from '../types'
import { ECGAnimation } from '../components/ECGAnimation'

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

.doctors-shell { animation: fade-up 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) both; }

.doctor-card {
  animation: fade-up 0.4s ease both;
  transition: all 0.2s ease;
}
.doctor-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px -8px rgba(0,0,0,0.08);
}
.doctor-card:nth-child(1){ animation-delay:0.03s }
.doctor-card:nth-child(2){ animation-delay:0.06s }
.doctor-card:nth-child(3){ animation-delay:0.09s }
.doctor-card:nth-child(4){ animation-delay:0.12s }
.doctor-card:nth-child(5){ animation-delay:0.15s }
.doctor-card:nth-child(6){ animation-delay:0.18s }

.doctors-shell * { box-sizing:border-box; }

/* Custom scrollbar */
.doctors-shell ::-webkit-scrollbar {
  width: 5px;
}
.doctors-shell ::-webkit-scrollbar-track {
  background: #E8EDEE;
  border-radius: 4px;
}
.doctors-shell ::-webkit-scrollbar-thumb {
  background: #8BAFB1;
  border-radius: 4px;
}

/* Focus styles */
input:focus {
  border-color: #5B8C8F !important;
  box-shadow: 0 0 0 3px rgba(91, 140, 143, 0.1) !important;
}

@media(max-width:768px){
  .doctors-grid { grid-template-columns: repeat(2,1fr) !important; gap: 12px !important; }
  .doctors-title { font-size: 24px !important; }
}
@media(max-width:480px){
  .doctors-grid { grid-template-columns: 1fr !important; }
}
`

// Comfortable color palette
const PRIMARY = '#5B8C8F'
const PRIMARY_LIGHT = '#8BAFB1'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const SUCCESS = '#4A7679'
const WARNING = '#C4A77D'

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  ar: {
    title: 'الأطباء',
    addDoctor: 'إضافة طبيب',
    searchPlaceholder: 'ابحث بالاسم أو التخصص...',
    noDoctors: 'لا يوجد أطباء',
    specialty: 'التخصص',
    phone: 'الهاتف',
    status: 'الحالة',
    active: 'نشط',
    inactive: 'غير نشط',
    loading: 'جارٍ التحميل...',
    loadingMessage: 'جاري تحميل الأطباء',
    loadingSub: 'يرجى الانتظار أثناء تحميل بيانات الأطباء',
    specializations: {
      cardiology: 'قلبية',
      dermatology: 'جلدية',
      pediatrics: 'أطفال',
      neurology: 'أعصاب',
      orthopedics: 'عظام',
      general: 'عام',
      ophthalmology: 'عيون',
      dentistry: 'أسنان',
    }
  },
  en: {
    title: 'Doctors',
    addDoctor: 'Add Doctor',
    searchPlaceholder: 'Search by name or specialty...',
    noDoctors: 'No doctors found',
    specialty: 'Specialty',
    phone: 'Phone',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    loading: 'Loading...',
    loadingMessage: 'Loading Doctors',
    loadingSub: 'Please wait while we load doctor data',
    specializations: {
      cardiology: 'Cardiology',
      dermatology: 'Dermatology',
      pediatrics: 'Pediatrics',
      neurology: 'Neurology',
      orthopedics: 'Orthopedics',
      general: 'General',
      ophthalmology: 'Ophthalmology',
      dentistry: 'Dentistry',
    }
  },
}

// ─── Loading Screen with ECG ─────────────────────────────────────────────────
const DoctorsLoadingScreen = ({ msg, subMsg }: { msg: string; subMsg: string }) => (
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
          <span>❤️ FETCHING DATA</span>
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

// ─── Doctor Card Component ───────────────────────────────────────────────────
const DoctorCard = ({ doctor, lang, onClick, onEdit }: { 
  doctor: Doctor; 
  lang: 'ar' | 'en'; 
  onClick?: () => void;
  onEdit?: () => void 
}) => {
  const t = T[lang]
  const isAr = lang === 'ar'

  // Get translated specialty
  const getSpecialtyTranslation = (specialty: string) => {
    const specialtyMap = T[lang].specializations
    const key = Object.keys(specialtyMap).find(
      k => specialty?.toLowerCase().includes(k) || k === specialty?.toLowerCase()
    )
    return key ? specialtyMap[key as keyof typeof specialtyMap] : specialty || (isAr ? 'غير محدد' : 'Not specified')
  }

  return (
    <div 
      className="doctor-card"
      onClick={onClick}
      style={{
        background: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderRadius: 20,
        padding: '20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top gradient border */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${PRIMARY}, ${PRIMARY_LIGHT}, ${PRIMARY})`,
        backgroundSize: '200% auto',
        animation: 'shimmer 3s linear infinite',
      }} />

      {/* Avatar Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 20,
          background: PRIMARY_SOFT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          transition: 'transform 0.2s ease',
        }}>
          {doctor.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️'}
        </div>
        <div>
          <p style={{
            fontSize: 16,
            fontWeight: 600,
            color: TEXT_DARK,
            margin: 0,
            marginBottom: 4,
          }}>
            {doctor.fullName}
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: `${PRIMARY}15`,
            borderRadius: 100,
            padding: '2px 8px',
          }}>
            <span style={{ fontSize: 10, color: PRIMARY }}>🏥</span>
            <span style={{ fontSize: 11, color: PRIMARY, fontWeight: 500 }}>
              {getSpecialtyTranslation(doctor.specialty || '')}
            </span>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div style={{
        borderTop: `1px solid ${BORDER}`,
        paddingTop: 12,
        marginTop: 4,
      }}>
        {/* Phone */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 14 }}>📞</span>
          <span style={{ fontSize: 13, color: TEXT_MUTED }}>
            {doctor.phone || (isAr ? 'غير متوفر' : 'Not available')}
          </span>
        </div>

        {/* Email */}
        {doctor.email && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
          }}>
            <span style={{ fontSize: 14 }}>✉️</span>
            <span style={{ fontSize: 13, color: TEXT_MUTED }}>
              {doctor.email}
            </span>
          </div>
        )}

        {/* Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
          paddingTop: 8,
          borderTop: `1px solid ${BORDER}`,
        }}>
          <span style={{ fontSize: 12, color: TEXT_MUTED }}>{t.status}</span>
          <span style={{
            fontSize: 12,
            fontWeight: 500,
            padding: '2px 10px',
            borderRadius: 100,
            background: doctor.isActive ? `${SUCCESS}15` : `${WARNING}15`,
            color: doctor.isActive ? SUCCESS : WARNING,
          }}>
            {doctor.isActive ? t.active : t.inactive}
          </span>
        </div>
      </div>

      {/* Edit Button */}
      <div style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: `1px solid ${BORDER}`,
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (onEdit) onEdit()
          }}
          style={{
            width: '100%',
            background: PRIMARY_SOFT,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 500,
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
      </div>
    </div>
  )
}

// ─── Main Doctors Component ─────────────────────────────────────────────────
export default function Doctors() {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())

  // Inject global styles
  useEffect(() => {
    const styleId = 'cura-doctors-css'
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

  // Fetch doctors
  const fetchDoctors = () => {
    const startTime = Date.now()
    const minLoadingTime = 800

    api.get('/doctors')
      .then(res => setDoctors(res.data))
      .catch(() => navigate('/login'))
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
    fetchDoctors()
  }, [])

  // Filter doctors based on search
  const filteredDoctors = doctors.filter(doctor =>
    doctor.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (doctor.specialty ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (doctor.phone ?? '').includes(search)
  )

  const t = T[lang]
  const isAr = lang === 'ar'

  if (loading) {
    return (
      <DoctorsLoadingScreen 
        msg={t.loadingMessage} 
        subMsg={t.loadingSub}
      />
    )
  }

  return (
    <div 
      className="doctors-shell" 
      style={{
        direction: isAr ? 'rtl' : 'ltr',
        background: '#F8FAFA',
        minHeight: '100vh',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{
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
              {isAr ? 'فريق العمل' : 'Medical Team'}
            </div>
            <h2 className="doctors-title" style={{
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
              {isAr ? `📊 ${doctors.length} طبيب مسجل` : `📊 ${doctors.length} registered doctors`}
            </p>
          </div>

          <button
            onClick={() => navigate('/doctors/add')}
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
            {t.addDoctor}
          </button>
        </div>

        {/* ── Search Bar ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                width: '100%',
                background: CARD_BG,
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                padding: '12px 20px 12px 45px',
                fontSize: 14,
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
              [isAr ? 'right' : 'left']: 16,
              fontSize: 16,
              color: TEXT_MUTED,
            }}>
              🔍
            </span>
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  [isAr ? 'left' : 'right']: 16,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: TEXT_MUTED,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── Doctors Grid ── */}
        {filteredDoctors.length === 0 ? (
          <div style={{
            background: CARD_BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 20,
            padding: '48px 24px',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: 48, opacity: 0.5 }}>👨‍⚕️</span>
            <p style={{
              fontSize: 14,
              color: TEXT_MUTED,
              marginTop: 16,
            }}>
              {t.noDoctors}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: PRIMARY,
                  fontSize: 13,
                  cursor: 'pointer',
                  marginTop: 8,
                  textDecoration: 'underline',
                }}
              >
                {isAr ? 'مسح البحث' : 'Clear search'}
              </button>
            )}
          </div>
        ) : (
          <div className="doctors-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}>
            {filteredDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                lang={lang}
                onClick={() => navigate(`/doctors/${doctor.id}`)}
                onEdit={() => navigate(`/doctors/${doctor.id}/edit`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}