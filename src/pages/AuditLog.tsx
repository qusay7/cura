import { useEffect, useState } from 'react'
import api from '../api/axios'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'
import { formatDateTime } from '../utils/i18n'
import { showMessageBox } from '../utils/messageBox'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

interface EntityType {
  key: string
  labelAr: string
  labelEn: string
}

interface AuditRow {
  id: string
  name: string
  createdAt: string | null
  createdByName: string | null
  updatedAt: string | null
  updatedByName: string | null
}

const T = {
  ar: {
    title: 'سجل التدقيق',
    subtitle: 'مين أنشأ أو عدّل كل سجل، ومتى',
    name: 'العنصر',
    createdBy: 'أنشأه',
    createdAt: 'تاريخ الإنشاء',
    updatedBy: 'آخر تعديل بواسطة',
    updatedAt: 'تاريخ آخر تعديل',
    noUpdate: '—',
    loading: 'جاري التحميل...',
    empty: 'لا توجد سجلات',
    prev: 'السابق',
    next: 'التالي',
    pageOf: (p: number, total: number) => `صفحة ${p} من ${total}`,
    error: 'تعذّر تحميل سجل التدقيق',
  },
  en: {
    title: 'Audit Log',
    subtitle: 'Who created or last changed each record, and when',
    name: 'Record',
    createdBy: 'Created by',
    createdAt: 'Created at',
    updatedBy: 'Last updated by',
    updatedAt: 'Updated at',
    noUpdate: '—',
    loading: 'Loading...',
    empty: 'No records',
    prev: 'Previous',
    next: 'Next',
    pageOf: (p: number, total: number) => `Page ${p} of ${total}`,
    error: 'Could not load the audit log',
  },
}

export default function AuditLog() {
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const isAr = lang === 'ar'
  const t = T[lang]

  useEffect(() => {
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  const [entityTypes, setEntityTypes] = useState<EntityType[]>([])
  const [entityType, setEntityType] = useState('')
  const [rows, setRows] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  useEffect(() => {
    api.get('/audit/entities')
      .then(res => {
        setEntityTypes(res.data)
        if (res.data.length > 0) setEntityType(res.data[0].key)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!entityType) return
    setLoading(true)
    api.get('/audit', { params: { entityType, page, pageSize: 20 } })
      .then(res => {
        setRows(res.data.items)
        setPages(res.data.pages || 1)
      })
      .catch(() => showMessageBox(t.error, 'error'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, page])

  const entityLabel = (e: EntityType) => isAr ? e.labelAr : e.labelEn

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT_DARK, margin: '0 0 4px' }}>{t.title}</h1>
      <p style={{ fontSize: 13, color: TEXT_MUTED, margin: '0 0 20px' }}>{t.subtitle}</p>

      {/* تبويبات نوع السجل */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {entityTypes.map(e => (
          <button key={e.key}
            onClick={() => { setEntityType(e.key); setPage(1) }}
            style={{
              padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${entityType === e.key ? PRIMARY : BORDER}`,
              background: entityType === e.key ? PRIMARY : CARD_BG,
              color: entityType === e.key ? '#FFFFFF' : TEXT_DARK,
              transition: 'all 0.15s ease',
            }}>
            {entityLabel(e)}
          </button>
        ))}
      </div>

      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED, fontSize: 13 }}>{t.loading}</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED, fontSize: 13 }}>{t.empty}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: PRIMARY_SOFT }}>
                  <th style={thStyle(isAr)}>{t.name}</th>
                  <th style={thStyle(isAr)}>{t.createdBy}</th>
                  <th style={thStyle(isAr)}>{t.createdAt}</th>
                  <th style={thStyle(isAr)}>{t.updatedBy}</th>
                  <th style={thStyle(isAr)}>{t.updatedAt}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={tdStyle}>{r.name}</td>
                    <td style={tdStyle}>{r.createdByName || t.noUpdate}</td>
                    <td style={{ ...tdStyle, color: TEXT_MUTED }}>{r.createdAt ? formatDateTime(r.createdAt, lang) : t.noUpdate}</td>
                    <td style={tdStyle}>{r.updatedByName || t.noUpdate}</td>
                    <td style={{ ...tdStyle, color: TEXT_MUTED }}>{r.updatedAt ? formatDateTime(r.updatedAt, lang) : t.noUpdate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '14px', borderTop: `1px solid ${BORDER}` }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              style={pagerBtnStyle(page <= 1)}>{t.prev}</button>
            <span style={{ fontSize: 12.5, color: TEXT_MUTED }}>{t.pageOf(page, pages)}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
              style={pagerBtnStyle(page >= pages)}>{t.next}</button>
          </div>
        )}
      </div>
    </div>
  )
}

const thStyle = (isAr: boolean): React.CSSProperties => ({
  textAlign: isAr ? 'right' : 'left', padding: '10px 14px', fontSize: 11.5, fontWeight: 700,
  color: TEXT_DARK, textTransform: 'uppercase', letterSpacing: '0.4px',
})

const tdStyle: React.CSSProperties = { padding: '10px 14px', color: TEXT_DARK }

const pagerBtnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
  border: `1px solid ${BORDER}`, background: CARD_BG,
  color: disabled ? TEXT_MUTED : TEXT_DARK,
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
})
