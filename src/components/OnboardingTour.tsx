import { useEffect, useLayoutEffect, useState } from 'react'

const PRIMARY = '#5B8C8F'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'

export interface TourStep {
  // null = خطوة ترحيبية بلا هدف، تُعرض في وسط الشاشة بدون تظليل عنصر معيّن
  target: string | null
  titleAr: string
  titleEn: string
  descAr: string
  descEn: string
}

interface Props {
  steps: TourStep[]
  isAr: boolean
  onFinish: () => void
}

// ✅ جولة تعريفية خفيفة بلا أي مكتبة خارجية — تعتمد على تقنية "spotlight" الكلاسيكية
// (box-shadow كبير حول العنصر المستهدف) بدل تحميل مكتبة جولات جاهزة، حفاظاً على
// حجم الحزمة الذي عملنا على تصغيره في هذه المحادثة
export default function OnboardingTour({ steps, isAr, onFinish }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const step = steps[stepIndex]
  const isWelcome = !step?.target

  useLayoutEffect(() => {
    if (!step || isWelcome) { setRect(null); return }

    const el = document.querySelector(step.target as string) as HTMLElement | null
    // ✅ عنصر غير موجود، أو موجود لكن بلا أبعاد (display:none — مثلاً القائمة
    // الجانبية على شاشة موبايل ضيقة) — تخطّ الخطوة تلقائياً بدل عرض تظليل مكسور
    const isUsable = el && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0
    if (!isUsable) {
      if (stepIndex < steps.length - 1) setStepIndex(i => i + 1)
      else onFinish()
      return
    }

    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const update = () => setRect(el.getBoundingClientRect())
    update()
    const t = setTimeout(update, 260) // بعد انتهاء أي حركة سكرول سلسة
    window.addEventListener('resize', update)
    return () => { clearTimeout(t); window.removeEventListener('resize', update) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onFinish() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!step) return null
  if (!isWelcome && !rect) return null // لحظة قياس موضع العنصر

  const isLast = stepIndex === steps.length - 1
  const next = () => { if (isLast) onFinish(); else setStepIndex(i => i + 1) }
  const back = () => setStepIndex(i => Math.max(0, i - 1))

  const title = isAr ? step.titleAr : step.titleEn
  const desc = isAr ? step.descAr : step.descEn

  // موضع بطاقة الشرح: أسفل الهدف مع تفادي تجاوز حدود الشاشة.
  // ✅ الرسو (anchor) يُحسَب من الموضع الفعلي للعنصر على الشاشة، لا من اتجاه اللغة —
  // القائمة الجانبية تنتقل يمين/يسار مع اللغة، لكن جرس الإشعارات وقائمة المستخدم
  // (بأقصى الطرف المقابل من الشريط العلوي) ينتقلان بالعكس تماماً، فأي افتراض
  // مبني على isAr فقط يصيب نصف الخطوات ويُخطئ النصف الآخر
  const cardWidth = 300
  let top = 0, left = 0
  if (rect) {
    top = Math.min(rect.bottom + 14, window.innerHeight - 190)
    if (top < rect.bottom + 14 && rect.top > 200) top = rect.top - 176 // لو ما في مساحة تحت، اعرضها فوق
    const targetCenterX = rect.left + rect.width / 2
    const anchorToRightEdge = targetCenterX > window.innerWidth / 2
    left = anchorToRightEdge
      ? Math.min(Math.max(rect.right - cardWidth, 12), window.innerWidth - cardWidth - 12)
      : Math.min(Math.max(rect.left, 12), window.innerWidth - cardWidth - 12)
  }

  return (
    <>
      {/* حاجب نقرات كامل الشاشة — يمنع التفاعل مع الصفحة نفسها أثناء الجولة */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9997, background: isWelcome ? 'rgba(15,31,31,0.55)' : 'transparent' }}
        onClick={e => e.preventDefault()} />

      {/* التظليل (Spotlight) حول العنصر المستهدف */}
      {rect && (
        <div style={{
          position: 'fixed', top: rect.top - 6, left: rect.left - 6,
          width: rect.width + 12, height: rect.height + 12,
          borderRadius: 12, boxShadow: '0 0 0 9999px rgba(15,31,31,0.55)',
          border: `2px solid ${PRIMARY}`, zIndex: 9998, pointerEvents: 'none',
          transition: 'top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease',
        }} />
      )}

      {/* بطاقة الشرح */}
      <div style={{
        position: 'fixed',
        ...(isWelcome
          ? { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }
          : { top, left }),
        zIndex: 9999, background: '#FFFFFF', borderRadius: 18,
        padding: '22px 22px', width: cardWidth,
        boxShadow: '0 16px 48px rgba(0,0,0,0.28)',
        direction: isAr ? 'rtl' : 'ltr',
        fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif",
      }}>
        <p style={{ fontSize: 11, color: PRIMARY, fontWeight: 700, marginBottom: 8, letterSpacing: '0.4px' }}>
          {stepIndex + 1} / {steps.length}
        </p>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: TEXT_DARK }}>{title}</h4>
        <p style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.7, marginBottom: 18 }}>{desc}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <button onClick={onFinish} style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 12, cursor: 'pointer', padding: '6px 4px' }}>
            {isAr ? 'تخطّي' : 'Skip'}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {stepIndex > 0 && (
              <button onClick={back} style={{ background: 'transparent', border: '1px solid #DCE5E5', color: TEXT_DARK, borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {isAr ? 'رجوع' : 'Back'}
              </button>
            )}
            <button onClick={next} style={{ background: PRIMARY, color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {isLast ? (isAr ? 'إنهاء' : 'Finish') : (isAr ? 'التالي' : 'Next')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
