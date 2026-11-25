// كلمة مرور عشوائية حقيقية — بدون أحرف متشابهة بصرياً (0/O، 1/l/I) لتسهيل
// كتابتها يدوياً، وبدون أي اشتقاق من اسم المستخدم/النطاق الفرعي
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

export function generateRandomPassword(length = 12): string {
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join('')
}
