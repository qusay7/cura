import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import type { AuthResponse } from '../types'
import logo from '../assets/logo.png'
import { LoadingScreen } from '../components/LoadingScreen'
import { ECGAnimation } from '../components/ECGAnimation'

// ─── Translations ──────────────────────────────────────────────────────────
const translations = {
  en: {
    dir: 'ltr' as const,
    font: "'Inter', sans-serif",
    sub: 'Sign in to your account',
    headline: ['Built for', 'modern clinics'],
    desc: 'Appointments, patients, and billing — all in one elegant, intelligent workspace.',
    stats: ['Clinics', 'Uptime', 'Support'],
     lEmail: 'EMAIL OR USERNAME',  // ✅ عدّل
    ePh: 'email or username',     // ✅ عدّل
    lPass: 'PASSWORD',
    pPh: '••••••••',
    forgot: 'Forgot password?',
    btn: 'Sign In',
    ssl: 'SECURE CONNECTION',
    errEmpty: 'Please fill in all fields',
    errWrong: 'Invalid email or password',
    trust: ['Secure', 'Encrypted', 'Trusted'],
    showP: 'Show password',
    hideP: 'Hide password',
  },
  ar: {
    dir: 'rtl' as const,
    font: "'Cairo', sans-serif",
    sub: 'تسجيل الدخول إلى حسابك',
    headline: ['مصمم من أجل', 'العيادة الحديثة'],
    desc: 'المواعيد، المرضى، والفواتير — كل شيء في مكان واحد ذكي.',
    stats: ['عيادة', 'استمرارية', 'دعم فني'],
   lEmail: 'البريد أو اسم المستخدم',  // ✅ عدّل
    ePh: 'البريد أو اسم المستخدم',     // ✅ عدّل
    lPass: 'كلمة المرور',
    pPh: '••••••••',
    forgot: 'نسيت كلمة المرور؟',
    btn: 'تسجيل الدخول',
    ssl: 'اتصال آمن',
    errEmpty: 'يرجى تعبئة جميع الحقول',
    errWrong: 'البريد أو كلمة المرور غير صحيحة',
    trust: ['آمن', 'مشفر', 'موثوق'],
    showP: 'إظهار كلمة المرور',
    hideP: 'إخفاء كلمة المرور',
  },
}

type Lang = keyof typeof translations

// ─── Global CSS with Comfortable Colors ────────────────────────────────────
const globalCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,600&family=Cairo:wght@400;500;600;700&display=swap');

