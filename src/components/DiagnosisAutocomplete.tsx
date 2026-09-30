import { useEffect, useRef, useState } from 'react'
import api from '../api/axios'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'

interface Suggestion {
  id: string
  name: string
}

interface Medication {
  id: string
  drugName: string
  instructions: string | null
}

interface DiagnosisAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onInsertPrescriptionText: (text: string) => void
  isAr: boolean
}

// ✅ اقتراح أثناء الكتابة — يقترح تشخيصات مطابقة من قائمة العيادة الخاصة
// (يبنيها الطبيب بنفسه من صفحة الإعدادات)، وعند اختيار واحد يعرض أدويته
// المقترحة كأزرار إدراج بالوصفة — مافي شي يُفرض تلقائياً، كل شي قابل للتعديل
export default function DiagnosisAutocomplete({ value, onChange, onInsertPrescriptionText, isAr }: DiagnosisAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [medications, setMedications] = useState<Medication[]>([])
  const [matchedName, setMatchedName] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value || value.trim().length < 2) {
      setSuggestions([])
      return
    }

    debounceRef.current = setTimeout(() => {
      api.get('/diagnosistemplates/search', { params: { q: value.trim() } })
        .then(res => setSuggestions(res.data || []))
        .catch(() => setSuggestions([]))
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const pickSuggestion = async (s: Suggestion) => {
    onChange(s.name)
    setShowDropdown(false)
    setMatchedName(s.name)
    try {
      const res = await api.get(`/diagnosistemplates/${s.id}`)
      setMedications(res.data?.medications || [])
    } catch {
      setMedications([])
    }
  }

  const insertOne = (m: Medication) => {
    const text = m.instructions ? `${m.drugName} — ${m.instructions}` : m.drugName
    onInsertPrescriptionText(text)
  }

  const insertAll = () => {
    medications.forEach(insertOne)
  }

  // ✅ إذا المستخدم عدّل النص بعد اختيار اقتراح، ما نضل نعرض أدوية تشخيص تاني عن قصد
  useEffect(() => {
    if (matchedName && value !== matchedName) {
      setMedications([])
      setMatchedName(null)
    }
  }, [value, matchedName])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <textarea
        value={value}
        onChange={e => { onChange(e.target.value); setShowDropdown(true) }}
        onFocus={() => setShowDropdown(true)}
        rows={3}
        style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK, resize: 'vertical' }}
      />

      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', insetInlineStart: 0, insetInlineEnd: 0, zIndex: 20,
          background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, marginTop: 4,
          boxShadow: '0 4px 14px rgba(0,0,0,0.08)', maxHeight: 180, overflowY: 'auto',
        }}>
          {suggestions.map(s => (
            <div key={s.id} onClick={() => pickSuggestion(s)}
              style={{ padding: '8px 12px', fontSize: 12.5, color: TEXT_DARK, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = PRIMARY_SOFT)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {s.name}
            </div>
          ))}
        </div>
      )}

      {medications.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, color: TEXT_MUTED }}>
            💊 {isAr ? 'أدوية مقترحة:' : 'Suggested medications:'}
          </span>
          {medications.map(m => (
            <button key={m.id} type="button" onClick={() => insertOne(m)}
              style={{ padding: '4px 10px', borderRadius: 100, border: `1px solid ${BORDER}`, background: PRIMARY_SOFT, color: PRIMARY, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              + {m.drugName}
            </button>
          ))}
          {medications.length > 1 && (
            <button type="button" onClick={insertAll}
              style={{ padding: '4px 10px', borderRadius: 100, border: 'none', background: PRIMARY, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              {isAr ? 'إدراج الكل' : 'Insert all'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
