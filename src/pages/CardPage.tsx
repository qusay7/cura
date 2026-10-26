import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Phone, Mail, MessageCircle, Download, Globe } from 'lucide-react'
import { C, T, type Lang, useLandingStyles } from './landing/shared'
import { usePageMeta } from '../hooks/usePageMeta'
// ✅ لوجو مخصّص لهذي الصفحة بس — المستخدم طلب تحديثه هون تحديداً بدون لمس
// لوجو الموقع العام (favicon/PWA/باقي الصفحات)
import logo from '../assets/logo-card.png'

// ✅ أرقام حقيقية مؤكدة من المستخدم — قصي: نفس رقم العمل العام بالموقع،
// زينب: رقمها الشخصي. صيغة دولية بدون + أو صفر بداية (مطلوبة لروابط wa.me)
const PEOPLE = [
  {
    key: 'qusai',
    name: 'Qusai Yousef',
    nameAr: 'قصي يوسف',
    phoneDisplay: '+962 7961 39705',
    phoneTel: '+962796139705',
    phoneIntl: '962796139705',
  },
  {
    key: 'zainab',
    name: 'Zainab Aqil',
    nameAr: 'زينب عقيل',
    phoneDisplay: '+962 795 460 456',
    phoneTel: '+962795460456',
    phoneIntl: '962795460456',
  },
]

const EMAIL = 'info@cura100.com'
const WEBSITE = 'https://cura100.com'
const CARD_URL = 'https://cura100.com/card'

const COPY = {
  ar: {
    title: 'بطاقة عمل Cura الرقمية',
    role: 'مؤسس مشارك',
    demoTitle: 'جاهز تجرّب Cura لعيادتك؟',
    demoBtn: 'اطلب عرضاً تجريبياً مجانياً ←',
    call: 'اتصال', whatsapp: 'واتساب', email: 'بريد إلكتروني', saveContact: 'حفظ جهة الاتصال',
    website: 'زيارة الموقع',
    qrTitle: 'امسح الرمز لفتح هذي الصفحة',
  },
  en: {
    title: 'Cura Digital Business Card',
    role: 'Co-Founder',
    demoTitle: 'Ready to try Cura for your clinic?',
    demoBtn: 'Request a free demo ←',
    call: 'Call', whatsapp: 'WhatsApp', email: 'Email', saveContact: 'Save Contact',
    website: 'Visit Website',
    qrTitle: 'Scan to open this page',
  },
}

