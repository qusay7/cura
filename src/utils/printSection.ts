import api from '../api/axios'

// ✅ هروب بسيط للنص قبل حقنه بـ HTML — النصوص هون دايماً بيانات مريض حقيقية
// (تشخيص/وصفة/ملاحظات)، لازم تُعامل كنص خام مش HTML حتى لو فيها < أو &
export const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

interface ClinicLetterhead {
  name: string
  logoDataUrl?: string | null
  address?: string | null
  phone?: string | null
}

let cachedClinic: ClinicLetterhead | null = null

// ✅ نفس منطق PrintHeader.tsx بالضبط — نحوّل الشعار لـ Base64 مضمّن عشان يطبع
// صحيح بمعزل عن أي تبعية Cross-Origin أو Cache، بس هون داخل نافذة طباعة جديدة
const fetchClinicLetterhead = async (): Promise<ClinicLetterhead> => {
  if (cachedClinic) return cachedClinic
  try {
    // ✅ نقطة مخصّصة متاحة لأي دور (طبيب، استقبال...) — GET /clinics/{id}
    // محصورة بـ SuperAdmin/ClinicStaff/ClinicAdmin وكانت بترجع 403 لباقي
    // الأدوار، فتطبع فورمات الوصفة/التحاليل بدون شعار ولا اسم عيادة
    const res = await api.get('/clinics/letterhead')
    const logo = res.data.logo || null
    let logoDataUrl: string | null = null
    if (logo) {
      try {
        // ✅ الشعار مخزّن كـ /logos/xxx.png — جذر الباك اند نفسه، مش الفرونت اند.
        // نمرّ عبر baseURL (/api) بدل جذر الفرونت اند عشان يوصل فعلاً عبر نفس
        // مسار الريفيرس بروكسي الشغّال أصلاً (الباك اند يعرض نفس المجلد تحت /api/logos كمان)
        const imgRes = await fetch(`${api.defaults.baseURL || ''}${logo}`)
        if (!imgRes.ok) throw new Error('logo fetch failed')
        const blob = await imgRes.blob()
        logoDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      } catch { /* بدون شعار، نكمل */ }
    }
    cachedClinic = { name: res.data.name, logoDataUrl, address: res.data.address, phone: res.data.phone }
  } catch {
    cachedClinic = { name: '' }
  }
  return cachedClinic
}

// ✅ يفتح نافذة جديدة فاضية ويطبع محتوى منفصل تماماً عن باقي الصفحة — نفس مبدأ
// طباعة فاتورة بصفحة الفواتير (نافذة معزولة)، بس هون نبني الـ HTML محلياً
// بدل توليد PDF بالسيرفر، لأنها مجرد نصوص (تشخيص/وصفة/ملاحظات/تقرير)
export const printSection = async (opts: {
  clinicId: string
  title: string
  isAr: boolean
  bodyHtml: string
  doctorName?: string | null
}) => {
  const clinic = await fetchClinicLetterhead()
  const logoDataUrl = clinic.logoDataUrl

  const win = window.open('', '_blank')
  if (!win) return

  const dir = opts.isAr ? 'rtl' : 'ltr'
  const now = new Date().toLocaleString(opts.isAr ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })

  win.document.write(`
    <!DOCTYPE html>
    <html dir="${dir}" lang="${opts.isAr ? 'ar' : 'en'}">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(opts.title)}</title>
      <style>
        body { font-family: 'Cairo', 'Inter', sans-serif; color: #2C3E3F; padding: 32px; max-width: 720px; margin: 0 auto; }
        .letterhead { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #5B8C8F; padding-bottom: 14px; margin-bottom: 20px; }
        .letterhead img { width: 48px; height: 48px; object-fit: contain; border-radius: 8px; }
        .clinic-name { font-size: 18px; font-weight: 700; margin: 0; }
        .clinic-meta { font-size: 11.5px; color: #6B8A8C; margin: 2px 0 0; }
        h2 { font-size: 16px; margin: 0 0 16px; }
        .body-text { font-size: 14px; line-height: 1.8; white-space: pre-wrap; }
        .footer { margin-top: 28px; font-size: 10.5px; color: #6B8A8C; border-top: 1px solid #DCE5E5; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="letterhead">
        ${logoDataUrl ? `<img src="${logoDataUrl}" />` : ''}
        <div>
          <p class="clinic-name">${escapeHtml(clinic.name || '')}</p>
          ${clinic.address || clinic.phone ? `<p class="clinic-meta">${escapeHtml([clinic.address, clinic.phone].filter(Boolean).join(' · '))}</p>` : ''}
        </div>
      </div>
      <h2>${escapeHtml(opts.title)}</h2>
      <div class="body-text">${opts.bodyHtml}</div>
      <div class="footer">
        ${opts.doctorName ? `${opts.isAr ? 'الطبيب' : 'Doctor'}: ${escapeHtml(opts.doctorName)} · ` : ''}${opts.isAr ? 'تاريخ الطباعة' : 'Printed'}: ${now}
      </div>
    </body>
    </html>
  `)
  win.document.close()

  const triggerPrint = () => { win.focus(); win.print() }
  const img = win.document.querySelector('img')
  if (img && !(img as HTMLImageElement).complete) {
    img.addEventListener('load', triggerPrint)
    img.addEventListener('error', triggerPrint)
  } else {
    setTimeout(triggerPrint, 150)
  }
}
