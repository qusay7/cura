import { useEffect, useState } from 'react'
import api from '../api/axios'
import SearchableSelect from './SearchableSelect'
import { getCurrencySymbol } from '../utils/i18n'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'
import { printSection, escapeHtml } from '../utils/printSection'

interface ProceduresPickerProps {
  parentType: 'appointment' | 'queue'
  parentId: string
  lang: 'ar' | 'en'
  onTotalChange?: (total: number) => void
  onItemsChange?: (items: AddedItem[]) => void
  /** ✅ تُستخدم لما الصفحة الأم (مثلاً شاشة الدفع) تريد تعرض الإجراءات المضافة
   * كبنود داخل جدول الفاتورة نفسه بدل صندوق منفصل — فتاخذ القائمة عبر
   * onItemsChange وتعرضها هي، وهذا المكوّن يبقى بس لإضافة إجراء جديد */
  hideItemsList?: boolean
  /** ✅ لو الصفحة الأم حذفت إجراء بنفسها (بدل زر الحذف هون)، تزيد هذا الرقم
   * عشان يعيد الجلب ويبقى متزامن مع حالة هذا المكوّن الداخلية */
  refreshTrigger?: number
  // ✅ طبيب الزيارة/الحالة الحالية — يُطبع بتذييل الصفحة عند الطباعة (غير
  // مرتبط بـ AddedItem.doctorName اللي يحدد مين أضاف كل إجراء بالذات)
  doctorName?: string | null
}

interface CatalogItem { id: string; name: string; nameEn: string | null; defaultPrice: number | null }
interface AddedItem {
  id: string; procedureId: string | null; name: string; price: number | null; createdAt: string; doctorName?: string | null
  needsNursing?: boolean; nursingDone?: boolean
}

const T = {
  ar: {
    title: '💉 الإجراءات', add: 'إضافة', pickPlaceholder: 'اختر إجراء...',
    price: 'السعر', total: 'الإجمالي', remove: 'حذف', noItems: 'لا توجد إجراءات مضافة لهذي الزيارة',
    needsNursing: '🩺 يحتاج تنفيذ تمريض', pendingNursing: '🩺 بانتظار التمريض', nursingDone: '🩺 نفّذته التمريض ✅',
  },
  en: {
    title: '💉 Procedures', add: 'Add', pickPlaceholder: 'Pick a procedure...',
    price: 'Price', total: 'Total', remove: 'Remove', noItems: 'No procedures added to this visit',
    needsNursing: '🩺 Needs nursing to perform', pendingNursing: '🩺 Awaiting nursing', nursingDone: '🩺 Done by nursing ✅',
  },
}

