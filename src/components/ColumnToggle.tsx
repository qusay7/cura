import { useEffect, useRef, useState } from 'react'

const PRIMARY = '#5B8C8F'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'

export interface ColumnDef {
  key: string
  label: string
  /** أعمدة أساسية ما تقدر تختفي (مثلاً اسم المريض) — اختياري */
  locked?: boolean
}

/**
 * ✅ Hook قابل لإعادة الاستخدام — يدير حالة "الأعمدة الظاهرة" لأي جدول بالنظام،
 * ويحفظها بـ localStorage (تفضل محفوظة حتى بعد ما تسكّر المتصفح)، بمفتاح مختلف
 * لكل جدول (storageKey) عشان جدول ما يأثر على جدول ثاني.
 */
export function useColumnVisibility(storageKey: string, columns: ColumnDef[]) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`col-vis-${storageKey}`)
      if (saved) return new Set(JSON.parse(saved))
    } catch { /* تجاهل — نستخدم الافتراضي */ }
    return new Set(columns.map(c => c.key))
  })

  useEffect(() => {
    localStorage.setItem(`col-vis-${storageKey}`, JSON.stringify([...visibleKeys]))
  }, [storageKey, visibleKeys])

  const toggle = (key: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const isVisible = (key: string) => visibleKeys.has(key)
  const visibleColumns = columns.filter(c => visibleKeys.has(c.key))

  return { visibleKeys, toggle, isVisible, visibleColumns }
}

/**
 * ✅ زر "⚙️ الأعمدة" — يفتح قائمة Checkbox لكل عمود. ضعه بأي صفحة جنب زر الطباعة/التصدير.
 */
export function ColumnToggleButton({
  columns, visibleKeys, onToggle, isRtl,
}: {
  columns: ColumnDef[]
  visibleKeys: Set<string>
  onToggle: (key: string) => void
  isRtl: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const t = isRtl
    ? { label: 'الأعمدة', hint: 'اختر الأعمدة اللي تبي تظهر' }
    : { label: 'Columns', hint: 'Choose which columns to show' }

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={ref} className="no-print" style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_DARK, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
        ⚙️ {t.label}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '110%', [isRtl ? 'right' : 'left']: 0, zIndex: 50,
          background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 190,
        }}>
          <p style={{ fontSize: 10.5, color: TEXT_MUTED, marginBottom: 8 }}>{t.hint}</p>
          {columns.map(col => (
            <label key={col.key}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', cursor: col.locked ? 'not-allowed' : 'pointer', opacity: col.locked ? 0.6 : 1 }}>
              <input type="checkbox" checked={visibleKeys.has(col.key)} disabled={col.locked}
                onChange={() => !col.locked && onToggle(col.key)}
                style={{ width: 14, height: 14, accentColor: PRIMARY, cursor: col.locked ? 'not-allowed' : 'pointer' }} />
              <span style={{ fontSize: 12.5, color: TEXT_DARK }}>{col.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}