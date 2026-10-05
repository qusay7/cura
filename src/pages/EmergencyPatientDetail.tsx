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

const T = {
  ar: {
    back: '← لوحة الطوارئ',
    queueNumber: 'رقم', since: 'منذ',
    discharge: '🚪 تسجيل خروج المريض', discharging: 'جارٍ التسجيل...',
    dischargeConfirm: 'هل أنت متأكد من تسجيل خروج هذا المريض؟ سيُغلق ملفه ويختفي من لوحة الطوارئ.',
    discharged: 'تم تسجيل الخروج', dischargedAtLabel: 'تاريخ الخروج',
    timeline: '📋 السجل الزمني', noEntries: 'لا توجد سجلات بعد',
    vitals: '🩺 العلامات الحيوية', bloodPressure: 'ضغط الدم', bloodPressurePlaceholder: '120/80',
    bloodSugar: 'سكر الدم', heartRate: 'النبض', respiratoryRate: 'التنفس',
    diagnosis: 'التشخيص', prescription: 'الوصفة الطبية', tests: 'الفحوصات المطلوبة', notes: 'ملاحظات إضافية',
    report: '📄 تقرير الحالة', reportNotes: 'ملاحظات وتقييم إضافي', reportCompiledTitle: 'الملخص',
    sickLeave: '🩺 إجازة مرضية', print: '🖨️', noContentToPrint: 'لا يوجد محتوى للطباعة بعد',
    save: '💾 حفظ السجل', saving: 'جارٍ الحفظ...',
    errorOccurred: 'حدث خطأ', loading: 'جارٍ التحميل...', notFound: 'الحالة غير موجودة',
    patient: 'المريض',
  },
  en: {
    back: '← Emergency Dashboard',
    queueNumber: 'No.', since: 'since',
    discharge: '🚪 Discharge Patient', discharging: 'Discharging...',
    dischargeConfirm: 'Are you sure you want to discharge this patient? This closes their file and removes it from the ER dashboard.',
    discharged: 'Discharged', dischargedAtLabel: 'Discharged at',
    timeline: '📋 Timeline', noEntries: 'No entries yet',
    vitals: '🩺 Vital Signs', bloodPressure: 'Blood Pressure', bloodPressurePlaceholder: '120/80',
    bloodSugar: 'Blood Sugar', heartRate: 'Heart Rate', respiratoryRate: 'Resp. Rate',
    diagnosis: 'Diagnosis', prescription: 'Prescription', tests: 'Requested Tests', notes: 'Additional Notes',
    report: '📄 Status Report', reportNotes: 'Additional Notes & Assessment', reportCompiledTitle: 'Summary',
    sickLeave: '🩺 Sick Leave', print: '🖨️', noContentToPrint: 'Nothing to print yet',
    save: '💾 Save Entry', saving: 'Saving...',
    errorOccurred: 'An error occurred', loading: 'Loading...', notFound: 'Case not found',
    patient: 'Patient',
  },
}

const emptyEntryForm = { bloodPressure: '', bloodSugar: '', heartRate: '', respiratoryRate: '', diagnosis: '', prescription: '', tests: '', notes: '', reportNotes: '' }

export default function EmergencyPatientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const t = T[lang]
  const isAr = lang === 'ar'

  const [entry, setEntry] = useState<QueueDetail | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
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
      const [entryRes, timelineRes] = await Promise.all([
        api.get(`/queue/${id}`),
        api.get(`/visitnotes/queue/${id}/timeline`),
      ])
      setEntry(entryRes.data)
      setTimeline(timelineRes.data)
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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: TEXT_MUTED }}>{t.loading}</div>
  )

  if (notFound || !entry) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: TEXT_MUTED }}>{t.notFound}</div>
  )

  const isDischarged = entry.status === 'completed' && !!entry.dischargedAt

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
            {/* 🩺 العلامات الحيوية — أول شي يشوفه الطبيب عند الدخول */}
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

            {/* 📎 صور الأشعة والمرفقات — مربوطة بهذي الحالة بالذات */}
            <div style={{ marginBottom: 16 }}>
              <PatientAttachmentsTab patientId={entry.patientId} lang={lang} queueEntryId={entry.id} />
            </div>

            {/* 💉 الإجراءات */}
            <ProceduresPicker parentType="queue" parentId={entry.id} lang={lang} />

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

        {/* Timeline */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK, display: 'block', marginBottom: 10 }}>{t.timeline}</label>
          {timeline.length === 0 ? (
            <p style={{ fontSize: 12.5, color: TEXT_MUTED, fontStyle: 'italic' }}>{t.noEntries}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {timeline.map(entry2 => (
                <div key={entry2.id} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: PRIMARY }}>👨‍⚕️ {entry2.doctorName || (isAr ? 'غير معروف' : 'Unknown')}</span>
                    <span style={{ fontSize: 11, color: TEXT_MUTED, fontFamily: "'Inter',sans-serif" }}>{formatDateTime(entry2.createdAt)}</span>
                  </div>
                  {(entry2.bloodPressure || entry2.bloodSugar != null || entry2.heartRate != null || entry2.respiratoryRate != null) && (
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 8, fontSize: 12, color: TEXT_DARK, fontFamily: "'Inter',sans-serif" }}>
                      {entry2.bloodPressure && <span>🩸 {entry2.bloodPressure}</span>}
                      {entry2.bloodSugar != null && <span>🍬 {entry2.bloodSugar}</span>}
                      {entry2.heartRate != null && <span>❤️ {entry2.heartRate}</span>}
                      {entry2.respiratoryRate != null && <span>🫁 {entry2.respiratoryRate}</span>}
                    </div>
                  )}
                  <div style={{ fontSize: 12.5, color: TEXT_DARK, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {entry2.diagnosis && <div>🩺 {t.diagnosis}: {entry2.diagnosis}</div>}
                    {entry2.prescription && <div>💊 {t.prescription}: {entry2.prescription}</div>}
                    {entry2.tests && <div>🧪 {t.tests}: {entry2.tests}</div>}
                    {entry2.notes && <div>📝 {entry2.notes}</div>}
                    {entry2.reportNotes && <div>📄 {entry2.reportNotes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
