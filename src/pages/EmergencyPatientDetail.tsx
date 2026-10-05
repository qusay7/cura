import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import ProceduresPicker from '../components/ProceduresPicker'
import PatientAttachmentsTab from '../components/PatientAttachmentsTab'
import SickLeaveCertificate from '../components/SickLeaveCertificate'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'
import { getCurrencySymbol } from '../utils/i18n'
import { printSection, escapeHtml } from '../utils/printSection'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

interface QueueDetail {
  id: string
  queueNumber: number
  status: string
  notes?: string | null
  createdAt: string
  price?: number | null
  isPaid: boolean
  patientId: string
  patientName: string
  patientPhone?: string | null
  doctorName?: string | null
  dischargedAt?: string | null
}

interface TimelineEntry {
  id: string
  diagnosis?: string | null
  prescription?: string | null
  tests?: string | null
  notes?: string | null
  bloodPressure?: string | null
  bloodSugar?: number | null
  heartRate?: number | null
  respiratoryRate?: number | null
  reportNotes?: string | null
  createdAt: string
  doctorName?: string | null
}

interface ProcedureTimelineItem { id: string; procedureId: string | null; name: string; price: number | null; createdAt: string; doctorName?: string | null }
interface AttachmentTimelineItem { id: string; fileName: string; category: string | null; createdAt: string; isImage: boolean; queueEntryId: string | null }

type Delta = { systolic?: number; sugar?: number; heart?: number; resp?: number }

const T = {
  ar: {
    back: '← لوحة الطوارئ',
    queueNumber: 'رقم', since: 'منذ',
    discharge: '🚪 تسجيل خروج المريض', discharging: 'جارٍ التسجيل...',
    dischargeConfirm: 'هل أنت متأكد من تسجيل خروج هذا المريض؟ سيُغلق ملفه ويختفي من لوحة الطوارئ.',
    discharged: 'تم تسجيل الخروج', dischargedAtLabel: 'تاريخ الخروج',
    fullTimeline: '📈 السجل الزمني الكامل للحالة', timelineHint: 'كل قراءة وإجراء ومرفق، بالأحدث أولاً — لمتابعة تطور حالة المريض',
    noEntries: 'لا توجد سجلات بعد',
    vitals: '🩺 العلامات الحيوية', bloodPressure: 'ضغط الدم', bloodPressurePlaceholder: '120/80',
    bloodSugar: 'سكر الدم', heartRate: 'النبض', respiratoryRate: 'التنفس',
    diagnosis: 'التشخيص', prescription: 'الوصفة الطبية', tests: 'الفحوصات المطلوبة', notes: 'ملاحظات إضافية',
    report: '📄 تقرير الحالة', reportNotes: 'ملاحظات وتقييم إضافي', reportCompiledTitle: 'الملخص',
    sickLeave: '🩺 إجازة مرضية', print: '🖨️', noContentToPrint: 'لا يوجد محتوى للطباعة بعد',
    save: '💾 حفظ السجل', saving: 'جارٍ الحفظ...',
    errorOccurred: 'حدث خطأ', loading: 'جارٍ التحميل...', notFound: 'الحالة غير موجودة',
    patient: 'المريض', reading: '🩺 قراءة', procedure: '💉 إجراء', attachment: '📎 مرفق', unknown: 'غير معروف',
    xray: 'أشعة', lab: 'تحليل مخبري', other: 'أخرى',
  },
  en: {
    back: '← Emergency Dashboard',
    queueNumber: 'No.', since: 'since',
    discharge: '🚪 Discharge Patient', discharging: 'Discharging...',
    dischargeConfirm: 'Are you sure you want to discharge this patient? This closes their file and removes it from the ER dashboard.',
    discharged: 'Discharged', dischargedAtLabel: 'Discharged at',
    fullTimeline: '📈 Full Case Timeline', timelineHint: 'Every reading, procedure and attachment, newest first — to track how the patient is progressing',
    noEntries: 'No entries yet',
    vitals: '🩺 Vital Signs', bloodPressure: 'Blood Pressure', bloodPressurePlaceholder: '120/80',
    bloodSugar: 'Blood Sugar', heartRate: 'Heart Rate', respiratoryRate: 'Resp. Rate',
    diagnosis: 'Diagnosis', prescription: 'Prescription', tests: 'Requested Tests', notes: 'Additional Notes',
    report: '📄 Status Report', reportNotes: 'Additional Notes & Assessment', reportCompiledTitle: 'Summary',
    sickLeave: '🩺 Sick Leave', print: '🖨️', noContentToPrint: 'Nothing to print yet',
    save: '💾 Save Entry', saving: 'Saving...',
    errorOccurred: 'An error occurred', loading: 'Loading...', notFound: 'Case not found',
    patient: 'Patient', reading: '🩺 Reading', procedure: '💉 Procedure', attachment: '📎 Attachment', unknown: 'Unknown',
    xray: 'X-Ray', lab: 'Lab Result', other: 'Other',
  },
}

