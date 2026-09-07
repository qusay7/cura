import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * ✅ إدارة تركيز موحّدة لأي نافذة منبثقة — تحل مشكلة تكررت بكل نافذة بالتطبيق:
 * لا نقل تركيز عند الفتح، لا حبس للتركيز بالداخل (Tab يهرب للصفحة اللي وراها)،
 * لا إغلاق بـ Escape، ولا إعادة تركيز لزر الفتح عند الإغلاق.
 *
 * الاستخدام: مرّر ref لعنصر لوحة النافذة نفسها (مو الخلفية المعتمة) + حالة
 * الفتح + دالة الإغلاق. أضف role="dialog" aria-modal="true" على نفس العنصر.
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void
) {
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const container = containerRef.current
    if (!container) return

    previouslyFocused.current = document.activeElement as HTMLElement | null

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))

    const focusable = getFocusable()
    ;(focusable[0] || container).focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const items = getFocusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused.current?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])
}
