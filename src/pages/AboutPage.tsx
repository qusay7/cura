import { useState } from 'react'
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react'
import { C, T, type Lang, useLandingStyles } from './landing/shared'
import SiteNav from './landing/SiteNav'
import SiteFooter from './landing/SiteFooter'
import { usePageMeta } from '../hooks/usePageMeta'

const CONTACT = {
  phone: '+962 7961 39705',
  phoneHref: 'tel:+962796139705',
  email: 'infocura100@gmail.com',
  whatsapp: 'https://wa.me/962796139705',
  addressAr: 'الأردن، عمان، شارع الجامعة',
  addressEn: 'University Street, Amman, Jordan',
}

const COPY = {
  ar: {
    title: 'من نحن',
    intro: 'Cura منصة سحابية لإدارة العيادات، مصمّمة لتبسيط عمل العيادات في الأردن والعالم العربي — من حجز المواعيد وملفات المرضى إلى الفواتير والتقارير، في مكان واحد بواجهة عربية وإنجليزية.',
    note: 'Cura حالياً اسم تجاري قيد التطوير، بدون تسجيل شركة رسمي بعد.',
    contactTitle: 'تواصل معنا',
    phone: 'الهاتف', email: 'البريد الإلكتروني', address: 'الموقع', whatsapp: 'واتساب',
    supportTitle: 'الدعم الفني',
    supportDesc: 'فريقنا متاح على واتساب على مدار الساعة للإجابة عن استفساراتك أو مساعدتك بالإعداد.',
    ctaBtn: 'تواصل معنا الآن',
  },
  en: {
    title: 'About Us',
    intro: 'Cura is a cloud-based clinic management platform built to simplify clinic operations across Jordan and the Arab world — appointments, patient records, billing, and reporting, all in one place with full Arabic and English support.',
    note: 'Cura is currently an operating brand name, not yet a formally registered company.',
    contactTitle: 'Get in Touch',
    phone: 'Phone', email: 'Email', address: 'Location', whatsapp: 'WhatsApp',
    supportTitle: 'Technical Support',
    supportDesc: "Our team is available on WhatsApp around the clock to answer questions or help with setup.",
    ctaBtn: 'Contact us now',
  },
}

export default function AboutPage() {
  useLandingStyles()
  const [lang, setLang] = useState<Lang>('en')
  const t = T[lang]
  const c = COPY[lang]
  const isAr = lang === 'ar'

  usePageMeta({
    title: isAr ? 'من نحن ومعلومات التواصل — CURA' : 'About Us & Contact Information — CURA',
    description: isAr
      ? 'تعرّف على Cura، منصة إدارة العيادات، ومعلومات التواصل والدعم الفني: الهاتف والبريد الإلكتروني وواتساب والموقع في عمّان، الأردن.'
      : 'Learn about Cura, the clinic management platform, and our contact and support information: phone, email, WhatsApp, and our location in Amman, Jordan.',
    canonical: 'https://cura100.com/about',
  })

  const rows = [
    { Icon: Phone, label: c.phone, value: CONTACT.phone, href: CONTACT.phoneHref },
    { Icon: Mail, label: c.email, value: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { Icon: MessageCircle, label: c.whatsapp, value: CONTACT.whatsapp.replace('https://', ''), href: CONTACT.whatsapp },
    { Icon: MapPin, label: c.address, value: isAr ? CONTACT.addressAr : CONTACT.addressEn, href: undefined },
  ]

  return (
    <div dir={t.dir} style={{ fontFamily: t.font, background: C.cream, minHeight: '100vh', overflowX: 'hidden' }}>
      <SiteNav lang={lang} setLang={setLang} />

      <section style={{ padding: '140px 40px 80px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="fu tag" style={{ background: C.tealSoft, border: `1px solid ${C.border}`, color: C.teal, marginBottom: 18 }}>
              ✦ {c.title}
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 'clamp(28px,4vw,46px)', color: C.dark, marginBottom: 16, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              Cura
            </h1>
            <p style={{ fontSize: 15.5, color: C.muted, lineHeight: 1.8 }}>{c.intro}</p>
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, marginTop: 14, fontStyle: 'italic' }}>{c.note}</p>
          </div>

          <div className="feat-card fu" style={{ padding: '32px 28px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 20 }}>{c.contactTitle}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {rows.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: C.tealSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <r.Icon size={17} color={C.teal} strokeWidth={1.8} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 11, color: C.muted, margin: '0 0 2px', fontWeight: 600 }}>{r.label}</p>
                    {r.href ? (
                      <a href={r.href} target={r.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                        style={{ fontSize: 14, color: C.dark, fontWeight: 600, textDecoration: 'none' }}>
                        {r.value}
                      </a>
                    ) : (
                      <p style={{ fontSize: 14, color: C.dark, fontWeight: 600, margin: 0 }}>{r.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="feat-card fu" style={{ padding: '28px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 8 }}>{c.supportTitle}</h2>
            <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.7, marginBottom: 20, maxWidth: 480, margin: '0 auto 20px' }}>{c.supportDesc}</p>
            <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
              {c.ctaBtn}
            </a>
          </div>
        </div>
      </section>

      <SiteFooter lang={lang} />
    </div>
  )
}
