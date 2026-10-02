import { useRef, useState } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { printSection, escapeHtml } from '../utils/printSection'
import { PRIMARY, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'

interface SickLeaveCertificateProps {
  patientName: string
  doctorName?: string | null
  defaultReason?: string
  lang: 'ar' | 'en'
  onClose: () => void
}

const T = {
  ar: {
    title: '🩺 نموذج إجازة مرضية', patientName: 'اسم المريض', startDate: 'من تاريخ', endDate: 'إلى تاريخ',
    days: 'يوم', reason: 'السبب / التشخيص', print: '🖨️ طباعة', cancel: 'إغلاق',
    certTitle: 'إجازة مرضية', certBody: 'نشهد بأن المريض/ة المذكور/ة أعلاه تم فحصه وتبيّن أنه بحاجة لإجازة مرضية للفترة المذكورة أدناه.',
    datesLine: 'من', toLine: 'إلى', daysLine: 'عدد الأيام', signature: 'توقيع الطبيب',
    invalidDates: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
  },
  en: {
    title: '🩺 Sick Leave Certificate', patientName: 'Patient Name', startDate: 'From', endDate: 'To',
    days: 'day(s)', reason: 'Reason / Diagnosis', print: '🖨️ Print', cancel: 'Close',
    certTitle: 'Sick Leave Certificate', certBody: 'This is to certify that the above-named patient was examined and found to require sick leave for the period stated below.',
    datesLine: 'From', toLine: 'To', daysLine: 'Number of days', signature: "Doctor's Signature",
    invalidDates: 'End date must be after start date',
  },
}

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ✅ نموذج إجازة مرضية — طباعة فقط بهذي النسخة، بدون حفظ بقاعدة البيانات
// (قرار نطاق متعمّد لتبسيط الإصدار الأول؛ ممكن نضيف أرشفة لاحقاً لو احتاج الطبيب)
export default function SickLeaveCertificate({ patientName, doctorName, defaultReason, lang, onClose }: SickLeaveCertificateProps) {
  const t = T[lang]
  const isAr = lang === 'ar'
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

  const [startDate, setStartDate] = useState(todayStr())
  const [endDate, setEndDate] = useState(todayStr())
  const [reason, setReason] = useState(defaultReason || '')
  const [error, setError] = useState('')

  const dayCount = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1)

  const handlePrint = () => {
    if (new Date(endDate) < new Date(startDate)) { setError(t.invalidDates); return }
    setError('')

    let clinicId = ''
    try { clinicId = JSON.parse(localStorage.getItem('user') || '{}').clinicId || '' } catch { /* ignore */ }
    if (!clinicId) return

    const fmt = (d: string) => new Date(d).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'long' })

    const bodyHtml = `
      <p><strong>${escapeHtml(t.patientName)}:</strong> ${escapeHtml(patientName)}</p>
      <p>${escapeHtml(t.certBody)}</p>
      <p><strong>${escapeHtml(t.datesLine)}:</strong> ${escapeHtml(fmt(startDate))} &nbsp;&nbsp; <strong>${escapeHtml(t.toLine)}:</strong> ${escapeHtml(fmt(endDate))}</p>
      <p><strong>${escapeHtml(t.daysLine)}:</strong> ${dayCount} ${escapeHtml(t.days)}</p>
      ${reason.trim() ? `<p><strong>${escapeHtml(t.reason)}:</strong> ${escapeHtml(reason)}</p>` : ''}
      <br/><br/>
      <p>${escapeHtml(t.signature)}: ______________________</p>
    `

    printSection({ clinicId, title: t.certTitle, isAr, bodyHtml, doctorName })
  }

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,30,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={t.title} tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{ background: CARD_BG, borderRadius: 16, padding: 22, maxWidth: 440, width: '100%' }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, margin: '0 0 16px' }}>{t.title}</h4>

        {error && <p style={{ fontSize: 11.5, color: '#EF4444', margin: '0 0 10px' }}>⚠️ {error}</p>}

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, color: TEXT_MUTED, marginBottom: 4 }}>{t.patientName}</label>
          <div style={{ padding: '8px 10px', background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 13, color: TEXT_DARK }}>
            {patientName}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: TEXT_MUTED, marginBottom: 4 }}>{t.startDate}</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: "'Inter',sans-serif", color: TEXT_DARK }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: TEXT_MUTED, marginBottom: 4 }}>{t.endDate}</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: "'Inter',sans-serif", color: TEXT_DARK }} />
          </div>
        </div>

        <p style={{ fontSize: 11.5, color: PRIMARY, marginBottom: 12 }}>📅 {dayCount} {t.days}</p>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 11, color: TEXT_MUTED, marginBottom: 4 }}>{t.reason}</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
            style={{ width: '100%', padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: 'inherit', color: TEXT_DARK, resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={handlePrint}
            style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            {t.print}
          </button>
          <button type="button" onClick={onClose}
            style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '9px 16px', fontSize: 12.5, color: TEXT_MUTED, cursor: 'pointer' }}>
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  )
}
