import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
//import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

// ═══════════════════════════════════════════════════════════════════════════
// 🔐 إعدادات API الآمنة
// ═══════════════════════════════════════════════════════════════════════════

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ لإرسال httpOnly cookies
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
})

// ═══════════════════════════════════════════════════════════════════════════
// 🔐 إدارة التوكنات — في الذاكرة بدل localStorage (أمان من XSS)
// ═══════════════════════════════════════════════════════════════════════════

interface AuthTokens {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
}

let authTokens: AuthTokens = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
}

// ✅ محاولة استرجاع التوكنات من localStorage عند التحميل
// ✅ محاولة استرجاع التوكنات من sessionStorage عند التحميل
// ✅ استخدم localStorage فقط (ليس sessionStorage)
const initializeTokens = () => {
  try {
    const stored = localStorage.getItem('_auth_tokens')
    if (stored) {
      const parsed = JSON.parse(stored)
      authTokens = {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        expiresAt: parsed.expiresAt
      }
      if (authTokens.expiresAt && Date.now() > authTokens.expiresAt) {
        clearAuthTokens()
      }
    }
  } catch (e) {
    console.error('Failed to initialize tokens:', e)
    clearAuthTokens()
  }
}

const setAuthTokens = (accessToken: string, refreshToken: string | null, expiresIn?: number) => {
  authTokens.accessToken = accessToken
  authTokens.refreshToken = refreshToken
  authTokens.expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : null

  try {
    localStorage.setItem('_auth_tokens', JSON.stringify({
      accessToken,
      refreshToken,
      expiresAt: authTokens.expiresAt
    }))
  } catch (e) {
    console.error('❌ Failed to save tokens:', e)
  }
}

const clearAuthTokens = () => {
  authTokens = { accessToken: null, refreshToken: null, expiresAt: null }
  try {
    localStorage.removeItem('_auth_tokens')
  } catch {}
}















 
const getAccessToken = () => authTokens.accessToken




const getRefreshToken = () => authTokens.refreshToken



initializeTokens()

// ═══════════════════════════════════════════════════════════════════════════
// 🔐 Endpoints عامة (بدون توكن مطلوب)
// ═══════════════════════════════════════════════════════════════════════════

const PUBLIC_GET_ENDPOINTS = ['/plans', '/clinics/by-subdomain']

function isPublicGetRequest(url: string, method?: string) {
  const isGet = (method || 'get').toLowerCase() === 'get'
  return isGet && PUBLIC_GET_ENDPOINTS.some(p => url.includes(p))
}

// ═══════════════════════════════════════════════════════════════════════════
// ✅ منع تضاهي طلبات المتحورة (POST/PUT/PATCH/DELETE) — Deduplication
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

  api[method] = (url: string, dataOrConfig?: any, maybeConfig?: any) => {
    const data = method === 'delete' ? undefined : dataOrConfig
    const key = buildRequestKey(method, url, data)

    const existing = pendingRequests.get(key)
    if (existing) {
      // ✅ نفس العملية شغّالة — رجّع نفس النتيجة
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

// ═══════════════════════════════════════════════════════════════════════════
// 🔐 حماية من Race Conditions في تجديد التوكن
// ═══════════════════════════════════════════════════════════════════════════

let isRefreshing = false
let refreshQueue: Array<{
  resolve: (token: string) => void
  reject: (error: any) => void
}> = []

const processRefreshQueue = (error: any, newToken: string | null = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else if (newToken) {
      resolve(newToken)
    } else {
      reject(new Error('Token refresh failed'))
    }
  })
  refreshQueue = []
}

// ─── Request Interceptor ──────────────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const url = config.url || ''

  // ✅ Endpoints عامة: بدون توكن
  if (isPublicGetRequest(url, config.method)) {
    return config
  }

  // ✅ إضافة التوكن من الذاكرة
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// ─── Response Interceptor ────────────────────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const url = originalRequest?.url || ''

    // ❌ Endpoints عامة: لا تحاول تجديد
    if (isPublicGetRequest(url, originalRequest?.method)) {
      return Promise.reject(error)
    }

    // ❌ Endpoints المصادقة: لا تحاول تجديد
    if (url.includes('/auth/') || url.includes('my-permissions')) {
      return Promise.reject(error)
    }

        // ✅ انتهاء الاشتراك — تنبيه وتسجيل خروج
    if (
      error.response?.status === 402 &&
      (error.response?.data as any)?.code === 'SUBSCRIPTION_EXPIRED'
    ) {
      const msg = (error.response?.data as any)?.message
        || 'انتهى اشتراك العيادة. يرجى التجديد للمتابعة.'
      alert(msg)
      clearAuthTokens()
      localStorage.removeItem('user')
      localStorage.removeItem('permissions')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // ✅ معالجة 401 (انتهت الصلاحية)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = getRefreshToken()

      // ❌ لا يوجد refresh token — اذهب إلى login
      if (!refreshToken) {
        clearAuthTokens()
        window.location.href = '/login'
        return Promise.reject(new Error('No refresh token available'))
      }

      // ✅ إذا كان تجديد قيد التنفيذ، انتظر النتيجة
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              resolve(api(originalRequest))
            },
            reject: (err: any) => {
              reject(err)
            },
          })
        })
      }

      // ✅ ابدأ عملية التجديد
      isRefreshing = true

      try {
        // 🔄 طلب التجديد
        const refreshResponse = await api.post(
          '/auth/refresh',
          { refreshToken },
          { withCredentials: true }
        )

        const { token, refreshToken: newRefreshToken, expiresIn } = refreshResponse.data

        // ✅ تحديث التوكنات
        setAuthTokens(token, newRefreshToken, expiresIn)

        // ✅ إعادة محاولة الطلب الأصلي
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`
        }

        // ✅ معالجة جميع الطلبات المعلقة
        processRefreshQueue(null, token)
        isRefreshing = false

        return api(originalRequest)
      } catch (refreshError) {
        // ❌ فشل التجديد
        clearAuthTokens()
        processRefreshQueue(refreshError, null)
        isRefreshing = false

        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// ═══════════════════════════════════════════════════════════════════════════
// 🔐 تصدير الدوال للاستخدام الخارجي
// ═══════════════════════════════════════════════════════════════════════════

export const authService = {
  setTokens: setAuthTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens: clearAuthTokens,
  isAuthenticated: () => !!getAccessToken(),
}

export default api