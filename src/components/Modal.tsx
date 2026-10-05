import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const TEXT_DARK  = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER     = '#DCE5E5'
const CARD_BG    = '#FFFFFF'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  /** العرض المثالي على شاشة كبيرة — يبقى مقيّداً بـ 95vw على أي شاشة أصغر */
  width?: number
  isRtl?: boolean
  /** ✅ للنماذج الكثيفة (عدة تبويبات/حقول) — تاخذ الشاشة كاملة بدل صندوق صغير
   * بالنص، عشان الحقول ما تكون مزدحمة. الرأس والتذييل يبقوا ثابتين وبعرض كامل،
   * بس محتوى النموذج نفسه محدود بعرض مقروء (maxWidth) ومتمركز، مش ملاصق للحيطان. */
  fullScreen?: boolean
  /** عرض محتوى النموذج الأقصى بوضع ملء الشاشة (افتراضي 880) */
  contentMaxWidth?: number
}

/**
 * نافذة منبثقة موحّدة بهوية Cura — بديل عن تكرار نفس overlay/box بكل صفحة.
 * بالوضع العادي: الأبعاد مقيّدة بحدود الشاشة (maxWidth: 95vw, maxHeight: 90vh)
 * والمحتوى الطويل يتمرّر داخل الإطار (overflowY: auto) بدل ما يكسر الصفحة.
 * بوضع fullScreen: النافذة تاخذ الشاشة بالكامل، أوضح وأسهل للنماذج الكثيفة.
 */
export default function Modal({ open, onClose, title, children, footer, width = 600, isRtl = true, fullScreen = false, contentMaxWidth = 880 }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, background: fullScreen ? CARD_BG : 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: fullScreen ? 'stretch' : 'center', justifyContent: fullScreen ? 'stretch' : 'center',
        zIndex: 9998, padding: fullScreen ? 0 : 16,
      }}
      onClick={fullScreen ? undefined : onClose}
    >
      <div
        style={{
          background: CARD_BG, borderRadius: fullScreen ? 0 : 20,
          width: fullScreen ? '100%' : width, maxWidth: fullScreen ? '100%' : '95vw',
          height: fullScreen ? '100%' : undefined, maxHeight: fullScreen ? '100%' : '90vh',
          display: 'flex', flexDirection: 'column', direction: isRtl ? 'rtl' : 'ltr',
          boxShadow: fullScreen ? 'none' : '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
        }}
        onClick={fullScreen ? undefined : e => e.stopPropagation()}
      >
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: fullScreen ? '18px 24px' : '20px 24px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>{title}</h3>
            <button
              onClick={onClose}
              aria-label={isRtl ? 'إغلاق' : 'Close'}
              style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: TEXT_MUTED, lineHeight: 1, padding: 4 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* المحتوى وحده يتمرّر — الرأس والتذييل ثابتين، فالنافذة كاملة تبقى داخل حدود الشاشة دايماً.
            بوضع fullScreen، المحتوى نفسه محدود بعرض مقروء ومتمركز بنص الشاشة الواسعة. */}
        <div style={{ padding: fullScreen ? '28px 24px' : 24, overflowY: 'auto', flex: 1 }}>
          <div style={fullScreen ? { maxWidth: contentMaxWidth, margin: '0 auto' } : undefined}>
            {children}
          </div>
        </div>

        {footer && (
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 10,
            padding: fullScreen ? '16px 24px' : '16px 24px', borderTop: `1px solid ${BORDER}`, flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
