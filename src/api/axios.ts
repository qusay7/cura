import axios from 'axios'

const API_BASE_URL = window.location.hostname === 'localhost'
  ? '/api'
  : `http://${window.location.hostname}:5192/api`

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ✅ روابط عامة — بس لو الطلب "قراءة" (GET). أي طلب تاني (إنشاء/تعديل/حذف)
// لنفس الرابط يبقى محمي ولازم توكن، حتى لو فيه '/plans' بعنوانه.
const PUBLIC_GET_ENDPOINTS = ['/plans', '/clinics/by-subdomain']

function isPublicGetRequest(url: string, method?: string) {
  const isGet = (method || 'get').toLowerCase() === 'get'
  return isGet && PUBLIC_GET_ENDPOINTS.some(p => url.includes(p))
}

// ═══════════════════════════════════════════════════════════════════════════
// ✅ منع تنفيذ نفس عملية الحفظ/التعديل/الحذف أكثر من مرة بالتوازي —
// يحمي كل صفحات المشروع تلقائياً بدون تعديل أي واحدة منها.
//
// الفكرة: أي طلب POST/PUT/PATCH/DELETE له "بصمة" (الرابط + نوعه + محتوى الطلب).
// لو نفس البصمة أصلاً "قيد التنفيذ" (لسا الرد ما وصل)، أي استدعاء ثاني بنفس
// اللحظة يرجعله نفس الـ Promise الأول — بدون ما يرسل طلب شبكي ثاني إطلاقاً.
// أول ما يوصل الرد (نجاح أو فشل)، البصمة تُحذف وتصير العملية جاهزة تُعاد من جديد.
// ═══════════════════════════════════════════════════════════════════════════
const pendingRequests = new Map<string, Promise<any>>()
const MUTATING_METHODS = ['post', 'put', 'patch', 'delete'] as const

function buildRequestKey(method: string, url: string, data: unknown): string {
  let bodySignature = ''
  try {
    bodySignature = typeof data === 'string' ? data : JSON.stringify(data ?? '')
  } catch {
    bodySignature = String(data)
  }
  return `${method.toUpperCase()}::${url}::${bodySignature}`
}

MUTATING_METHODS.forEach((method) => {
  const original = api[method].bind(api)

   // نعيد تعريف التوقيع يدوياً لأن axios overloads معقدة هنا
  api[method] = (url: string, dataOrConfig?: any, maybeConfig?: any) => {
    // delete(url, config) عندها توقيع مختلف شوي عن post/put/patch(url, data, config)
    const data = method === 'delete' ? undefined : dataOrConfig
    const key = buildRequestKey(method, url, data)

    const existing = pendingRequests.get(key)
    if (existing) {
      // ✅ نفس العملية شغّالة أصلاً — رجّع نفس النتيجة بدل ما نرسل طلب مكرر
      return existing
    }

    const config = method === 'delete' ? dataOrConfig : maybeConfig
    const promise = (method === 'delete' ? original(url, config) : original(url, data, config))
      .finally(() => {
        pendingRequests.delete(key)
      })

    pendingRequests.set(key, promise)
    return promise
  }
})

// ─── Request Interceptor ──────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const url = config.url || ''
  if (isPublicGetRequest(url, config.method)) return config

  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response Interceptor ────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config
    const url = originalRequest?.url || ''

    if (isPublicGetRequest(url, originalRequest?.method)) {
      return Promise.reject(error)
    }

    if (url.includes('/auth/') || url.includes('my-permissions')) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        )

        const { token, refreshToken: newRefreshToken } = response.data
        localStorage.setItem('token', token)
        localStorage.setItem('refreshToken', newRefreshToken)

        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)

      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api