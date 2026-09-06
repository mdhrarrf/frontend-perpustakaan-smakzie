import apiClient from './client'
import type { ApiResponse, DashboardStats, ChartDataPoint } from '@/types'

export const dashboardService = {
  async stats(): Promise<DashboardStats> {
    const { data } = await apiClient.get<ApiResponse<DashboardStats>>('/perpustakaan/dashboard/stats')
    return data.data!
  },

  async chart(days = 7): Promise<{ loan_chart: ChartDataPoint[]; top_books: Array<{ id: number; judul: string; penulis: string; jumlah_dipinjam: number }> }> {
    const { data } = await apiClient.get('/perpustakaan/dashboard/chart', { params: { days } })
    return data.data!
  },
}

export const uploadService = {
  async photo(base64: string, context: 'borrow' | 'return' = 'borrow'): Promise<{ path: string; url: string }> {
    const { data } = await apiClient.post('/perpustakaan/upload/photo', {
      photo_base64: base64,
      context,
    })
    return data.data!
  },
}

export const violationService = {
  async check(studentId: number, bookId: number) {
    const { data } = await apiClient.get('/perpustakaan/violations/check', {
      params: { student_id: studentId, book_id: bookId },
    })
    return data.data!
  },

  async list(params = {}) {
    const { data } = await apiClient.get('/perpustakaan/violations', { params })
    return data
  },
}

export const auditService = {
  async list(params = {}) {
    const { data } = await apiClient.get('/perpustakaan/audit-logs', { params })
    return data
  },
}

export const lostBookService = {
  async list(params = {}) {
    const { data } = await apiClient.get('/perpustakaan/lost-books', { params })
    return data
  },

  async resolve(id: number, payload: { compensation_type: string; notes?: string }) {
    const { data } = await apiClient.patch(`/perpustakaan/lost-books/${id}/resolve`, payload)
    return data
  },
}
