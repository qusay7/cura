import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import type { Patient } from '../types'
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

.patients-shell { animation: fade-up 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) both; }

/* Table row animation */
.patient-row {
  animation: slide-in 0.3s ease both;
}
.patient-row:nth-child(1){ animation-delay:0.02s }
.patient-row:nth-child(2){ animation-delay:0.04s }
.patient-row:nth-child(3){ animation-delay:0.06s }
.patient-row:nth-child(4){ animation-delay:0.08s }
.patient-row:nth-child(5){ animation-delay:0.10s }

.patients-shell * { box-sizing:border-box; }

/* Custom scrollbar */
.patients-shell ::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.patients-shell ::-webkit-scrollbar-track {
  background: #E8EDEE;
  border-radius: 4px;
}
.patients-shell ::-webkit-scrollbar-thumb {
  background: #8BAFB1;
  border-radius: 4px;
}

/* Table styles */
.patients-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.patients-table th {
  position: sticky;
  top: 0;
  background: #F8FAFA;
  z-index: 10;
}
.patients-table td {
  transition: background 0.2s ease;
}

/* Search input */
.search-input:focus {
  border-color: #5B8C8F !important;
  box-shadow: 0 0 0 3px rgba(91, 140, 143, 0.1) !important;
}

@media(max-width: 768px) {
  .patients-table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .patients-title { font-size: 24px !important; }
  .patients-header { flex-direction: column !important; align-items: stretch !important; }
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

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  ar: {
    title: 'المرضى',
    addPatient: 'إضافة مريض',
    searchPlaceholder: 'ابحث بالاسم أو رقم المريض...',
    noPatients: 'لا يوجد مرضى',
    patientNumber: 'رقم المريض',
    name: 'الاسم',
    phone: 'الهاتف',
    gender: 'الجنس',
    age: 'العمر',
    createdAt: 'تاريخ الإنشاء',
    actions: 'إجراءات',
    view: 'عرض',
    male: 'ذكر',
    female: 'أنثى',
    loadingMessage: 'جاري تحميل المرضى',
    loadingSub: 'يرجى الانتظار أثناء تحميل بيانات المرضى',
    totalPatients: 'إجمالي المرضى',
    activePatients: 'مرضى نشطون',
    yearsOld: 'سنة',
  },
  en: {
    title: 'Patients',
    addPatient: 'Add Patient',
    searchPlaceholder: 'Search by name or patient ID...',
    noPatients: 'No patients found',
    patientNumber: 'Patient ID',
    name: 'Name',
    phone: 'Phone',
    gender: 'Gender',
    age: 'Age',
    createdAt: 'Created At',
    actions: 'Actions',
    view: 'View',
    male: 'Male',
    female: 'Female',
    loadingMessage: 'Loading Patients',
    loadingSub: 'Please wait while we load patient data',
    totalPatients: 'Total Patients',
    activePatients: 'Active Patients',
    yearsOld: 'years',
  },
}

// ─── Loading Screen with ECG ─────────────────────────────────────────────────
const PatientsLoadingScreen = ({ msg, subMsg }: { msg: string; subMsg: string }) => (
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
          <span>👥 FETCHING DATA</span>
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

// ─── Age Calculation Helper ──────────────────────────────────────────────────
const calculateAge = (dateOfBirth?: string | null): number | null => {
  if (!dateOfBirth) return null
  
  const birthDate = new Date(dateOfBirth)
  // Check if date is valid
  if (isNaN(birthDate.getTime())) return null
  
  const today = new Date()
  
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

// ─── Gender Badge Component ─────────────────────────────────────────────────
const GenderBadge = ({ gender, lang }: { gender?: string | null; lang: 'ar' | 'en' }) => {
  const t = T[lang]
  const isMale = gender === 'male' || gender === 'ذكر'
  const isFemale = gender === 'female' || gender === 'أنثى'
  
  if (!gender || (!isMale && !isFemale)) {
    return <span style={{ fontSize: 12, color: TEXT_MUTED }}>—</span>
  }
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '2px 8px',
      borderRadius: 100,
      fontSize: 11,
      fontWeight: 500,
      background: isMale ? `${INFO}15` : `${SUCCESS}15`,
      color: isMale ? INFO : SUCCESS,
    }}>
      <span style={{ fontSize: 10 }}>{isMale ? '👨' : '👩'}</span>
      {isMale ? t.male : t.female}
    </span>
  )
}

// ─── Age Badge Component ─────────────────────────────────────────────────────
const AgeBadge = ({ dateOfBirth, lang }: { dateOfBirth?: string | null; lang: 'ar' | 'en' }) => {
  const t = T[lang]
  const age = calculateAge(dateOfBirth)
  
  if (age === null) {
    return <span style={{ fontSize: 12, color: TEXT_MUTED }}>—</span>
  }
  
  // Color code based on age group
  let color = PRIMARY
  let bg = PRIMARY_SOFT
  
  if (age < 12) {
    color = '#22C55E' // Children - green
    bg = '#E8F5E9'
  } else if (age < 18) {
    color = '#F59E0B' // Teenagers - amber
    bg = '#FFF8E1'
  } else if (age < 40) {
    color = PRIMARY // Adults - primary
    bg = PRIMARY_SOFT
  } else if (age < 60) {
    color = '#8B5CF6' // Middle age - purple
    bg = '#F3E8FF'
  } else {
    color = '#EF4444' // Elderly - red
    bg = '#FFF5F5'
  }
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 10px',
      borderRadius: 100,
      fontSize: 12,
      fontWeight: 600,
      background: bg,
      color: color,
    }}>
      <span style={{ fontSize: 10 }}>🎂</span>
      {age} {t.yearsOld}
    </span>
  )
}

