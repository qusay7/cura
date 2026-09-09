import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// ─── ألوان افتراضية (نفس هوية Cura) — تقدر تتجاوزها بالـ props لو صفحة عندها لوحة ألوان مختلفة ───
const DEFAULTS = {
  primary: '#5B8C8F',
  primarySoft: '#E8F0F0',
  textDark: '#2C3E3F',
  textMuted: '#6B8A8C',
  border: '#DCE5E5',
  cardBg: '#FFFFFF',
}

export interface SearchableSelectOption {
  value: string
  label: string
  disabled?: boolean
  hint?: string   // نص إضافي يظهر جنب الخيار (مثلاً: "مرتبط بـ: أحمد")
}

interface SearchableSelectProps {
  value: string
  onChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  isRtl?: boolean
  disabled?: boolean
  loading?: boolean
  emptyText?: string
  colors?: Partial<typeof DEFAULTS>
  // ✅ تُمرَّر عادةً من FormField لربط <label htmlFor> ورسالة الخطأ برمجياً
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  'aria-required'?: boolean
}

const css = `
@keyframes sso-fade { from{opacity:0;transform:translateY(-4px);} to{opacity:1;transform:translateY(0);} }
.sso-dropdown { animation: sso-fade 0.15s ease both; }
.sso-option:hover:not(.sso-disabled) { background: var(--sso-primary-soft); }
.sso-option.sso-active { background: var(--sso-primary-soft); }
`

/**
 * قائمة اختيار قابلة للبحث — بديل موحّد لأي <select> عادي بالمشروع.
 * استخدامها: <SearchableSelect value={x} onChange={setX} options={[{value,label}]} />
 */
