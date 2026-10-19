import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { C, T, type Lang, useLandingStyles } from './landing/shared'
import SiteNav from './landing/SiteNav'
import SiteFooter from './landing/SiteFooter'
import { usePageMeta } from '../hooks/usePageMeta'

export default function FaqPage() {
  useLandingStyles()
  const [lang, setLang] = useState<Lang>('en')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const t = T[lang]
  const isAr = lang === 'ar'

  usePageMeta({
    title: isAr ? 'الأسئلة الشائعة — نظام Cura لإدارة العيادات' : 'Frequently Asked Questions — Cura',
    description: isAr
      ? 'إجابات عن أهم أسئلة عيادتك حول Cura: أمان بيانات المرضى، الفوترة الإلكترونية الأردنية، الدعم على الموبايل، تعدد الأقسام، والبدء السريع.'
      : "Answers to your clinic's top questions about Cura: patient data security, Jordan e-invoicing, mobile support, multi-department setup, and getting started.",
    canonical: 'https://cura100.com/faq',
  })

  return (
    <div dir={t.dir} style={{ fontFamily:t.font, background:C.cream, minHeight:'100vh', overflowX:'hidden' }}>
      <SiteNav lang={lang} setLang={setLang} />

      <section style={{ padding:'140px 40px 80px', background:C.white }}>
        <div style={{ maxWidth:760, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div className="fu tag" style={{ background:C.tealSoft, border:`1px solid ${C.border}`, color:C.teal, marginBottom:18 }}>
              ✦ {t.faq.eyebrow}
            </div>
            <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(28px,4vw,46px)', color:C.dark, marginBottom:16, letterSpacing:'-0.3px', lineHeight:1.2 }}>
              {t.faq.title}
            </h1>
            <p style={{ fontSize:15, color:C.muted, lineHeight:1.75 }}>{t.faq.sub}</p>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {t.faq.items.map((item, i) => {
              const isOpen = openFaq === i
              return (
                <div key={i} className="fu" style={{
                  animationDelay:`${i*0.04}s`,
                  background:C.cream, border:`1px solid ${isOpen ? C.tealLight : C.border}`,
                  borderRadius:16, overflow:'hidden', transition:'border-color 0.2s ease',
                }}>
                  <button type="button" onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    style={{
                      width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', gap:14,
                      padding:'18px 22px', background:'transparent', border:'none', cursor:'pointer',
                      fontSize:15, fontWeight:600, color:C.dark, textAlign:isAr?'right':'left', fontFamily:'inherit',
                    }}>
                    <span>{item.q}</span>
                    <ChevronDown size={18} color={C.teal} strokeWidth={2}
                      style={{ flexShrink:0, transition:'transform 0.25s ease', transform:isOpen?'rotate(180deg)':'rotate(0deg)' }} />
                  </button>
                  {isOpen && (
                    <p className="fi" style={{ margin:0, padding:'0 22px 20px', fontSize:14, color:C.muted, lineHeight:1.8 }}>
                      {item.a}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <SiteFooter lang={lang} />
    </div>
  )
}