@keyframes fade-in {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-24px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(24px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes pulse-soft {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(1); opacity: 0.6; }
  40% { transform: scale(1.3); opacity: 1; }
}

/* ── Main Layout ── */
.cura-shell {
  display: grid;
  grid-template-columns: 55fr 45fr;
  min-height: 100dvh;
  background: #F5F7F8;
}

.cura-left {
  overflow-y: auto;
  background: #FFFFFF;
  position: relative;
}

.cura-right {
  overflow-y: auto;
  background: linear-gradient(135deg, #F8FAFA 0%, #F0F3F4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Custom scrollbar */
.cura-left::-webkit-scrollbar,
.cura-right::-webkit-scrollbar {
  width: 5px;
}

.cura-left::-webkit-scrollbar-track,
.cura-right::-webkit-scrollbar-track {
  background: #E8EDEE;
  border-radius: 4px;
}

.cura-left::-webkit-scrollbar-thumb,
.cura-right::-webkit-scrollbar-thumb {
  background: #8BAFB1;
  border-radius: 4px;
}

/* Input focus styles */
input:focus {
  border-color: #5B8C8F !important;
  box-shadow: 0 0 0 3px rgba(91, 140, 143, 0.1) !important;
}

/* Responsive */
@media (max-width: 1024px) {
  .cura-shell { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 768px) {
  .cura-shell { grid-template-columns: 1fr; grid-template-rows: auto auto; }
  .cura-left { padding: 2rem 1.5rem !important; }
  .cura-right { padding: 2rem 1.5rem !important; }
  .cura-title { font-size: 28px !important; }
  .cura-stats-grid { display: none !important; }
  .cura-card { max-width: 100% !important; margin: 0 auto; }
  .cura-ecg { margin-bottom: 1rem !important; }
}

@media (max-width: 480px) {
  .cura-left { padding: 1.5rem 1rem !important; }
  .cura-right { padding: 1.5rem 1rem !important; }
  .cura-title { font-size: 24px !important; }
  .cura-card { padding: 1.5rem !important; }
}
`

// Comfortable color palette
const PRIMARY = '#5B8C8F'
const PRIMARY_DARK = '#4A7679'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const ERROR_BG = '#FDF5F5'
const ERROR_TEXT = '#C4A77D'

// ─── Eye Icons ─────────────────────────────────────────────────────────────
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

// ─── Medical Background SVG ────────────────────────────────────────────────
const MedicalBg = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
    <defs>
      <style>{`
        .med  { fill:rgba(91,140,143,0.055); stroke:rgba(91,140,143,0.08); stroke-width:1 }
        .medl { fill:rgba(91,140,143,0.035); stroke:rgba(91,140,143,0.06); stroke-width:1 }
      `}</style>
    </defs>
    <g transform="translate(270,60) rotate(20)">
      <circle cx="0" cy="0" r="32" className="medl" />
      <circle cx="0" cy="0" r="20" className="med" />
      <circle cx="0" cy="0" r="8" fill="rgba(91,140,143,0.08)" />
      <path d="M0,32 Q10,70 30,80 Q60,90 70,120 Q80,150 60,160 Q40,170 30,155" fill="none" stroke="rgba(91,140,143,0.07)" strokeWidth="7" strokeLinecap="round" />
      <path d="M0,32 Q-10,70 -28,80 Q-58,90 -68,120 Q-78,150 -60,160 Q-40,170 -30,155" fill="none" stroke="rgba(91,140,143,0.07)" strokeWidth="7" strokeLinecap="round" />
      <line x1="-28" y1="80" x2="28" y2="80" stroke="rgba(91,140,143,0.07)" strokeWidth="7" strokeLinecap="round" />
      <line x1="0" y1="-32" x2="0" y2="-70" stroke="rgba(91,140,143,0.07)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="0" cy="-80" r="8" className="med" />
    </g>
    <g transform="translate(340,220) rotate(-35)">
      <rect x="-6" y="-60" width="12" height="90" rx="6" className="medl" />
      <rect x="-8" y="-65" width="16" height="12" rx="3" className="med" />
      <rect x="-4" y="30" width="8" height="30" rx="4" className="med" />
      <line x1="0" y1="60" x2="0" y2="80" stroke="rgba(91,140,143,0.09)" strokeWidth="3" strokeLinecap="round" />
      <line x1="-6" y1="-35" x2="6" y2="-35" stroke="rgba(91,140,143,0.08)" strokeWidth="1.5" />
      <line x1="-6" y1="-15" x2="6" y2="-15" stroke="rgba(91,140,143,0.08)" strokeWidth="1.5" />
      <line x1="-6" y1="5" x2="6" y2="5" stroke="rgba(91,140,143,0.08)" strokeWidth="1.5" />
      <rect x="-14" y="22" width="8" height="18" rx="2" className="medl" />
      <rect x="6" y="22" width="8" height="18" rx="2" className="medl" />
    </g>
    <g transform="translate(50,90) rotate(30)">
      <rect x="-10" y="-30" width="20" height="60" rx="10" className="medl" />
      <rect x="-10" y="-30" width="20" height="30" rx="10" fill="rgba(91,140,143,0.06)" stroke="rgba(91,140,143,0.08)" strokeWidth="1" />
      <line x1="-10" y1="0" x2="10" y2="0" stroke="rgba(91,140,143,0.08)" strokeWidth="1" />
    </g>
    <ellipse cx="100" cy="200" rx="14" ry="9" className="medl" transform="rotate(45,100,200)" />
    <ellipse cx="310" cy="380" rx="14" ry="9" className="medl" transform="rotate(-20,310,380)" />
    <ellipse cx="60" cy="480" rx="18" ry="11" className="medl" transform="rotate(60,60,480)" />
    <g transform="translate(50,310)" opacity=".6">
      <rect x="-6" y="-20" width="12" height="40" rx="3" className="medl" />
      <rect x="-20" y="-6" width="40" height="12" rx="3" className="medl" />
    </g>
  </svg>
)

// ─── Stats Dashboard Component ─────────────────────────────────────────────
const dashTrans = {
  en: {
    apptLabel: "Today's",
    patLabel: 'Active',
    revLabel: 'Revenue',
    deptTitle: 'Department Load',
    weekTitle: 'Weekly Visits',
    depts: ['General', 'Cardiology', 'Pediatrics', 'Orthopedics'],
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  },
  ar: {
    apptLabel: 'اليوم',
    patLabel: 'نشطون',
    revLabel: 'الإيراد',
    deptTitle: 'تحميل الأقسام',
    weekTitle: 'زيارات أسبوعية',
    depts: ['عام', 'قلبية', 'أطفال', 'عظام'],
    days: ["إث", "ثل", "أرب", "خم", "جم"],
  },
}

const StatsDashboard = ({ lang }: { lang: 'en' | 'ar' }) => {
  const dt = dashTrans[lang]

  useEffect(() => {
    const intervals: number[] = []
    const timeouts: number[] = []

    const animCount = (id: string, target: number) => {
      const el = document.getElementById(id)
      if (!el) return
      let cur = 0
      const step = target / 50
      const interval = window.setInterval(() => {
        cur = Math.min(cur + step, target)
        el.textContent = Math.round(cur).toLocaleString()
        if (cur >= target) window.clearInterval(interval)
      }, 800 / 50)
      intervals.push(interval)
    }
    
    animCount('sd-appt', 48)
    animCount('sd-pat', 1247)
    animCount('sd-rev', 84)

    const barTimeout = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>('.sd-bar').forEach(b => {
        b.style.width = (b.dataset.w || '0') + '%'
      })
    }, 200)
    timeouts.push(barTimeout)

    const mbTimeout = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>('.sd-mb').forEach((b, i) => {
        const timeout = window.setTimeout(() => {
          b.style.height = (b.dataset.h || '0') + '%'
        }, i * 60)
        timeouts.push(timeout)
      })
    }, 200)
    timeouts.push(mbTimeout)

    return () => {
      intervals.forEach(id => window.clearInterval(id))
      timeouts.forEach(id => window.clearTimeout(id))
    }
  }, [])

  const deptsBase = [88, 72, 61, 45]
  const daysBase = [60, 80, 100, 75, 90]

  return (
    <div style={{ marginTop: '1.5rem', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
        {[
          { id: 'sd-appt', label: dt.apptLabel, icon: '📅' },
          { id: 'sd-pat', label: dt.patLabel, icon: '👥' },
          { id: 'sd-rev', label: dt.revLabel, icon: '💰' },
        ].map(c => (
          <div key={c.id} style={{
            background: PRIMARY_SOFT,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>{c.icon}</span>
              <span style={{ fontSize: 9, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT_DARK }}>
              {c.id === 'sd-rev' && '$'}
              <span id={c.id}>0</span>
              {c.id === 'sd-rev' && <span style={{ fontSize: 11, color: TEXT_MUTED }}>K</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: PRIMARY_SOFT,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_DARK, marginBottom: 10 }}>{dt.deptTitle}</div>
        {deptsBase.map((w, i) => (
          <div key={dt.depts[i]} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: TEXT_MUTED, width: 65, flexShrink: 0 }}>{dt.depts[i]}</div>
            <div style={{ flex: 1, background: 'rgba(91, 140, 143, 0.15)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
              <div className="sd-bar" data-w={w} style={{ height: '100%', borderRadius: 100, background: PRIMARY, width: 0, transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ fontSize: 10, color: TEXT_DARK, fontWeight: 500, width: 30, textAlign: 'right' }}>{w}%</div>
          </div>
        ))}
      </div>

      <div style={{
        background: PRIMARY_SOFT,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: '12px 14px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_DARK, marginBottom: 10 }}>{dt.weekTitle}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 50 }}>
          {daysBase.map((h, i) => (
            <div key={dt.days[i]} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div className="sd-mb" data-h={h} style={{
                width: '100%',
                background: i === 2 ? PRIMARY : 'rgba(91, 140, 143, 0.25)',
                borderRadius: '4px 4px 0 0',
                height: 0,
                transition: 'height 0.7s ease',
              }} />
              <div style={{ fontSize: 8, color: TEXT_MUTED }}>{dt.days[i]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Login Component ───────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate()

  const [lang, setLangState] = useState<Lang>('en')
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const t = translations[lang]
  const isAr = lang === 'ar'

  // Inject global styles
  useEffect(() => {
    const styleId = 'cura-login-css'
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
  }, [])

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    const response = await api.post<AuthResponse>('/auth/login', {
      emailOrUsername,
      password,
    })

    const data = response.data

    // ✅ احفظ التوكن أولاً
    localStorage.setItem('token', data.token)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify({
      fullName:   data.fullName,
      email:      data.email,
      role:       data.role,
      clinicId:   data.clinicId,
      clinicName: data.clinicName,
    }))

    // ✅ ثم اجلب الصلاحيات
    try {
      const permRes = await api.get('/roles/my-permissions')
      localStorage.setItem('permissions', JSON.stringify(permRes.data.permissions))
    } catch {
      // SuperAdmin لا يحتاج permissions من الـ API
      localStorage.setItem('permissions', JSON.stringify([]))
    }

    navigate('/dashboard')

  } catch {
    setError(isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials')
  } finally {
    setLoading(false)
  }
}

  const LoadingDots = () => (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      {[0, 0.15, 0.3].map((d, i) => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: '50%', background: '#fff',
          animation: `dot-bounce 1s ${d}s infinite`,
        }} />
      ))}
    </span>
  )

  const statData = [
    { n: '500+', l: t.stats[0] },
    { n: '99.9%', l: t.stats[1] },
    { n: '24/7', l: t.stats[2] },
  ]

  if (loading) {
    return (
      <LoadingScreen
        message={lang === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing you in...'}
        subMessage={
          lang === 'ar'
            ? 'يرجى الانتظار أثناء التحقق من بياناتك'
            : 'Please wait while we verify your credentials'
        }
        fullScreen
      />
    )
  }

  return (
    <div className="cura-shell">

      {/* ── Left Side (Brand/Info) ── */}
      <div className="cura-left" style={{
        padding: '3rem 2.5rem',
        position: 'relative',
        animation: 'slide-in-left 0.5s ease both',
      }}>
        <MedicalBg />

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: PRIMARY_SOFT,
          border: `1px solid ${BORDER}`,
          borderRadius: 100,
          padding: '5px 14px',
          fontSize: 11,
          fontWeight: 600,
          color: PRIMARY,
          letterSpacing: '0.5px',
          marginBottom: '1.5rem',
          width: 'fit-content',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, animation: 'pulse-soft 2s infinite' }} />
          {lang === 'ar' ? 'منصة إدارة العيادات' : 'Clinic Management Platform'}
        </div>

        <div style={{ marginBottom: '1.5rem', width: '100%' }}>
          <ECGAnimation height={110} showLetters={true} speed={0.7} />
        </div>

        <h1 className="cura-title" style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 42,
          fontWeight: 600,
          lineHeight: 1.2,
          color: TEXT_DARK,
          marginBottom: '1rem',
        }}>
          {t.headline[0]}<br />
          <span style={{ color: PRIMARY, fontStyle: 'italic' }}>{t.headline[1]}</span>
        </h1>

        <p style={{
          fontSize: 14,
          color: TEXT_MUTED,
          lineHeight: 1.6,
          marginBottom: '2rem',
          maxWidth: '90%',
        }}>
          {t.desc}
        </p>

        <div className="cura-stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          maxWidth: '90%',
          marginBottom: '1rem',
        }}>
          {statData.map(s => (
            <div key={s.l} style={{
              background: PRIMARY_SOFT,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: '12px',
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: TEXT_DARK, display: 'block' }}>{s.n}</div>
              <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 4, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{s.l}</div>
            </div>
          ))}
        </div>

        <StatsDashboard lang={lang} />
      </div>

      {/* ── Right Side (Login Form) ── */}
      <div className="cura-right" style={{
        padding: '3rem',
        animation: 'slide-in-right 0.5s ease both',
      }}>
        <div className="cura-card" style={{
          width: '100%',
          maxWidth: 440,
          background: '#FFFFFF',
          border: `1px solid ${BORDER}`,
          borderRadius: 24,
          padding: '2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
        }}>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            background: PRIMARY_SOFT,
            borderRadius: 100,
            padding: 4,
            marginBottom: '1.5rem',
          }}>
            {(['en', 'ar'] as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => { setLangState(l); setError('') }}
                style={{
                  border: 'none',
                  borderRadius: 100,
                  padding: '6px 18px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: l === 'ar' ? "'Cairo', sans-serif" : "'Inter', sans-serif",
                  background: lang === l ? PRIMARY : 'transparent',
                  color: lang === l ? '#FFFFFF' : TEXT_MUTED,
                }}
              >
                {l === 'ar' ? 'العربية' : 'English'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', gap: 8 }}>
            <div style={{
              width: 70,
              height: 70,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(91, 140, 143, 0.2)',
            }}>
              <img src={logo} alt="CURA" style={{ width: 45, height: 45, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            </div>
            <div style={{ fontSize: 13, color: TEXT_MUTED, textAlign: 'center' }}>{t.sub}</div>
          </div>

          <form onSubmit={handleLogin} style={{ direction: t.dir }}>

 
<div style={{ marginBottom: '1rem' }}>
  <label style={{
    display: 'block',
    fontSize: 10,
    fontWeight: 600,
    color: TEXT_MUTED,
    marginBottom: 6,
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
  }}>
    {isAr ? 'البريد الإلكتروني أو اسم المستخدم' : 'EMAIL OR USERNAME'}
  </label>
  <div style={{ position: 'relative' }}>
    <input
      type="text"                           // ✅ text بدل email
      value={emailOrUsername}
      required
      autoComplete="username"              // ✅ أضف
      placeholder={isAr ? 'example@clinic.com أو username' : 'email or username'}
      style={{
        width: '100%',
        background: PRIMARY_SOFT,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        fontSize: 14,
        fontFamily: t.font,
        color: TEXT_DARK,
        outline: 'none',
        transition: 'all 0.2s ease',
        padding: isAr ? '12px 14px 12px 40px' : '12px 40px 12px 14px',
      }}
      onChange={e => setEmailOrUsername(e.target.value)}
    />
    <span style={{
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      color: TEXT_MUTED,
      fontSize: 14,
      pointerEvents: 'none',
      ...(isAr ? { left: 14 } : { right: 14 }),
    }}>👤</span>
  </div>
</div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 600,
                color: TEXT_MUTED,
                marginBottom: 6,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
              }}>{t.lPass}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"  // ✅ أضف

                  value={password}
                  required
                  placeholder={t.pPh}
                  style={{
                    width: '100%',
                    background: PRIMARY_SOFT,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 12,
                    fontSize: 14,
                    fontFamily: t.font,
                    color: TEXT_DARK,
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    padding: '12px 40px 12px 40px',
                  }}
                  onChange={e => setPassword(e.target.value)}
                />
                <span style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: TEXT_MUTED,
                  fontSize: 14,
                  pointerEvents: 'none',
                  ...(isAr ? { left: 14 } : { right: 14 }),
                }}>🔒</span>
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: showPass ? PRIMARY : TEXT_MUTED,
                    padding: 5,
                    borderRadius: 5,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 0.2s',
                    ...(isAr ? { right: 12 } : { left: 12 }),
                  }}
                  aria-label={showPass ? t.hideP : t.showP}
                >
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: isAr ? 'right' : 'left', marginBottom: '1.25rem' }}>
              <a
                href="#"
                style={{ fontSize: 11, color: PRIMARY, textDecoration: 'none', opacity: 0.7 }}
                onClick={e => e.preventDefault()}
              >
                {t.forgot}
              </a>
            </div>

            {error && (
              <div style={{
                background: ERROR_BG,
                border: `1px solid ${ERROR_TEXT}40`,
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: 12,
                color: ERROR_TEXT,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                animation: 'fade-in 0.3s ease',
              }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span style={{ fontSize: 13, flex: 1 }}>{error}</span>
                <button
                  onClick={() => setError('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: ERROR_TEXT,
                    padding: 4,
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: PRIMARY,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                padding: '13px',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: t.font,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? <LoadingDots /> : t.btn}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '1.25rem 0' }}>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
              <span style={{ fontSize: 10, color: TEXT_MUTED, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{t.ssl}</span>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
              {t.trust.map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: TEXT_MUTED }}>
                  <span>{['🛡️', '🔐', '✅'][i]}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}



