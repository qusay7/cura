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

interface SuggestedTest {
  id: string
  testName: string
  category: 'lab' | 'radiology'
}

interface SuggestedProcedure {
  id: string
  procedureId: string
  name: string
  nameEn: string | null
  defaultPrice: number | null
  needsNursing: boolean
}

interface DiagnosisAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onInsertPrescriptionText: (text: string) => void
  // ✅ اختياري — بدونه (مثلاً صفحات لسا ما ربطت طلبات التحاليل/الأشعة) قسم
  // الاقتراحات يختفي بس باقي الميزات (الأدوية) تشتغل عادي. ينشئ طلب تحليل/أشعة
  // حقيقي (مش نص) — السبب والفئة (lab/radiology) موجودين بالاقتراح نفسه
  onInsertTest?: (test: { testName: string; category: 'lab' | 'radiology' }) => void
  // ✅ اختياري — نفس مبدأ onInsertTest، بس ينشئ إجراء حقيقي (VisitProcedureItem)
  // بسعره من الكتالوج، مع needsNursing المُعدّ مسبقاً بالقالب (قابل للتعديل لاحقاً
  // من صفحة الإجراءات نفسها، مش هون)
  onInsertProcedure?: (proc: { procedureId: string; price: number | null; needsNursing: boolean }) => void
  isAr: boolean
}

// ✅ اقتراح أثناء الكتابة — يقترح تشخيصات مطابقة من قائمة العيادة الخاصة
// (يبنيها الطبيب بنفسه من صفحة الإعدادات)، وعند اختيار واحد يعرض أدويته
// المقترحة كأزرار إدراج بالوصفة — مافي شي يُفرض تلقائياً، كل شي قابل للتعديل
export default function DiagnosisAutocomplete({ value, onChange, onInsertPrescriptionText, onInsertTest, onInsertProcedure, isAr }: DiagnosisAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [medications, setMedications] = useState<Medication[]>([])
  const [tests, setTests] = useState<SuggestedTest[]>([])
  const [procedures, setProcedures] = useState<SuggestedProcedure[]>([])
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
      setTests(res.data?.tests || [])
      setProcedures(res.data?.procedures || [])
    } catch {
      setMedications([])
      setTests([])
      setProcedures([])
    }
  }

  const insertOne = (m: Medication) => {
    const text = m.instructions ? `${m.drugName} — ${m.instructions}` : m.drugName
    onInsertPrescriptionText(text)
  }

  const insertAll = () => {
    medications.forEach(insertOne)
  }

  const insertOneTest = (x: SuggestedTest) => {
    onInsertTest?.({ testName: x.testName, category: x.category })
  }

  const insertAllTests = () => {
    tests.forEach(insertOneTest)
  }

  const insertOneProcedure = (p: SuggestedProcedure) => {
    onInsertProcedure?.({ procedureId: p.procedureId, price: p.defaultPrice, needsNursing: p.needsNursing })
  }

  const insertAllProcedures = () => {
    procedures.forEach(insertOneProcedure)
  }

  // ✅ إذا المستخدم عدّل النص بعد اختيار اقتراح، ما نضل نعرض أدوية/تحاليل/إجراءات تشخيص تاني عن قصد
  useEffect(() => {
    if (matchedName && value !== matchedName) {
      setMedications([])
      setTests([])
      setProcedures([])
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

      {onInsertTest && tests.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, color: TEXT_MUTED }}>
            🧪 {isAr ? 'تحاليل وأشعة مقترحة:' : 'Suggested tests & radiology:'}
          </span>
          {tests.map(x => (
            <button key={x.id} type="button" onClick={() => insertOneTest(x)}
              style={{ padding: '4px 10px', borderRadius: 100, border: `1px solid ${BORDER}`, background: PRIMARY_SOFT, color: PRIMARY, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              + {x.category === 'radiology' ? '☢️' : '🧪'} {x.testName}
            </button>
          ))}
          {tests.length > 1 && (
            <button type="button" onClick={insertAllTests}
              style={{ padding: '4px 10px', borderRadius: 100, border: 'none', background: PRIMARY, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              {isAr ? 'إدراج الكل' : 'Insert all'}
            </button>
          )}
        </div>
      )}

      {onInsertProcedure && procedures.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, color: TEXT_MUTED }}>
            💉 {isAr ? 'إجراءات مقترحة:' : 'Suggested procedures:'}
          </span>
          {procedures.map(p => (
            <button key={p.id} type="button" onClick={() => insertOneProcedure(p)}
              style={{ padding: '4px 10px', borderRadius: 100, border: `1px solid ${BORDER}`, background: PRIMARY_SOFT, color: PRIMARY, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              + 💉 {isAr ? p.name : (p.nameEn || p.name)}{p.needsNursing ? ' 🩺' : ''}
            </button>
          ))}
          {procedures.length > 1 && (
            <button type="button" onClick={insertAllProcedures}
              style={{ padding: '4px 10px', borderRadius: 100, border: 'none', background: PRIMARY, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              {isAr ? 'إدراج الكل' : 'Insert all'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
