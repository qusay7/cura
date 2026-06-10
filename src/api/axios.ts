import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request Interceptor ──────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response Interceptor ────────────────────────────────────────────────
api.interceptors.response.use(
  async (response) => {
    // ✅ تحديث الصلاحيات كل 5 دقائق
    // تجنب الـ loop — لا تحدّث عند استدعاء my-permissions نفسه
    const isPermsRequest = response.config.url?.includes('my-permissions')

    if (!isPermsRequest) {
      const lastUpdate = localStorage.getItem('perms_updated_at')
      const now = Date.now()
      const fiveMinutes = 5 * 60 * 1000

      if (!lastUpdate || now - Number(lastUpdate) > fiveMinutes) {
        try {
          // ✅ استخدم axios مباشرة بدل api لتجنب الـ loop
          const token = localStorage.getItem('token')
          const res = await axios.get(`${API_BASE_URL}/roles/my-permissions`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          localStorage.setItem('permissions', JSON.stringify(res.data.permissions))
          localStorage.setItem('perms_updated_at', String(now))
        } catch {
          // تجاهل الخطأ — لا نوقف الطلب الأصلي
        }
      }
    }

    return response
  },

  async (error) => {
    const originalRequest = error.config

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