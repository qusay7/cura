import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import SearchableSelect from '../components/SearchableSelect'
import PatientAttachmentsTab from '../components/PatientAttachmentsTab'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const globalCss = `
@keyframes fade-up { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
@keyframes spin { to { transform:rotate(360deg); } }
.visit-shell { animation: fade-up 0.35s ease both; }
`

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const SUCCESS = '#22C55E'
const SUCCESS_BG = '#E8F5E9'

const T = {
  ar: {
    back: 'رجوع', loading: 'جاري التحميل...',
    currentVisit: '🩺 الزيارة الحالية', visitType: 'نوع الزيارة',
    diagnosis: 'التشخيص', prescription: 'الوصفة الطبية', tests: 'الفحوصات المطلوبة',
    notes: 'ملاحظات إضافية', nextVisit: 'موعد الزيارة القادمة (اختياري)',
    save: 'حفظ الزيارة', saving: 'جارٍ الحفظ...', saved: 'تم حفظ الزيارة بنجاح ✅',
    history: '📋 السجل المرضي السابق', noHistory: 'لا يوجد سجل زيارات سابقة لهذا المريض',
    visitDate: 'التاريخ', doctor: 'الطبيب', type: 'النوع', attachments: 'مرفقات',
    checkedIn: 'تم تسجيل الدخول', notCheckedIn: 'لسا ما سجّل دخول', checkInNow: 'تسجيل الدخول الآن',
    mustCheckInFirst: '🔒 سجّل دخول المريض أول عشان تقدر تدخل بيانات الزيارة',
    attachmentsSection: '📎 مرفقات هذي الزيارة',
    upcomingAppointment: '📅 الموعد القادم لهذا المريض',
    goToCheckout: 'إنهاء الزيارة (الخروج)', patient: 'المريض', collapse: 'طي', expand: 'عرض التفاصيل',
  },
  en: {
    back: 'Back', loading: 'Loading...',
    currentVisit: '🩺 Current Visit', visitType: 'Visit Type',
    diagnosis: 'Diagnosis', prescription: 'Prescription', tests: 'Requested Tests',
    notes: 'Additional Notes', nextVisit: 'Next Visit Date (optional)',
    save: 'Save Visit', saving: 'Saving...', saved: 'Visit saved successfully ✅',
    history: '📋 Previous Medical History', noHistory: 'No previous visit history for this patient',
    visitDate: 'Date', doctor: 'Doctor', type: 'Type', attachments: 'Attachments',
    checkedIn: 'Checked In', notCheckedIn: 'Not checked in yet', checkInNow: 'Check In Now',
    mustCheckInFirst: '🔒 Check the patient in first to enter visit details',
    attachmentsSection: '📎 Attachments for this Visit',
    upcomingAppointment: "📅 Patient's Next Appointment",
    goToCheckout: 'Finish Visit (Check Out)', patient: 'Patient', collapse: 'Collapse', expand: 'View Details',
  },
}

interface HistoryItem {
  id: string
  appointmentId: string | null
  diagnosis: string | null
  prescription: string | null
  tests: string | null
  notes: string | null
  createdAt: string
  doctorName: string | null
  appointmentDate: string | null
  visitType: string | null
  attachments: { id: string; fileName: string; category: string | null; isImage: boolean }[]
}

interface VisitTemplate { id: string; name: string; nameEn: string | null; defaultSessionsCount?: number }

