import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

// Axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  // Axios sets JSON for objects; browser sets multipart boundaries for FormData.
})

// ── Request Interceptor: đính kèm Access Token ───────────────────
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().getAccessToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor: tự động refresh token ──────────────────
let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Binary PDF requests also receive JSON 401 errors as Blob. Decode only
    // JSON errors so TOKEN_EXPIRED can use the existing refresh/retry flow.
    if (error.response?.status === 401 &&
        error.response.data instanceof Blob &&
        error.response.headers?.['content-type']?.includes('application/json')) {
      try {
        error.response.data = JSON.parse(await error.response.data.text())
      } catch { /* fall through with original HTTP error */ }
    }

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { refreshToken } = useAuthStore.getState()
        const { data } = await axios.post('/api/auth/refresh', { refreshToken })
        const newAccessToken = data.data.accessToken

        useAuthStore.getState().setAuth({
          ...useAuthStore.getState(),
          accessToken:  newAccessToken,
          refreshToken: data.data.refreshToken,
        })

        processQueue(null, newAccessToken)
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
