import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Cloud, Wrench, Quote, ChevronDown } from 'lucide-react'
import { C, T, type Lang, ECGLine, SHOW_TESTIMONIALS, useLandingStyles } from './landing/shared'
import SiteNav from './landing/SiteNav'
import SiteFooter from './landing/SiteFooter'
import { usePageMeta } from '../hooks/usePageMeta'

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  useLandingStyles()
  const navigate  = useNavigate()
  const [lang, setLang] = useState<Lang>('en')
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const t    = T[lang]
  const isAr = lang === 'ar'

  usePageMeta({
    title: 'برنامج إدارة العيادات الطبية | CURA',
    description: 'نظّم مواعيد المرضى وملفاتهم وفواتير العيادة مع CURA، نظام إدارة عيادات بواجهة عربية وإنجليزية.',
    canonical: 'https://cura100.com/',
  })

  // ── إنشاء العيادة يتم عبر التواصل المباشر، لا بتسجيل ذاتي ──
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

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', padding:'110px 40px 80px', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-15%', [isAr?'left':'right']:'-10%', width:600, height:600, borderRadius:'50%',
          background:`radial-gradient(circle, ${C.teal}18 0%, transparent 70%)`,
          pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'absolute', bottom:'-20%', [isAr?'right':'left']:'-5%', width:500, height:500, borderRadius:'50%',
          background:`radial-gradient(circle, ${C.tealLight}12 0%, transparent 70%)`,
          pointerEvents:'none', zIndex:0 }} />

        <div style={{ maxWidth:1200, margin:'0 auto', width:'100%', position:'relative', zIndex:1 }}>
          <div className="hero-grid" style={{ display:'grid', gridTemplateColumns:'1fr 480px', gap:64, alignItems:'center' }}>

            <div>
              <div className="fu tag" style={{ background:C.tealSoft, border:`1px solid ${C.border}`, color:C.teal, marginBottom:22 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:C.teal, animation:'pulse2 2s infinite' }} />
                {t.hero.eyebrow}
              </div>

              <h1 className="fu d1" style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(40px,5.5vw,70px)', color:C.dark, lineHeight:1.1, letterSpacing:'-0.6px', marginBottom:6 }}>
                {t.hero.h1}
              </h1>
              <h1 className="fu d1" style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(40px,5.5vw,70px)', color:C.teal, lineHeight:1.1, letterSpacing:'-0.6px', marginBottom:28 }}>
                {t.hero.h1b}
              </h1>

              <p className="fu d2" style={{ fontSize:'clamp(15px,1.6vw,17.5px)', color:C.muted, lineHeight:1.75, maxWidth:520, marginBottom:40 }}>
                {t.hero.sub}
              </p>

              <div className="fu d3" style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:48 }}>
                <button className="btn-primary" onClick={contactSales} style={{ fontSize:15, padding:'13px 28px' }}>{t.hero.cta1}</button>
                <button className="btn-ghost"   onClick={() => navigate('/features')} style={{ fontSize:15, padding:'13px 26px' }}>{t.hero.cta2}</button>
              </div>

              <div className="fu d4" style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
                {[
                  { Icon:Lock,   text: isAr ? 'بيانات آمنة ومشفّرة' : 'Encrypted & Secure' },
                  { Icon:Cloud,  text: isAr ? 'سحابي 100%'         : '100% Cloud-Based'  },
                  { Icon:Wrench, text: isAr ? 'دعم فني على مدار الساعة' : '24/7 Support'  },
                ].map((b,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:C.muted, fontWeight:500 }}>
                    <b.Icon size={14} strokeWidth={2} color={C.teal} /><span>{b.text}</span>
                  </div>
                ))}
              </div>

              <div className="fu d5" style={{ marginTop:44, opacity:0.6 }}>
                <ECGLine color={C.tealMid} />
              </div>
            </div>

            <div className="hero-vis fu d2" style={{ position:'relative', display:'flex', flexDirection:'column', gap:14 }}>
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

              <div style={{
                background:C.white, border:`1px solid ${C.border}`,
                borderRadius:22, padding:'22px 24px',
                boxShadow:'0 8px 40px rgba(46,110,110,0.10)',
                animation:'floatA 5s ease-in-out infinite',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:32, height:32, borderRadius:9, background:C.tealSoft, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      📅
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{t.hero.card_title}</span>
                  </div>
                  <span style={{ fontSize:11, background:C.tealSoft, color:C.teal, padding:'3px 10px', borderRadius:100, fontWeight:700 }}>
                    12 {t.hero.card_total}
                  </span>
                </div>

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
        <div style={{ maxWidth:1200, margin:'0 auto', position:'relative' }}>
          <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:32, textAlign:'center' }}>
            {t.stats.map((s,i) => (
              <div key={i} style={{ animation:`countUp 0.6s ease ${i*0.1}s both` }}>
                <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(28px,3.2vw,38px)', color:'#FFF', margin:'0 0 6px', lineHeight:1 }}>{s.val}</p>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.65)', margin:0, fontWeight:500 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ FEATURES (teaser — 4 of 8, full list on /features) ══════════════════════ */}
      <section style={{ padding:'100px 40px' }}>
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

          <div className="feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:32 }}>
            {t.feats.items.slice(0,4).map((f,i) => (
              <div key={i} className="feat-card fu" style={{ animationDelay:`${i*0.05}s` }}>
                <div style={{ width:50, height:50, background:C.tealSoft, borderRadius:15, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                  <f.Icon size={22} color={C.teal} strokeWidth={1.8} />
                </div>
                <h3 style={{ fontSize:15, fontWeight:700, color:C.dark, marginBottom:10, lineHeight:1.3 }}>{f.title}</h3>
                <p style={{ fontSize:13, color:C.muted, lineHeight:1.7, margin:0 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign:'center' }}>
            <button className="btn-ghost" onClick={() => navigate('/features')} style={{ fontSize:14 }}>{t.feats.seeAll}</button>
          </div>
        </div>
      </section>

      {/* ══════════════════════ TESTIMONIALS ══════════════════════
          مخفي مؤقتاً — لا يوجد بعد اقتباسات حقيقية من عيادات فعلية.
          اقتباسات وهمية على موقع تسويقي عام تخدع الزوار، فأبقيناه مخفياً
          بدل نشر محتوى مفتَرى. فعّل SHOW_TESTIMONIALS متى جهزت آراء حقيقية.
      ══════════════════════════════════════════════════════════ */}
      {SHOW_TESTIMONIALS && (
      <section style={{ padding:'100px 40px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:60 }}>
            <div className="fu tag" style={{ background:C.tealSoft, border:`1px solid ${C.border}`, color:C.teal, marginBottom:18 }}>
              ✦ {t.testimonials.eyebrow}
            </div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(28px,4vw,46px)', color:C.dark, marginBottom:16, letterSpacing:'-0.3px', lineHeight:1.2 }}>
              {t.testimonials.title}
            </h2>
            <p style={{ fontSize:13.5, color:C.amber, maxWidth:560, margin:'0 auto', lineHeight:1.7, fontWeight:600 }}>{t.testimonials.sub}</p>
          </div>

          <div className="feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
            {t.testimonials.items.map((item,i) => (
              <div key={i} className="feat-card fu" style={{ animationDelay:`${i*0.05}s`, display:'flex', flexDirection:'column' }}>
                <Quote size={26} color={C.tealLight} strokeWidth={1.5} style={{ marginBottom:14 }} />
                <p style={{ fontSize:14, color:C.dark, lineHeight:1.8, marginBottom:20, fontStyle:'italic', flex:1 }}>
                  {item.quote}
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:12, borderTop:`1px solid ${C.border}`, paddingTop:16 }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:C.tealSoft, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:C.teal, flexShrink:0 }}>
                    ?
                  </div>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:C.dark, margin:0 }}>{item.name}</p>
                    <p style={{ fontSize:11.5, color:C.muted, margin:'2px 0 0' }}>{item.role} · {item.clinic}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ══════════════════════ PRICING (teaser — full plans on /pricing) ══════════════════════ */}
      <section style={{ padding:'100px 40px', background:C.white }}>
        <div style={{ maxWidth:700, margin:'0 auto', textAlign:'center' }}>
          <div className="fu tag" style={{ background:C.tealSoft, border:`1px solid ${C.border}`, color:C.teal, marginBottom:18 }}>
            ✦ {t.pricing.eyebrow}
          </div>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(28px,4vw,46px)', color:C.dark, marginBottom:16, letterSpacing:'-0.3px' }}>
            {t.pricing.title}
          </h2>
          <p style={{ fontSize:16, color:C.muted, margin:'0 auto 32px', lineHeight:1.75 }}>{t.pricing.teaser}</p>
          <button className="btn-primary" onClick={() => navigate('/pricing')} style={{ fontSize:14 }}>{t.pricing.seeAll}</button>
        </div>
      </section>

      {/* ══════════════════════ FAQ (teaser — 2 of 6, full list on /faq) ══════════════════════ */}
      <section style={{ padding:'100px 40px', background:C.white }}>
        <div style={{ maxWidth:760, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div className="fu tag" style={{ background:C.tealSoft, border:`1px solid ${C.border}`, color:C.teal, marginBottom:18 }}>
              ✦ {t.faq.eyebrow}
            </div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(28px,4vw,46px)', color:C.dark, marginBottom:16, letterSpacing:'-0.3px', lineHeight:1.2 }}>
              {t.faq.title}
            </h2>
            <p style={{ fontSize:15, color:C.muted, lineHeight:1.75 }}>{t.faq.sub}</p>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:28 }}>
            {t.faq.items.slice(0,2).map((item, i) => {
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

          <div style={{ textAlign:'center' }}>
            <button className="btn-ghost" onClick={() => navigate('/faq')} style={{ fontSize:14 }}>{t.faq.seeAll}</button>
          </div>
        </div>
      </section>

      {/* ══════════════════════ CTA ══════════════════════ */}
      <section style={{ padding:'110px 40px', background:`linear-gradient(160deg,${C.tealGlow} 0%,${C.teal} 60%,${C.tealMid} 100%)`, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', bottom:20, left:0, right:0, opacity:0.12, pointerEvents:'none' }}>
          <ECGLine color="#FFF" />
        </div>
        <div style={{ maxWidth:680, margin:'0 auto', textAlign:'center', position:'relative' }}>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(28px,4.5vw,50px)', color:'#FFF', marginBottom:16, letterSpacing:'-0.4px', lineHeight:1.2 }}>
            {t.cta.title}
          </h2>
          <p style={{ fontSize:17, color:'rgba(255,255,255,0.75)', marginBottom:40, lineHeight:1.7 }}>{t.cta.sub}</p>
          <button className="btn-white" onClick={contactSales} style={{ fontSize:15, padding:'15px 36px' }}>
            {t.cta.btn}
          </button>
        </div>
      </section>

      <SiteFooter lang={lang} />
    </div>
  )
}
