import {
  Calendar, FolderOpen, Stethoscope, ListOrdered, CreditCard,
  BarChart3, Building2, Globe,
} from 'lucide-react'
import { useEffect } from 'react'

// 📸 لقطات حقيقية من النظام (ليست تصاميم توضيحية) — عيادة اختبار حقيقية
import apptAr from '../../assets/features/appointments-ar.png'
import apptEn from '../../assets/features/appointments-en.png'
import recordAr from '../../assets/features/patient-record-ar.png'
import recordEn from '../../assets/features/patient-record-en.png'
import visitAr from '../../assets/features/visit-notes-ar.png'
import visitEn from '../../assets/features/visit-notes-en.png'
import queueAr from '../../assets/features/queue-ar.png'
import queueEn from '../../assets/features/queue-en.png'
import billingAr from '../../assets/features/billing-ar.png'
import billingEn from '../../assets/features/billing-en.png'
import reportsAr from '../../assets/features/reports-ar.png'
import reportsEn from '../../assets/features/reports-en.png'
import deptAr from '../../assets/features/departments-ar.png'
import deptEn from '../../assets/features/departments-en.png'
import dashAr from '../../assets/features/dashboard-ar.png'
import dashEn from '../../assets/features/dashboard-en.png'

// ✅ محتوى مؤقت (placeholder) — استبدله باقتباسات وأسماء عيادات حقيقية قبل النشر الفعلي
export const SHOW_TESTIMONIALS = false

export interface ApiPlan {
  id: string
  name: string
  description: string | null
  nameEn: string | null
  descriptionEn: string | null
  monthlyPrice: number
  yearlyPrice: number
  maxUsers: number
  maxDoctors: number
  maxPatients: number
  isActive: boolean
  isFeatured: boolean
  features: string[]
  featuresEn: string[]
}

export const C = {
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

export const css = `

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
@keyframes gradMove { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }

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
.btn-primary:focus-visible { outline:2px solid ${C.tealLight}; outline-offset:2px; }

.btn-ghost {
  display:inline-flex; align-items:center; gap:8px;
  background:transparent; color:${C.dark};
  border:1.5px solid ${C.border}; border-radius:12px;
  padding:12px 26px; font-size:14px; font-weight:600;
  cursor:pointer; transition:all 0.22s ease; white-space:nowrap;
}
.btn-ghost:hover { border-color:${C.teal}; color:${C.teal}; background:${C.tealSoft}; transform:translateY(-1px); }
.btn-ghost:focus-visible { outline:2px solid ${C.teal}; outline-offset:2px; }

.btn-white {
  display:inline-flex; align-items:center; gap:8px;
  background:#FFF; color:${C.teal};
  border:none; border-radius:12px;
  padding:14px 32px; font-size:15px; font-weight:700;
  cursor:pointer; transition:all 0.22s ease; white-space:nowrap;
  box-shadow:0 4px 20px rgba(0,0,0,0.12);
}
.btn-white:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,0.18); }
.btn-white:focus-visible { outline:2px solid #FFF; outline-offset:3px; }

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
  transform: scale(1) translateY(0);
}
.plan-card:hover { border-color:${C.tealLight}; box-shadow:0 16px 48px rgba(46,110,110,0.12); transform: scale(1) translateY(-5px); }
.plan-card.top {
  background:linear-gradient(160deg, ${C.darkMid} 0%, ${C.dark} 100%);
  border-color:${C.teal};
  box-shadow:0 20px 60px rgba(46,110,110,0.25);
  transform: scale(1.03) translateY(0);
}
.plan-card.top:hover { box-shadow:0 28px 70px rgba(46,110,110,0.3); transform: scale(1.03) translateY(-6px); }

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

/* ── Mobile menu ── */
.mobile-menu-btn { display:none; }
.mobile-panel { animation: slideDown 0.22s ease both; }

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
}

/* ── Responsive ── */
@media(max-width:1024px) {
  .hero-grid    { grid-template-columns:1fr !important; }
  .hero-vis     { display:none !important; }
  .feat-grid    { grid-template-columns:repeat(2,1fr) !important; }
  .plan-grid    { grid-template-columns:1fr !important; }
}
@media(max-width:768px) {
  .nav-links      { display:none !important; }
  .mobile-menu-btn{ display:inline-flex !important; }
  .stats-grid     { grid-template-columns:repeat(2,1fr) !important; }
  .feat-grid      { grid-template-columns:1fr !important; }
  .feat-img-grid  { grid-template-columns:1fr !important; }
}
`

// ✅ تحقن أنماط الصفحة التسويقية مرة وحدة فقط (id محروس) — تستدعيها كل صفحة
// من الأربعة (الرئيسية + الميزات + الأسعار + الأسئلة) بأمان بدون تكرار الحقن
export function useLandingStyles() {
  useEffect(() => {
    const id = 'cura-lp-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = css; document.head.appendChild(s)
    }
  }, [])
}

