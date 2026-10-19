import { useState } from 'react'
import { C, T, type Lang, useLandingStyles } from './landing/shared'
import SiteNav from './landing/SiteNav'
import SiteFooter from './landing/SiteFooter'
import { usePageMeta } from '../hooks/usePageMeta'

export default function FeaturesPage() {
  useLandingStyles()
  const [lang, setLang] = useState<Lang>('en')
  const t = T[lang]
  const isAr = lang === 'ar'

  usePageMeta({
    title: isAr ? 'ميزات نظام Cura لإدارة العيادات' : 'Cura Clinic Management Features',
    description: isAr
      ? 'جدولة المواعيد، ملفات المرضى، ملاحظات الزيارة، قوائم الانتظار، الفواتير والفوترة الإلكترونية، التقارير، وتعدد الأقسام — كل ميزات Cura بالتفصيل.'
      : 'Appointment scheduling, patient records, visit notes, queue management, billing with e-invoicing, analytics, and multi-department support — every Cura feature in detail.',
    canonical: 'https://cura100.com/features',
  })

  return (
    <div dir={t.dir} style={{ fontFamily:t.font, background:C.cream, minHeight:'100vh', overflowX:'hidden' }}>
      <SiteNav lang={lang} setLang={setLang} />

      <section style={{ padding:'140px 40px 60px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <div className="fu tag" style={{ background:C.tealSoft, border:`1px solid ${C.border}`, color:C.teal, marginBottom:18 }}>
              ✦ {t.feats.eyebrow}
            </div>
            <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(28px,4vw,46px)', color:C.dark, marginBottom:16, letterSpacing:'-0.3px', lineHeight:1.2 }}>
              {t.feats.title}
            </h1>
            <p style={{ fontSize:16, color:C.muted, maxWidth:560, margin:'0 auto', lineHeight:1.75 }}>{t.feats.sub}</p>
          </div>

          <div className="feat-img-grid" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:28 }}>
            {t.feats.items.map((f,i) => (
              <div key={i} className="feat-card fu" style={{ animationDelay:`${i*0.05}s`, padding:24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ width:42, height:42, background:C.tealSoft, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <f.Icon size={19} color={C.teal} strokeWidth={1.8} />
                  </div>
                  <h3 style={{ fontSize:15.5, fontWeight:700, color:C.dark, margin:0, lineHeight:1.3 }}>{f.title}</h3>
                </div>
                <p style={{ fontSize:13, color:C.muted, lineHeight:1.7, margin:'0 0 16px' }}>{f.desc}</p>
                {/* 📸 لقطة حقيقية من النظام — عيادة اختبار فعلية، وليست تصميماً توضيحياً */}
                <img src={f.image} alt={f.title} loading="lazy"
                  style={{ width:'100%', borderRadius:12, border:`1px solid ${C.border}`, boxShadow:'0 4px 16px rgba(0,0,0,0.06)', display:'block' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter lang={lang} />
    </div>
  )
}