// ─── Main Patients Component ─────────────────────────────────────────────────
export default function Patients() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())

  // Inject global styles
  useEffect(() => {
    const styleId = 'cura-patients-css'
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

  // Fetch patients
  const fetchPatients = () => {
    const startTime = Date.now()
    const minLoadingTime = 800

    api.get('/patients')
      .then(res => setPatients(res.data))
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
    fetchPatients()
  }, [])

  // Filter patients
  const filteredPatients = patients.filter(patient =>
    patient.fullName.toLowerCase().includes(search.toLowerCase()) ||
    patient.patientNumber.toString().includes(search)
  )

  const t = T[lang]
  const isAr = lang === 'ar'

  if (loading) {
    return (
      <PatientsLoadingScreen 
        msg={t.loadingMessage} 
        subMsg={t.loadingSub}
      />
    )
  }

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div 
      className="patients-shell" 
      style={{
        direction: isAr ? 'rtl' : 'ltr',
        background: '#F8FAFA',
        minHeight: '100vh',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div className="patients-header" style={{
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
              {isAr ? 'سجل المرضى' : 'Patient Records'}
            </div>
            <h2 className="patients-title" style={{
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
              👥 {filteredPatients.length} {t.totalPatients}
              {search && ` (${t.activePatients || ''})`}
            </p>
          </div>

          {hasPermission('patients.create') && (
            <button
              onClick={() => navigate('/patients/add')}
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
              {t.addPatient}
            </button>
          )}
        </div>

        {/* ── Search Bar ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="search-input"
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
                  padding: 4,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── Patients Table ── */}
        <div className="patients-table-container" style={{
          background: CARD_BG,
          border: `1px solid ${BORDER}`,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="patients-table" style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: 700,
            }}>
              <thead>
                <tr style={{
                  borderBottom: `1px solid ${BORDER}`,
                  background: PRIMARY_SOFT,
                }}>
                  <th style={{ padding: '14px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>
                    {t.patientNumber}
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>
                    {t.name}
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>
                    {t.phone}
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>
                    {t.gender}
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>
                    {t.age}
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>
                    {t.createdAt}
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: TEXT_MUTED }}>
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                    }}>
                      <span style={{ fontSize: 48, opacity: 0.5 }}>👥</span>
                      <p style={{
                        fontSize: 14,
                        color: TEXT_MUTED,
                        marginTop: 12,
                      }}>
                        {t.noPatients}
                      </p>
                      {search && (
                        <button
                          onClick={() => setSearch('')}
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
                          {isAr ? 'مسح البحث' : 'Clear search'}
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => (
                    <tr 
                      key={patient.id} 
                      className="patient-row"
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
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: 13,
                          fontWeight: 500,
                          color: PRIMARY,
                          background: `${PRIMARY}10`,
                          padding: '2px 6px',
                          borderRadius: 6,
                        }}>
                          #{patient.patientNumber}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: TEXT_DARK,
                        }}>
                          {patient.fullName}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: TEXT_MUTED }}>
                        {patient.phone || '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <GenderBadge gender={patient.gender} lang={lang} />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <AgeBadge dateOfBirth={patient.dateOfBirth} lang={lang} />
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: TEXT_MUTED }}>
                        {formatDate(patient.createdAt)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/patients/${patient.id}`)
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: PRIMARY,
                            fontSize: 12,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 8px',
                            borderRadius: 8,
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = PRIMARY_SOFT
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          <span>👁️</span>
                          {t.view}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Summary Stats ── */}
        {filteredPatients.length > 0 && (
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
              <span style={{ fontSize: 14 }}>👥</span>
              <span style={{ fontSize: 12, color: TEXT_MUTED }}>
                {t.totalPatients}:
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: PRIMARY }}>
                {filteredPatients.length}
              </span>
            </div>
            <div style={{ width: 1, background: BORDER }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>👨</span>
              <span style={{ fontSize: 12, color: TEXT_MUTED }}>
                {t.male}:
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: PRIMARY }}>
                {filteredPatients.filter(p => p.gender === 'male' || p.gender === 'ذكر').length}
              </span>
            </div>
            <div style={{ width: 1, background: BORDER }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>👩</span>
              <span style={{ fontSize: 12, color: TEXT_MUTED }}>
                {t.female}:
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: PRIMARY }}>
                {filteredPatients.filter(p => p.gender === 'female' || p.gender === 'أنثى').length}
              </span>
            </div>
            <div style={{ width: 1, background: BORDER }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>🎂</span>
              <span style={{ fontSize: 12, color: TEXT_MUTED }}>
                {isAr ? 'متوسط العمر' : 'Avg Age'}:
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: PRIMARY }}>
                {(() => {
                  const ages = filteredPatients
                    .map(p => calculateAge(p.dateOfBirth))
                    .filter((age): age is number => age !== null)
                  if (ages.length === 0) return '—'
                  const avg = ages.reduce((a, b) => a + b, 0) / ages.length
                  return `${Math.round(avg)} ${t.yearsOld}`
                })()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}