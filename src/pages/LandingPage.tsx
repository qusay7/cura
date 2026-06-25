import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const C = {
  teal:      '#2E6E6E',
  tealMid:   '#3D8080',
  tealLight: '#5B9E9E',
  tealSoft:  '#EAF4F4',
  tealGlow:  '#1A4F4F',
  cream:     '#F7F9F9',
  white:     '#FFFFFF',
  dark:      '#0F1F1F',
  darkMid:   '#1A2E2E',
  muted:     '#4A6868',
  border:    '#D0E4E4',
  gold:      '#B8892A',
  goldSoft:  '#FBF4E4',
  green:     '#22C55E',
  amber:     '#F59E0B',
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&family=Noto+Kufi+Arabic:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; font-size: 16px; }
body { background: ${C.cream}; -webkit-font-smoothing: antialiased; }

@keyframes fadeUp   { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
@keyframes floatA   { 0%,100% { transform:translateY(0px) rotate(0deg); } 50% { transform:translateY(-10px) rotate(0.5deg); } }
@keyframes floatB   { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-6px); } }
@keyframes pulse2   { 0%,100% { opacity:0.5; transform:scale(0.95); } 50% { opacity:1; transform:scale(1.05); } }
@keyframes draw     { from { stroke-dashoffset:400; } to { stroke-dashoffset:0; } }
@keyframes blink    { 0%,100% { opacity:1; } 50% { opacity:0.1; } }
@keyframes shimmer  { 0% { transform:translateX(-100%); } 100% { transform:translateX(100%); } }
@keyframes countUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
@keyframes spin     { to { transform:rotate(360deg); } }
@keyframes gradMove { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }

.fu  { animation: fadeUp  0.65s cubic-bezier(0.22, 1, 0.36, 1) both; }
.fi  { animation: fadeIn  0.5s ease both; }
.d1  { animation-delay:0.08s; }
.d2  { animation-delay:0.16s; }
.d3  { animation-delay:0.24s; }
.d4  { animation-delay:0.34s; }
.d5  { animation-delay:0.44s; }

/* ── Glass card ── */
.glass {
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.9);
  border-radius: 20px;
}

/* ── Nav ── */
.nav-item {
  font-size: 14px; font-weight: 500;
  color: ${C.muted}; cursor: pointer;
  transition: color 0.2s; text-decoration: none;
  position: relative;
}
.nav-item::after {
  content:''; position:absolute; bottom:-2px; left:0; right:0;
  height:1.5px; background:${C.teal}; transform:scaleX(0);
  transition:transform 0.2s; transform-origin: center;
}
.nav-item:hover { color:${C.teal}; }
.nav-item:hover::after { transform:scaleX(1); }

/* ── Buttons ── */
.btn-primary {
  display:inline-flex; align-items:center; gap:8px;
  background:${C.teal}; color:#FFF; border:none;
  border-radius:12px; padding:12px 26px;
  font-size:14px; font-weight:600;
  cursor:pointer; transition:all 0.22s ease;
  position:relative; overflow:hidden; white-space:nowrap;
}
.btn-primary::before {
  content:''; position:absolute; inset:0;
  background:linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
  opacity:0; transition:opacity 0.2s;
}
.btn-primary:hover { background:${C.tealGlow}; transform:translateY(-2px); box-shadow:0 8px 28px rgba(46,110,110,0.35); }
.btn-primary:hover::before { opacity:1; }
.btn-primary:active { transform:translateY(0); }

.btn-ghost {
  display:inline-flex; align-items:center; gap:8px;
  background:transparent; color:${C.dark};
  border:1.5px solid ${C.border}; border-radius:12px;
  padding:12px 26px; font-size:14px; font-weight:600;
  cursor:pointer; transition:all 0.22s ease; white-space:nowrap;
}
.btn-ghost:hover { border-color:${C.teal}; color:${C.teal}; background:${C.tealSoft}; transform:translateY(-1px); }

.btn-white {
  display:inline-flex; align-items:center; gap:8px;
  background:#FFF; color:${C.teal};
  border:none; border-radius:12px;
  padding:14px 32px; font-size:15px; font-weight:700;
  cursor:pointer; transition:all 0.22s ease; white-space:nowrap;
  box-shadow:0 4px 20px rgba(0,0,0,0.12);
}
.btn-white:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,0.18); }

