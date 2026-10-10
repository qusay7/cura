// ✅ messagebox عام يُستدعى من أي صفحة بسطر واحد، بدون ما تحتاج الصفحة تدير
// حالة نافذة منبثقة بنفسها — نفس أسلوب أحداث cura-lang-change المستخدم بالتطبيق،
// بس لعرض رسالة تحذير/خطأ واضحة بمنتصف الشاشة بدل بانر نصي سهل تفوّته

export type MessageBoxType = 'error' | 'warning' | 'success' | 'info'

export const showMessageBox = (message: string, type: MessageBoxType = 'error') => {
  window.dispatchEvent(new CustomEvent('cura-messagebox', { detail: { message, type } }))
}