const emptyEntryForm = { bloodPressure: '', bloodSugar: '', heartRate: '', respiratoryRate: '', diagnosis: '', prescription: '', tests: '', notes: '', reportNotes: '' }

// ✅ "140/90" → 140 — نقارن الانقباضي فقط بين قراءة وأللي قبلها، كفاية لإظهار الاتجاه
const parseSystolic = (bp?: string | null): number | null => {
  if (!bp) return null
  const m = bp.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

// ✅ نحسب الفرق بين كل قراءة والقراءة الأقدم منها (بالترتيب التصاعدي) — هذا هو
// "توثيق التغيّرات" اللي طلبه المستخدم: يشوف الضغط نازل تدريجياً بعد الإجراءات مثلاً
const computeDeltas = (entriesAsc: TimelineEntry[]): Map<string, Delta> => {
  const map = new Map<string, Delta>()
  let prevSys: number | null = null, prevSugar: number | null = null, prevHeart: number | null = null, prevResp: number | null = null
  for (const n of entriesAsc) {
    const sys = parseSystolic(n.bloodPressure)
    const d: Delta = {}
    if (sys != null && prevSys != null) d.systolic = sys - prevSys
    if (n.bloodSugar != null && prevSugar != null) d.sugar = n.bloodSugar - prevSugar
    if (n.heartRate != null && prevHeart != null) d.heart = n.heartRate - prevHeart
    if (n.respiratoryRate != null && prevResp != null) d.resp = n.respiratoryRate - prevResp
    map.set(n.id, d)
    if (sys != null) prevSys = sys
    if (n.bloodSugar != null) prevSugar = n.bloodSugar
    if (n.heartRate != null) prevHeart = n.heartRate
    if (n.respiratoryRate != null) prevResp = n.respiratoryRate
  }
  return map
}

export default function EmergencyPatientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const t = T[lang]
  const isAr = lang === 'ar'

  const [entry, setEntry] = useState<QueueDetail | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [procedureItems, setProcedureItems] = useState<ProcedureTimelineItem[]>([])
  const [attachments, setAttachments] = useState<AttachmentTimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [form, setForm] = useState(emptyEntryForm)
  const [saving, setSaving] = useState(false)
  const [discharging, setDischarging] = useState(false)
  const [error, setError] = useState('')
  const [showSickLeave, setShowSickLeave] = useState(false)

  useEffect(() => {
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  const fetchAll = useCallback(async () => {
    if (!id) return
    try {
      const entryRes = await api.get(`/queue/${id}`)
      setEntry(entryRes.data)

      const [timelineRes, attachmentsRes] = await Promise.all([
        api.get(`/visitnotes/queue/${id}/timeline`),
        api.get(`/attachments/patient/${entryRes.data.patientId}`).catch(() => ({ data: [] })),
      ])
      setTimeline(timelineRes.data)
      setAttachments((attachmentsRes.data as AttachmentTimelineItem[]).filter(a => a.queueEntryId === id))
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ✅ طباعة قسم واحد بمعزل عن باقي الصفحة — نفس أسلوب VisitWorkspace
  const handlePrintSection = (title: string, text: string) => {
    if (!text.trim()) { setError(t.noContentToPrint); return }
    let clinicId = ''
    try { clinicId = JSON.parse(localStorage.getItem('user') || '{}').clinicId || '' } catch { /* ignore */ }
    if (!clinicId) return
    printSection({
      clinicId,
      title,
      isAr,
      bodyHtml: escapeHtml(text).replace(/\n/g, '<br/>'),
      doctorName: entry?.doctorName || undefined,
    })
  }

  const handleSaveEntry = async () => {
    if (!entry) return
    setSaving(true); setError('')
    try {
      await api.post('/visitnotes', {
        patientId: entry.patientId,
        queueEntryId: entry.id,
        bloodPressure: form.bloodPressure || null,
        bloodSugar: form.bloodSugar ? parseFloat(form.bloodSugar) : null,
        heartRate: form.heartRate ? parseInt(form.heartRate) : null,
        respiratoryRate: form.respiratoryRate ? parseInt(form.respiratoryRate) : null,
        diagnosis: form.diagnosis || null,
        prescription: form.prescription || null,
        tests: form.tests || null,
        notes: form.notes || null,
        reportNotes: form.reportNotes || null,
      })
      setForm(emptyEntryForm)
      fetchAll()
    } catch (err: any) {
      setError(err.response?.data || t.errorOccurred)
    } finally {
      setSaving(false)
    }
  }

  const handleDischarge = async () => {
    if (!entry) return
    if (!window.confirm(t.dischargeConfirm)) return
    setDischarging(true)
    try {
      await api.put(`/queue/${entry.id}/discharge`)
      navigate('/emergency/dashboard')
    } catch (err: any) {
      setError(err.response?.data || t.errorOccurred)
      setDischarging(false)
    }
  }

  const formatDateTime = (iso: string) =>
    new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).toLocaleString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 11px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG, boxSizing: 'border-box' }

  const renderDelta = (d?: number) => {
    if (d == null || d === 0) return null
    const up = d > 0
    return <span style={{ color: up ? '#B8892A' : '#3B82F6', fontWeight: 700, fontFamily: "'Inter',sans-serif" }}> {up ? '↑' : '↓'}{Math.abs(d)}</span>
  }

  const categoryLabel = (c: string | null) => c === 'xray' ? t.xray : c === 'lab' ? t.lab : t.other
  const categoryIcon = (c: string | null) => c === 'xray' ? '🩻' : c === 'lab' ? '🧪' : '📄'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: TEXT_MUTED }}>{t.loading}</div>
  )

  if (notFound || !entry) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: TEXT_MUTED }}>{t.notFound}</div>
  )

  const isDischarged = entry.status === 'completed' && !!entry.dischargedAt

  // ✅ الفرق محسوب بالترتيب التصاعدي (الأقدم أول) عشان كل قراءة تُقارَن باللي قبلها فعلياً
  const deltaMap = computeDeltas([...timeline].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))

  // ✅ دمج القراءات + الإجراءات + المرفقات بقصة زمنية واحدة، بالأحدث أول — هذا هو
  // "التغيّرات اللي حدثت لحالة المريض" اللي طلبها المستخدم بالضبط: شوف إجراء بوقت
  // معيّن، وبعده قراءة تحسّنت
  type UnifiedItem =
    | { kind: 'note'; timestamp: string; note: TimelineEntry }
    | { kind: 'procedure'; timestamp: string; procedure: ProcedureTimelineItem }
    | { kind: 'attachment'; timestamp: string; attachment: AttachmentTimelineItem }

  const unified: UnifiedItem[] = [
    ...timeline.map(n => ({ kind: 'note' as const, timestamp: n.createdAt, note: n })),
    ...procedureItems.map(p => ({ kind: 'procedure' as const, timestamp: p.createdAt, procedure: p })),
    ...attachments.map(a => ({ kind: 'attachment' as const, timestamp: a.createdAt, attachment: a })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif", background: '#F8FAFA', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <button onClick={() => navigate('/emergency/dashboard')}
          style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 12.5, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
          {t.back}
        </button>

        {/* Patient header */}
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 20, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>
                👤 {entry.patientName}
              </h2>
              <div style={{ fontSize: 12.5, color: TEXT_MUTED, marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'Inter',sans-serif" }}>{t.queueNumber} #{entry.queueNumber}</span>
                {entry.patientPhone && <span>📞 {entry.patientPhone}</span>}
                <span>👨‍⚕️ {entry.doctorName || (isAr ? 'بدون طبيب محدد' : 'No doctor assigned')}</span>
                <span>🕒 {t.since} {formatDateTime(entry.createdAt)}</span>
              </div>
              {entry.price != null && (
                <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, marginTop: 8, fontFamily: "'Inter',sans-serif" }}>
                  💰 {entry.price} {getCurrencySymbol(lang)}
                </div>
              )}
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100,
              background: isDischarged ? '#E8F5E9' : (entry.status === 'waiting' ? '#FFF8E1' : '#EBF4FF'),
              color: isDischarged ? '#22C55E' : (entry.status === 'waiting' ? '#F59E0B' : '#3B82F6'),
            }}>
              {isDischarged ? `✅ ${t.discharged}` : entry.status}
            </span>
          </div>

          {isDischarged ? (
            entry.dischargedAt && (
              <p style={{ fontSize: 11.5, color: TEXT_MUTED, marginTop: 12, marginBottom: 0 }}>
                {t.dischargedAtLabel}: {formatDateTime(entry.dischargedAt)}
              </p>
            )
          ) : (
            <button onClick={handleDischarge} disabled={discharging}
              style={{ marginTop: 14, background: '#FFF5F5', color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 700, cursor: discharging ? 'not-allowed' : 'pointer', opacity: discharging ? 0.6 : 1 }}>
              {discharging ? t.discharging : t.discharge}
            </button>
          )}
        </div>

        {error && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#EF4444' }}>
            ⚠️ {error}
          </div>
        )}

        {!isDischarged && (
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 20, marginBottom: 18 }}>
            {/* 🩺 العلامات الحيوية — أول شي يشوفه الطبيب، وكل حفظ يسجّل قراءة جديدة
                (ما بيستبدل القديمة) عشان تقدر تراقب المريض بأكثر من قراءة بالوقت */}
            <div style={{ background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14, marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 10 }}>{t.vitals}</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10.5, color: TEXT_MUTED, marginBottom: 4 }}>{t.bloodPressure}</label>
                  <input value={form.bloodPressure} onChange={e => setForm({ ...form, bloodPressure: e.target.value })} placeholder={t.bloodPressurePlaceholder} style={{ ...inputStyle, fontFamily: "'Inter',sans-serif" }} autoFocus />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10.5, color: TEXT_MUTED, marginBottom: 4 }}>{t.bloodSugar}</label>
                  <input type="number" value={form.bloodSugar} onChange={e => setForm({ ...form, bloodSugar: e.target.value })} style={{ ...inputStyle, fontFamily: "'Inter',sans-serif" }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10.5, color: TEXT_MUTED, marginBottom: 4 }}>{t.heartRate}</label>
                  <input type="number" value={form.heartRate} onChange={e => setForm({ ...form, heartRate: e.target.value })} style={{ ...inputStyle, fontFamily: "'Inter',sans-serif" }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10.5, color: TEXT_MUTED, marginBottom: 4 }}>{t.respiratoryRate}</label>
                  <input type="number" value={form.respiratoryRate} onChange={e => setForm({ ...form, respiratoryRate: e.target.value })} style={{ ...inputStyle, fontFamily: "'Inter',sans-serif" }} />
                </div>
              </div>
            </div>

            {/* 📎 صور الأشعة والمرفقات — تتكرر بأي وقت، كلها مربوطة بهذي الحالة بالذات */}
            <div style={{ marginBottom: 16 }}>
              <PatientAttachmentsTab patientId={entry.patientId} lang={lang} queueEntryId={entry.id} />
            </div>

            {/* 💉 الإجراءات — تتكرر بأي وقت، كل واحد موثّق بوقته وطبيبه */}
            <ProceduresPicker parentType="queue" parentId={entry.id} lang={lang} onItemsChange={setProcedureItems} />

            {/* 🩺 التشخيص والوصفة — بالنهاية، كل واحد بزر طباعة مستقل */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14, marginTop: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED }}>{t.diagnosis}</label>
                  <button type="button" onClick={() => handlePrintSection(t.diagnosis, form.diagnosis)} title={t.diagnosis}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13 }}>{t.print}</button>
                </div>
                <textarea value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} rows={3}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED }}>{t.prescription}</label>
                  <button type="button" onClick={() => handlePrintSection(t.prescription, form.prescription)} title={t.prescription}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13 }}>{t.print}</button>
                </div>
                <textarea value={form.prescription} onChange={e => setForm({ ...form, prescription: e.target.value })} rows={3}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.tests}</label>
              <input value={form.tests} onChange={e => setForm({ ...form, tests: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK, boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED }}>{t.notes}</label>
                <button type="button" onClick={() => handlePrintSection(t.notes, form.notes)} title={t.notes}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13 }}>{t.print}</button>
              </div>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK, resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            {/* 📄 تقرير الحالة — ملخص مُجمّع + إضافة الطبيب الحرة، بزر طباعة */}
            <div style={{ background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED }}>{t.report}</label>
                <button type="button" onClick={() => handlePrintSection(t.report, [
                  `${t.patient}: ${entry.patientName}`,
                  form.diagnosis && `${t.diagnosis}: ${form.diagnosis}`,
                  form.prescription && `${t.prescription}: ${form.prescription}`,
                  (form.bloodPressure || form.bloodSugar || form.heartRate || form.respiratoryRate) &&
                    `${t.vitals}: ${[form.bloodPressure && `BP ${form.bloodPressure}`, form.bloodSugar && `Sugar ${form.bloodSugar}`, form.heartRate && `HR ${form.heartRate}`, form.respiratoryRate && `RR ${form.respiratoryRate}`].filter(Boolean).join(' · ')}`,
                  form.reportNotes && `${t.reportNotes}: ${form.reportNotes}`,
                ].filter(Boolean).join('\n\n'))} title={t.report}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13 }}>{t.print}</button>
              </div>
              <div style={{ fontSize: 12.5, color: TEXT_DARK, lineHeight: 1.7, marginBottom: 10 }}>
                <strong>{t.reportCompiledTitle}:</strong>{' '}
                {[form.diagnosis, form.prescription].filter(Boolean).join(' — ') || '—'}
              </div>
              <label style={{ display: 'block', fontSize: 10.5, color: TEXT_MUTED, marginBottom: 4 }}>{t.reportNotes}</label>
              <textarea value={form.reportNotes} onChange={e => setForm({ ...form, reportNotes: e.target.value })} rows={3}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK, resize: 'vertical', background: CARD_BG, boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={handleSaveEntry} disabled={saving}
                style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 12, padding: '11px 26px', fontSize: 13.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? t.saving : t.save}
              </button>
              <button type="button" onClick={() => setShowSickLeave(true)}
                style={{ background: CARD_BG, color: TEXT_DARK, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '11px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {t.sickLeave}
              </button>
            </div>
          </div>
        )}

        {showSickLeave && (
          <SickLeaveCertificate
            patientName={entry.patientName}
            doctorName={entry.doctorName || ''}
            defaultReason={form.diagnosis}
            lang={lang}
            onClose={() => setShowSickLeave(false)}
          />
        )}

        {/* السجل الزمني الكامل — دمج القراءات + الإجراءات + المرفقات بقصة واحدة */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK, display: 'block', marginBottom: 2 }}>{t.fullTimeline}</label>
          <p style={{ fontSize: 11, color: TEXT_MUTED, margin: '0 0 10px' }}>{t.timelineHint}</p>

          {unified.length === 0 ? (
            <p style={{ fontSize: 12.5, color: TEXT_MUTED, fontStyle: 'italic' }}>{t.noEntries}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {unified.map(u => {
                if (u.kind === 'note') {
                  const n = u.note
                  const d = deltaMap.get(n.id)
                  return (
                    <div key={`note-${n.id}`} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: PRIMARY }}>{t.reading} · 👨‍⚕️ {n.doctorName || t.unknown}</span>
                        <span style={{ fontSize: 11, color: TEXT_MUTED, fontFamily: "'Inter',sans-serif" }}>{formatDateTime(n.createdAt)}</span>
                      </div>
                      {(n.bloodPressure || n.bloodSugar != null || n.heartRate != null || n.respiratoryRate != null) && (
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 8, fontSize: 12, color: TEXT_DARK, fontFamily: "'Inter',sans-serif" }}>
                          {n.bloodPressure && <span>🩸 {n.bloodPressure}{renderDelta(d?.systolic)}</span>}
                          {n.bloodSugar != null && <span>🍬 {n.bloodSugar}{renderDelta(d?.sugar)}</span>}
                          {n.heartRate != null && <span>❤️ {n.heartRate}{renderDelta(d?.heart)}</span>}
                          {n.respiratoryRate != null && <span>🫁 {n.respiratoryRate}{renderDelta(d?.resp)}</span>}
                        </div>
                      )}
                      <div style={{ fontSize: 12.5, color: TEXT_DARK, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {n.diagnosis && <div>🩺 {t.diagnosis}: {n.diagnosis}</div>}
                        {n.prescription && <div>💊 {t.prescription}: {n.prescription}</div>}
                        {n.tests && <div>🧪 {t.tests}: {n.tests}</div>}
                        {n.notes && <div>📝 {n.notes}</div>}
                        {n.reportNotes && <div>📄 {n.reportNotes}</div>}
                      </div>
                    </div>
                  )
                }
                if (u.kind === 'procedure') {
                  const p = u.procedure
                  return (
                    <div key={`proc-${p.id}`} style={{ background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_DARK }}>
                        {t.procedure}: {p.name}{p.doctorName ? ` · 👨‍⚕️ ${p.doctorName}` : ''}
                      </span>
                      <span style={{ fontSize: 11, color: TEXT_MUTED, fontFamily: "'Inter',sans-serif" }}>{formatDateTime(p.createdAt)}</span>
                    </div>
                  )
                }
                const a = u.attachment
                return (
                  <div key={`att-${a.id}`} style={{ background: '#F8FAFA', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_DARK }}>
                      {categoryIcon(a.category)} {categoryLabel(a.category)}: {a.fileName}
                    </span>
                    <span style={{ fontSize: 11, color: TEXT_MUTED, fontFamily: "'Inter',sans-serif" }}>{formatDateTime(a.createdAt)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
