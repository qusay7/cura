import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import type { AuthResponse } from '../types'
import logo from '../assets/logo.png'
import { LoadingScreen } from '../components/LoadingScreen'
import { ECGAnimation } from '../components/ECGAnimation'
import { authService } from '../api/axios'
const translations = {
  en: {
    dir: 'ltr' as const,
    font: "'Inter', sans-serif",
    sub: 'Sign in to your account',
    headline: ['Smarter clinic management.', 'Better patient outcomes.'],
    desc: 'Appointments, patients, and billing — all in one elegant, intelligent workspace.',
    stats: ['Clinics', 'Uptime', 'Support'],
    lEmail: 'EMAIL OR USERNAME',
    ePh: 'email or username',
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
    // Subdomain step
    subdomainLabel: 'YOUR CLINIC URL',
    subdomainPh: 'clinic-name',
    subdomainSuffix: '.cura.jo',
    subdomainBtn: 'Continue →',
    subdomainBack: '← Back',
    subdomainChecking: 'Checking...',
    subdomainNotFound: 'Clinic not found or inactive',
    subdomainHint: 'Enter your clinic subdomain to continue',
    adminLinkText: 'Platform administrator?',
    adminLinkCta: 'Sign in here',
    adminBadge: 'Platform Administration',
    adminWelcome: 'Super Admin access — not tied to any single clinic',
    copyLink: 'Copy your clinic link',
    copiedLink: 'Copied!',
    copyHint: 'Save this link — it takes you straight to your clinic\'s sign-in next time',
    autoChecking: 'Loading your clinic...',
  },
  ar: {
    dir: 'rtl' as const,
    font: "'Noto Kufi Arabic', sans-serif",
    sub: 'تسجيل الدخول إلى حسابك',
    headline: ['إدارة عيادة أكثر ذكاء.', 'نتائج أفضل للمرضى.'],
    desc: 'المواعيد، المرضى، والفواتير — كل شيء في مكان واحد ذكي.',
    stats: ['عيادة', 'استمرارية', 'دعم فني'],
    lEmail: 'البريد أو اسم المستخدم',
    ePh: 'البريد أو اسم المستخدم',
    lPass: 'كلمة المرور',
    pPh: '••••••••',
    forgot: 'نسيت كلمة المرور؟',
    btn: 'تسجيل الدخول',
    ssl: 'اتصال آمن',
    errEmpty: 'يرجى تعبئة جميع الحقول',
    errWrong: 'بيانات الدخول غير صحيحة',
    trust: ['آمن', 'مشفّر', 'موثوق'],
    showP: 'إظهار كلمة المرور',
    hideP: 'إخفاء كلمة المرور',
    subdomainLabel: 'رابط عيادتك',
    subdomainPh: 'اسم-العيادة',
    subdomainSuffix: '.cura.jo',
    subdomainBtn: 'متابعة ←',
    subdomainBack: '→ رجوع',
    subdomainChecking: 'جارٍ التحقق...',
    subdomainNotFound: 'العيادة غير موجودة أو غير نشطة',
    subdomainHint: 'أدخل رابط عيادتك للمتابعة',
    adminLinkText: 'أنت مسؤول المنصة؟',
    adminLinkCta: 'سجّل الدخول من هنا',
    adminBadge: 'إدارة المنصة',
    adminWelcome: 'دخول المسؤول العام — غير تابع لأي عيادة',
    copyLink: 'انسخ رابط عيادتك',
    copiedLink: 'تم النسخ!',
    copyHint: 'احفظ هذا الرابط — سيأخذك مباشرة لتسجيل الدخول لعيادتك في المرة القادمة',
    autoChecking: 'جارٍ تحميل بيانات عيادتك...',
  },
}

type Lang = keyof typeof translations

const globalCss = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap');

