import { useEffect, useRef, useState } from 'react'
import api from '../api/axios'
import { PRIMARY, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'

interface VoiceRecorderProps {
  patientId: string
  appointmentId?: string
  lang: 'ar' | 'en'
  category: string
}

interface SavedRecording {
  id: string
  fileName: string
  createdAt: string
}

const T = {
  ar: {
    record: '🎙️ تسجيل صوتي', stop: '⏹️ إيقاف', save: '💾 حفظ التسجيل', discard: 'حذف',
    recording: 'جارٍ التسجيل...', saving: 'جارٍ الحفظ...', saved: 'تم الحفظ ✅',
    noMicPermission: 'تعذّر الوصول للمايكروفون — تأكد من إعطاء الصلاحية',
    savedRecordings: 'تسجيلات سابقة',
  },
  en: {
    record: '🎙️ Record', stop: '⏹️ Stop', save: '💾 Save Recording', discard: 'Discard',
    recording: 'Recording...', saving: 'Saving...', saved: 'Saved ✅',
    noMicPermission: 'Could not access the microphone — check permission',
    savedRecordings: 'Previous recordings',
  },
}

// ✅ تسجيل صوتي يُحفظ كمرفق (بدون تحويل تلقائي لنص بعد — قرار واعي لتجنّب
// تكلفة/مخاطر خدمة تحويل خارجية بهذي المرحلة). يُستخدم بالملاحظات وبتقرير حالة
// المريض، كل واحد بـ category مختلف عشان نفرّق التسجيلات عن بعض.
export default function VoiceRecorder({ patientId, appointmentId, lang, category }: VoiceRecorderProps) {
  const t = T[lang]
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<SavedRecording[]>([])
  const [playUrls, setPlayUrls] = useState<Record<string, string>>({})

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const fetchSaved = () => {
    api.get(`/attachments/patient/${patientId}`)
      .then(res => setSaved((res.data as any[]).filter(a => a.category === category && a.appointmentId === appointmentId)))
      .catch(() => {})
  }

  useEffect(() => { fetchSaved() }, [patientId, appointmentId, category])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      streamRef.current?.getTracks().forEach(tr => tr.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startRecording = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setAudioBlob(blob)
        setPreviewUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(tr => tr.stop())
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      setError(t.noMicPermission)
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const discard = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setAudioBlob(null)
    setPreviewUrl(null)
  }

  const saveRecording = async () => {
    if (!audioBlob) return
    setSaving(true); setError('')
    try {
      const ext = audioBlob.type.includes('ogg') ? 'ogg' : 'webm'
      const file = new File([audioBlob], `voice-note-${Date.now()}.${ext}`, { type: audioBlob.type })
      const formData = new FormData()
      formData.append('file', file)
      formData.append('patientId', patientId)
      formData.append('category', category)
      if (appointmentId) formData.append('appointmentId', appointmentId)

      await api.post(`/attachments/upload?lang=${lang}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      discard()
      fetchSaved()
    } catch {
      setError(lang === 'ar' ? 'فشل حفظ التسجيل' : 'Failed to save the recording')
    } finally {
      setSaving(false)
    }
  }

  const loadPlayUrl = async (id: string) => {
    if (playUrls[id]) return
    try {
      const res = await api.get(`/attachments/${id}/file`, { responseType: 'blob' })
      setPlayUrls(prev => ({ ...prev, [id]: URL.createObjectURL(res.data) }))
    } catch { /* ignore */ }
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {!recording && !audioBlob && (
          <button type="button" onClick={startRecording}
            style={{ background: '#FFF5F5', color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: 9, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {t.record}
          </button>
        )}
        {recording && (
          <button type="button" onClick={stopRecording}
            style={{ background: '#EF4444', color: '#FFF', border: 'none', borderRadius: 9, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {t.stop} <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#FFF', marginInlineStart: 5, animation: 'pulse 1s infinite' }} />
          </button>
        )}
        {audioBlob && previewUrl && !recording && (
          <>
            <audio controls src={previewUrl} style={{ height: 32 }} />
            <button type="button" onClick={saveRecording} disabled={saving}
              style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 9, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? t.saving : t.save}
            </button>
            <button type="button" onClick={discard} disabled={saving}
              style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 9, padding: '6px 12px', fontSize: 11.5, color: TEXT_MUTED, cursor: 'pointer' }}>
              {t.discard}
            </button>
          </>
        )}
      </div>

      {error && <p style={{ fontSize: 11, color: '#EF4444', margin: '6px 0 0' }}>⚠️ {error}</p>}

      {saved.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 10.5, color: TEXT_MUTED }}>🎧 {t.savedRecordings} ({saved.length})</span>
          {saved.map(rec => (
            <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {playUrls[rec.id] ? (
                <audio controls src={playUrls[rec.id]} style={{ height: 30 }} />
              ) : (
                <button type="button" onClick={() => loadPlayUrl(rec.id)}
                  style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '4px 10px', fontSize: 11, color: PRIMARY, cursor: 'pointer' }}>
                  ▶️ {new Date(rec.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
