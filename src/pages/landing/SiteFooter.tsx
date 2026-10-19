import { useNavigate } from 'react-router-dom'
import { C, T, type Lang } from './shared'

export default function SiteFooter({ lang }: { lang: Lang }) {
  const navigate = useNavigate()
  const t = T[lang]
  const isAr = lang === 'ar'

  return (
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
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', maxWidth:240, lineHeight:1.6 }}>{t.footer.info}</p>
          </div>

          {/* Links */}
          <div style={{ display:'flex', gap:28, flexWrap:'wrap', alignItems:'center' }}>
            {[
              { label: t.footer.links[0], path:'/features' },
              { label: t.footer.links[1], path:'/pricing' },
            ].map((l,i) => (
              <span key={i} onClick={() => navigate(l.path)} style={{ fontSize:13, color:'rgba(255,255,255,0.45)', cursor:'pointer', transition:'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.8)'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.45)'}>
                {l.label}
              </span>
            ))}
            {[t.footer.links[2], t.footer.links[3]].map((l,i) => (
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
  )
}
