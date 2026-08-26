import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import PrintHeader from '../components/PrintHeader'
import ExportBar from '../components/ExportBar'
import { useColumnVisibility, ColumnToggleButton, type ColumnDef } from '../components/ColumnToggle'

const getStoredLang = (): 'ar' | 'en' => (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const PRIMARY      = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK    = '#2C3E3F'
const TEXT_MUTED   = '#6B8A8C'
const BORDER       = '#DCE5E5'
const CARD_BG      = '#FFFFFF'
const SUCCESS      = '#16A34A'
const WARNING      = '#B8892A'
const DANGER       = '#EF4444'

const T = {
  ar: {
    title: 'الفواتير', subtitle: 'إصدار وترحيل الفواتير والمرتجعات',
    riyal: 'د.أ', loading: 'جاري التحميل...', noData: 'لا توجد فواتير',
    invoiceNo: 'رقم الفاتورة', docType: 'النوع', patient: 'المريض', date: 'التاريخ',
    total: 'الإجمالي', discount: 'الخصم', tax: 'الضريبة', payable: 'المستحق',
    submitState: 'حالة الترحيل', submitted: 'مُرحّلة', notSubmitted: 'غير مُرحّلة',
    xml: 'XML المُرسل', taxResponse: 'رد الضريبة', qr: 'QR',
    sale: 'فاتورة بيع', creditNote: 'مرتجع',
    all: 'الكل', filter: 'فلتر', from: 'من', to: 'إلى', apply: 'تطبيق', reset: 'إعادة تعيين',
    view: 'عرض', print: 'طباعة', submit: 'ترحيل', submitting: 'جارٍ الترحيل...',
    newInvoice: '+ إنشاء فاتورة', newReturn: '↩️ مرتجع', actions: 'إجراءات',
    pickPayment: 'اختر الدفعة', noUninvoiced: 'كل الدفعات مُفوترة',
    create: 'إنشاء', cancel: 'إلغاء', saving: 'جارٍ الحفظ...',
    item: 'البند', qty: 'الكمية', price: 'السعر', itemDiscount: 'الخصم',
    reason: 'سبب المرتجع', returnQty: 'الكمية المرتجعة', sourceInvoice: 'فاتورة البيع',
    taxMethod: 'نمط الضريبة',
    tm1: 'خاضع', tm2: 'غير خاضع', tm3: 'معفي', tm4: 'تصدير', tm5: 'خاضع بنسبة صفر',
    thanks: 'شكراً لزيارتكم', notes: 'ملاحظات', copy: 'نسخ', copied: 'تم النسخ',
    empty: '—', submitFailed: 'فشل الترحيل',
  },
  en: {
    title: 'Invoices', subtitle: 'Issue and submit invoices and credit notes',
    riyal: 'JD', loading: 'Loading...', noData: 'No invoices found',
    invoiceNo: 'Invoice #', docType: 'Type', patient: 'Patient', date: 'Date',
    total: 'Total', discount: 'Discount', tax: 'Tax', payable: 'Payable',
    submitState: 'Submission', submitted: 'Submitted', notSubmitted: 'Not submitted',
    xml: 'Sent XML', taxResponse: 'Tax Response', qr: 'QR',
    sale: 'Sales Invoice', creditNote: 'Credit Note',
    all: 'All', filter: 'Filter', from: 'From', to: 'To', apply: 'Apply', reset: 'Reset',
    view: 'View', print: 'Print', submit: 'Submit', submitting: 'Submitting...',
    newInvoice: '+ New Invoice', newReturn: '↩️ Credit Note', actions: 'Actions',
    pickPayment: 'Select a payment', noUninvoiced: 'All payments are invoiced',
    create: 'Create', cancel: 'Cancel', saving: 'Saving...',
    item: 'Item', qty: 'Qty', price: 'Price', itemDiscount: 'Discount',
    reason: 'Return reason', returnQty: 'Return Qty', sourceInvoice: 'Source Invoice',
    taxMethod: 'Tax Method',
    tm1: 'Taxable', tm2: 'Not taxable', tm3: 'Exempt', tm4: 'Export', tm5: 'Zero-rated',
    thanks: 'Thank you for your visit', notes: 'Notes', copy: 'Copy', copied: 'Copied',
    empty: '—', submitFailed: 'Submission failed',
  },
}

const fmt = (n: number) => (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const globalCss = `
@media print {
  @page { size: A4 landscape; margin: 10mm; }
  .no-print { display: none !important; }
  .inv-overlay { position: static !important; background: none !important; padding: 0 !important; }
  .inv-sheet { box-shadow: none !important; max-height: none !important; overflow: visible !important; border-radius: 0 !important; }

  /* ✅ الجدول كان ينقص بالطباعة لأنه داخل حاوية تمرير أفقي — نلغيها ونلفّ النص */
  .print-scroll { overflow: visible !important; }
  .print-table { min-width: 0 !important; width: 100% !important; font-size: 10px !important; table-layout: fixed; }
  .print-table td, .print-table th { white-space: normal !important; word-break: break-word; padding: 5px 6px !important; }
  .print-card { border: none !important; border-radius: 0 !important; box-shadow: none !important; }

  /* ✅ عند فتح فاتورة، نطبع النافذة وحدها لا جدول الفواتير خلفها */
  body.printing-invoice .page-body { display: none !important; }
  body.printing-invoice .inv-sheet { max-width: 100% !important; padding: 0 !important; }
}
`

const btn = (bg: string, color: string, border = 'transparent'): React.CSSProperties => ({
  background: bg, color, border: `1px solid ${border}`, borderRadius: 9,
  padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
})

// ─── عارض نص طويل (XML / رد الضريبة / QR) ───────────────────────────────────
function TextViewer({ title, value, lang, onClose }: { title: string; value: string; lang: 'ar' | 'en'; onClose: () => void }) {
  const t = T[lang]
  const [copied, setCopied] = useState(false)

  return (
    <div className="no-print" onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,30,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: CARD_BG, borderRadius: 16, padding: 20, maxWidth: 760, width: '100%', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>{title}</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
              style={btn(PRIMARY_SOFT, PRIMARY, BORDER)}>
              {copied ? `✅ ${t.copied}` : `📋 ${t.copy}`}
            </button>
            <button onClick={onClose} style={btn('#F1F4F4', TEXT_MUTED)}>✕</button>
          </div>
        </div>
        {value.startsWith('data:image') ? (
          <img src={value} alt="QR" style={{ maxWidth: 260, display: 'block', margin: '0 auto' }} />
        ) : (
          <pre style={{ background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, fontSize: 11, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all', direction: 'ltr', textAlign: 'left', margin: 0 }}>
            {value}
          </pre>
        )}
      </div>
    </div>
  )
}

// ─── نافذة الفاتورة (عرض وطباعة) ────────────────────────────────────────────
function InvoiceModal({ invoiceId, lang, onClose }: { invoiceId: string; lang: 'ar' | 'en'; onClose: () => void }) {
  const t = T[lang]
  const [loading, setLoading] = useState(true)
  const [inv, setInv] = useState<any>(null)
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} } })()

  useEffect(() => {
    api.get(`/invoices/${invoiceId}`)
      .then(r => setInv(r.data))
      .catch(() => setInv(null))
      .finally(() => setLoading(false))
  }, [invoiceId])

  // ✅ نعلّم الـ body وقت فتح النافذة عشان قواعد الطباعة تخفي الصفحة خلفها
  useEffect(() => {
    document.body.classList.add('printing-invoice')
    return () => { document.body.classList.remove('printing-invoice') }
  }, [])

  const isReturn = inv?.documentType === '381'
  // ✅ الطباعة تفتح الـ PDF المُولَّد من الخادم وتطبعه — بدل لقطة شاشة للنافذة
  const download = async (format: 'pdf' | 'excel', print = false) => {
    try {
      const r = await api.get(`/invoices/${invoiceId}/export?format=${format}&lang=${lang}`, { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      if (print) {
        const w = window.open(url)
        w?.addEventListener('load', () => w.print())
        return
      }
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice.${format === 'excel' ? 'xlsx' : 'pdf'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* تعذّر التوليد */ }
  }
  return (
    <div className="inv-overlay" onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,30,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div className="inv-sheet" onClick={e => e.stopPropagation()}
        style={{ background: CARD_BG, borderRadius: 18, padding: 28, maxWidth: 660, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

        <PrintHeader reportTitle={`${isReturn ? t.creditNote : t.sale} — ${inv?.patientName || ''}`} lang={lang} />

        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>
              {isReturn ? '↩️' : '🧾'} {isReturn ? t.creditNote : t.sale}
            </h3>
            <p style={{ fontSize: 12, color: TEXT_MUTED, margin: '4px 0 0' }}>{user.clinicName || ''}</p>
          </div>
                   <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => download('pdf', true)} style={btn(CARD_BG, TEXT_MUTED, BORDER)}>🖨️ {t.print}</button>
            <button onClick={() => download('pdf')} style={btn(PRIMARY, '#FFF')}>📄 PDF</button>
            <button onClick={() => download('excel')} style={btn('#E8F5E9', SUCCESS, '#A7D8B4')}>📊 Excel</button>
            <button onClick={onClose} style={btn('#F1F4F4', TEXT_MUTED)}>✕</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: TEXT_MUTED, fontSize: 13 }}>{t.loading}</div>
        ) : !inv ? (
          <div style={{ textAlign: 'center', padding: 40, color: DANGER, fontSize: 13 }}>{t.noData}</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: PRIMARY_SOFT, borderRadius: 12, padding: 14, marginBottom: 18, fontSize: 12.5 }}>
              <div><span style={{ color: TEXT_MUTED }}>{t.invoiceNo}: </span><b style={{ fontFamily: "'Inter',monospace" }}>{inv.invoiceNumber}</b></div>
              <div><span style={{ color: TEXT_MUTED }}>{t.date}: </span><b>{inv.issueDate}</b></div>
              <div><span style={{ color: TEXT_MUTED }}>{t.patient}: </span><b>{inv.patientName || t.empty}</b></div>
              <div><span style={{ color: TEXT_MUTED }}>{t.taxMethod}: </span><b>{(t as any)[`tm${inv.taxMethod}`] || inv.taxMethod}</b></div>
              {isReturn && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: TEXT_MUTED }}>{t.sourceInvoice}: </span>
                  <b style={{ fontFamily: "'Inter',monospace" }}>{inv.sourceInvoiceNumber || t.empty}</b>
                </div>
              )}
              {inv.notes && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: TEXT_MUTED }}>{t.notes}: </span><b>{inv.notes}</b>
                </div>
              )}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, marginBottom: 16 }}>
              <thead>
                <tr style={{ background: '#F8FAFA' }}>
                  {[t.item, t.qty, t.price, t.itemDiscount, t.tax].map((h, i) => (
                    <th key={i} style={{ padding: '8px 10px', textAlign: i === 0 ? 'start' : 'end', fontSize: 11, fontWeight: 600, color: TEXT_MUTED, borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inv.items?.map((it: any) => (
                  <tr key={it.id}>
                    <td style={{ padding: '8px 10px', color: TEXT_DARK, borderBottom: `1px solid ${BORDER}` }}>{it.name}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'end', borderBottom: `1px solid ${BORDER}`, fontFamily: "'Inter',monospace" }}>{fmt(it.quantity)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'end', borderBottom: `1px solid ${BORDER}`, fontFamily: "'Inter',monospace" }}>{fmt(it.unitPrice)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'end', color: SUCCESS, borderBottom: `1px solid ${BORDER}`, fontFamily: "'Inter',monospace" }}>{fmt(it.discount)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'end', color: TEXT_MUTED, borderBottom: `1px solid ${BORDER}`, fontFamily: "'Inter',monospace" }}>{fmt(it.taxAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginInlineStart: 'auto', maxWidth: 280, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: TEXT_MUTED }}>{t.total}</span>
                <b style={{ fontFamily: "'Inter',monospace" }}>{fmt(inv.totalAmount)} {t.riyal}</b>
              </div>
              {inv.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: TEXT_MUTED }}>{t.discount}</span>
                  <b style={{ color: SUCCESS, fontFamily: "'Inter',monospace" }}>-{fmt(inv.discountAmount)} {t.riyal}</b>
                </div>
              )}
              {inv.taxAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: TEXT_MUTED }}>{t.tax} ({fmt(inv.taxRate)}%)</span>
                  <b style={{ fontFamily: "'Inter',monospace" }}>{fmt(inv.taxAmount)} {t.riyal}</b>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px dashed ${BORDER}`, paddingTop: 6 }}>
                <b style={{ color: TEXT_DARK }}>{t.payable}</b>
                <b style={{ color: PRIMARY, fontFamily: "'Inter',monospace" }}>{fmt(inv.payableAmount)} {t.riyal}</b>
              </div>
            </div>

            {inv.qrCode && (
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                {inv.qrCode.startsWith('data:image')
                  ? <img src={inv.qrCode} alt="QR" style={{ width: 130, height: 130 }} />
                  : <span style={{ fontSize: 9, color: TEXT_MUTED, wordBreak: 'break-all', direction: 'ltr', display: 'block' }}>{inv.qrCode}</span>}
              </div>
            )}

            <p style={{ textAlign: 'center', fontSize: 11, color: TEXT_MUTED, marginTop: 22 }}>{t.thanks}</p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── نافذة إنشاء فاتورة من دفعة ─────────────────────────────────────────────
function NewInvoiceModal({ lang, onClose, onCreated }: { lang: 'ar' | 'en'; onClose: () => void; onCreated: () => void }) {
  const t = T[lang]
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [payments, setPayments] = useState<any[]>([])
  const [selected, setSelected] = useState('')
  const [taxMethod, setTaxMethod] = useState('2')
  const [taxRate, setTaxRate] = useState('')

  useEffect(() => {
    api.get('/invoices/uninvoiced-payments')
      .then(r => setPayments(Array.isArray(r.data) ? r.data : []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false))
  }, [])

  const create = async () => {
    if (!selected) return
    setSaving(true); setError('')
    try {
      await api.post('/invoices/from-payment', {
        paymentDetailId: selected,
        taxMethod: parseInt(taxMethod),
        taxRate: taxMethod === '1' ? (parseFloat(taxRate) || 0) : 0,
      })
      onCreated()
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || t.noData)
    } finally { setSaving(false) }
  }

  return (
    <div className="no-print" onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,30,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: CARD_BG, borderRadius: 18, padding: 24, maxWidth: 560, width: '100%', maxHeight: '88vh', overflowY: 'auto' }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: TEXT_DARK, margin: '0 0 16px' }}>🧾 {t.pickPayment}</h3>

        {error && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12.5, color: DANGER }}>⚠️ {error}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: TEXT_MUTED, fontSize: 13 }}>{t.loading}</div>
        ) : payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: TEXT_MUTED, fontSize: 13 }}>{t.noUninvoiced}</div>
        ) : (
          <div style={{ maxHeight: 340, overflowY: 'auto', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
            {payments.map(p => (
              <label key={p.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', background: selected === p.id ? PRIMARY_SOFT : 'transparent' }}>
                <input type="radio" name="payment" checked={selected === p.id} onChange={() => setSelected(p.id)} style={{ accentColor: PRIMARY }} />
                <span style={{ flex: 1, fontSize: 13, color: TEXT_DARK }}>{p.patientName}</span>
                <span style={{ fontSize: 11, color: TEXT_MUTED }}>{p.createdAt}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: PRIMARY, fontFamily: "'Inter',monospace" }}>{fmt(p.totalAmount)} {t.riyal}</span>
              </label>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.taxMethod}</label>
            <select value={taxMethod} onChange={e => setTaxMethod(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: TEXT_DARK, outline: 'none', fontFamily: 'inherit' }}>
              <option value="1">{t.tm1}</option>
              <option value="2">{t.tm2}</option>
              <option value="3">{t.tm3}</option>
              <option value="4">{t.tm4}</option>
              <option value="5">{t.tm5}</option>
            </select>
          </div>
          {/* ✅ النسبة تُدخل فقط للنمط "خاضع" */}
          {taxMethod === '1' && (
            <div style={{ width: 110 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>%</label>
              <input type="number" min={0} max={100} value={taxRate} onChange={e => setTaxRate(e.target.value)}
                placeholder="16"
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, textAlign: 'center', fontFamily: "'Inter',sans-serif" }} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={create} disabled={!selected || saving} style={{ ...btn(PRIMARY, '#FFF'), flex: 1, padding: '11px', opacity: (!selected || saving) ? 0.6 : 1 }}>
            {saving ? t.saving : t.create}
          </button>
          <button onClick={onClose} style={{ ...btn('transparent', TEXT_MUTED, BORDER), padding: '11px 18px' }}>{t.cancel}</button>
        </div>
      </div>
    </div>
  )
}

// ─── نافذة المرتجع ──────────────────────────────────────────────────────────
function ReturnModal({ invoiceId, lang, onClose, onCreated }: { invoiceId: string; lang: 'ar' | 'en'; onClose: () => void; onCreated: () => void }) {
  const t = T[lang]
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [inv, setInv] = useState<any>(null)
  const [reason, setReason] = useState('')
  const [qty, setQty] = useState<Record<string, string>>({})

  useEffect(() => {
    api.get(`/invoices/${invoiceId}`)
      .then(r => {
        setInv(r.data)
        const init: Record<string, string> = {}
        r.data.items?.forEach((it: any) => { init[it.id] = String(it.quantity) })
        setQty(init)
      })
      .catch(() => setInv(null))
      .finally(() => setLoading(false))
  }, [invoiceId])

  const create = async () => {
    const items = Object.entries(qty)
      .map(([sourceItemId, q]) => ({ sourceItemId, quantity: parseFloat(q) || 0 }))
      .filter(x => x.quantity > 0)
    if (items.length === 0) return

    setSaving(true); setError('')
    try {
      await api.post('/invoices/return', { sourceInvoiceId: invoiceId, reason, items })
      onCreated()
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || t.noData)
    } finally { setSaving(false) }
  }

  return (
    <div className="no-print" onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,30,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: CARD_BG, borderRadius: 18, padding: 24, maxWidth: 600, width: '100%', maxHeight: '88vh', overflowY: 'auto' }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: TEXT_DARK, margin: '0 0 6px' }}>↩️ {t.creditNote}</h3>
        <p style={{ fontSize: 12, color: TEXT_MUTED, margin: '0 0 16px' }}>{t.sourceInvoice}: {inv?.invoiceNumber || ''}</p>

        {error && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12.5, color: DANGER }}>⚠️ {error}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: TEXT_MUTED, fontSize: 13 }}>{t.loading}</div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.reason}</label>
              <input value={reason} onChange={e => setReason(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK }} />
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#F8FAFA' }}>
                  {[t.item, t.price, t.returnQty].map((h, i) => (
                    <th key={i} style={{ padding: '8px 10px', textAlign: i === 0 ? 'start' : 'end', fontSize: 11, fontWeight: 600, color: TEXT_MUTED, borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inv?.items?.map((it: any) => (
                  <tr key={it.id}>
                    <td style={{ padding: '8px 10px', color: TEXT_DARK, borderBottom: `1px solid ${BORDER}` }}>{it.name}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'end', borderBottom: `1px solid ${BORDER}`, fontFamily: "'Inter',monospace" }}>{fmt(it.unitPrice)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'end', borderBottom: `1px solid ${BORDER}` }}>
                      <input type="number" min={0} max={it.quantity} value={qty[it.id] ?? ''}
                        onChange={e => setQty(prev => ({ ...prev, [it.id]: e.target.value }))}
                        style={{ width: 70, padding: '5px 8px', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, textAlign: 'center', fontFamily: "'Inter',sans-serif" }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={create} disabled={saving || loading} style={{ ...btn(PRIMARY, '#FFF'), flex: 1, padding: '11px', opacity: (saving || loading) ? 0.6 : 1 }}>
            {saving ? t.saving : t.create}
          </button>
          <button onClick={onClose} style={{ ...btn('transparent', TEXT_MUTED, BORDER), padding: '11px 18px' }}>{t.cancel}</button>
        </div>
      </div>
    </div>
  )
}

// ─── الصفحة ──────────────────────────────────────────────────────────────────
export default function Invoices() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [docType, setDocType] = useState('')
  const [submitFilter, setSubmitFilter] = useState('')
  const [fromDate, setFrom] = useState('')
  const [toDate, setTo] = useState('')
  const [page, setPage] = useState(1)

  const [viewId, setViewId] = useState<string | null>(null)
  const [returnId, setReturnId] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [viewer, setViewer] = useState<{ title: string; value: string } | null>(null)

  const t = T[lang]
  const isAr = lang === 'ar'

  // ✅ إظهار/إخفاء الأعمدة — نفس نمط صفحة المواعيد
  const columnDefs: ColumnDef[] = [
    { key: 'invoiceNo', label: t.invoiceNo, locked: true },
    { key: 'docType', label: t.docType },
    { key: 'patient', label: t.patient, locked: true },
    { key: 'date', label: t.date },
    { key: 'total', label: t.total },
    { key: 'tax', label: t.tax },
    { key: 'payable', label: t.payable },
    { key: 'submitState', label: t.submitState },
    { key: 'xml', label: t.xml },
    { key: 'taxResponse', label: t.taxResponse },
    { key: 'qr', label: t.qr },
    { key: 'actions', label: t.actions, locked: true },
  ]
  const { visibleKeys, toggle } = useColumnVisibility('invoices-table', columnDefs)
  const colVisible = (key: string) => visibleKeys.has(key)

  useEffect(() => {
    const onLang = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', onLang)
    return () => window.removeEventListener('cura-lang-change', onLang)
  }, [])

  useEffect(() => { fetchData() }, [docType, submitFilter, page])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (docType) params.set('documentType', docType)
      if (submitFilter === 'yes') params.set('isSubmitted', 'true')
      if (submitFilter === 'no') params.set('isSubmitted', 'false')
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)
      const r = await api.get(`/invoices?${params}`)
      setData(r.data)
    } catch (err: any) {
      if (err?.response?.status === 401) navigate('/login')
    } finally { setLoading(false) }
  }

  const applyFilter = () => { setPage(1); fetchData() }
  const resetFilter = () => { setDocType(''); setSubmitFilter(''); setFrom(''); setTo(''); setPage(1); setTimeout(fetchData, 0) }

  const submitInvoice = async (id: string) => {
    setSubmitting(id)
    try {
      const r = await api.post(`/invoices/${id}/submit`)
      alert(r.data?.message || '')
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data || t.submitFailed)
    } finally { setSubmitting(null) }
  }

  // ✅ نبني رابط التصدير بنفس فلاتر الشاشة
  const exportQuery = (() => {
    const p = new URLSearchParams()
    if (docType) p.set('documentType', docType)
    if (submitFilter === 'yes') p.set('isSubmitted', 'true')
    if (submitFilter === 'no') p.set('isSubmitted', 'false')
    if (fromDate) p.set('from', fromDate)
    if (toDate) p.set('to', toDate)
    const s = p.toString()
    return s ? `?${s}` : ''
  })()

  const cell: React.CSSProperties = { padding: '10px 12px', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }

  return (
    <>
      <style>{globalCss}</style>
      <div className="page-body" dir={isAr ? 'rtl' : 'ltr'} style={{ background: '#F8FAFA', minHeight: '100vh', padding: 24, fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif" }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* ✅ رأس الطباعة الموحّد — نفس صفحة المواعيد */}
          <PrintHeader reportTitle={t.title} lang={lang} />

          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 100, padding: '4px 16px', fontSize: 11, fontWeight: 600, color: PRIMARY, marginBottom: 12 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY }} /> 🧾
              </div>
              <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 30, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>{t.title}</h2>
              <p style={{ fontSize: 13, color: TEXT_MUTED, margin: '6px 0 0' }}>{t.subtitle}</p>
            </div>
            <button onClick={() => setNewOpen(true)} style={btn(PRIMARY, '#FFF')}>{t.newInvoice}</button>
          </div>

          {/* فلتر */}
          <div className="no-print" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK }}>🔍 {t.filter}</span>
            <select value={docType} onChange={e => setDocType(e.target.value)}
              style={{ padding: '8px 12px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 13, color: TEXT_DARK, outline: 'none', minWidth: 130, fontFamily: 'inherit' }}>
              <option value="">{t.all}</option>
              <option value="388">{t.sale}</option>
              <option value="381">{t.creditNote}</option>
            </select>
            <select value={submitFilter} onChange={e => setSubmitFilter(e.target.value)}
              style={{ padding: '8px 12px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 13, color: TEXT_DARK, outline: 'none', minWidth: 130, fontFamily: 'inherit' }}>
              <option value="">{t.all}</option>
              <option value="yes">{t.submitted}</option>
              <option value="no">{t.notSubmitted}</option>
            </select>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: 700 }}>{t.from}</label>
              <input type="date" value={fromDate} onChange={e => setFrom(e.target.value)}
                style={{ padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: 700 }}>{t.to}</label>
              <input type="date" value={toDate} onChange={e => setTo(e.target.value)}
                style={{ padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none' }} />
            </div>
            <button onClick={applyFilter} style={{ ...btn(PRIMARY, '#FFF'), padding: '9px 18px' }}>{t.apply}</button>
            <button onClick={resetFilter} style={btn('transparent', TEXT_MUTED, BORDER)}>✕ {t.reset}</button>
          </div>

          {/* ✅ شريط التصدير والأعمدة — نفس صفحة المواعيد */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
            <ExportBar endpoint={`/invoices/export${exportQuery}`} lang={lang} fileName="invoices" />
            <ColumnToggleButton columns={columnDefs} visibleKeys={visibleKeys} onToggle={toggle} isRtl={isAr} />
          </div>

          {/* الجدول */}
          <div className="print-card" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: TEXT_MUTED }}>{t.loading}</div>
            ) : data?.invoices?.length > 0 ? (
              <div className="print-scroll" style={{ overflowX: 'auto' }}>
                <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 1000 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFA' }}>
                      {columnDefs.filter(c => visibleKeys.has(c.key)).map(c => (
                        <th key={c.key}
                          className={['xml', 'taxResponse', 'qr', 'actions'].includes(c.key) ? 'no-print' : undefined}
                          style={{ padding: '10px 12px', fontWeight: 600, fontSize: 11, color: TEXT_MUTED, textAlign: 'start', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>
                          {c.key === 'actions' ? '' : c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.invoices.map((inv: any) => {
                      const isReturn = inv.documentType === '381'
                      return (
                        <tr key={inv.id}
                          onMouseEnter={e => e.currentTarget.style.background = '#F8FAFA'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                          {colVisible('invoiceNo') && (
                            <td style={{ ...cell, fontFamily: "'Inter',monospace", fontWeight: 600, color: TEXT_DARK }}>{inv.invoiceNumber}</td>
                          )}

                          {colVisible('docType') && (
                            <td style={cell}>
                              <span style={{ padding: '3px 9px', borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: isReturn ? '#FFF5F5' : PRIMARY_SOFT, color: isReturn ? DANGER : PRIMARY }}>
                                {isReturn ? t.creditNote : t.sale}
                              </span>
                            </td>
                          )}

                          {colVisible('patient') && (
                            <td style={{ ...cell, color: TEXT_DARK }}>{inv.patientName}</td>
                          )}

                          {colVisible('date') && (
                            <td style={{ ...cell, color: TEXT_MUTED, fontSize: 11.5 }}>{inv.issueDate}</td>
                          )}

                          {colVisible('total') && (
                            <td style={{ ...cell, fontFamily: "'Inter',monospace" }}>{fmt(inv.totalAmount)}</td>
                          )}

                          {colVisible('tax') && (
                            <td style={{ ...cell, fontFamily: "'Inter',monospace", color: TEXT_MUTED }}>{fmt(inv.taxAmount)}</td>
                          )}

                          {colVisible('payable') && (
                            <td style={{ ...cell, fontFamily: "'Inter',monospace", fontWeight: 700, color: PRIMARY }}>{fmt(inv.payableAmount)}</td>
                          )}

                          {colVisible('submitState') && (
                            <td style={cell}>
                              <span style={{ padding: '3px 9px', borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: inv.isSubmitted ? '#E8F5E9' : '#FFF8E1', color: inv.isSubmitted ? SUCCESS : WARNING }}>
                                {inv.isSubmitted ? `✅ ${t.submitted}` : `⏳ ${t.notSubmitted}`}
                              </span>
                            </td>
                          )}

                          {colVisible('xml') && (
                            <td className="no-print" style={cell}>
                              {inv.invoiceXml
                                ? <button onClick={() => setViewer({ title: t.xml, value: inv.invoiceXml })} style={btn(CARD_BG, PRIMARY, BORDER)}>📄</button>
                                : <span style={{ color: TEXT_MUTED }}>{t.empty}</span>}
                            </td>
                          )}

                          {colVisible('taxResponse') && (
                            <td className="no-print" style={cell}>
                              {inv.taxResponse
                                ? <button onClick={() => setViewer({ title: t.taxResponse, value: inv.taxResponse })} style={btn(CARD_BG, PRIMARY, BORDER)}>📩</button>
                                : <span style={{ color: TEXT_MUTED }}>{t.empty}</span>}
                            </td>
                          )}

                          {colVisible('qr') && (
                            <td className="no-print" style={cell}>
                              {inv.qrCode
                                ? <button onClick={() => setViewer({ title: t.qr, value: inv.qrCode })} style={btn(CARD_BG, PRIMARY, BORDER)}>🔳</button>
                                : <span style={{ color: TEXT_MUTED }}>{t.empty}</span>}
                            </td>
                          )}

                          {colVisible('actions') && (
                            <td className="no-print" style={cell}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => setViewId(inv.id)} style={btn(CARD_BG, PRIMARY, BORDER)}>🧾 {t.view}</button>
                                {!inv.isSubmitted && (
                                  <button onClick={() => submitInvoice(inv.id)} disabled={submitting === inv.id}
                                    style={{ ...btn('#FFF8E1', WARNING, '#E8D4A8'), opacity: submitting === inv.id ? 0.6 : 1 }}>
                                    {submitting === inv.id ? t.submitting : `📤 ${t.submit}`}
                                  </button>
                                )}
                                {!isReturn && (
                                  <button onClick={() => setReturnId(inv.id)} style={btn('#FFF5F5', DANGER, '#FCA5A5')}>{t.newReturn}</button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: TEXT_MUTED }}>
                <span style={{ fontSize: 40, opacity: 0.4 }}>🧾</span>
                <p style={{ fontSize: 13, marginTop: 12 }}>{t.noData}</p>
              </div>
            )}

            {data?.pages > 1 && (
              <div className="no-print" style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '16px 0', borderTop: `1px solid ${BORDER}` }}>
                {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${p === page ? PRIMARY : BORDER}`, background: p === page ? PRIMARY : CARD_BG, color: p === page ? '#FFF' : TEXT_DARK, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {viewId && <InvoiceModal invoiceId={viewId} lang={lang} onClose={() => setViewId(null)} />}
      {returnId && <ReturnModal invoiceId={returnId} lang={lang} onClose={() => setReturnId(null)} onCreated={() => { setReturnId(null); fetchData() }} />}
      {newOpen && <NewInvoiceModal lang={lang} onClose={() => setNewOpen(false)} onCreated={() => { setNewOpen(false); fetchData() }} />}
      {viewer && <TextViewer title={viewer.title} value={viewer.value} lang={lang} onClose={() => setViewer(null)} />}
    </>
  )
}