/* ── Feature cards ── */
.feat-card {
  background:${C.white}; border:1px solid ${C.border};
  border-radius:20px; padding:28px 24px;
  transition:all 0.25s ease; position:relative; overflow:hidden;
}
.feat-card::before {
  content:''; position:absolute; top:0; left:0; right:0; height:3px;
  background:linear-gradient(90deg, ${C.teal}, ${C.tealLight});
  transform:scaleX(0); transition:transform 0.3s ease;
}
.feat-card:hover { border-color:${C.teal}40; box-shadow:0 12px 40px rgba(46,110,110,0.10); transform:translateY(-3px); }
.feat-card:hover::before { transform:scaleX(1); }

/* ── Plan cards ── */
.plan-card {
  background:${C.white}; border:1.5px solid ${C.border};
  border-radius:24px; padding:36px 28px;
  transition:all 0.28s ease; position:relative; overflow:hidden;
}
.plan-card:hover { border-color:${C.tealLight}; box-shadow:0 16px 48px rgba(46,110,110,0.12); transform:translateY(-5px); }
.plan-card.top {
  background:linear-gradient(160deg, ${C.darkMid} 0%, ${C.dark} 100%);
  border-color:${C.teal};
  box-shadow:0 20px 60px rgba(46,110,110,0.25);
}
.plan-card.top:hover { box-shadow:0 28px 70px rgba(46,110,110,0.3); transform:translateY(-6px); }

/* ── ECG ── */
.ecg-path {
  stroke-dasharray:400;
  stroke-dashoffset:400;
  animation:draw 2.5s cubic-bezier(0.4,0,0.2,1) 0.5s forwards;
}

/* ── Stat number ── */
.stat-val {
  font-family:'DM Serif Display', Georgia, serif;
  font-size:44px; line-height:1; color:${C.white};
  animation:countUp 0.6s ease both;
}

/* ── Tag / badge ── */
.tag {
  display:inline-flex; align-items:center; gap:6px;
  border-radius:100px; padding:5px 14px;
  font-size:11px; font-weight:700; letter-spacing:0.8px;
  text-transform:uppercase;
}

/* ── Scroll indicator ── */
.scroll-dot { animation:floatB 2s ease-in-out infinite; }

/* ── Gradient text ── */
.grad-text {
  background:linear-gradient(135deg, ${C.teal} 0%, ${C.tealLight} 100%);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  background-clip:text;
}

