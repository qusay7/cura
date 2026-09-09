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
}

/**
 * نافذة منبثقة موحّدة بهوية Cura — بديل عن تكرار نفس overlay/box بكل صفحة.
 * الأبعاد دايماً مقيّدة بحدود الشاشة (maxWidth: 95vw, maxHeight: 90vh)
 * والمحتوى الطويل يتمرّر داخل الإطار (overflowY: auto) بدل ما يكسر الصفحة.
 */
export default function Modal({ open, onClose, title, children, footer, width = 600, isRtl = true }: ModalProps) {
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
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9998, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: CARD_BG, borderRadius: 20, width, maxWidth: '95vw', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column', direction: isRtl ? 'rtl' : 'ltr',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>{title}</h3>
            <button
              onClick={onClose}
              aria-label={isRtl ? 'إغلاق' : 'Close'}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: TEXT_MUTED, lineHeight: 1, padding: 4 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* المحتوى وحده يتمرّر — الرأس والتذييل ثابتين، فالنافذة كاملة تبقى داخل حدود الشاشة دايماً */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {footer && (
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 10,
            padding: '16px 24px', borderTop: `1px solid ${BORDER}`, flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
