import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import api from '../api/axios'
import { C, T, type Lang, type ApiPlan, useLandingStyles } from './landing/shared'
import SiteNav from './landing/SiteNav'
import SiteFooter from './landing/SiteFooter'
import { usePageMeta } from '../hooks/usePageMeta'

export default function PricingPage() {
  useLandingStyles()
  const [lang, setLang] = useState<Lang>('en')
  const [billing, setBilling] = useState<'monthly'|'yearly'>('monthly')
  const [plans, setPlans] = useState<ApiPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [plansError, setPlansError] = useState(false)
  const t = T[lang]
  const isAr = lang === 'ar'

  usePageMeta({
    title: isAr ? 'أسعار نظام Cura لإدارة العيادات' : 'Cura Clinic Management Pricing',
    description: isAr
      ? 'خطط اشتراك مرنة لنظام Cura لإدارة العيادات — بدون رسوم مخفية، مع دعم فني مجاني. اطلب تجربتك المجانية اليوم.'
      : 'Flexible subscription plans for Cura clinic management — no hidden fees, free technical support included. Request your free trial today.',
    canonical: 'https://cura100.com/pricing',
  })

  useEffect(() => {
    let cancelled = false
    async function loadPlans() {
      setPlansLoading(true)
      setPlansError(false)
      try {
        const res = await api.get<ApiPlan[]>('/plans')
        if (!cancelled) setPlans(res.data)
      } catch {
        if (!cancelled) setPlansError(true)
      } finally {
        if (!cancelled) setPlansLoading(false)
      }
    }
    loadPlans()
    return () => { cancelled = true }
  }, [])

  const WHATSAPP = 'https://wa.me/962796139705'
  const contactSales = () => {
    window.open(
      `${WHATSAPP}?text=${encodeURIComponent(
        isAr ? 'مرحباً، أرغب بتجربة نظام Cura لعيادتي' : 'Hello, I would like to try Cura for my clinic'
      )}`,
      '_blank'
    )
  }

  return (
    <div dir={t.dir} style={{ fontFamily:t.font, background:C.cream, minHeight:'100vh', overflowX:'hidden' }}>
      <SiteNav lang={lang} setLang={setLang} />

      <section style={{ padding:'140px 40px 80px', background:C.white }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:60 }}>
            <div className="fu tag" style={{ background:C.tealSoft, border:`1px solid ${C.border}`, color:C.teal, marginBottom:18 }}>
              ✦ {t.pricing.eyebrow}
            </div>
            <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(28px,4vw,46px)', color:C.dark, marginBottom:16, letterSpacing:'-0.3px' }}>
              {t.pricing.title}
            </h1>
            <p style={{ fontSize:16, color:C.muted, maxWidth:500, margin:'0 auto 32px', lineHeight:1.75 }}>{t.pricing.sub}</p>

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

          {plansLoading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'60px 0', color:C.muted }}>
              <Loader2 size={28} style={{ animation:'spin 0.9s linear infinite' }} />
              <p style={{ fontSize:14 }}>{t.pricing.loading}</p>
            </div>
          )}

          {!plansLoading && plansError && (
            <div style={{ textAlign:'center', padding:'60px 0' }}>
              <p style={{ fontSize:14, color:C.muted }}>{t.pricing.error}</p>
            </div>
          )}

          {!plansLoading && !plansError && plans.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 0' }}>
              <p style={{ fontSize:14, color:C.muted }}>{t.pricing.empty}</p>
            </div>
          )}

          {!plansLoading && !plansError && plans.length > 0 && (
            <div className="plan-grid" style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(plans.length,3)},1fr)`, gap:24 }}>
              {plans.map((plan) => {
                const displayPrice = billing==='yearly'
                  ? Math.round(plan.yearlyPrice)
                  : Math.round(plan.monthlyPrice)
                const specs = [
                  { icon:'👥', val: plan.maxUsers === -1 ? t.pricing.unlimited : plan.maxUsers, label: t.pricing.users },
                  { icon:'🩺', val: plan.maxDoctors === -1 ? t.pricing.unlimited : plan.maxDoctors, label: t.pricing.doctors },
                  { icon:'🧍', val: plan.maxPatients === -1 ? t.pricing.unlimited : plan.maxPatients, label: plan.maxPatients === -1 ? t.pricing.patients : t.pricing.patientsPerMonth },
                ]
                const displayName = isAr ? plan.name : (plan.nameEn || plan.name)
                const displayDescription = isAr ? plan.description : (plan.descriptionEn || plan.description)
                const displayFeatures = isAr ? plan.features : (plan.featuresEn?.length ? plan.featuresEn : plan.features)
                return (
                  <div key={plan.id} className={`plan-card${plan.isFeatured?' top':''}`}>
                    {plan.isFeatured && (
                      <div style={{ background:`linear-gradient(90deg,${C.teal},${C.tealLight})`, color:'#FFF', fontSize:11, fontWeight:800, padding:'5px 14px', borderRadius:100, display:'inline-block', marginBottom:20, letterSpacing:'0.6px' }}>
                        {isAr ? '⭐ الأكثر اختياراً' : '⭐ Most Popular'}
                      </div>
                    )}

                    <h3 style={{ fontSize:20, fontWeight:800, color:plan.isFeatured?'#FFF':C.dark, marginBottom:6 }}>{displayName}</h3>
                    {displayDescription && (
                      <p style={{ fontSize:13, color:plan.isFeatured?'rgba(255,255,255,0.6)':C.muted, marginBottom:24, lineHeight:1.5 }}>{displayDescription}</p>
                    )}

                    <div style={{ marginBottom:28, display:'flex', alignItems:'baseline', gap:4 }}>
                      <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:52, color:plan.isFeatured?'#FFF':C.teal, lineHeight:1 }}>
                        {displayPrice}
                      </span>
                      <span style={{ fontSize:14, color:plan.isFeatured?'rgba(255,255,255,0.5)':C.muted }}>
                        {t.pricing.currency}/{billing==='yearly' ? t.pricing.perYear : t.pricing.perMonth}
                      </span>
                    </div>

                    <div style={{ display:'flex', gap:10, marginBottom:24, paddingBottom:24, borderBottom:`1px solid ${plan.isFeatured?'rgba(255,255,255,0.15)':C.border}`, flexWrap:'wrap' }}>
                      {specs.map((s,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:plan.isFeatured?'rgba(255,255,255,0.85)':C.dark }}>
                          <span>{s.icon}</span>
                          <span style={{ fontWeight:700 }}>{s.val}</span>
                          <span style={{ color:plan.isFeatured?'rgba(255,255,255,0.55)':C.muted }}>{s.label}</span>
                        </div>
                      ))}
                    </div>

                    <ul style={{ listStyle:'none', marginBottom:32 }}>
                      {displayFeatures.map((f,j) => (
                        <li key={j} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:14, color:plan.isFeatured?'rgba(255,255,255,0.85)':C.dark, marginBottom:12, lineHeight:1.5 }}>
                          <span style={{ color:plan.isFeatured?'#4ADE80':C.teal, fontWeight:700, flexShrink:0, marginTop:1 }}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button onClick={contactSales}
                      style={{
                        width:'100%', padding:'14px', borderRadius:12,
                        border: plan.isFeatured ? 'none' : `1.5px solid ${C.border}`,
                        background: plan.isFeatured ? `linear-gradient(135deg,${C.tealLight},${C.teal})` : 'transparent',
                        color: plan.isFeatured ? '#FFF' : C.dark,
                        fontSize:14, fontWeight:700, cursor:'pointer', transition:'all 0.22s ease',
                        fontFamily:t.font,
                      }}
                      onMouseEnter={e => {
                        if(plan.isFeatured) { e.currentTarget.style.opacity='0.9'; e.currentTarget.style.transform='scale(1.01)' }
                        else { e.currentTarget.style.background=C.tealSoft; e.currentTarget.style.borderColor=C.teal; e.currentTarget.style.color=C.teal }
                      }}
                      onMouseLeave={e => {
                        if(plan.isFeatured) { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='scale(1)' }
                        else { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.dark }
                      }}>
                      {plan.isFeatured ? t.pricing.ctaFeatured : t.pricing.ctaDefault}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <p style={{ textAlign:'center', marginTop:32, fontSize:13, color:C.muted }}>
            {isAr
              ? '✓ بطاقة ائتمان غير مطلوبة  ·  ✓ إلغاء في أي وقت  ·  ✓ دعم مجاني للإعداد'
              : '✓ No credit card required  ·  ✓ Cancel anytime  ·  ✓ Free onboarding support'}
          </p>
        </div>
      </section>

      <SiteFooter lang={lang} />
    </div>
  )
}