/* ── Responsive ── */
@media(max-width:1024px) {
  .hero-grid    { grid-template-columns:1fr !important; }
  .hero-vis     { display:none !important; }
  .feat-grid    { grid-template-columns:repeat(2,1fr) !important; }
  .plan-grid    { grid-template-columns:1fr !important; }
}
@media(max-width:768px) {
  .nav-links    { display:none !important; }
  .stats-grid   { grid-template-columns:repeat(2,1fr) !important; }
  .feat-grid    { grid-template-columns:1fr !important; }
}
`

// ─── ECG ──────────────────────────────────────────────────────────────────────
const ECGLine = ({ color = C.tealLight }: { color?: string }) => (
  <svg viewBox="0 0 360 56" fill="none" style={{ width:'100%', height:56 }}>
    <path className="ecg-path"
      d="M0 28 L50 28 L68 28 L80 8 L92 48 L104 4 L116 52 L128 28 L148 28 L300 28 L360 28"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="300" cy="28" r="4.5" fill={color} style={{ animation:'blink 1.1s ease infinite' }} />
  </svg>
)

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  ar: {
    dir:'rtl' as const,
    font:"'Noto Kufi Arabic', sans-serif",
    nav:{ features:'المميزات', pricing:'الأسعار', about:'من نحن', login:'تسجيل الدخول', cta:'ابدأ مجاناً' },
    hero:{
      eyebrow:'منصة إدارة العيادات الطبية',
      h1:  'إدارة عيادة أكثر ذكاء.',
      h1b: 'نتائج أفضل للمرضى.',
      sub:'منصة Cura المتكاملة تجمع بين ملفات المرضى وحجز المواعيد وقوائم الانتظار وتقارير الإيرادات — في واجهة واحدة سهلة الاستخدام، مصمّمة للعيادات في الأردن والعالم العربي.',
      cta1:'ابدأ تجربتك المجانية ←',
      cta2:'استعرض المميزات',
      card_title:'مواعيد اليوم',
      card_total:'موعد',
      rows:[
        { name:'أحمد الخالد', time:'09:00', label:'مكتمل',  color:C.green  },
        { name:'سارة العمر',  time:'09:30', label:'قيد الانتظار', color:C.amber  },
        { name:'محمد علي',    time:'10:15', label:'مجدول',  color:C.teal   },
      ],
      rev_label:'إيرادات اليوم',
      pat_label:'مريض جديد',
      pat_name:'ليلى محمود',
    },
    stats:[
      { val:'+500',   label:'عيادة نشطة' },
      { val:'+50K',   label:'مريض مسجّل' },
      { val:'99.9%',  label:'وقت التشغيل' },
      { val:'4.9 ★',  label:'رضا العملاء' },
    ],
    feats:{
      eyebrow:'المميزات',
      title:'كل ما تحتاجه عيادتك في منصة واحدة',
      sub:'من أوّل موعد حتى آخر فاتورة — Cura يُغطّي كل خطوة في رحلة مريضك',
      items:[
        { icon:'📅', title:'جدولة المواعيد',   desc:'تقويم ذكي يُقلّل الغياب ويملأ الفراغات تلقائياً — مع تذكيرات فورية للمرضى.' },
        { icon:'🗂️', title:'ملف المريض الموحّد', desc:'سجل طبي شامل يضمّ التاريخ المرضي والوصفات والفحوصات والتشخيصات بأثر رجعي.' },
        { icon:'🩺', title:'ملاحظات الزيارة',  desc:'تشخيص دقيق، وصفة طبية، طلبات مختبر وأشعة — كلّها في نقرة واحدة عند كل زيارة.' },
        { icon:'🔢', title:'إدارة قوائم الدور', desc:'نظام انتظار ذكي يتتبّع الدور في الوقت الفعلي ويُعلم الطاقم بأي تغيير.' },
        { icon:'💳', title:'الفواتير والإيصالات', desc:'إصدار فواتير احترافية بنقرة واحدة مع دعم قادم للفوترة الإلكترونية الأردنية.' },
        { icon:'📊', title:'تقارير الأداء',    desc:'لوحة بيانات تفصيلية للإيرادات والمرضى والأطباء تساعدك في اتخاذ قرارات مبنية على البيانات.' },
        { icon:'🏥', title:'تعدد الأقسام',     desc:'قسّم عيادتك إلى أقسام طبية مستقلة — لكل منها فريقه وصلاحياته الخاصة.' },
        { icon:'🌐', title:'واجهة ثنائية اللغة', desc:'دعم كامل للغتين العربية والإنجليزية مع اتجاه RTL مدمج من اليوم الأول.' },
      ],
    },
    pricing:{
      eyebrow:'الأسعار',
      title:'أسعار شفّافة بلا رسوم مخفية',
      sub:'خطط مرنة تنمو مع عيادتك — جميعها تشمل الدعم الفني المجاني ومدير حساب مخصص',
      monthly:'شهري', yearly:'سنوي', save:'وفّر 20%',
      plans:[
        { name:'الأساسية', nameEn:'Starter', price:29, currency:'د.أ',
          desc:'للعيادات الناشئة والأطباء المستقلين',
          features:['3 أطباء كحدٍّ أقصى','500 ملف مريض','جدولة المواعيد','ملاحظات الزيارة','تقارير أساسية'],
          cta:'ابدأ الآن', featured:false },
        { name:'المتقدمة', nameEn:'Professional', price:59, currency:'د.أ',
          desc:'الخيار الأمثل للعيادات متوسطة الحجم',
          features:['10 أطباء كحدٍّ أقصى','مرضى غير محدودين','جميع المميزات','فواتير إلكترونية','أقسام متعددة','دعم ذو أولوية'],
          cta:'ابدأ مجاناً 14 يوماً', featured:true },
        { name:'المؤسسية', nameEn:'Enterprise', price:99, currency:'د.أ',
          desc:'للمستشفيات والمجمعات الطبية الكبرى',
          features:['أطباء ومرضى غير محدودين','واجهة برمجية (API) مخصصة','تكامل مع الفوترة الوطنية','مدير حساب مخصص','اتفاقية مستوى الخدمة (SLA)','تدريب مجاني للفريق'],
          cta:'تواصل مع فريق المبيعات', featured:false },
      ],
    },
    cta:{
      title:'جاهز لتحويل تجربة مرضاك؟',
      sub:'انضم إلى أكثر من 500 عيادة تثق في Cura يومياً',
      btn:'ابدأ تجربتك المجانية — 14 يوماً بلا التزام',
    },
    footer:{
      tagline:'منصة إدارة عيادات مصمّمة للعالم العربي',
      rights:'© 2025 Cura. جميع الحقوق محفوظة.',
      links:['المميزات','الأسعار','سياسة الخصوصية','شروط الاستخدام'],
    },
  },
  en: {
    dir:'ltr' as const,
    font:"'Inter', sans-serif",
    nav:{ features:'Features', pricing:'Pricing', about:'About', login:'Sign In', cta:'Get Started' },
    hero:{
      eyebrow:'Clinic Management Platform',
      h1:  'Smarter clinic management.',
      h1b: 'Better patient outcomes.',
      sub:'Cura brings patient records, appointment scheduling, walk-in queues, and revenue analytics together in one intuitive platform — built for clinics across Jordan and the Arab world.',
      cta1:'Start free trial →',
      cta2:'Explore features',
      card_title:"Today's Appointments",
      card_total:'appointments',
      rows:[
        { name:'Ahmed Al-Khaled', time:'09:00', label:'Completed',  color:C.green  },
        { name:'Sara Al-Omar',    time:'09:30', label:'Waiting',    color:C.amber  },
        { name:'Mohammed Ali',    time:'10:15', label:'Scheduled',  color:C.teal   },
      ],
      rev_label:"Today's Revenue",
      pat_label:'New Patient',
      pat_name:'Layla Mahmoud',
    },
    stats:[
      { val:'500+',  label:'Active Clinics' },
      { val:'50K+',  label:'Patients Served' },
      { val:'99.9%', label:'Uptime SLA' },
      { val:'4.9 ★', label:'Customer Rating' },
    ],
    feats:{
      eyebrow:'Features',
      title:'Everything your clinic needs, nothing it doesn\'t',
      sub:'From first appointment to final invoice — Cura covers every step of your patient journey',
      items:[
        { icon:'📅', title:'Appointment Scheduling', desc:'Smart calendar that cuts no-shows and fills gaps automatically with instant patient reminders.' },
        { icon:'🗂️', title:'Unified Patient Records',  desc:'Comprehensive medical history, prescriptions, lab results, and diagnoses — all in one place.' },
        { icon:'🩺', title:'Visit Notes',             desc:'Diagnosis, prescription, lab orders, and imaging requests captured in a single click per visit.' },
        { icon:'🔢', title:'Queue Management',        desc:'Real-time walk-in queue system that keeps staff and patients informed at every step.' },
        { icon:'💳', title:'Billing & Receipts',     desc:'One-click professional invoices with Jordan national e-invoicing integration coming soon.' },
        { icon:'📊', title:'Performance Analytics',  desc:'Revenue, patient, and physician dashboards that turn clinic data into actionable decisions.' },
        { icon:'🏥', title:'Multi-Department',        desc:'Independent departments with dedicated teams, permissions, and workflows under one roof.' },
        { icon:'🌐', title:'Bilingual Interface',    desc:'Full Arabic and English support with native RTL layout built in from day one.' },
      ],
    },
    pricing:{
      eyebrow:'Pricing',
      title:'Transparent pricing, no hidden fees',
      sub:'Flexible plans that scale with your clinic — all include free technical support and onboarding',
      monthly:'Monthly', yearly:'Yearly', save:'Save 20%',
      plans:[
        { name:'Starter', nameEn:'Starter', price:29, currency:'JD',
          desc:'For independent physicians and small practices',
          features:['Up to 3 physicians','500 patient records','Appointment scheduling','Visit notes','Basic reports'],
          cta:'Get started', featured:false },
        { name:'Professional', nameEn:'Professional', price:59, currency:'JD',
          desc:'The go-to choice for growing clinics',
          features:['Up to 10 physicians','Unlimited patients','All features','E-invoicing','Multi-department','Priority support'],
          cta:'Start 14-day free trial', featured:true },
        { name:'Enterprise', nameEn:'Enterprise', price:99, currency:'JD',
          desc:'For hospitals and large medical groups',
          features:['Unlimited physicians & patients','Custom API access','National billing integration','Dedicated account manager','SLA guarantee','Free staff training'],
          cta:'Talk to sales', featured:false },
      ],
    },
    cta:{
      title:'Ready to transform your patient experience?',
      sub:'Join 500+ clinics that rely on Cura every day',
      btn:'Start your free 14-day trial — no commitment',
    },
    footer:{
      tagline:'Clinic management built for the Arab world',
      rights:'© 2025 Cura. All rights reserved.',
      links:['Features','Pricing','Privacy Policy','Terms of Service'],
    },
  },
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate  = useNavigate()
  const [lang,    setLang]    = useState<'ar'|'en'>('en')
  const [billing, setBilling] = useState<'monthly'|'yearly'>('monthly')
  const [scrolled,setScrolled]= useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = 'cura-lp-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = css; document.head.appendChild(s)
    }
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const t    = T[lang]
  const isAr = lang === 'ar'
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' })

  const LangBtn = () => (
    <button onClick={() => setLang(isAr ? 'en' : 'ar')}
      style={{ background:C.tealSoft, border:`1px solid ${C.border}`, borderRadius:8,
        padding:'5px 13px', fontSize:12, fontWeight:700, color:C.teal, cursor:'pointer',
        fontFamily:"'Inter', sans-serif", letterSpacing:'0.3px' }}>
      {isAr ? 'EN' : 'ع'}
    </button>
  )

  return (
    <div dir={t.dir} style={{ fontFamily:t.font, background:C.cream, minHeight:'100vh', overflowX:'hidden' }}>

      {/* ══════════════════════ NAV ══════════════════════ */}
      <nav style={{
        position:'fixed', inset:'0 0 auto 0', zIndex:200,
        background: scrolled ? 'rgba(247,249,249,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : 'none',
        transition:'all 0.3s ease', padding:'0 40px',
      }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:70 }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}>
            <div style={{ width:38, height:38, borderRadius:11, background:`linear-gradient(135deg,${C.teal},${C.tealLight})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 14px ${C.teal}40` }}>
              <span style={{ color:'#FFF', fontSize:17, fontWeight:800, fontFamily:"'DM Serif Display',serif", lineHeight:1 }}>C</span>
            </div>
            <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:23, color:C.dark, letterSpacing:'-0.4px', fontWeight:400 }}>Cura</span>
          </div>

          {/* Desktop links */}
          <div className="nav-links" style={{ display:'flex', alignItems:'center', gap:36 }}>
            {[
              { label:t.nav.features, id:'features' },
              { label:t.nav.pricing,  id:'pricing'  },
            ].map(l => (
              <span key={l.id} className="nav-item" onClick={() => scrollTo(l.id)}>{l.label}</span>
            ))}
            <LangBtn />
            <div style={{ width:1, height:20, background:C.border }} />
            <span className="nav-item" onClick={() => navigate('/login')}>{t.nav.login}</span>
            <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding:'9px 22px', fontSize:13, borderRadius:10 }}>{t.nav.cta}</button>
          </div>

          {/* Mobile */}
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <LangBtn />
            <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding:'9px 18px', fontSize:13, borderRadius:10 }}>{t.nav.login}</button>
          </div>
        </div>
      </nav>

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section ref={heroRef} style={{ minHeight:'100vh', display:'flex', alignItems:'center', padding:'110px 40px 80px' }}>
        {/* BG gradient blob */}
        <div style={{ position:'fixed', top:'-15%', [isAr?'left':'right']:'-10%', width:600, height:600, borderRadius:'50%',
          background:`radial-gradient(circle, ${C.teal}18 0%, transparent 70%)`,
          pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'fixed', bottom:'-20%', [isAr?'right':'left']:'-5%', width:500, height:500, borderRadius:'50%',
          background:`radial-gradient(circle, ${C.tealLight}12 0%, transparent 70%)`,
          pointerEvents:'none', zIndex:0 }} />

        <div style={{ maxWidth:1200, margin:'0 auto', width:'100%', position:'relative', zIndex:1 }}>
          <div className="hero-grid" style={{ display:'grid', gridTemplateColumns:'1fr 480px', gap:64, alignItems:'center' }}>

            {/* ── Text ── */}
            <div>
              {/* Eyebrow */}
              <div className="fu tag" style={{ background:C.tealSoft, border:`1px solid ${C.border}`, color:C.teal, marginBottom:22 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:C.teal, animation:'pulse2 2s infinite' }} />
                {t.hero.eyebrow}
              </div>

              <h1 className="fu d1" style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(40px,5.5vw,70px)', color:C.dark, lineHeight:1.1, letterSpacing:'-0.6px', marginBottom:6 }}>
                {t.hero.h1}
              </h1>
<h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(40px,5.5vw,70px)', color:C.teal, lineHeight:1.1, letterSpacing:'-0.6px', marginBottom:28 }}>
  {t.hero.h1b}
</h1>

              <p className="fu d2" style={{ fontSize:'clamp(15px,1.6vw,17.5px)', color:C.muted, lineHeight:1.75, maxWidth:520, marginBottom:40 }}>
                {t.hero.sub}
              </p>

              <div className="fu d3" style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:48 }}>
                <button className="btn-primary" onClick={() => navigate('/login')} style={{ fontSize:15, padding:'13px 28px' }}>{t.hero.cta1}</button>
                <button className="btn-ghost"   onClick={() => scrollTo('features')} style={{ fontSize:15, padding:'13px 26px' }}>{t.hero.cta2}</button>
              </div>

              {/* Trust badges */}
              <div className="fu d4" style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
                {[
                  { icon:'🔒', text: isAr ? 'بيانات آمنة ومشفّرة' : 'Encrypted & Secure' },
                  { icon:'☁️', text: isAr ? 'سحابي 100%'         : '100% Cloud-Based'  },
                  { icon:'🛠️', text: isAr ? 'دعم فني على مدار الساعة' : '24/7 Support'  },
                ].map((b,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:C.muted, fontWeight:500 }}>
                    <span>{b.icon}</span><span>{b.text}</span>
                  </div>
                ))}
              </div>

              {/* ECG */}
              <div className="fu d5" style={{ marginTop:44, opacity:0.6 }}>
                <ECGLine color={C.tealMid} />
              </div>
            </div>

            {/* ── Visual ── */}
            <div className="hero-vis fu d2" style={{ position:'relative', display:'flex', flexDirection:'column', gap:14 }}>

              {/* Revenue badge — top */}
              <div style={{
                position:'absolute', top:-28, [isAr?'left':'right']:-24,
                background:C.white, border:`1px solid ${C.border}`,
                borderRadius:16, padding:'14px 20px',
                boxShadow:'0 12px 40px rgba(0,0,0,0.10)',
                animation:'floatB 3.8s ease-in-out infinite',
                zIndex:10,
              }}>
                <p style={{ fontSize:10, color:C.muted, margin:'0 0 3px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px' }}>💰 {t.hero.rev_label}</p>
                <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:26, color:C.teal, margin:0, lineHeight:1 }}>
                  340 <span style={{ fontSize:14, fontWeight:400 }}>{isAr?'د.أ':'JD'}</span>
                </p>
              </div>

              {/* Main appointments card */}
              <div style={{
                background:C.white, border:`1px solid ${C.border}`,
                borderRadius:22, padding:'22px 24px',
                boxShadow:'0 8px 40px rgba(46,110,110,0.10)',
                animation:'floatA 5s ease-in-out infinite',
              }}>
                {/* Card header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:32, height:32, borderRadius:9, background:C.tealSoft, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>📅</div>
                    <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{t.hero.card_title}</span>
                  </div>
                  <span style={{ fontSize:11, background:C.tealSoft, color:C.teal, padding:'3px 10px', borderRadius:100, fontWeight:700 }}>
                    12 {t.hero.card_total}
                  </span>
                </div>

                {/* Rows */}
                {t.hero.rows.map((r, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom: i < t.hero.rows.length-1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ width:36, height:36, borderRadius:11, background:C.tealSoft, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>👤</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:C.dark, margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.name}</p>
                      <p style={{ fontSize:11, color:C.muted, margin:0 }}>{r.time}</p>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color:r.color, background:`${r.color}18`, padding:'3px 9px', borderRadius:100, flexShrink:0 }}>{r.label}</span>
                  </div>
                ))}

                {/* Mini stat row */}
                <div style={{ display:'flex', gap:10, marginTop:16 }}>
                  {[
                    { val:'8', label: isAr?'منجزة':'Done',    color:C.green },
                    { val:'3', label: isAr?'قيد الانتظار':'Waiting', color:C.amber },
                    { val:'1', label: isAr?'ملغية':'Cancelled', color:'#EF4444' },
                  ].map((s,i) => (
                    <div key={i} style={{ flex:1, background:C.cream, borderRadius:12, padding:'10px 8px', textAlign:'center' }}>
                      <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, color:s.color, margin:0, lineHeight:1 }}>{s.val}</p>
                      <p style={{ fontSize:10, color:C.muted, margin:'3px 0 0', fontWeight:500 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* New patient badge — bottom */}
              <div style={{
                alignSelf:'flex-end',
                background:`linear-gradient(135deg,${C.darkMid},${C.dark})`,
                borderRadius:18, padding:'14px 20px',
                boxShadow:'0 12px 40px rgba(0,0,0,0.22)',
                animation:'floatB 4.5s ease-in-out infinite',
                animationDelay:'0.8s',
                maxWidth:230,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:22, animation:'pulse2 2s infinite' }}>🎉</span>
                  <div>
                    <p style={{ fontSize:10, color:'rgba(255,255,255,0.55)', margin:'0 0 3px', fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase' }}>{t.hero.pat_label}</p>
                    <p style={{ fontSize:14, color:'#FFF', margin:0, fontWeight:700 }}>{t.hero.pat_name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ STATS ══════════════════════ */}
      <section style={{ background:`linear-gradient(135deg,${C.tealGlow} 0%,${C.teal} 100%)`, padding:'52px 40px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', opacity:0.4 }} />
        <div style={{ maxWidth:1200, margin:'0 auto', position:'relative' }}>
          <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:32, textAlign:'center' }}>
            {t.stats.map((s,i) => (
              <div key={i} style={{ animation:`countUp 0.6s ease ${i*0.1}s both` }}>
                <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(36px,4vw,48px)', color:'#FFF', margin:'0 0 6px', lineHeight:1 }}>{s.val}</p>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.65)', margin:0, fontWeight:500 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ FEATURES ══════════════════════ */}
      <section id="features" style={{ padding:'100px 40px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <div className="fu tag" style={{ background:C.tealSoft, border:`1px solid ${C.border}`, color:C.teal, marginBottom:18 }}>
              ✦ {t.feats.eyebrow}
            </div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(28px,4vw,46px)', color:C.dark, marginBottom:16, letterSpacing:'-0.3px', lineHeight:1.2 }}>
              {t.feats.title}
            </h2>
            <p style={{ fontSize:16, color:C.muted, maxWidth:560, margin:'0 auto', lineHeight:1.75 }}>{t.feats.sub}</p>
          </div>

          <div className="feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
            {t.feats.items.map((f,i) => (
              <div key={i} className="feat-card fu" style={{ animationDelay:`${i*0.05}s` }}>
                <div style={{ width:50, height:50, background:C.tealSoft, borderRadius:15, display:'flex', alignItems:'center', justifyContent:'center', fontSize:23, marginBottom:18 }}>{f.icon}</div>
                <h3 style={{ fontSize:15, fontWeight:700, color:C.dark, marginBottom:10, lineHeight:1.3 }}>{f.title}</h3>
                <p style={{ fontSize:13, color:C.muted, lineHeight:1.7, margin:0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ PRICING ══════════════════════ */}
      <section id="pricing" style={{ padding:'100px 40px', background:C.white }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:60 }}>
            <div className="fu tag" style={{ background:C.tealSoft, border:`1px solid ${C.border}`, color:C.teal, marginBottom:18 }}>
              ✦ {t.pricing.eyebrow}
            </div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(28px,4vw,46px)', color:C.dark, marginBottom:16, letterSpacing:'-0.3px' }}>
              {t.pricing.title}
            </h2>
            <p style={{ fontSize:16, color:C.muted, maxWidth:500, margin:'0 auto 32px', lineHeight:1.75 }}>{t.pricing.sub}</p>

            {/* Billing toggle */}
            <div style={{ display:'inline-flex', background:C.cream, border:`1px solid ${C.border}`, borderRadius:12, padding:4, gap:3 }}>
              {(['monthly','yearly'] as const).map(b => (
                <button key={b} onClick={() => setBilling(b)} style={{
                  padding:'8px 22px', borderRadius:9, border:'none', fontSize:13, fontWeight:600,
                  background: billing===b ? C.white : 'transparent',
                  color: billing===b ? C.dark : C.muted,
                  boxShadow: billing===b ? '0 2px 10px rgba(0,0,0,0.07)' : 'none',
                  cursor:'pointer', transition:'all 0.2s ease', display:'flex', alignItems:'center', gap:8,
                  fontFamily:t.font,
                }}>
                  {b==='monthly' ? t.pricing.monthly : (
                    <>
                      {t.pricing.yearly}
                      <span style={{ background:C.gold, color:'#FFF', fontSize:10, padding:'2px 7px', borderRadius:100, fontWeight:800 }}>{t.pricing.save}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="plan-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
            {t.pricing.plans.map((plan,i) => (
              <div key={i} className={`plan-card${plan.featured?' top':''}`} style={{ ...(plan.featured ? { transform:'scale(1.03)' } : {}) }}>

                {plan.featured && (
                  <div style={{ background:`linear-gradient(90deg,${C.teal},${C.tealLight})`, color:'#FFF', fontSize:11, fontWeight:800, padding:'5px 14px', borderRadius:100, display:'inline-block', marginBottom:20, letterSpacing:'0.6px' }}>
                    {isAr ? '⭐ الأكثر اختياراً' : '⭐ Most Popular'}
                  </div>
                )}

                <h3 style={{ fontSize:20, fontWeight:800, color:plan.featured?'#FFF':C.dark, marginBottom:6 }}>{plan.name}</h3>
                <p style={{ fontSize:13, color:plan.featured?'rgba(255,255,255,0.6)':C.muted, marginBottom:24, lineHeight:1.5 }}>{plan.desc}</p>

                <div style={{ marginBottom:28, display:'flex', alignItems:'baseline', gap:4 }}>
                  <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:52, color:plan.featured?'#FFF':C.teal, lineHeight:1 }}>
                    {billing==='yearly' ? Math.round(plan.price*0.8) : plan.price}
                  </span>
                  <span style={{ fontSize:14, color:plan.featured?'rgba(255,255,255,0.5)':C.muted }}>
                    {plan.currency}/{isAr?'شهر':'mo'}
                  </span>
                </div>

                <ul style={{ listStyle:'none', marginBottom:32 }}>
                  {plan.features.map((f,j) => (
                    <li key={j} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:14, color:plan.featured?'rgba(255,255,255,0.85)':C.dark, marginBottom:12, lineHeight:1.5 }}>
                      <span style={{ color:plan.featured?'#4ADE80':C.teal, fontWeight:700, flexShrink:0, marginTop:1 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button onClick={() => navigate('/login')}
                  style={{
                    width:'100%', padding:'14px', borderRadius:12,
                    border: plan.featured ? 'none' : `1.5px solid ${C.border}`,
                    background: plan.featured ? `linear-gradient(135deg,${C.tealLight},${C.teal})` : 'transparent',
                    color: plan.featured ? '#FFF' : C.dark,
                    fontSize:14, fontWeight:700, cursor:'pointer', transition:'all 0.22s ease',
                    fontFamily:t.font,
                  }}
                  onMouseEnter={e => {
                    if(plan.featured) { e.currentTarget.style.opacity='0.9'; e.currentTarget.style.transform='scale(1.01)' }
                    else { e.currentTarget.style.background=C.tealSoft; e.currentTarget.style.borderColor=C.teal; e.currentTarget.style.color=C.teal }
                  }}
                  onMouseLeave={e => {
                    if(plan.featured) { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='scale(1)' }
                    else { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.dark }
                  }}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Guarantee note */}
          <p style={{ textAlign:'center', marginTop:32, fontSize:13, color:C.muted }}>
            {isAr
              ? '✓ بطاقة ائتمان غير مطلوبة  ·  ✓ إلغاء في أي وقت  ·  ✓ دعم مجاني للإعداد'
              : '✓ No credit card required  ·  ✓ Cancel anytime  ·  ✓ Free onboarding support'}
          </p>
        </div>
      </section>

      {/* ══════════════════════ CTA ══════════════════════ */}
      <section style={{ padding:'110px 40px', background:`linear-gradient(160deg,${C.tealGlow} 0%,${C.teal} 60%,${C.tealMid} 100%)`, position:'relative', overflow:'hidden' }}>
        {/* Decorative ECG in background */}
        <div style={{ position:'absolute', bottom:20, left:0, right:0, opacity:0.12, pointerEvents:'none' }}>
          <ECGLine color="#FFF" />
        </div>
        <div style={{ maxWidth:680, margin:'0 auto', textAlign:'center', position:'relative' }}>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(28px,4.5vw,50px)', color:'#FFF', marginBottom:16, letterSpacing:'-0.4px', lineHeight:1.2 }}>
            {t.cta.title}
          </h2>
          <p style={{ fontSize:17, color:'rgba(255,255,255,0.75)', marginBottom:40, lineHeight:1.7 }}>{t.cta.sub}</p>
          <button className="btn-white" onClick={() => navigate('/login')} style={{ fontSize:15, padding:'15px 36px' }}>
            {t.cta.btn}
          </button>
        </div>
      </section>

      {/* ══════════════════════ FOOTER ══════════════════════ */}
      <footer style={{ background:C.dark, padding:'48px 40px 28px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:32, marginBottom:40 }}>
            {/* Brand */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:34, height:34, borderRadius:9, background:`linear-gradient(135deg,${C.teal},${C.tealLight})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ color:'#FFF', fontSize:15, fontWeight:800, fontFamily:"'DM Serif Display',serif" }}>C</span>
                </div>
                <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, color:'#FFF' }}>Cura</span>
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', maxWidth:240, lineHeight:1.6 }}>{t.footer.tagline}</p>
            </div>

            {/* Links */}
            <div style={{ display:'flex', gap:28, flexWrap:'wrap', alignItems:'center' }}>
              {t.footer.links.map((l,i) => (
                <span key={i} style={{ fontSize:13, color:'rgba(255,255,255,0.45)', cursor:'pointer', transition:'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.8)'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.45)'}>
                  {l}
                </span>
              ))}
              <button onClick={() => navigate('/login')} style={{ background:C.teal, color:'#FFF', border:'none', borderRadius:9, padding:'8px 18px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:t.font }}>
                {t.nav.login}
              </button>
            </div>
          </div>

          <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:22, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.25)', margin:0 }}>{t.footer.rights}</p>
            <div style={{ display:'flex', gap:6, opacity:0.3 }}>
              {['🇯🇴','🇸🇦','🇦🇪','🇰🇼'].map((f,i) => <span key={i} style={{ fontSize:16 }}>{f}</span>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
