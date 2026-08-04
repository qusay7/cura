import { useEffect, useRef, useState } from 'react'
import api from '../api/axios'

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const DANGER = '#EF4444'

const T = {
  ar: {
    title: '📎 المرفقات والفحوصات', subtitle: 'صور أشعة، نتائج تحاليل، وأي ملفات طبية للمريض',
    upload: '+ رفع ملف', uploading: 'جارٍ الرفع...', dropHint: 'اسحب ملف هنا أو اضغط للاختيار',
    category: 'نوع المرفق', xray: 'أشعة', lab: 'تحليل مخبري', other: 'أخرى',
    notes: 'ملاحظات (اختياري)', notesPlaceholder: 'وصف مختصر...',
    noFiles: 'لا توجد مرفقات لهذا المريض بعد', view: 'عرض', download: 'تحميل', delete: 'حذف',
    confirmDelete: 'متأكد تبي تحذف هذا الملف؟', allowedTypes: 'الأنواع المسموحة: JPG, PNG, WEBP, PDF (حتى 20 ميجا)',
    uploadedAt: 'رُفع بتاريخ', cancel: 'إلغاء', save: 'حفظ',
  },
  en: {
    title: '📎 Attachments & Results', subtitle: "X-rays, lab results, and any medical files for the patient",
    upload: '+ Upload File', uploading: 'Uploading...', dropHint: 'Drag a file here or click to choose',
    category: 'Category', xray: 'X-Ray', lab: 'Lab Result', other: 'Other',
    notes: 'Notes (optional)', notesPlaceholder: 'Brief description...',
    noFiles: 'No attachments for this patient yet', view: 'View', download: 'Download', delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this file?', allowedTypes: 'Allowed types: JPG, PNG, WEBP, PDF (up to 20 MB)',
    uploadedAt: 'Uploaded on', cancel: 'Cancel', save: 'Save',
  },
}

interface AttachmentItem {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  category: string | null
  notes: string | null
  createdAt: string
  appointmentId: string | null
  isImage: boolean
}

const fmtSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function PatientAttachmentsTab({ patientId, lang, appointmentId }: { patientId: string; lang: 'ar' | 'en'; appointmentId?: string }) {
  const t = T[lang]
  const isAr = lang === 'ar'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [items, setItems] = useState<AttachmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [category, setCategory] = useState('other')
  const [notes, setNotes] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const fetchAttachments = () => {
    setLoading(true)
    api.get(`/attachments/patient/${patientId}`)
      .then(res => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAttachments() }, [patientId])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setPendingFile(file); setCategory('other'); setNotes(''); setError('') }
  }

  const handleUpload = async () => {
    if (!pendingFile) return
    setUploading(true); setError(''); setSuccess('')
    try {
      const formData = new FormData()
      formData.append('file', pendingFile)
      formData.append('patientId', patientId)
      formData.append('category', category)
      if (appointmentId) formData.append('appointmentId', appointmentId)
      if (notes) formData.append('notes', notes)

      await api.post(`/attachments/upload?lang=${lang}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSuccess(isAr ? 'تم الرفع بنجاح ✅' : 'Uploaded successfully ✅')
      setPendingFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchAttachments()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || (isAr ? 'فشل الرفع' : 'Upload failed'))
    } finally {
      setUploading(false)
    }
  }

  const handleView = async (item: AttachmentItem) => {
    try {
      const res = await api.get(`/attachments/${item.id}/file`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      setPreviewId(item.id)
      setPreviewUrl(url)
    } catch {
      setError(isAr ? 'تعذّر فتح الملف' : 'Could not open file')
    }
  }

  const handleDownload = async (item: AttachmentItem) => {
    try {
      const res = await api.get(`/attachments/${item.id}/file`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = item.fileName
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError(isAr ? 'تعذّر تحميل الملف' : 'Could not download file')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.confirmDelete)) return
    try {
      await api.delete(`/attachments/${id}?lang=${lang}`)
      fetchAttachments()
    } catch {
      setError(isAr ? 'تعذّر الحذف' : 'Could not delete')
    }
  }

  const categoryLabel = (c: string | null) => c === 'xray' ? t.xray : c === 'lab' ? t.lab : t.other
  const categoryIcon = (c: string | null) => c === 'xray' ? '🩻' : c === 'lab' ? '🧪' : '📄'

  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>{t.title}</h3>
          <p style={{ fontSize: 12, color: TEXT_MUTED, margin: '4px 0 0' }}>{t.subtitle}</p>
        </div>
        <div>
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileSelect} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current?.click()}
            style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            {t.upload}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12.5, color: DANGER }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12.5, color: '#166534' }}>
          ✅ {success}
        </div>
      )}

      {/* فورم تأكيد الرفع — يظهر بس بعد اختيار ملف */}
      {pendingFile && (
        <div style={{ background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, marginBottom: 18 }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_DARK, marginBottom: 12 }}>📎 {pendingFile.name} ({fmtSize(pendingFile.size)})</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.category}</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG }}>
                <option value="xray">🩻 {t.xray}</option>
                <option value="lab">🧪 {t.lab}</option>
                <option value="other">📄 {t.other}</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.notes}</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder={t.notesPlaceholder}
                style={{ width: '100%', padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: 'inherit', color: TEXT_DARK, background: CARD_BG }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleUpload} disabled={uploading}
              style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 9, padding: '8px 18px', fontSize: 12.5, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
              {uploading ? t.uploading : `✅ ${t.save}`}
            </button>
            <button onClick={() => { setPendingFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }} disabled={uploading}
              style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 9, padding: '8px 16px', fontSize: 12, color: TEXT_MUTED, cursor: 'pointer' }}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      <p style={{ fontSize: 10.5, color: TEXT_MUTED, marginBottom: 14 }}>💡 {t.allowedTypes}</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: TEXT_MUTED, fontSize: 12.5 }}>...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: TEXT_MUTED, fontSize: 12.5 }}>{t.noFiles}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {items.map(item => (
            <div key={item.id} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{categoryIcon(item.category)}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: TEXT_DARK, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.fileName}</p>
                  <p style={{ fontSize: 10, color: TEXT_MUTED, margin: '2px 0 0' }}>{categoryLabel(item.category)} · {fmtSize(item.fileSize)}</p>
                </div>
              </div>
              {item.notes && <p style={{ fontSize: 10.5, color: TEXT_MUTED, marginBottom: 8, fontStyle: 'italic' }}>{item.notes}</p>}
              <p style={{ fontSize: 9.5, color: TEXT_MUTED, marginBottom: 10 }}>
                {t.uploadedAt}: {new Date(item.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => handleView(item)}
                  style={{ flex: 1, background: PRIMARY_SOFT, color: PRIMARY, border: 'none', borderRadius: 8, padding: '6px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  👁️ {t.view}
                </button>
                <button onClick={() => handleDownload(item)}
                  style={{ flex: 1, background: '#F1F4F4', color: TEXT_DARK, border: 'none', borderRadius: 8, padding: '6px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  ⬇️
                </button>
                <button onClick={() => handleDelete(item.id)}
                  style={{ background: '#FFF5F5', color: DANGER, border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* نافذة معاينة الملف */}
      {previewId && previewUrl && (
        <div onClick={() => { setPreviewId(null); URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', background: '#FFF', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setPreviewId(null); URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }}
                style={{ background: '#F1F4F4', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            {items.find(i => i.id === previewId)?.isImage ? (
              <img src={previewUrl} alt="" style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain' }} />
            ) : (
              <iframe src={previewUrl} title="preview" style={{ width: '80vw', height: '80vh', border: 'none' }} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}