export default function SearchableSelect({
  value, onChange, options, placeholder, searchPlaceholder,
  isRtl = true, disabled = false, loading = false, emptyText, colors,
  id, 'aria-invalid': ariaInvalid, 'aria-describedby': ariaDescribedBy, 'aria-required': ariaRequired,
}: SearchableSelectProps) {
  const c = { ...DEFAULTS, ...colors }
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const instanceId = useId()
  const listboxId = `sso-listbox-${instanceId}`
  const optionId = (i: number) => `sso-option-${instanceId}-${i}`

  // ✅ موضع القائمة يُحسب بالنسبة للشاشة (fixed) لا للأب المباشر — عشان لو الحقل
  // داخل نافذة منبثقة قابلة للتمرير، القائمة تبقى ظاهرة كاملة داخل حدود الشاشة
  // بدل ما تنقطع عند حافة النافذة أو تخرج منها. تنقلب لفوق لو ما فيه مساحة تحت.
  const [pos, setPos] = useState<{ top: number; left: number; width: number; placement: 'below' | 'above' }>(
    { top: 0, left: 0, width: 0, placement: 'below' }
  )

  const recalcPosition = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const maxDropdownHeight = 280
    const spaceBelow = window.innerHeight - rect.bottom
    const placement = spaceBelow < maxDropdownHeight && rect.top > spaceBelow ? 'above' : 'below'
    setPos({
      top: placement === 'below' ? rect.bottom + 4 : rect.top - 4,
      left: rect.left,
      width: rect.width,
      placement,
    })
  }

  useLayoutEffect(() => {
    if (!open) return
    recalcPosition()
    const onScrollOrResize = () => recalcPosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    const id = 'cura-searchable-select-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = css; document.head.appendChild(s)
    }
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (wrapRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setOpen(false); setQuery('')
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30) }, [open])

  const selected = options.find(o => o.value === value)
  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  // ✅ يعيد ضبط عنصر التنقّل النشط كلما تغيّرت نتائج البحث أو فُتحت القائمة —
  // يمنع بقاء مؤشر يشير لخيار لم يعد ظاهراً بالنتائج المفلترة
  useEffect(() => {
    setActiveIndex(filtered.length > 0 ? 0 : -1)
  }, [query, open])

  useEffect(() => {
    if (activeIndex < 0) return
    document.getElementById(optionId(activeIndex))?.scrollIntoView?.({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex])

  const pick = (opt: SearchableSelectOption) => {
    if (opt.disabled) return
    onChange(opt.value)
    setOpen(false); setQuery('')
  }

  const closeAndReturnFocus = () => {
    setOpen(false); setQuery('')
    triggerRef.current?.focus()
  }

  // ✅ نمط combobox/listbox القياسي: الأسهم تحرّك عنصراً "نشطاً" (aria-activedescendant)
  // بدل نقل التركيز الفعلي، فيبقى المستخدم يكتب بحقل البحث بينما يتنقّل بالنتائج
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => (filtered.length === 0 ? -1 : Math.min(i + 1, filtered.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => (filtered.length === 0 ? -1 : Math.max(i - 1, 0)))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && filtered[activeIndex]) pick(filtered[activeIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeAndReturnFocus()
    }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', ['--sso-primary-soft' as any]: c.primarySoft }}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        aria-required={ariaRequired || undefined}
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '9px 12px', border: `1px solid ${open ? c.primary : c.border}`,
          borderRadius: 10, fontSize: 13, color: selected ? c.textDark : c.textMuted,
          background: disabled ? '#F5F5F5' : c.cardBg, cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          fontFamily: 'inherit', textAlign: isRtl ? 'right' : 'left',
          boxShadow: open ? `0 0 0 3px ${c.primary}18` : 'none', transition: 'all 0.15s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : (placeholder || '—')}
        </span>
        <span style={{ fontSize: 10, color: c.textMuted, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
      </button>

      {open && !disabled && createPortal(
        <div ref={dropdownRef} className="sso-dropdown" style={{
          position: 'fixed', left: pos.left, width: pos.width, zIndex: 9999,
          top: pos.placement === 'below' ? pos.top : undefined,
          bottom: pos.placement === 'above' ? window.innerHeight - pos.top : undefined,
          background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 12,
          boxShadow: '0 8px 28px rgba(0,0,0,0.12)', overflow: 'hidden', maxHeight: 280, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: 8, borderBottom: `1px solid ${c.border}` }}>
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded="true"
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={searchPlaceholder || (isRtl ? 'بحث...' : 'Search...')}
              style={{
                width: '100%', padding: '7px 10px', border: `1px solid ${c.border}`, borderRadius: 8,
                fontSize: 12.5, outline: 'none', fontFamily: 'inherit', color: c.textDark,
              }}
            />
          </div>
          <div id={listboxId} role="listbox" style={{ overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '14px 12px', fontSize: 12, color: c.textMuted, textAlign: 'center' }}>
                {isRtl ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '14px 12px', fontSize: 12, color: c.textMuted, textAlign: 'center' }}>
                {emptyText || (isRtl ? 'لا توجد نتائج' : 'No results')}
              </div>
            ) : filtered.map((opt, i) => (
              <div
                key={opt.value}
                id={optionId(i)}
                role="option"
                aria-selected={opt.value === value}
                aria-disabled={opt.disabled || undefined}
                className={`sso-option${opt.value === value ? ' sso-active' : ''}${opt.disabled ? ' sso-disabled' : ''}${i === activeIndex ? ' sso-highlighted' : ''}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => pick(opt)}
                style={{
                  padding: '9px 12px', fontSize: 13, cursor: opt.disabled ? 'not-allowed' : 'pointer',
                  color: opt.disabled ? c.textMuted : c.textDark, opacity: opt.disabled ? 0.6 : 1,
                  display: 'flex', flexDirection: 'column', gap: 1,
                  background: i === activeIndex ? c.primarySoft : undefined,
                }}
              >
                <span>{opt.label}</span>
                {opt.hint && <span style={{ fontSize: 10.5, color: c.textMuted }}>{opt.hint}</span>}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}