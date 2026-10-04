import { useEffect, useState } from 'react'
import api from '../api/axios'
import SearchableSelect from './SearchableSelect'
import { getCurrencySymbol } from '../utils/i18n'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'

interface ProceduresPickerProps {
  parentType: 'appointment' | 'queue'
  parentId: string
  lang: 'ar' | 'en'
  onTotalChange?: (total: number) => void
}

interface CatalogItem { id: string; name: string; nameEn: string | null; defaultPrice: number | null }
interface AddedItem { id: string; procedureId: string | null; name: string; price: number | null; createdAt: string }

const T = {
  ar: {
    title: '💉 الإجراءات', add: 'إضافة', pickPlaceholder: 'اختر إجراء...',
    price: 'السعر', total: 'الإجمالي', remove: 'حذف', noItems: 'لا توجد إجراءات مضافة لهذي الزيارة',
  },
  en: {
    title: '💉 Procedures', add: 'Add', pickPlaceholder: 'Pick a procedure...',
    price: 'Price', total: 'Total', remove: 'Remove', noItems: 'No procedures added to this visit',
  },
}

// ✅ يُستخدم بزيارة موعد عادي أو حالة طوارئ (parentType يحدد مسار الـ API) —
// سعر كل إجراء يبدأ بالسعر الافتراضي من الكتالوج، والطبيب يعدّله أو يصفّره
// بحرية قبل الإضافة؛ الإزالة بعد الإضافة متاحة دايماً
export default function ProceduresPicker({ parentType, parentId, lang, onTotalChange }: ProceduresPickerProps) {
  const t = T[lang]
  const isAr = lang === 'ar'
  const basePath = parentType === 'appointment' ? `/appointments/${parentId}` : `/queue/${parentId}`

  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [items, setItems] = useState<AddedItem[]>([])
  const [selectedProcedureId, setSelectedProcedureId] = useState('')
  const [price, setPrice] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const fetchItems = () => {
    api.get(`${basePath}/procedures`).then(res => setItems(res.data)).catch(() => {})
  }

  useEffect(() => {
    api.get('/procedures').then(res => setCatalog(res.data)).catch(() => {})
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId, parentType])

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
      })
      setSelectedProcedureId('')
      setPrice('')
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

  return (
    <div style={{ background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 10 }}>{t.title}</label>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 10, marginBottom: 12 }}>
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

      {error && <p style={{ fontSize: 11, color: '#EF4444', margin: '0 0 10px' }}>⚠️ {error}</p>}

      {items.length === 0 ? (
        <p style={{ fontSize: 11.5, color: TEXT_MUTED, fontStyle: 'italic', margin: 0 }}>{t.noItems}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 12px' }}>
              <span style={{ fontSize: 12.5, color: TEXT_DARK }}>{item.name}</span>
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
      )}
    </div>
  )
}
