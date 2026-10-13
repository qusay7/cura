import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../../styles/theme'
import { formatDateTime } from '../../utils/i18n'
import { showMessageBox } from '../../utils/messageBox'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

interface ErrorLogRow {
  id: string
  message: string
  requestPath: string | null
  requestMethod: string | null
  createdAt: string
  userName: string | null
  clinicName: string | null
}

const T = {
  ar: {
    title: 'سجل أخطاء الباك إند',
    subtitle: 'أي استثناء غير متوقع بالسيرفر يُسجَّل هنا تلقائياً',
    message: 'الخطأ',
    path: 'المسار',
    user: 'المستخدم',
    clinic: 'العيادة',
    when: 'الوقت',
    noValue: '—',
    loading: 'جاري التحميل...',
    empty: 'لا توجد أخطاء مسجّلة — نظيف 👍',
    details: 'تفاصيل',
    stackTrace: 'تفاصيل الخطأ الكاملة',
    close: 'إغلاق',
    prev: 'السابق',
    next: 'التالي',
    pageOf: (p: number, total: number) => `صفحة ${p} من ${total}`,
    error: 'تعذّر تحميل سجل الأخطاء',
  },
  en: {
    title: 'Backend Error Log',
    subtitle: 'Any unexpected server exception gets recorded here automatically',
    message: 'Error',
    path: 'Path',
    user: 'User',
    clinic: 'Clinic',
    when: 'When',
    noValue: '—',
    loading: 'Loading...',
    empty: 'No errors logged — all clean 👍',
    details: 'Details',
    stackTrace: 'Full error details',
    close: 'Close',
    prev: 'Previous',
    next: 'Next',
    pageOf: (p: number, total: number) => `Page ${p} of ${total}`,
    error: 'Could not load the error log',
  },
}

export default function ErrorLogs() {
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const isAr = lang === 'ar'
  const t = T[lang]

  useEffect(() => {
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  const [rows, setRows] = useState<ErrorLogRow[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [detail, setDetail] = useState<{ message: string; stackTrace: string | null } | null>(null)

  useEffect(() => {
    setLoading(true)
    api.get('/errorlogs', { params: { page, pageSize: 20 } })
      .then(res => {
        setRows(res.data.items)
        setPages(res.data.pages || 1)
      })
      .catch(() => showMessageBox(t.error, 'error'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const openDetails = (id: string) => {
    api.get(`/errorlogs/${id}`)
      .then(res => setDetail({ message: res.data.message, stackTrace: res.data.stackTrace }))
      .catch(() => showMessageBox(t.error, 'error'))
  }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT_DARK, margin: '0 0 4px' }}>{t.title}</h1>
      <p style={{ fontSize: 13, color: TEXT_MUTED, margin: '0 0 20px' }}>{t.subtitle}</p>

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
                  <th style={thStyle(isAr)}>{t.message}</th>
                  <th style={thStyle(isAr)}>{t.path}</th>
                  <th style={thStyle(isAr)}>{t.user}</th>
                  <th style={thStyle(isAr)}>{t.clinic}</th>
                  <th style={thStyle(isAr)}>{t.when}</th>
                  <th style={thStyle(isAr)}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ ...tdStyle, color: '#C0392B', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.message}</td>
                    <td style={{ ...tdStyle, fontFamily: "'Inter',monospace", fontSize: 11.5 }}>{r.requestMethod} {r.requestPath || t.noValue}</td>
                    <td style={tdStyle}>{r.userName || t.noValue}</td>
                    <td style={tdStyle}>{r.clinicName || t.noValue}</td>
                    <td style={{ ...tdStyle, color: TEXT_MUTED }}>{formatDateTime(r.createdAt, lang)}</td>
                    <td style={tdStyle}>
                      <button onClick={() => openDetails(r.id)}
                        style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD_BG, color: PRIMARY, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
                        {t.details}
                      </button>
                    </td>
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

      {detail && (
        <div onClick={() => setDetail(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,30,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}
            style={{ background: CARD_BG, borderRadius: 16, padding: 22, maxWidth: 720, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, margin: '0 0 4px' }}>{t.stackTrace}</h3>
            <p style={{ fontSize: 13, color: '#C0392B', fontWeight: 600, margin: '8px 0' }}>{detail.message}</p>
            <pre style={{
              fontSize: 11.5, fontFamily: "'Inter',monospace", color: TEXT_DARK, background: '#F8FAFA',
              border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              direction: 'ltr', textAlign: 'left',
            }}>
              {detail.stackTrace || t.noValue}
            </pre>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button onClick={() => setDetail(null)}
                style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: PRIMARY, color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
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
