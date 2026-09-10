// src/utils/i18n.ts

// إعدادات العملة
export const CURRENCY = {
  code: 'JOD',
  symbol: 'د.أ',
  nameAr: 'دينار أردني',
  nameEn: 'Jordanian Dinar'
}

/**
 * تنسيق السعر حسب اللغة
 * @param price - السعر (رقم)
 * @param lang - اللغة ('ar' | 'en')
 * @returns السعر منسق مع العملة
 */
export const formatPrice = (price: number, lang: 'ar' | 'en'): string => {
  if (price === undefined || price === null) return '—'
  
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-JO' : 'en-JO', {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price)
}

/**
 * تنسيق التاريخ
 * @param dateStr - التاريخ (نص أو Date)
 * @param lang - اللغة ('ar' | 'en')
 * @returns التاريخ منسق
 */
export const formatDate = (dateStr: string | Date, lang: 'ar' | 'en'): string => {
  if (!dateStr) return '—'
  
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(date.getTime())) return '—'
  
  return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * تفضيل عرض الوقت للعيادة الحالية — "12" (ص/م) أو "24" — محفوظ بـ localStorage
 * عند تسجيل الدخول ومُحدَّث فوراً عند حفظه بصفحة الإعدادات
 */
export const getTimeFormat = (): '12' | '24' =>
  localStorage.getItem('cura-timeFormat') === '12' ? '12' : '24'

export const isHour12 = (): boolean => getTimeFormat() === '12'

/**
 * تنسيق الوقت
 * @param dateStr - التاريخ (نص أو Date)
 * @param lang - اللغة ('ar' | 'en')
 * @param hour12 - نظام 12/24 ساعة — افتراضياً حسب تفضيل العيادة
 * @returns الوقت منسق
 */
export const formatTime = (dateStr: string | Date, lang: 'ar' | 'en', hour12: boolean = isHour12()): string => {
  if (!dateStr) return '—'

  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(date.getTime())) return '—'

  return date.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12,
  })
}

/**
 * تنسيق التاريخ والوقت معاً
 * @param dateStr - التاريخ (نص أو Date)
 * @param lang - اللغة ('ar' | 'en')
 * @param hour12 - نظام 12/24 ساعة — افتراضياً حسب تفضيل العيادة
 * @returns التاريخ والوقت منسقين
 */
export const formatDateTime = (dateStr: string | Date, lang: 'ar' | 'en', hour12: boolean = isHour12()): string => {
  if (!dateStr) return '—'

  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(date.getTime())) return '—'

  return date.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12,
  })
}

/**
 * تنسيق سلسلة وقت خام من الباك اند ("HH:mm" أو "HH:mm:ss") بدون الحاجة لكائن Date كامل —
 * للأوقات اللي مالها تاريخ حقيقي مرتبط (دوام العيادة، خانات التقويم...)
 * @param t - الوقت الخام، مثلاً "14:15" أو "14:15:00"
 * @param hour12 - نظام 12/24 ساعة — افتراضياً حسب تفضيل العيادة
 */
export const formatTimeString = (t: string, hour12: boolean = isHour12()): string => {
  if (!t) return ''
  const [h, m] = t.substring(0, 5).split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return t
  if (!hour12) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

/**
 * الحصول على رمز العملة
 * @param lang - اللغة ('ar' | 'en')
 * @returns رمز العملة
 */
export const getCurrencySymbol = (lang: 'ar' | 'en'): string => {
  return lang === 'ar' ? CURRENCY.symbol : CURRENCY.code
}

/**
 * تنسيق رقم الهاتف
 * @param phone - رقم الهاتف
 * @returns رقم الهاتف منسق
 */
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return '—'
  
  // إزالة المسافات والأحرف غير الرقمية
  const cleaned = phone.replace(/\D/g, '')
  
  // تنسيق رقم سعودي/أردني
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
  }
  if (cleaned.length === 9) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
  }
  
  return phone
}

/**
 * تنسيق رقم المريض
 * @param number - رقم المريض
 * @returns رقم المريض منسق
 */
export const formatPatientNumber = (number: number): string => {
  return `#${number.toString().padStart(6, '0')}`
}