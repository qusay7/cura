import { useEffect, useRef } from 'react'

/**
 * ✅ يحذّر المستخدم قبل إغلاق التبويب أو تحديث الصفحة لو فيه تعديلات غير
 * محفوظة — لا حماية من التنقّل الداخلي بالتطبيق (Router الحالي لا يدعم
 * حجب التنقّل الداخلي إلا بإعداد Data Router، وهو تغيير معماري أكبر من
 * نطاق هذا الإصلاح)، فقط من إغلاق/تحديث المتصفح الفعلي.
 *
 * `ready` يؤخَّر أخذ "الصورة المرجعية" الأولى للنموذج لحين انتهاء تحميل
 * البيانات الأصلية (بصفحات التعديل) — عشان تعبئة النموذج من الخادم ما
 * تُحسَب هي نفسها "تعديل غير محفوظ".
 */
export function useUnsavedChangesWarning<T>(form: T, ready: boolean = true) {
  const baselineRef = useRef<string | null>(null)

  useEffect(() => {
    if (ready && baselineRef.current === null) {
      baselineRef.current = JSON.stringify(form)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const isDirty = ready && baselineRef.current !== null && JSON.stringify(form) !== baselineRef.current

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  return isDirty
}
