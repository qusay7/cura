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

// ✅ تشخيص واحد من بين أكثر من تشخيص مكتوبين بنفس الحقل (مثلاً "التهاب حلق
// وحرارة") — كل واحد له اقتراحاته المستقلة
interface MatchedTemplate {
  id: string
  name: string
  medications: Medication[]
  tests: SuggestedTest[]
  procedures: SuggestedProcedure[]
}

interface DiagnosisAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onInsertPrescriptionText: (text: string) => void
  // ✅ اختياري — بدونه (مثلاً صفحات لسا ما ربطت طلبات التحاليل/الأشعة) قسم
  // الاقتراحات يختفي بس باقي الميزات (الأدوية) تشتغل عادي. ينشئ طلب تحليل/أشعة
  // حقيقي (مش نص) — السبب والفئة (lab/radiology) موجودين بالاقتراح نفسه
  onInsertTest?: (test: { testName: string; category: 'lab' | 'radiology' }) => void | Promise<void>
  // ✅ اختياري — نفس مبدأ onInsertTest، بس ينشئ إجراء حقيقي (VisitProcedureItem)
  // بسعره من الكتالوج، مع needsNursing المُعدّ مسبقاً بالقالب (قابل للتعديل لاحقاً
  // من صفحة الإجراءات نفسها، مش هون)
  onInsertProcedure?: (proc: { procedureId: string; price: number | null; needsNursing: boolean }) => void | Promise<void>
  isAr: boolean
}

// ✅ آخر "قطعة" بالنص الحالي (بعد آخر فاصلة/سطر جديد) — تُستخدم لاقتراح
// التشخيص اللحظي وقت الكتابة بدون ما يفسدها وجود تشخيص سابق بنفس الحقل
const lastSegment = (text: string) => {
  const parts = text.split(/[,،\n;]/)
  return parts[parts.length - 1].trim()
}