@keyframes fade-in    { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
@keyframes slide-left { from{opacity:0;transform:translateX(-24px);}to{opacity:1;transform:translateX(0);} }
@keyframes slide-right{ from{opacity:0;transform:translateX(24px);}to{opacity:1;transform:translateX(0);} }
@keyframes pulse-soft { 0%,100%{opacity:0.5;}50%{opacity:1;} }
@keyframes dot-bounce { 0%,80%,100%{transform:scale(1);opacity:0.6;}40%{transform:scale(1.3);opacity:1;} }
@keyframes shake      { 0%,100%{transform:translateX(0);}20%,60%{transform:translateX(-6px);}40%,80%{transform:translateX(6px);} }
@keyframes step-in    { from{opacity:0;transform:translateX(30px) scale(0.98);}to{opacity:1;transform:translateX(0) scale(1);} }
@keyframes step-in-r  { from{opacity:0;transform:translateX(-30px) scale(0.98);}to{opacity:1;transform:translateX(0) scale(1);} }
@keyframes pop-in     { from{opacity:0;transform:scale(0.9);}to{opacity:1;transform:scale(1);} }

.cura-shell {
  display:grid; grid-template-columns:55fr 45fr; min-height:100dvh; background:#F5F7F8;
}
.cura-left  { overflow-y:auto; background:#FFFFFF; position:relative; }
.cura-right { overflow-y:auto; background:linear-gradient(135deg,#F8FAFA 0%,#EEF3F3 100%); display:flex; align-items:center; justify-content:center; }

.cura-left::-webkit-scrollbar,
.cura-right::-webkit-scrollbar { width:5px; }
.cura-left::-webkit-scrollbar-thumb,
.cura-right::-webkit-scrollbar-thumb { background:#8BAFB1; border-radius:4px; }

input:focus { border-color:#5B8C8F !important; box-shadow:0 0 0 3px rgba(91,140,143,0.12) !important; }

.shake { animation:shake 0.4s ease; }

.step-enter     { animation:step-in   0.35s cubic-bezier(0.22,1,0.36,1) both; }
.step-enter-rev { animation:step-in-r 0.35s cubic-bezier(0.22,1,0.36,1) both; }
.pop-in         { animation:pop-in 0.25s cubic-bezier(0.22,1,0.36,1) both; }

@media(max-width:1024px){ .cura-shell{ grid-template-columns:1fr 1fr; } }
@media(max-width:768px){
  .cura-shell{ grid-template-columns:1fr; }
  .cura-left { padding:2rem 1.5rem !important; }
  .cura-right{ padding:2rem 1.5rem !important; }
  .cura-stats-grid{ display:none !important; }
}
`

const P  = '#5B8C8F'
const PD = '#4A7679'
const PS = '#E8F0F0'
const TD = '#2C3E3F'
const TM = '#6B8A8C'
const BR = '#DCE5E5'
const EB = '#FDF5F5'
const ET = '#79674D'
// Gold accent reserved for the SuperAdmin path only, so it reads as a
// distinct, higher-privilege entry point rather than "just another clinic".
const GOLD   = '#B8892A'
const GOLDS  = '#FBF4E4'
const GOLDBR = '#E8D4A8'

// ─── Icons ────────────────────────────────────────────────────────────────────
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const ShieldIcon = ({ color = GOLD }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
)
const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07l-1.5 1.5"/>
    <path d="M14 11a5 5 0 00-7.07 0l-2.83 2.83a5 5 0 007.07 7.07l1.5-1.5"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

// ─── MedicalBg ────────────────────────────────────────────────────────────────
const MedicalBg = () => (
  <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
    <defs><style>{`.med{fill:rgba(91,140,143,0.055);stroke:rgba(91,140,143,0.08);stroke-width:1}.medl{fill:rgba(91,140,143,0.035);stroke:rgba(91,140,143,0.06);stroke-width:1}`}</style></defs>
    <g transform="translate(270,60) rotate(20)">
      <circle cx="0" cy="0" r="32" className="medl"/><circle cx="0" cy="0" r="20" className="med"/>
      <path d="M0,32 Q10,70 30,80 Q60,90 70,120" fill="none" stroke="rgba(91,140,143,0.07)" strokeWidth="7" strokeLinecap="round"/>
      <path d="M0,32 Q-10,70 -28,80 Q-58,90 -68,120" fill="none" stroke="rgba(91,140,143,0.07)" strokeWidth="7" strokeLinecap="round"/>
    </g>
    <g transform="translate(50,310)" opacity=".5">
      <rect x="-6" y="-20" width="12" height="40" rx="3" className="medl"/>
      <rect x="-20" y="-6" width="40" height="12" rx="3" className="medl"/>
    </g>
    <ellipse cx="100" cy="200" rx="14" ry="9" className="medl" transform="rotate(45,100,200)"/>
    <ellipse cx="310" cy="380" rx="14" ry="9" className="medl" transform="rotate(-20,310,380)"/>
  </svg>
)

// ─── StatsDashboard ───────────────────────────────────────────────────────────
const dashTrans = {
  en:{ apptLabel:"Today's", patLabel:'Active', revLabel:'Revenue', deptTitle:'Department Load', weekTitle:'Weekly Visits', depts:['General','Cardiology','Pediatrics','Orthopedics'], days:['Mon','Tue','Wed','Thu','Fri'] },
  ar:{ apptLabel:'اليوم',   patLabel:'نشطون',  revLabel:'الإيراد', deptTitle:'تحميل الأقسام',  weekTitle:'زيارات أسبوعية', depts:['عام','قلبية','أطفال','عظام'],                    days:['إث','ثل','أرب','خم','جم'] },
}
const StatsDashboard = ({ lang }: { lang:'en'|'ar' }) => {
  const dt = dashTrans[lang]
  useEffect(() => {
    const intervals: number[] = []; const timeouts: number[] = []
    const animCount = (id:string, target:number) => {
      const el = document.getElementById(id); if(!el) return
      let cur=0; const step=target/50
      const iv = window.setInterval(() => { cur=Math.min(cur+step,target); el.textContent=Math.round(cur).toLocaleString(); if(cur>=target) window.clearInterval(iv) }, 800/50)
      intervals.push(iv)
    }
    animCount('sd-appt',48); animCount('sd-pat',1247); animCount('sd-rev',84)
    const t1 = window.setTimeout(() => { document.querySelectorAll<HTMLElement>('.sd-bar').forEach(b => { b.style.width=(b.dataset.w||'0')+'%' }) }, 200)
    const t2 = window.setTimeout(() => { document.querySelectorAll<HTMLElement>('.sd-mb').forEach((b,i) => { const t=window.setTimeout(()=>{ b.style.height=(b.dataset.h||'0')+'%' },i*60); timeouts.push(t) }) }, 200)
    timeouts.push(t1,t2)
    return () => { intervals.forEach(clearInterval); timeouts.forEach(clearTimeout) }
  }, [])
  return (
    <div style={{ marginTop:'1.5rem', width:'100%' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:12 }}>
        {[{id:'sd-appt',label:dt.apptLabel,icon:'📅'},{id:'sd-pat',label:dt.patLabel,icon:'👥'},{id:'sd-rev',label:dt.revLabel,icon:'💰'}].map(c=>(
          <div key={c.id} style={{ background:PS, border:`1px solid ${BR}`, borderRadius:12, padding:'10px 12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
              <span style={{ fontSize:14 }}>{c.icon}</span>
              <span style={{ fontSize:9, color:TM, textTransform:'uppercase', letterSpacing:'0.5px' }}>{c.label}</span>
            </div>
            <div style={{ fontSize:20, fontWeight:700, color:TD }}>{c.id==='sd-rev'&&'$'}<span id={c.id}>0</span>{c.id==='sd-rev'&&<span style={{ fontSize:11, color:TM }}>K</span>}</div>
          </div>
        ))}
      </div>
      <div style={{ background:PS, border:`1px solid ${BR}`, borderRadius:12, padding:'12px 14px', marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:600, color:TD, marginBottom:10 }}>{dt.deptTitle}</div>
        {[88,72,61,45].map((w,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ fontSize:10, color:TM, width:65, flexShrink:0 }}>{dt.depts[i]}</div>
            <div style={{ flex:1, background:'rgba(91,140,143,0.15)', borderRadius:100, height:5, overflow:'hidden' }}>
              <div className="sd-bar" data-w={w} style={{ height:'100%', borderRadius:100, background:P, width:0, transition:'width 0.8s ease' }} />
            </div>
            <div style={{ fontSize:10, color:TD, fontWeight:500, width:30, textAlign:'right' }}>{w}%</div>
          </div>
        ))}
      </div>
      <div style={{ background:PS, border:`1px solid ${BR}`, borderRadius:12, padding:'12px 14px' }}>
        <div style={{ fontSize:11, fontWeight:600, color:TD, marginBottom:10 }}>{dt.weekTitle}</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:50 }}>
          {[60,80,100,75,90].map((h,i)=>(
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
              <div className="sd-mb" data-h={h} style={{ width:'100%', background:i===2?P:'rgba(91,140,143,0.25)', borderRadius:'4px 4px 0 0', height:0, transition:'height 0.7s ease' }} />
              <div style={{ fontSize:8, color:TM }}>{dt.days[i]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate()
  // ── Point 1: reading the subdomain straight from the URL ──
  // Route this component at "/login/:subdomain?" so a clinic gets a
  // permanent, bookmarkable link like  app.cura.jo/login/huor
  // and "/login/admin" is reserved for the SuperAdmin entry (point 2).
  const { subdomain: subdomainParam } = useParams<{ subdomain?: string }>()

  const [lang, setLang]         = useState<Lang>('en')
  const [step, setStep]         = useState<'subdomain'|'login'>('subdomain')
  const [subdomain, setSubdomain] = useState('')
  const [clinicInfo, setClinicInfo] = useState<{ name:string; logo?:string; isAdmin:boolean } | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)
  const [autoChecking, setAutoChecking] = useState(false)
  const [subdomainError, setSubdomainError] = useState('')
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [shakeForm, setShakeForm] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  // Remembers the last subdomain we already resolved, so navigating to the
  // same "/login/:subdomain" we just set ourselves doesn't trigger a second,
  // redundant fetch + full-screen loading flash that hides the login form.
  const resolvedRef = useRef<string | null>(null)

  const t    = translations[lang]
  const isAr = lang === 'ar'

  useEffect(() => {
    const id = 'cura-login-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id=id; s.textContent=globalCss; document.head.appendChild(s)
    }
  }, [])

  // ── Shared resolver used by both the manual form and the URL-driven auto-check ──
  const resolveSubdomain = useCallback(async (value: string, opts?: { silent?: boolean }) => {
    const sub = value.trim().toLowerCase()
    if (!sub) return

    // Point 2: the SuperAdmin entry never hits the clinics endpoint —
    // it isn't tied to any clinic, so there's nothing to look up.
    if (sub === 'admin') {
      resolvedRef.current = 'admin'
      setClinicInfo({ name: t.adminBadge, isAdmin: true })
      setSubdomain('admin')
      setStep('login')
      return
    }

    if (!opts?.silent) setCheckingSubdomain(true)
    setSubdomainError('')
    try {
      const res = await api.get(`/clinics/by-subdomain/${sub}`)
      resolvedRef.current = sub
      setClinicInfo(res.data)
      setSubdomain(sub)
      setStep('login')
      // Point 1: once confirmed, make the URL reflect the clinic so the
      // address bar itself becomes the shareable/bookmarkable link.
      navigate(`/login/${sub}`, { replace: true })
    } catch {
      setSubdomainError(t.subdomainNotFound)
      setShakeForm(true); setTimeout(() => setShakeForm(false), 400)
    } finally {
      setCheckingSubdomain(false)
    }
  }, [navigate, t.adminBadge, t.subdomainNotFound])

  // ── On mount / when the URL param changes, resolve it automatically ──
  // so staff who open their saved clinic link never have to type it again.
  useEffect(() => {
    if (!subdomainParam) return
    if (resolvedRef.current === subdomainParam.toLowerCase()) return
    setAutoChecking(true)
    resolveSubdomain(subdomainParam, { silent: true }).finally(() => setAutoChecking(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomainParam])

  const handleSubdomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subdomain.trim()) return
    await resolveSubdomain(subdomain)
  }

  // ── Step 2: Login ──────────────────────────────────────────────────────────
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setError(''); setLoading(true)
  try {
    const response = await api.post<AuthResponse>(
      `/auth/login?lang=${lang}&subdomain=${subdomain}`, 
      { emailOrUsername, password }
    )
    const data = response.data
    
    // ✅ استخدم authService للتوكنات
    authService.setTokens(data.token, data.refreshToken, data.expiresIn)
    
    // ✅ احفظ البيانات الأخرى في localStorage
    localStorage.setItem('clinicSubdomain', subdomain)
    localStorage.setItem('user', JSON.stringify({
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      clinicId: data.clinicId,
      clinicName: data.clinicName,
    }))
    
    // ✅ جديد — احفظ permissions من نفس Login Response
    localStorage.setItem('permissions', JSON.stringify(data.permissions || []))

if (data.role?.toLowerCase() === 'doctor') {
  navigate('/daily')
} else {
  navigate('/dashboard')
}
  } catch (err) {
    console.error('❌ Login error:', err)
    setError(isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials')
    setShakeForm(true)
    setTimeout(() => setShakeForm(false), 400)
  } finally {
    setLoading(false)
  }
}
  const handleCopyLink = async () => {
    const url = `${window.location.origin}/login/${subdomain}`
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch { /* clipboard unavailable — silently ignore */ }
  }

  const LoadingDots = () => (
    <span style={{ display:'inline-flex', gap:4, alignItems:'center' }}>
      {[0,0.15,0.3].map((d,i) => (
        <span key={i} style={{ width:5, height:5, borderRadius:'50%', background:'#fff', animation:`dot-bounce 1s ${d}s infinite` }} />
      ))}
    </span>
  )

  if (loading) return (
    <LoadingScreen
      message={isAr ? 'جارٍ تسجيل الدخول...' : 'Signing you in...'}
      subMessage={isAr ? 'يرجى الانتظار أثناء التحقق من بياناتك' : 'Please wait while we verify your credentials'}
      fullScreen
    />
  )

  // While an URL-provided subdomain is being resolved automatically, show a
  // minimal loading state instead of flashing the "type your clinic" form.
  if (autoChecking) return (
    <LoadingScreen
      message={t.autoChecking}
      fullScreen
    />
  )

  const inputStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    width:'100%', background:PS, border:`1px solid ${BR}`, borderRadius:12,
    padding:'12px 14px', fontSize:14, fontFamily:t.font, color:TD,
    outline:'none', transition:'all 0.2s ease', ...extra,
  })

  const isAdminMode = !!clinicInfo?.isAdmin
  const accent   = isAdminMode ? GOLD   : P
  const accentD  = isAdminMode ? '#9C7222' : PD
  const accentS  = isAdminMode ? GOLDS  : PS
  const accentBr = isAdminMode ? GOLDBR : BR

  return (
    <div className="cura-shell" dir={t.dir} style={{ fontFamily:t.font }}>

      {/* ══════ LEFT ══════ */}
      <div className="cura-left" style={{ padding:'3rem 2.5rem', animation:'slide-left 0.5s ease both' }}>
        <MedicalBg />

        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:PS, border:`1px solid ${BR}`, borderRadius:100, padding:'5px 14px', fontSize:11, fontWeight:600, color:P, marginBottom:'1.5rem' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:P, animation:'pulse-soft 2s infinite' }} />
          {isAr ? 'منصة إدارة العيادات' : 'Clinic Management Platform'}
        </div>

        <div style={{ marginBottom:'1.5rem' }}>
          <ECGAnimation height={110} showLetters speed={0.7} />
        </div>

        <h1 style={{ fontFamily:"'DM Serif Display', serif", fontSize:38, fontWeight:500, lineHeight:1.2, color:TD, marginBottom:'1rem' }}>
          {t.headline[0]}<br/>
          <span style={{ color:P }}>{t.headline[1]}</span>
        </h1>

        <p style={{ fontSize:14, color:TM, lineHeight:1.65, marginBottom:'2rem', maxWidth:'90%' }}>{t.desc}</p>

        <div className="cura-stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, maxWidth:'90%', marginBottom:'1rem' }}>
          {[{n:'500+',l:t.stats[0]},{n:'99.9%',l:t.stats[1]},{n:'24/7',l:t.stats[2]}].map(s=>(
            <div key={s.l} style={{ background:PS, border:`1px solid ${BR}`, borderRadius:12, padding:12 }}>
              <div style={{ fontSize:22, fontWeight:700, color:TD }}>{s.n}</div>
              <div style={{ fontSize:10, color:TM, marginTop:4, letterSpacing:'0.5px', textTransform:'uppercase' }}>{s.l}</div>
            </div>
          ))}
        </div>

        <StatsDashboard lang={lang} />
      </div>

      {/* ══════ RIGHT ══════ */}
      <div className="cura-right" style={{ padding:'3rem', animation:'slide-right 0.5s ease both' }}>
        <div style={{ width:'100%', maxWidth:440 }}>

          {/* Lang toggle */}
          <div style={{ display:'flex', justifyContent:'center', gap:6, background:PS, borderRadius:100, padding:4, marginBottom:'1.5rem' }}>
            {(['en','ar'] as Lang[]).map(l => (
              <button key={l} onClick={() => { setLang(l); setError(''); setSubdomainError('') }}
                style={{ border:'none', borderRadius:100, padding:'6px 20px', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.2s ease', fontFamily:l==='ar'?"'Noto Kufi Arabic',sans-serif":"'Inter',sans-serif", background:lang===l?P:'transparent', color:lang===l?'#FFF':TM }}>
                {l==='ar' ? 'العربية' : 'English'}
              </button>
            ))}
          </div>

          {/* Card */}
          <div className={shakeForm ? 'shake' : ''} style={{ background:'#FFF', border:`1px solid ${accentBr}`, borderRadius:24, padding:'2rem', boxShadow: isAdminMode ? '0 8px 32px rgba(184,137,42,0.10)' : '0 8px 32px rgba(0,0,0,0.04)', transition:'border-color 0.3s ease, box-shadow 0.3s ease' }}>

            {/* Logo */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'1.5rem', gap:8 }}>
              <div style={{ width:70, height:70, borderRadius:20, background:`linear-gradient(135deg,${accent},${accentD})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 12px ${accent}30`, transition:'background 0.3s ease' }}>
                <img src={logo} alt="CURA" style={{ width:45, height:45, objectFit:'contain', filter:'brightness(0) invert(1)' }} />
              </div>

              {/* Clinic / Admin badge — shown after subdomain confirmed */}
              {clinicInfo && (
                <div className="pop-in" style={{ display:'flex', alignItems:'center', gap:8, background:accentS, border:`1px solid ${accentBr}`, borderRadius:100, padding:'5px 14px' }}>
                  {clinicInfo.isAdmin ? <ShieldIcon color={GOLD} /> : <span style={{ fontSize:14 }}>🏥</span>}
                  <span style={{ fontSize:13, fontWeight:700, color: isAdminMode ? '#8A6A22' : TD }}>{clinicInfo.name}</span>
                  <button onClick={() => { setStep('subdomain'); setClinicInfo(null); setError(''); navigate('/login', { replace:true }) }}
                    style={{ background:'none', border:'none', color:TM, cursor:'pointer', fontSize:11, padding:'0 2px' }}>✕</button>
                </div>
              )}

              {clinicInfo?.isAdmin && (
                <p style={{ fontSize:11, color:TM, textAlign:'center', maxWidth:280, lineHeight:1.5 }}>{t.adminWelcome}</p>
              )}

              {!clinicInfo && (
                <div style={{ fontSize:13, color:TM, textAlign:'center' }}>
                  {isAr ? 'منصة إدارة العيادات' : 'Clinic Management Platform'}
                </div>
              )}
            </div>

            {/* ── STEP 1: Subdomain ── */}
            {step === 'subdomain' && (
              <form onSubmit={handleSubdomainSubmit} className="step-enter" dir={t.dir}>
                <p style={{ fontSize:13, color:TM, textAlign:'center', marginBottom:20, lineHeight:1.6 }}>
                  {t.subdomainHint}
                </p>

                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:10, fontWeight:600, color:TM, marginBottom:6, letterSpacing:'0.6px', textTransform:'uppercase' }}>
                    {t.subdomainLabel}
                  </label>
                  {/* Subdomain input with suffix */}
                  <div style={{ display:'flex', alignItems:'center', border:`1px solid ${subdomainError?ET:BR}`, borderRadius:12, overflow:'hidden', background:PS, transition:'all 0.2s ease' }}>
                    <input
                      type="text"
                      value={subdomain}
                      onChange={e => { setSubdomain(e.target.value.replace(/[^a-zA-Z0-9-]/g,'')); setSubdomainError('') }}
                      placeholder={t.subdomainPh}
                      autoFocus
                      style={{ flex:1, background:'transparent', border:'none', outline:'none', padding:'12px 14px', fontSize:14, fontFamily:"'Inter',sans-serif", color:TD, direction:'ltr' }}
                    />
                    <span style={{ padding:'12px 14px 12px 0', fontSize:13, color:TM, fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap' }}>
                      {t.subdomainSuffix}
                    </span>
                  </div>
                  {subdomainError && (
                    <p style={{ fontSize:11, color:ET, marginTop:6, display:'flex', alignItems:'center', gap:4 }}>⚠️ {subdomainError}</p>
                  )}
                </div>

                <button type="submit" disabled={checkingSubdomain || !subdomain.trim()}
                  style={{ width:'100%', background:P, color:'#FFF', border:'none', borderRadius:12, padding:'13px', fontSize:14, fontWeight:600, fontFamily:t.font, cursor:(checkingSubdomain||!subdomain.trim())?'not-allowed':'pointer', opacity:(checkingSubdomain||!subdomain.trim())?0.6:1, transition:'all 0.2s ease', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                  onMouseEnter={e=>{ if(!checkingSubdomain&&subdomain.trim()) e.currentTarget.style.background=PD }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=P }}>
                  {checkingSubdomain ? <><LoadingDots /></> : t.subdomainBtn}
                </button>

                {/* Point 2: a clear, dedicated SuperAdmin entry point instead of a hidden typing trick */}
               {/* <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:18, fontSize:12 }}>
                  <span style={{ color:TM }}>{t.adminLinkText}</span>
                  <button
                    type="button"
                    onClick={() => navigate('/login/admin')}
                    style={{ display:'inline-flex', alignItems:'center', gap:5, background:'none', border:'none', color:GOLD, fontWeight:700, cursor:'pointer', fontFamily:t.font, padding:0 }}
                  >
                    <ShieldIcon color={GOLD} />
                    {t.adminLinkCta}
                  </button>
                </div>
*/}
                {/* Divider */}
                <div style={{ display:'flex', alignItems:'center', gap:12, margin:'16px 0' }}>
                  <div style={{ flex:1, height:1, background:BR }} />
                  <span style={{ fontSize:10, color:TM, letterSpacing:'0.5px' }}>{isAr?'أو':'OR'}</span>
                  <div style={{ flex:1, height:1, background:BR }} />
                </div>

                <button type="button" onClick={() => navigate('/')}
                  style={{ width:'100%', background:'transparent', border:`1px solid ${BR}`, borderRadius:12, padding:'11px', fontSize:13, fontWeight:500, color:TM, cursor:'pointer', fontFamily:t.font, transition:'all 0.2s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.background=PS; e.currentTarget.style.borderColor=P; e.currentTarget.style.color=P }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor=BR; e.currentTarget.style.color=TM }}>
                  {isAr ? '← العودة للصفحة الرئيسية' : '← Back to homepage'}
                </button>
              </form>
            )}

            {/* ── STEP 2: Login ── */}
            {step === 'login' && (
              <form onSubmit={handleLogin} className="step-enter" dir={t.dir}>

                {/* Point 1: once the clinic is confirmed, offer a one-tap way to save
                    this exact URL for next time, so no one has to retype the subdomain. */}
                {!isAdminMode && (
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      background:PS, border:`1px dashed ${BR}`, borderRadius:12, padding:'10px 12px',
                      fontSize:12, fontWeight:600, color: linkCopied ? '#2E8B57' : P, cursor:'pointer',
                      fontFamily:t.font, marginBottom:16, transition:'all 0.2s ease',
                    }}
                  >
                    {linkCopied ? <CheckIcon /> : <LinkIcon />}
                    {linkCopied ? t.copiedLink : t.copyLink}
                  </button>
                )}

                {/* Email */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:10, fontWeight:600, color:TM, marginBottom:6, letterSpacing:'0.6px', textTransform:'uppercase' }}>
                    {t.lEmail}
                  </label>
                  <div style={{ position:'relative' }}>
                    <input type="text" value={emailOrUsername} onChange={e=>setEmailOrUsername(e.target.value)}
                      required autoComplete="username" placeholder={t.ePh}
                      style={inputStyle({ paddingRight:isAr?'14px':'40px', paddingLeft:isAr?'40px':'14px' })} />
                    <span style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', [isAr?'left':'right']:14, color:TM, fontSize:14, pointerEvents:'none' }}>👤</span>
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom:10 }}>
                  <label style={{ display:'block', fontSize:10, fontWeight:600, color:TM, marginBottom:6, letterSpacing:'0.6px', textTransform:'uppercase' }}>
                    {t.lPass}
                  </label>
                  <div style={{ position:'relative' }}>
                    <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                      required autoComplete="current-password" placeholder={t.pPh}
                      style={inputStyle({ padding:'12px 40px' })} />
                    <span style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', [isAr?'left':'right']:14, color:TM, fontSize:14, pointerEvents:'none' }}>🔒</span>
                    <button type="button" onClick={()=>setShowPass(v=>!v)}
                      style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', [isAr?'right':'left']:12, background:'none', border:'none', cursor:'pointer', color:showPass?P:TM, padding:5, display:'flex', alignItems:'center' }}>
                      {showPass ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                {/* Forgot */}
                <div style={{ textAlign:isAr?'right':'left', marginBottom:16 }}>
                  <a href="#" onClick={e=>e.preventDefault()} style={{ fontSize:11, color:accent, textDecoration:'none', opacity:0.75 }}>{t.forgot}</a>
                </div>

                {/* Error */}
                {error && (
                  <div style={{ background:EB, border:`1px solid ${ET}40`, borderRadius:10, padding:'10px 12px', fontSize:12, color:ET, marginBottom:14, display:'flex', alignItems:'center', gap:8, animation:'fade-in 0.3s ease' }}>
                    <span>⚠️</span><span style={{ flex:1 }}>{error}</span>
                    <button onClick={()=>setError('')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, color:ET }}>✕</button>
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={loading}
                  style={{ width:'100%', background:accent, color:'#FFF', border:'none', borderRadius:12, padding:'13px', fontSize:14, fontWeight:600, fontFamily:t.font, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s ease', marginBottom:14 }}
                  onMouseEnter={e=>{ if(!loading) e.currentTarget.style.background=accentD }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=accent }}>
                  {loading ? <LoadingDots /> : t.btn}
                </button>

                {/* Back to subdomain */}
                <button type="button" onClick={() => { setStep('subdomain'); setClinicInfo(null); setError(''); navigate('/login', { replace:true }) }}
                  style={{ width:'100%', background:'transparent', border:`1px solid ${BR}`, borderRadius:12, padding:'10px', fontSize:12, fontWeight:500, color:TM, cursor:'pointer', fontFamily:t.font, transition:'all 0.2s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.background=PS; e.currentTarget.style.color=P }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=TM }}>
                  {t.subdomainBack}
                </button>

                {/* Trust */}
                <div style={{ display:'flex', alignItems:'center', gap:12, margin:'16px 0 8px' }}>
                  <div style={{ flex:1, height:1, background:BR }} />
                  <span style={{ fontSize:10, color:TM, letterSpacing:'0.5px' }}>{t.ssl}</span>
                  <div style={{ flex:1, height:1, background:BR }} />
                </div>
                <div style={{ display:'flex', justifyContent:'center', gap:20 }}>
                  {t.trust.map((label,i) => (
                    <div key={label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:TM }}>
                      <span>{['🛡️','🔐','✅'][i]}</span><span>{label}</span>
                    </div>
                  ))}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}