function buildVCard(person: typeof PEOPLE[number], role: string, isAr: boolean) {
  const fn = isAr ? person.nameAr : person.name
  const [first, ...rest] = person.name.split(' ')
  const last = rest.join(' ')
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${last};${first};;;`,
    `FN:${fn}`,
    'ORG:Cura',
    `TITLE:${role}`,
    `TEL;TYPE=CELL:${person.phoneTel}`,
    `EMAIL:${EMAIL}`,
    `URL:${WEBSITE}`,
    'END:VCARD',
  ].join('\r\n')
}

function downloadVCard(person: typeof PEOPLE[number], role: string, isAr: boolean) {
  const vcard = buildVCard(person, role, isAr)
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${person.key}-cura.vcf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function CardPage() {
  useLandingStyles()
  const [lang, setLang] = useState<Lang>('ar')
  const t = T[lang]
  const c = COPY[lang]
  const isAr = lang === 'ar'

  usePageMeta({
    title: isAr ? 'بطاقة عمل Cura — قصي يوسف وزينب عقيل' : 'Cura Business Card — Qusai Yousef & Zainab Aqil',
    description: isAr
      ? 'بطاقة العمل الرقمية لمؤسسَي Cura، قصي يوسف وزينب عقيل — تواصل معنا مباشرة أو اطلب عرضاً تجريبياً مجانياً.'
      : "The digital business card for Cura's co-founders, Qusai Yousef and Zainab Aqil - reach out directly or request a free demo.",
    canonical: CARD_URL,
    ogImage: `${WEBSITE}/icons/icon-512x512.png`,
    // ✅ صفحة للمشاركة المباشرة (QR/NFC/واتساب)، لا للظهور بنتائج بحث عامة عن
    // "Cura" — نفس منطق noindex بصفحة الدخول
    robots: 'noindex, follow',
  })

  const demoWhatsapp = `https://wa.me/${PEOPLE[0].phoneIntl}?text=${encodeURIComponent(
    isAr ? 'مرحباً، أرغب بطلب عرض تجريبي مجاني لنظام Cura' : 'Hello, I would like to request a free demo of Cura'
  )}`

  return (
    <div dir={t.dir} style={{ fontFamily: t.font, background: C.cream, minHeight: '100vh', padding: '48px 20px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Lang toggle */}
        <div style={{ textAlign: isAr ? 'left' : 'right', marginBottom: 20 }}>
          <button onClick={() => setLang(isAr ? 'en' : 'ar')}
            style={{ background: C.tealSoft, border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 13px', fontSize: 12, fontWeight: 700, color: C.teal, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            {isAr ? 'EN' : 'ع'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src={logo} alt="Cura" style={{ width: 96, height: 96, objectFit: 'contain', marginBottom: 8 }} />
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: C.dark, margin: 0 }}>{c.title}</h1>
        </div>

        {/* Demo CTA — the most important button on the page */}
        <a href={demoWhatsapp} target="_blank" rel="noopener noreferrer" className="btn-primary"
          style={{ textDecoration: 'none', width: '100%', justifyContent: 'center', padding: '16px', fontSize: 15, marginBottom: 28, display: 'flex' }}>
          {c.demoBtn}
        </a>

        {/* Co-founder cards */}
        {PEOPLE.map(person => {
          const waLink = `https://wa.me/${person.phoneIntl}`
          return (
            <div key={person.key} className="feat-card fu" style={{ padding: 22, marginBottom: 18 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: C.dark, margin: '0 0 2px' }}>
                {isAr ? person.nameAr : person.name}
              </h2>
              <p style={{ fontSize: 12.5, color: C.teal, fontWeight: 600, margin: '0 0 16px' }}>{c.role}</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                <a href={`tel:${person.phoneTel}`} style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: C.dark, fontSize: 12.5, fontWeight: 600, background: C.cream, border: `1px solid ${C.border}`, borderRadius: 9, padding: '8px 10px' }}>
                  <Phone size={14} color={C.teal} /> {c.call}
                </a>
                <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: C.dark, fontSize: 12.5, fontWeight: 600, background: C.cream, border: `1px solid ${C.border}`, borderRadius: 9, padding: '8px 10px' }}>
                  <MessageCircle size={14} color={C.teal} /> {c.whatsapp}
                </a>
                <a href={`mailto:${EMAIL}`} style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: C.dark, fontSize: 12.5, fontWeight: 600, background: C.cream, border: `1px solid ${C.border}`, borderRadius: 9, padding: '8px 10px' }}>
                  <Mail size={14} color={C.teal} /> {c.email}
                </a>
                <button onClick={() => downloadVCard(person, c.role, isAr)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: C.dark, fontSize: 12.5, fontWeight: 600, background: C.cream, border: `1px solid ${C.border}`, borderRadius: 9, padding: '8px 10px', fontFamily: 'inherit' }}>
                  <Download size={14} color={C.teal} /> {c.saveContact}
                </button>
              </div>
            </div>
          )
        })}

        <a href={WEBSITE} target="_blank" rel="noopener noreferrer" className="btn-ghost"
          style={{ textDecoration: 'none', width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14, marginBottom: 28, display: 'flex', gap: 8 }}>
          <Globe size={16} /> {c.website} — cura100.com
        </a>

        {/* QR code — for printing on physical cards / NFC payload */}
        <div className="feat-card fu" style={{ padding: 22, textAlign: 'center' }}>
          <div style={{ background: '#FFF', display: 'inline-block', padding: 12, borderRadius: 12, marginBottom: 10 }}>
            <QRCodeCanvas value={`${CARD_URL}?src=print`} size={160} level="M" />
          </div>
          <p style={{ fontSize: 11.5, color: C.muted, margin: 0 }}>{c.qrTitle}</p>
        </div>
      </div>
    </div>
  )
}