// ✅ اقتراح أثناء الكتابة — يقترح تشخيصات مطابقة من قائمة العيادة الخاصة
// (يبنيها الطبيب بنفسه من صفحة الإعدادات). الحقل يدعم كتابة أكثر من تشخيص
// بنفس الوقت (مفصولين بفاصلة مثلاً) — وتُعرض اقتراحات الأدوية/التحاليل/
// الإجراءات لكل تشخيص مطابق منهم كلهم معاً، كل واحد بقسمه الخاص. مافي شي
// يُفرض تلقائياً، كل شي قابل للتعديل
export default function DiagnosisAutocomplete({ value, onChange, onInsertPrescriptionText, onInsertTest, onInsertProcedure, isAr }: DiagnosisAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [matches, setMatches] = useState<MatchedTemplate[]>([])
  // ✅ تمنع إدراج نفس الاقتراح (تحت نفس التشخيص) أكثر من مرة لو ضغط عليه
  // الطبيب غلط بالخطأ مرتين — بعد أول إدراج يصير الزر معطّل ويتحول لعلامة ✓
  const [insertedKeys, setInsertedKeys] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const matchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const detailCacheRef = useRef<Map<string, MatchedTemplate>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)

  // ✅ اقتراح لحظي أثناء الكتابة — على آخر قطعة بالنص فقط، مش كامل الحقل
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const segment = lastSegment(value)
    if (segment.length < 2) {
      setSuggestions([])
      return
    }

    debounceRef.current = setTimeout(() => {
      api.get('/diagnosistemplates/search', { params: { q: segment } })
        .then(res => setSuggestions(res.data || []))
        .catch(() => setSuggestions([]))
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [value])

  // ✅ كشف كل التشخيصات المطابقة ضمن النص الكامل (بغض النظر عن كيف انكتبت —
  // اختيار من القائمة أو كتابة حرة) وجلب اقتراحات كل واحد منها
  useEffect(() => {
    if (matchDebounceRef.current) clearTimeout(matchDebounceRef.current)

    if (!value || value.trim().length < 2) {
      setMatches([])
      return
    }

    matchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/diagnosistemplates/matchall', { params: { text: value } })
        const found: { id: string; name: string }[] = res.data || []

        const detailed = await Promise.all(found.map(async f => {
          const cached = detailCacheRef.current.get(f.id)
          if (cached) return cached
          try {
            const d = await api.get(`/diagnosistemplates/${f.id}`)
            const built: MatchedTemplate = {
              id: f.id,
              name: f.name,
              medications: d.data?.medications || [],
              tests: d.data?.tests || [],
              procedures: d.data?.procedures || [],
            }
            detailCacheRef.current.set(f.id, built)
            return built
          } catch {
            return null
          }
        }))

        setMatches(detailed.filter((m): m is MatchedTemplate => m !== null))
      } catch {
        setMatches([])
      }
    }, 400)

    return () => { if (matchDebounceRef.current) clearTimeout(matchDebounceRef.current) }
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

  // ✅ يستبدل فقط آخر قطعة بالنص (يلي كان ينكتب) بالاسم المختار، ويحافظ على
  // أي تشخيص سابق قبلها بنفس الحقل
  const pickSuggestion = (s: Suggestion) => {
    const idx = Math.max(value.lastIndexOf(','), value.lastIndexOf('،'), value.lastIndexOf('\n'), value.lastIndexOf(';'))
    const prefix = idx >= 0 ? value.slice(0, idx + 1) + ' ' : ''
    onChange(prefix + s.name)
    setShowDropdown(false)
  }

  const markInserted = (key: string) => setInsertedKeys(prev => new Set(prev).add(key))

  const insertOne = (key: string, m: Medication) => {
    if (insertedKeys.has(key)) return
    const text = m.instructions ? `${m.drugName} — ${m.instructions}` : m.drugName
    onInsertPrescriptionText(text)
    markInserted(key)
  }

  const insertOneTest = async (key: string, x: SuggestedTest) => {
    if (insertedKeys.has(key)) return
    await onInsertTest?.({ testName: x.testName, category: x.category })
    markInserted(key)
  }

  // ✅ async ومتسلسل (await) — عدة طلبات POST متوازية لنفس الموعد تتسابق على
  // تحديث appointment.Price (له RowVersion للتحكم بالتزامن)، فتفشل بـ
  // DbUpdateConcurrencyException. "إدراج الكل" يستدعي هذي بالتسلسل (for...of)
  // بدل forEach عشان كل طلب ينتهي قبل ما يبدأ التالي
  const insertOneProcedure = async (key: string, p: SuggestedProcedure) => {
    if (insertedKeys.has(key)) return
    await onInsertProcedure?.({ procedureId: p.procedureId, price: p.defaultPrice, needsNursing: p.needsNursing })
    markInserted(key)
  }

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

      {matches.map(m => (
        <div key={m.id} style={{ marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${BORDER}` }}>
          {matches.length > 1 && (
            <p style={{ fontSize: 10.5, fontWeight: 700, color: TEXT_DARK, margin: '0 0 6px' }}>🔹 {m.name}</p>
          )}

          {m.medications.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, color: TEXT_MUTED }}>
                💊 {isAr ? 'أدوية مقترحة:' : 'Suggested medications:'}
              </span>
              {m.medications.map(med => {
                const key = `${m.id}:med:${med.id}`
                const done = insertedKeys.has(key)
                return (
                  <button key={med.id} type="button" disabled={done} onClick={() => insertOne(key, med)}
                    style={{ padding: '4px 10px', borderRadius: 100, border: `1px solid ${BORDER}`, background: done ? CARD_BG : PRIMARY_SOFT, color: done ? TEXT_MUTED : PRIMARY, fontSize: 11, fontWeight: 600, cursor: done ? 'default' : 'pointer', opacity: done ? 0.6 : 1 }}>
                    {done ? '✓' : '+'} {med.drugName}
                  </button>
                )
              })}
              {m.medications.length > 1 && (
                <button type="button" onClick={() => m.medications.forEach(med => insertOne(`${m.id}:med:${med.id}`, med))}
                  style={{ padding: '4px 10px', borderRadius: 100, border: 'none', background: PRIMARY, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {isAr ? 'إدراج الكل' : 'Insert all'}
                </button>
              )}
            </div>
          )}

          {onInsertTest && m.tests.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, color: TEXT_MUTED }}>
                🧪 {isAr ? 'تحاليل وأشعة مقترحة:' : 'Suggested tests & radiology:'}
              </span>
              {m.tests.map(x => {
                const key = `${m.id}:test:${x.id}`
                const done = insertedKeys.has(key)
                return (
                  <button key={x.id} type="button" disabled={done} onClick={() => insertOneTest(key, x)}
                    style={{ padding: '4px 10px', borderRadius: 100, border: `1px solid ${BORDER}`, background: done ? CARD_BG : PRIMARY_SOFT, color: done ? TEXT_MUTED : PRIMARY, fontSize: 11, fontWeight: 600, cursor: done ? 'default' : 'pointer', opacity: done ? 0.6 : 1 }}>
                    {done ? '✓' : '+'} {x.category === 'radiology' ? '☢️' : '🧪'} {x.testName}
                  </button>
                )
              })}
              {m.tests.length > 1 && (
                <button type="button" onClick={async () => { for (const x of m.tests) await insertOneTest(`${m.id}:test:${x.id}`, x) }}
                  style={{ padding: '4px 10px', borderRadius: 100, border: 'none', background: PRIMARY, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {isAr ? 'إدراج الكل' : 'Insert all'}
                </button>
              )}
            </div>
          )}

          {onInsertProcedure && m.procedures.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, color: TEXT_MUTED }}>
                💉 {isAr ? 'إجراءات مقترحة:' : 'Suggested procedures:'}
              </span>
              {m.procedures.map(p => {
                const key = `${m.id}:proc:${p.id}`
                const done = insertedKeys.has(key)
                return (
                  <button key={p.id} type="button" disabled={done} onClick={() => insertOneProcedure(key, p)}
                    style={{ padding: '4px 10px', borderRadius: 100, border: `1px solid ${BORDER}`, background: done ? CARD_BG : PRIMARY_SOFT, color: done ? TEXT_MUTED : PRIMARY, fontSize: 11, fontWeight: 600, cursor: done ? 'default' : 'pointer', opacity: done ? 0.6 : 1 }}>
                    {done ? '✓' : '+'} 💉 {isAr ? p.name : (p.nameEn || p.name)}{p.needsNursing ? ' 🩺' : ''}
                  </button>
                )
              })}
              {m.procedures.length > 1 && (
                <button type="button" onClick={async () => { for (const p of m.procedures) await insertOneProcedure(`${m.id}:proc:${p.id}`, p) }}
                  style={{ padding: '4px 10px', borderRadius: 100, border: 'none', background: PRIMARY, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {isAr ? 'إدراج الكل' : 'Insert all'}
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