// ✅ يُستخدم بزيارة موعد عادي أو حالة طوارئ (parentType يحدد مسار الـ API) —
// سعر كل إجراء يبدأ بالسعر الافتراضي من الكتالوج، والطبيب يعدّله أو يصفّره
// بحرية قبل الإضافة؛ الإزالة بعد الإضافة متاحة دايماً
export default function ProceduresPicker({ parentType, parentId, lang, onTotalChange, onItemsChange, hideItemsList, refreshTrigger, doctorName }: ProceduresPickerProps) {
  const t = T[lang]
  const isAr = lang === 'ar'
  const basePath = parentType === 'appointment' ? `/appointments/${parentId}` : `/queue/${parentId}`

  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [items, setItems] = useState<AddedItem[]>([])
  const [selectedProcedureId, setSelectedProcedureId] = useState('')
  const [price, setPrice] = useState('')
  const [needsNursing, setNeedsNursing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const fetchItems = () => {
    api.get(`${basePath}/procedures`).then(res => setItems(res.data)).catch(() => {})
  }

  useEffect(() => {
    api.get('/procedures').then(res => setCatalog(res.data)).catch(() => {})
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId, parentType, refreshTrigger])

  const handlePick = (id: string) => {
    setSelectedProcedureId(id)
    const catalogItem = catalog.find(c => c.id === id)
    setPrice(catalogItem?.defaultPrice != null ? catalogItem.defaultPrice.toString() : '')
  }

  const handleAdd = async () => {
    if (!selectedProcedureId) return
    setAdding(true); setError('')
    try {
      await api.post(`${basePath}/procedures`, {
        procedureId: selectedProcedureId,
        price: price ? parseFloat(price) : null,
        needsNursing,
      })
      setSelectedProcedureId('')
      setPrice('')
      setNeedsNursing(false)
      fetchItems()
    } catch {
      setError(isAr ? 'فشلت إضافة الإجراء' : 'Failed to add the procedure')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await api.delete(`${basePath}/procedures/${id}`)
      fetchItems()
    } catch {
      setError(isAr ? 'فشل حذف الإجراء' : 'Failed to remove the procedure')
    }
  }

  const total = items.reduce((sum, i) => sum + (i.price || 0), 0)

  useEffect(() => {
    onTotalChange?.(total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total])

  useEffect(() => {
    onItemsChange?.(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const formatTime = (iso: string) =>
    new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).toLocaleString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })

  // ✅ طباعة قائمة الإجراءات المضافة لهذي الزيارة بمعزل عن باقي الصفحة —
  // نفس آلية طباعة التشخيص/الوصفة بـ VisitWorkspace
  const handlePrint = () => {
    if (items.length === 0) return
    let clinicId = ''
    try { clinicId = JSON.parse(localStorage.getItem('user') || '{}').clinicId || '' } catch { /* ignore */ }
    if (!clinicId) return
    const bodyHtml = `<ul style="padding-inline-start:18px;margin:0;">${items.map(i =>
      `<li style="margin-bottom:6px;">${escapeHtml(i.name)}${i.price != null ? ` — ${i.price} ${getCurrencySymbol(lang)}` : ''}</li>`
    ).join('')}</ul><p style="margin-top:14px;font-weight:700;">${t.total}: ${total} ${getCurrencySymbol(lang)}</p>`
    printSection({ clinicId, title: t.title, isAr, bodyHtml, doctorName })
  }

  return (
    <div style={{ background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <label style={{ fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED }}>{t.title}</label>
        {!hideItemsList && items.length > 0 && (
          <button type="button" onClick={handlePrint} title={t.title}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13 }}>🖨️</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 10, marginBottom: 10 }}>
        <SearchableSelect isRtl={isAr} value={selectedProcedureId} onChange={handlePick}
          placeholder={t.pickPlaceholder}
          options={catalog.map(c => ({ value: c.id, label: isAr ? c.name : (c.nameEn || c.name) }))} />
        <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder={t.price}
          style={{ padding: '9px 10px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: "'Inter',sans-serif", color: TEXT_DARK, background: CARD_BG }} />
        <button type="button" onClick={handleAdd} disabled={!selectedProcedureId || adding}
          style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 9, padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: selectedProcedureId ? 'pointer' : 'not-allowed', opacity: selectedProcedureId ? 1 : 0.5 }}>
          + {t.add}
        </button>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: TEXT_MUTED, marginBottom: 12, cursor: 'pointer', width: 'fit-content' }}>
        <input type="checkbox" checked={needsNursing} onChange={e => setNeedsNursing(e.target.checked)} />
        {t.needsNursing}
      </label>

      {error && <p style={{ fontSize: 11, color: '#EF4444', margin: '0 0 10px' }}>⚠️ {error}</p>}

      {!hideItemsList && (items.length === 0 ? (
        <p style={{ fontSize: 11.5, color: TEXT_MUTED, fontStyle: 'italic', margin: 0 }}>{t.noItems}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 12px' }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: 12.5, color: TEXT_DARK }}>{item.name}</span>
                <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>
                  🕒 {formatTime(item.createdAt)}{item.doctorName ? ` · 👨‍⚕️ ${item.doctorName}` : ''}
                </div>
                {item.needsNursing && (
                  <div style={{ fontSize: 10.5, marginTop: 3, fontWeight: 600, color: item.nursingDone ? '#22C55E' : '#B8892A' }}>
                    {item.nursingDone ? t.nursingDone : t.pendingNursing}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, fontFamily: "'Inter',sans-serif" }}>
                  {item.price != null ? `${item.price} ${getCurrencySymbol(lang)}` : '—'}
                </span>
                <button type="button" onClick={() => handleRemove(item.id)}
                  style={{ background: '#FFF5F5', color: '#EF4444', border: 'none', borderRadius: 7, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, fontSize: 12.5, fontWeight: 700, color: TEXT_DARK }}>
            <span>{t.total}</span>
            <span style={{ fontFamily: "'Inter',sans-serif" }}>{total} {getCurrencySymbol(lang)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