// ─── ECG ──────────────────────────────────────────────────────────────────────
export const ECGLine = ({ color = C.tealLight }: { color?: string }) => (
  <svg viewBox="0 0 360 56" fill="none" style={{ width:'100%', height:56 }}>
    <path className="ecg-path"
      d="M0 28 L50 28 L68 28 L80 8 L92 48 L104 4 L116 52 L128 28 L148 28 L300 28 L360 28"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="300" cy="28" r="4.5" fill={color} style={{ animation:'blink 1.1s ease infinite' }} />
  </svg>
)

// ─── Translations ─────────────────────────────────────────────────────────────
export const T = {
  ar: {
    dir:'rtl' as const,
    font:"'Noto Kufi Arabic', sans-serif",
    nav:{ features:'المميزات', pricing:'الأسعار', faq:'الأسئلة المتكررة', about:'من نحن', login:'تسجيل الدخول', cta:'ابدأ مجاناً' },
    hero:{
      eyebrow:'منصة إدارة العيادات الطبية',
      h1:  'إدارة عيادة أكثر ذكاء.',
      h1b: 'نتائج أفضل للمرضى.',
      sub:'Cura نظام إدارة عيادات متكامل يساعدك على تنظيم مواعيد المرضى، الفوترة الإلكترونية، وملفات الأطباء والمرضى — في واجهة واحدة سهلة الاستخدام، مصمّمة للعيادات في الأردن والعالم العربي.',
      cta1:'ابدأ أول شهر مجاناً ←',
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
    // ✅ استُبدلت الأرقام المُلفّقة (عدد عيادات/مرضى/تقييم) بميزات حقيقية
    // بدون ادعاءات رقمية — لا يوجد عملاء فعليون بعد لتوثيقها
    stats:[
      { val:'عربي / إنجليزي', label:'واجهة ثنائية اللغة بدعم RTL كامل' },
      { val:'سحابي',          label:'يعمل من أي متصفح بدون تثبيت' },
      { val:'تعدد الأقسام',   label:'لكل قسم فريقه وصلاحياته الخاصة' },
      { val:'شهر مجاني',   label:'أول شهر مجاناً بالكامل، بدون أي التزام' },
    ],
    feats:{
      eyebrow:'المميزات',
      title:'كل ما تحتاجه عيادتك في منصة واحدة',
      sub:'من تنظيم المواعيد إلى الفوترة الإلكترونية — نظام Cura لإدارة العيادات يُغطّي كل خطوة في رحلة مريضك وطبيبك',
      seeAll:'استعرض كل المميزات بالتفصيل ←',
      items:[
        { Icon:Calendar,     title:'جدولة المواعيد',   desc:'تقويم ذكي يُقلّل الغياب ويملأ الفراغات تلقائياً — مع تذكيرات تلقائية عبر واتساب للمرضى.', image:apptAr },
        { Icon:FolderOpen,   title:'ملف المريض الموحّد', desc:'سجل طبي شامل يضمّ التاريخ المرضي والوصفات والفحوصات والتشخيصات بأثر رجعي.', image:recordAr },
        { Icon:Stethoscope,  title:'ملاحظات الزيارة',  desc:'تشخيص دقيق، وصفة طبية، طلبات مختبر وأشعة — كلّها في نقرة واحدة عند كل زيارة.', image:visitAr },
        { Icon:ListOrdered,  title:'إدارة قوائم الدور', desc:'نظام انتظار ذكي يتتبّع الدور في الوقت الفعلي ويُعلم الطاقم بأي تغيير.', image:queueAr },
        { Icon:CreditCard,   title:'الفواتير والإيصالات', desc:'إصدار فواتير احترافية بنقرة واحدة مع دعم مباشر لمنظومة الفوترة الإلكترونية الأردنية.', image:billingAr },
        { Icon:BarChart3,    title:'تقارير الأداء',    desc:'لوحة بيانات تفصيلية للإيرادات والمرضى والأطباء تساعدك في اتخاذ قرارات مبنية على البيانات.', image:reportsAr },
        { Icon:Building2,    title:'تعدد الأقسام',     desc:'قسّم عيادتك إلى أقسام طبية مستقلة — لكل منها فريقه وصلاحياته الخاصة.', image:deptAr },
        { Icon:Globe,        title:'واجهة ثنائية اللغة', desc:'دعم كامل للغتين العربية والإنجليزية مع اتجاه RTL مدمج من اليوم الأول.', image:dashAr },
      ],
    },
    // ⚠️ محتوى مؤقت (placeholder) — استبدله باقتباسات وأسماء عيادات حقيقية قبل النشر الفعلي
    testimonials:{
      eyebrow:'آراء العملاء',
      title:'عيادات تثق بـ Cura',
      sub:'[قسم مؤقت للتعبئة — سيُستبدل بآراء حقيقية من عيادات تستخدم Cura فعلياً]',
      items:[
        { quote:'[اكتب هنا رأي حقيقي لعميل عن تجربته مع Cura]', name:'[اسم المسؤول]', role:'[المسمى الوظيفي]', clinic:'[اسم العيادة]' },
        { quote:'[اكتب هنا رأي حقيقي لعميل عن تجربته مع Cura]', name:'[اسم المسؤول]', role:'[المسمى الوظيفي]', clinic:'[اسم العيادة]' },
        { quote:'[اكتب هنا رأي حقيقي لعميل عن تجربته مع Cura]', name:'[اسم المسؤول]', role:'[المسمى الوظيفي]', clinic:'[اسم العيادة]' },
      ],
    },
    pricing:{
      eyebrow:'الأسعار',
      title:'أسعار شفّافة بلا رسوم مخفية',
      sub:'خطط مرنة تنمو مع عيادتك لتستخدم نظام Cura الكامل لإدارة العيادات — جميعها تشمل الدعم الفني المجاني ومدير حساب مخصص',
      teaser:'خطط تبدأ بأسعار تناسب العيادات الصغيرة، وتنمو مع احتياجاتك — بدون رسوم مخفية وبدون التزام طويل.',
      seeAll:'استعرض كل الخطط والأسعار ←',
      monthly:'شهري', yearly:'سنوي', save:'وفّر مقابل الاشتراك السنوي',
      currency:'د.أ', perMonth:'شهر', perYear:'سنة',
      ctaDefault:'تواصل معنا', ctaFeatured:'اطلب أول شهر مجاني',
      loading:'جاري تحميل الخطط...',
      error:'تعذّر تحميل الخطط حالياً، يرجى المحاولة لاحقاً',
      empty:'لا توجد خطط متاحة حالياً',
      users:'مستخدم', doctors:'طبيب', patients:'مريض', patientsPerMonth:'مريض جديد/شهر', unlimited:'غير محدود',
    },
    faq:{
      eyebrow:'الأسئلة المتكررة',
      title:'كل ما تحتاج معرفته عن نظام Cura لإدارة العيادات',
      sub:'إن لم تجد إجابتك هنا، راسلنا مباشرة عبر واتساب وسنساعدك',
      seeAll:'استعرض كل الأسئلة الشائعة ←',
      items:[
        { q:'هل بيانات مرضى عيادتي محمية؟', a:'نعم — كل الاتصال مشفّر (HTTPS)، ولكل مستخدم في عيادتك صلاحيات محددة بدقة حسب دوره (طبيب، استقبال، محاسب...)، وبيانات كل عيادة معزولة تماماً عن بيانات العيادات الأخرى على المنصة.' },
        { q:'هل يدعم Cura الفوترة الإلكترونية الأردنية؟', a:'نعم، تتوفر ميزة ربط الفواتير مع منظومة الفوترة الإلكترونية الأردنية، ويمكن تفعيلها ضمن خطتك.' },
        { q:'هل يعمل النظام على الموبايل؟', a:'نعم، Cura يعمل من متصفح أي جهاز، ويمكن أيضاً تثبيته كتطبيق على شاشة الموبايل الرئيسية دون الحاجة لمتجر تطبيقات.' },
        { q:'هل يمكن لعيادتي أن تحتوي على أكثر من قسم أو طبيب؟', a:'بالتأكيد — يدعم النظام تعدد الأقسام الطبية، كل قسم بفريقه وصلاحياته الخاصة، بدون حد على عدد الأطباء ضمن خطتك.' },
        { q:'هل يجب أن أثبّت أي برنامج؟', a:'لا، Cura نظام سحابي يعمل بالكامل من المتصفح — لا تنزيل ولا تثبيت مطلوب على أجهزة العيادة.' },
        { q:'كيف أبدأ استخدام Cura لعيادتي؟', a:'تواصل معنا عبر واتساب، وسيقوم فريقنا بإعداد حساب لعيادتك مع أول شهر مجاناً بالكامل، وإرشادك خلال الإعداد الأولي.' },
      ],
    },
    cta:{
      title:'جاهز لتحويل تجربة مرضاك؟',
      sub:'نظام واحد لتنظيم المواعيد والمرضى والفواتير — ابدأ بإدارة عيادتك بطريقة أكثر تنظيماً',
      btn:'تواصل معنا لبدء أول شهر مجاني',
    },
    footer:{
      tagline:'منصة إدارة عيادات مصمّمة للعالم العربي',
      info:'هاتف  +962 7961 39705 | بريد إلكتروني: infocura100@gmail.com',
      rights:'© 2026 Cura. جميع الحقوق محفوظة.',
      links:['المميزات','الأسعار','سياسة الخصوصية','شروط الاستخدام'],
    },
  },
  en: {
    dir:'ltr' as const,
    font:"'Inter', sans-serif",
    nav:{ features:'Features', pricing:'Pricing', faq:'FAQ', about:'About', login:'Sign In', cta:'Get Started' },
    hero:{
      eyebrow:'Clinic Management Platform',
      h1:  'Smarter clinic management.',
      h1b: 'Better patient outcomes.',
      sub:'Cura is a clinic management system that brings patient records, appointment scheduling, e-invoicing, and revenue analytics together in one intuitive platform — built for doctors and clinics across Jordan and the Arab world.',
      cta1:'Start your free month →',
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
    // ✅ Fabricated numbers (clinic/patient counts, rating) replaced with real,
    // non-numeric features - no real customers yet to back those claims up
    stats:[
      { val:'AR / EN',    label:'Fully bilingual, native RTL support' },
      { val:'Cloud',      label:'Runs in any browser, nothing to install' },
      { val:'Multi-Dept', label:'Independent teams & permissions per department' },
      { val:'Free Month', label:'Your first month, fully free, no commitment' },
    ],
    feats:{
      eyebrow:'Features',
      title:'Everything your clinic needs, nothing it doesn\'t',
      sub:'From appointment scheduling to e-invoicing — Cura\'s clinic management software covers every step of your patient and doctor journey',
      seeAll:'See all features in detail →',
      items:[
        { Icon:Calendar,    title:'Appointment Scheduling', desc:'Smart calendar that cuts no-shows and fills gaps automatically with automatic WhatsApp reminders for patients.', image:apptEn },
        { Icon:FolderOpen,  title:'Unified Patient Records',  desc:'Comprehensive medical history, prescriptions, lab results, and diagnoses — all in one place.', image:recordEn },
        { Icon:Stethoscope, title:'Visit Notes',             desc:'Diagnosis, prescription, lab orders, and imaging requests captured in a single click per visit.', image:visitEn },
        { Icon:ListOrdered, title:'Queue Management',        desc:'Real-time walk-in queue system that keeps staff and patients informed at every step.', image:queueEn },
        { Icon:CreditCard,  title:'Billing & Receipts',     desc:'One-click professional invoices with direct Jordan national e-invoicing integration.', image:billingEn },
        { Icon:BarChart3,   title:'Performance Analytics',  desc:'Revenue, patient, and physician dashboards that turn clinic data into actionable decisions.', image:reportsEn },
        { Icon:Building2,   title:'Multi-Department',        desc:'Independent departments with dedicated teams, permissions, and workflows under one roof.', image:deptEn },
        { Icon:Globe,       title:'Dual-Language Support',    desc:'Full Arabic and English support with native RTL layout built in from day one.', image:dashEn },
      ],
    },
    // ⚠️ Placeholder content — replace with real quotes and clinic names before going live
    testimonials:{
      eyebrow:'Customer Voices',
      title:'Clinics that trust Cura',
      sub:'[Placeholder section — will be replaced with real feedback from clinics actually using Cura]',
      items:[
        { quote:'[Write a real customer quote about their experience with Cura here]', name:'[Contact name]', role:'[Job title]', clinic:'[Clinic name]' },
        { quote:'[Write a real customer quote about their experience with Cura here]', name:'[Contact name]', role:'[Job title]', clinic:'[Clinic name]' },
        { quote:'[Write a real customer quote about their experience with Cura here]', name:'[Contact name]', role:'[Job title]', clinic:'[Clinic name]' },
      ],
    },
    pricing:{
      eyebrow:'Pricing',
      title:'Transparent pricing, no hidden fees',
      sub:'Flexible plans for Cura\'s complete clinic management software that scale with your clinic — all include free technical support and onboarding',
      teaser:'Plans start small for solo clinics and grow with your needs — no hidden fees, no long-term lock-in.',
      seeAll:'See all plans and pricing →',
      monthly:'Monthly', yearly:'Yearly', save:'Save with annual billing',
      currency:'JD', perMonth:'mo', perYear:'yr',
      ctaDefault:'Contact us', ctaFeatured:'Request your free month',
      loading:'Loading plans...',
      error:'Could not load plans right now, please try again later',
      empty:'No plans available right now',
      users:'users', doctors:'doctors', patients:'patients', patientsPerMonth:'new patients/mo', unlimited:'Unlimited',
    },
    faq:{
      eyebrow:'FAQ',
      title:'Everything you need to know about Cura\'s clinic management system',
      sub:"Can't find your answer? Message us directly on WhatsApp and we'll help",
      seeAll:'See all FAQs →',
      items:[
        { q:'Is my clinic\'s patient data secure?', a:'Yes — every connection is encrypted (HTTPS), each user in your clinic gets permissions scoped precisely to their role (doctor, receptionist, accountant...), and every clinic\'s data is fully isolated from every other clinic on the platform.' },
        { q:'Does Cura support Jordan\'s national e-invoicing?', a:'Yes, invoices can be linked to the Jordanian e-invoicing system, and this can be enabled as part of your plan.' },
        { q:'Does it work on mobile?', a:'Yes, Cura runs in any browser and can also be installed as an app on your home screen — no app store needed.' },
        { q:'Can my clinic have multiple departments or doctors?', a:'Absolutely — the system supports independent medical departments, each with its own team and permissions, with no limit on the number of doctors under your plan.' },
        { q:'Do I need to install any software?', a:'No, Cura is fully cloud-based and runs from the browser — nothing to download or install on clinic devices.' },
        { q:'How do I get started with Cura?', a:"Reach out to us on WhatsApp and our team will set up your clinic's account with a full free first month, and guide you through initial setup." },
      ],
    },
    cta:{
      title:'Ready to transform your patient experience?',
      sub:'One system for appointments, patients, and billing — start running your clinic more efficiently',
      btn:'Contact us to start your free month',
    },
    footer:{
      tagline:'Clinic management built for the Arab world',
      info:'Phone  +962 7961 39705 | Email: infocura100@gmail.com',
      rights:'© 2026 Cura. All rights reserved.',
      links:['Features','Pricing','Privacy Policy','Terms of Service'],
    },
  },
}

export type Lang = keyof typeof T
