import { useState } from 'react'
import api from '../api/axios'

const CARD_BG = '#FFFFFF'
const BORDER = '#DCE5E5'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'

const LABELS = {
  ar: { print: 'طباعة', exportPdf: 'PDF', exportExcel: 'Excel', failed: 'تعذّر التصدير' },
  en: { print: 'Print', exportPdf: 'PDF', exportExcel: 'Excel', failed: 'Export failed' },
}

/**
 * ✅ شريط تصدير موحّد (طباعة + PDF + Excel) — يشتغل بأي صفحة عندها endpoint تصدير
 * بالباك إند يقبل ?format=pdf|excel (نفس نمط SettlementsController.cs).
 *
 * الاستخدام: <ExportBar endpoint="/users/export" lang={lang} fileName="users" />
 */
export default function ExportBar({
  endpoint, lang, fileName = 'report', showPrint = true,
}: {
  endpoint: string
  lang: 'ar' | 'en'
  fileName?: string
  showPrint?: boolean
}) {
  const t = LABELS[lang]
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null)

  const download = async (format: 'pdf' | 'excel') => {
    setDownloading(format)
    try {
      const sep = endpoint.includes('?') ? '&' : '?'
      const res = await api.get(`${endpoint}${sep}format=${format}&lang=${lang}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileName}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch {
      alert(t.failed)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="no-print" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
      {showPrint && (
        <button onClick={() => window.print()}
          style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_MUTED, cursor: 'pointer' }}>
          🖨️ {t.print}
        </button>
      )}
      <button onClick={() => download('pdf')} disabled={downloading !== null}
        style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_DARK, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading === 'excel' ? 0.5 : 1 }}>
        {downloading === 'pdf' ? '⏳' : '📄'} {t.exportPdf}
      </button>
      <button onClick={() => download('excel')} disabled={downloading !== null}
        style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_DARK, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading === 'pdf' ? 0.5 : 1 }}>
        {downloading === 'excel' ? '⏳' : '📊'} {t.exportExcel}
      </button>
    </div>
  )
}