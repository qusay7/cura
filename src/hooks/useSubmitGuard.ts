import { useRef, useCallback, useState } from 'react'

/**
 * يمنع تنفيذ نفس العملية أكثر من مرة بالتوازي — حتى لو المستخدم ضغط الزر
 * عدة مرات بسرعة قبل ما تتحدث الواجهة. بيعتمد على useRef (يتحدث فوراً،
 * بدون انتظار إعادة رسم React) بدل الاعتماد بس على state، فيسد
 * "النافذة الزمنية" اللي فيها ضغطة ثانية ممكن تنفلت قبل ما يصير الزر disabled.
 *
 * الاستخدام:
 *   const { run: handleSave, loading: saving } = useSubmitGuard(async () => {
 *     await api.post('/staff', payload)
 *   })
 *   <button onClick={handleSave} disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ'}</button>
 */
export function useSubmitGuard<T extends any[]>(handler: (...args: T) => Promise<void>) {
  const isRunning = useRef(false)
  const [loading, setLoading] = useState(false)

  const run = useCallback(async (...args: T) => {
    if (isRunning.current) return   // ✅ تجاهل أي ضغطة إضافية أثناء التنفيذ الحالي
    isRunning.current = true
    setLoading(true)
    try {
      await handler(...args)
    } finally {
      isRunning.current = false
      setLoading(false)
    }
  }, [handler])

  return { run, loading }
}