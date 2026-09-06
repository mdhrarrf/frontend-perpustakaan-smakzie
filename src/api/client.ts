import axios, { type AxiosError, type AxiosResponse } from 'axios'
import { useAuthStore } from '@/store/auth.store'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
})

// ── Request Interceptor: Inject Bearer token ─────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response Interceptor: Handle global errors ────────────────────────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired atau tidak valid — logout otomatis
      useAuthStore.getState().logout()
      // Redirect ke login jika bukan sudah di halaman login
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/kiosk')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

// ── Helper untuk extract error message ───────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> }
    if (data?.errors) {
      // Ambil error pertama dari validation errors
      const firstKey = Object.keys(data.errors)[0]
      return data.errors[firstKey]?.[0] ?? data.message ?? 'Terjadi kesalahan.'
    }
    return data?.message ?? error.message ?? 'Terjadi gangguan koneksi.'
  }
  if (error instanceof Error) return error.message
  return 'Terjadi kesalahan yang tidak diketahui.'
}

export default apiClient