export default function VisitWorkspace() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const navigate = useNavigate()
  const [lang] = useState<'ar' | 'en'>(getStoredLang())
  const t = T[lang]
  const isAr = lang === 'ar'

  const [loading, setLoading] = useState(true)
  const [appointment, setAppointment] = useState<any>(null)
  const [upcomingAppointment, setUpcomingAppointment] = useState<any>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [existingNoteId, setExistingNoteId] = useState<string | null>(null)

  const [form, setForm] = useState({ diagnosis: '', prescription: '', tests: '', notes: '', nextVisitDate: '' })
  const [templates, setTemplates] = useState<VisitTemplate[]>([])
  const [templateId, setTemplateId] = useState('')
  const [saving, setSaving] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [nextVisitAutoFilled, setNextVisitAutoFilled] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const id = 'cura-visit-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = globalCss; document.head.appendChild(s)
    }
  }, [])

  useEffect(() => {
    if (!appointmentId) return
    const load = async () => {
      setLoading(true)
      try {
        const apptRes = await api.get(`/appointments/${appointmentId}`)
        setAppointment(apptRes.data)
        setTemplateId(apptRes.data.templateId || '')

        // ✅ أقرب موعد قادم فعليًا محجوز لهذا المريض مع نفس الطبيب (معلوماتي بس)
        try {
          const upcomingRes = await api.get('/appointments', {
            params: {
              patientId: apptRes.data.patientId,
              doctorId: apptRes.data.doctorId,
              dateFrom: apptRes.data.appointmentDate,
            },
          })
          const nearest = (upcomingRes.data as any[])
            .filter(a => a.status === 'scheduled' && a.id !== appointmentId)
            .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())[0]
          setUpcomingAppointment(nearest || null)
        } catch { setUpcomingAppointment(null) }

        const [historyRes, templatesRes, noteRes] = await Promise.all([
          api.get(`/visitnotes/patient/${apptRes.data.patientId}`),
          api.get('/treatmentplans/templates'),
          api.get(`/visitnotes/appointment/${appointmentId}`).catch(() => ({ data: null })),
        ])

        // ✅ السجل "السابق" — نستثني الزيارة الحالية نفسها من القائمة (لو فيها ملاحظة أصلاً)
        setHistory((historyRes.data as HistoryItem[]).filter(h => h.appointmentId !== appointmentId))
        setTemplates(templatesRes.data)

        if (noteRes.data) {
          setExistingNoteId(noteRes.data.id)
          setForm({
            diagnosis: noteRes.data.diagnosis || '',
            prescription: noteRes.data.prescription || '',
            tests: noteRes.data.tests || '',
            notes: noteRes.data.notes || '',
            nextVisitDate: noteRes.data.nextVisitDate ? noteRes.data.nextVisitDate.split('T')[0] : '',
          })
        }

        // ✅ لو القالب متعدد الجلسات، نجيب تاريخ الجلسة القادمة تلقائياً من خطة العلاج
        // (بس لو ما فيه تاريخ مُدخل يدويًا أصلاً — نحترم أي إدخال سابق للطبيب)
        const currentTemplate = (templatesRes.data as VisitTemplate[]).find(tpl => tpl.id === apptRes.data.templateId)
        if (currentTemplate && (currentTemplate.defaultSessionsCount ?? 1) > 1 && !(noteRes.data?.nextVisitDate)) {
          try {
            const plansRes = await api.get(`/treatmentplans/patient/${apptRes.data.patientId}`)
            const plan = (plansRes.data as any[]).find(p => p.templateId === apptRes.data.templateId && p.status === 'active')
            const currentSession = plan?.sessions?.find((s: any) => s.appointmentId === appointmentId)
            const nextSession = plan?.sessions
              ?.filter((s: any) => currentSession ? s.sessionNumber > currentSession.sessionNumber : true)
              ?.sort((a: any, b: any) => a.sessionNumber - b.sessionNumber)
              ?.find((s: any) => s.scheduledDate)

            if (nextSession?.scheduledDate) {
              setForm(prev => ({ ...prev, nextVisitDate: nextSession.scheduledDate.split('T')[0] }))
              setNextVisitAutoFilled(true)
            }
          } catch { /* ما قدرنا نجيب خطة العلاج — نكمل بدون تعبئة تلقائية */ }
        }
      } catch {
        navigate('/daily')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [appointmentId])

  const handleCheckIn = async () => {
    if (!appointmentId) return
    setCheckingIn(true)
    try {
      await api.post(`/appointments/${appointmentId}/checkin`)
      const apptRes = await api.get(`/appointments/${appointmentId}`)
      setAppointment(apptRes.data)
    } catch { /* ignore */ } finally { setCheckingIn(false) }
  }

  const handleTemplateChange = async (newTemplateId: string) => {
    setTemplateId(newTemplateId)
    if (!appointmentId || newTemplateId === appointment?.templateId) return
    try {
      const template = templates.find(tpl => tpl.id === newTemplateId)
      await api.patch(`/appointments/${appointmentId}/update-type`, {
        templateId: newTemplateId,
        type: template ? (isAr ? template.name : (template.nameEn || template.name)) : undefined,
      })
    } catch { /* ما نوقف الشغل لو فشل التحديث — الطبيب يقدر يكمل تسجيل الزيارة عادي */ }
  }

  const handleSave = async () => {
    if (!appointment) return
    if (!appointment.checkInTime) { setError(t.mustCheckInFirst); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const payload = {
        patientId: appointment.patientId,
        appointmentId,
        doctorId: appointment.doctorId,
        diagnosis: form.diagnosis || null,
        prescription: form.prescription || null,
        tests: form.tests || null,
        notes: form.notes || null,
        nextVisitDate: form.nextVisitDate || null,
      }
      if (existingNoteId) {
        await api.put(`/visitnotes/${existingNoteId}`, payload)
      } else {
        const res = await api.post('/visitnotes', payload)
        setExistingNoteId(res.data.id)
      }
      setSuccess(t.saved)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || (isAr ? 'حدث خطأ' : 'An error occurred'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: TEXT_MUTED }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, margin: '0 auto 12px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: PRIMARY, animation: 'spin 0.8s linear infinite' }} />
          {t.loading}
        </div>
      </div>
    )
  }

  if (!appointment) return null

  return (
    <div className="visit-shell" style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif", direction: isAr ? 'rtl' : 'ltr', background: '#F8FAFA', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <button onClick={() => navigate('/daily')}
              style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 12.5, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              {isAr ? '→' : '←'} {t.back}
            </button>
            <h2 style={{ fontFamily: "'DM Serif Display','Georgia',serif", fontSize: 24, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>
              👤 {appointment.patientName}
            </h2>
            <p style={{ fontSize: 12.5, color: TEXT_MUTED, marginTop: 4 }}>
              {new Date(appointment.appointmentDate).toLocaleString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {appointment.checkInTime ? (
              <span style={{ background: SUCCESS_BG, color: '#166534', padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                ✅ {t.checkedIn}
              </span>
            ) : (
              <button onClick={handleCheckIn} disabled={checkingIn}
                style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 12.5, fontWeight: 600, cursor: checkingIn ? 'not-allowed' : 'pointer', opacity: checkingIn ? 0.6 : 1 }}>
                {checkingIn ? '⏳' : `🚪 ${t.checkInNow}`}
              </button>
            )}
            {appointment.checkInTime && !appointment.checkOutTime && (
              <button onClick={() => navigate('/appointments')}
                style={{ background: '#FFF8E1', color: '#92400E', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                🏁 {t.goToCheckout}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#EF4444' }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ background: SUCCESS_BG, border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#166534' }}>
            {success}
          </div>
        )}

        {/* الزيارة الحالية */}
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, marginBottom: 14 }}>{t.currentVisit}</h3>

          {/* ✅ ما نسمح بإدخال أو حفظ أي بيانات زيارة قبل تسجيل الدخول فعليًا */}
          {!appointment?.checkInTime && (
            <div style={{ background: '#FFF8E1', border: '1px solid #FCD34D', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#92400E' }}>
              {t.mustCheckInFirst}
            </div>
          )}

          <div style={{ opacity: appointment?.checkInTime ? 1 : 0.5, pointerEvents: appointment?.checkInTime ? 'auto' : 'none' }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>🔄 {t.visitType}</label>
              <SearchableSelect isRtl={isAr} value={templateId} onChange={handleTemplateChange}
                options={templates.map(tpl => ({ value: tpl.id, label: isAr ? tpl.name : (tpl.nameEn || tpl.name) }))} />
              {templateId && templateId !== appointment?.templateId && (
                <p style={{ fontSize: 10.5, color: '#B8892A', margin: '5px 0 0' }}>
                  ⚠️ {isAr ? 'مختلف عن نوع الحجز الأصلي — تم تحديث سجل الموعد' : 'Different from the original booking — the appointment record was updated'}
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.diagnosis}</label>
                <textarea value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} rows={3}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK, resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.prescription}</label>
                <textarea value={form.prescription} onChange={e => setForm({ ...form, prescription: e.target.value })} rows={3}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK, resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.tests}</label>
                <input value={form.tests} onChange={e => setForm({ ...form, tests: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK }} />
              </div>
              <div>
                {upcomingAppointment ? (
                  <>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.upcomingAppointment}</label>
                    <div style={{ background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '9px 12px', fontSize: 13, fontWeight: 700, color: PRIMARY, fontFamily: "'Inter',sans-serif" }}>
                      📅 {new Date(upcomingAppointment.appointmentDate).toLocaleString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </>
                ) : (
                  <>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.nextVisit}</label>
                    <input type="date" value={form.nextVisitDate}
                      onChange={e => { setForm({ ...form, nextVisitDate: e.target.value }); setNextVisitAutoFilled(false) }}
                      style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "'Inter',sans-serif", color: TEXT_DARK }} />
                    {nextVisitAutoFilled && form.nextVisitDate && (
                      <p style={{ fontSize: 10, color: PRIMARY, margin: '5px 0 0' }}>
                        🔗 {isAr ? 'مُعبّى تلقائيًا من خطة العلاج' : 'Auto-filled from the treatment plan'}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.notes}</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: TEXT_DARK, resize: 'vertical' }} />
            </div>

            <button onClick={handleSave} disabled={saving || !appointment?.checkInTime}
              style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 12, padding: '11px 26px', fontSize: 13.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? t.saving : `💾 ${t.save}`}
            </button>
          </div>
        </div>

        {/* ✅ مرفقات هذي الزيارة — نفس مكوّن ملف المريض، بس مربوط بهذا الموعد بالذات */}
        <div style={{ marginBottom: 20, opacity: appointment?.checkInTime ? 1 : 0.5, pointerEvents: appointment?.checkInTime ? 'auto' : 'none' }}>
          <PatientAttachmentsTab patientId={appointment.patientId} lang={lang} appointmentId={appointmentId} />
        </div>

        {/* السجل المرضي السابق */}
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, marginBottom: 14 }}>{t.history}</h3>

          {history.length === 0 ? (
            <p style={{ fontSize: 12.5, color: TEXT_MUTED, fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>{t.noHistory}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr>
                    {[t.visitDate, t.doctor, t.type, t.diagnosis, t.prescription, t.attachments].map((c, i) => (
                      <th key={i} style={{ padding: '10px 12px', textAlign: 'start', fontSize: 11, fontWeight: 700, color: TEXT_MUTED, background: '#F8FAFA', borderBottom: `1px solid ${BORDER}` }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id}>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: TEXT_DARK, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>
                        {h.appointmentDate ? new Date(h.appointmentDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: TEXT_DARK, borderBottom: `1px solid ${BORDER}` }}>{h.doctorName || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: TEXT_DARK, borderBottom: `1px solid ${BORDER}` }}>{h.visitType || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: TEXT_DARK, borderBottom: `1px solid ${BORDER}`, maxWidth: 160 }}>{h.diagnosis || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: TEXT_DARK, borderBottom: `1px solid ${BORDER}`, maxWidth: 160 }}>{h.prescription || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: TEXT_DARK, borderBottom: `1px solid ${BORDER}` }}>
                        {h.attachments.length > 0 ? `📎 ${h.attachments.length}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}