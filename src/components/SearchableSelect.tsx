import { useEffect, useRef, useState } from 'react'

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
}: SearchableSelectProps) {
  const c = { ...DEFAULTS, ...colors }
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = 'cura-searchable-select-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = css; document.head.appendChild(s)
    }
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) { setOpen(false); setQuery('') }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30) }, [open])

  const selected = options.find(o => o.value === value)
  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  const pick = (opt: SearchableSelectOption) => {
    if (opt.disabled) return
    onChange(opt.value)
    setOpen(false); setQuery('')
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', ['--sso-primary-soft' as any]: c.primarySoft }}>
      <button
        type="button"
        disabled={disabled}
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

      {open && !disabled && (
        <div className="sso-dropdown" style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 400,
          background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 12,
          boxShadow: '0 8px 28px rgba(0,0,0,0.12)', overflow: 'hidden', maxHeight: 280, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: 8, borderBottom: `1px solid ${c.border}` }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={searchPlaceholder || (isRtl ? 'بحث...' : 'Search...')}
              style={{
                width: '100%', padding: '7px 10px', border: `1px solid ${c.border}`, borderRadius: 8,
                fontSize: 12.5, outline: 'none', fontFamily: 'inherit', color: c.textDark,
              }}
            />
          </div>
          <div style={{ overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '14px 12px', fontSize: 12, color: c.textMuted, textAlign: 'center' }}>
                {isRtl ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '14px 12px', fontSize: 12, color: c.textMuted, textAlign: 'center' }}>
                {emptyText || (isRtl ? 'لا توجد نتائج' : 'No results')}
              </div>
            ) : filtered.map(opt => (
              <div
                key={opt.value}
                className={`sso-option${opt.value === value ? ' sso-active' : ''}${opt.disabled ? ' sso-disabled' : ''}`}
                onClick={() => pick(opt)}
                style={{
                  padding: '9px 12px', fontSize: 13, cursor: opt.disabled ? 'not-allowed' : 'pointer',
                  color: opt.disabled ? c.textMuted : c.textDark, opacity: opt.disabled ? 0.6 : 1,
                  display: 'flex', flexDirection: 'column', gap: 1,
                }}
              >
                <span>{opt.label}</span>
                {opt.hint && <span style={{ fontSize: 10.5, color: c.textMuted }}>{opt.hint}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}