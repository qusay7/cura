import { useEffect, useState } from 'react'
import api from '../api/axios'

const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'

/**
 * ✅ رأس طباعة موحّد — يجيب شعار واسم العيادة تلقائياً، ويعرضهم بس وقت الطباعة
 * (زر 🖨️ طباعة)، بمحاذاة صحيحة (النص يمين بالعربي، الشعار يسار — والعكس بالإنجليزي).
 *
 * الاستخدام: حط <PrintHeader reportTitle={t.title} lang={lang} /> بأعلى أي صفحة،
 * وأضف className="no-print" لعنوان الصفحة العادي (اللي بالشاشة) عشان ما يتكرر وقت الطباعة.
 */
export default function PrintHeader({ reportTitle, lang }: { reportTitle: string; lang: 'ar' | 'en' }) {
  const [clinic, setClinic] = useState<{ name: string; logoDataUrl: string | null } | null>(null)
  const isAr = lang === 'ar'

  useEffect(() => {
    // ✅ GET /clinics/{id} محصورة بـ SuperAdmin/ClinicStaff/ClinicAdmin — أي
    // دور تاني (طبيب، استقبال...) كان ياخذ 403 صامت فيطلع الرأس بدون شعار ولا
    // اسم عيادة. /clinics/letterhead متاحة لأي مستخدم مسجّل بالعيادة
    api.get('/clinics/letterhead')
      .then(async res => {
        const logo = res.data.logo || null
        if (!logo) { setClinic({ name: res.data.name, logoDataUrl: null }); return }

        try {
          // ✅ نجيب الصورة كـ Blob ونحوّلها لبيانات Base64 مضمّنة بالصفحة —
          // يلغي الاعتماد على رابط خارجي (Cross-Origin) وقت الطباعة نهائياً،
          // بدل الاعتماد بس على Cache المتصفح اللي بعض محركات الطباعة تتجاهله.
          // الشعار مخزّن كـ /logos/xxx.png (جذر الباك اند) — نمرّ عبر baseURL
          // (/api) عشان يوصل عبر نفس مسار الريفيرس بروكسي الشغّال أصلاً
          const imgRes = await fetch(`${api.defaults.baseURL || ''}${logo}`)
          if (!imgRes.ok) throw new Error('logo fetch failed')
          const blob = await imgRes.blob()
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
          setClinic({ name: res.data.name, logoDataUrl: dataUrl })
        } catch {
          setClinic({ name: res.data.name, logoDataUrl: null })
        }
      })
      .catch(() => {})
  }, [])

  if (!clinic) return null

  const textBlock = (
    <div>
      <p style={{ fontSize: 16, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>{clinic.name}</p>
      <p style={{ fontSize: 11, color: TEXT_MUTED, margin: '2px 0 0' }}>{reportTitle}</p>
    </div>
  )
  const logoImg = clinic.logoDataUrl && (
    <img src={clinic.logoDataUrl} alt="logo" style={{ width: 56, height: 56, objectFit: 'contain' }} />
  )

  return (
    <div className="print-only-header">
      {/* ✅ بالعربي (RTL): النص أول (يطلع يمين)، الشعار ثاني (يطلع يسار) — والعكس بالإنجليزي */}
      {isAr ? <>{textBlock}{logoImg}</> : <>{logoImg}{textBlock}</>}
    </div>
  )
}