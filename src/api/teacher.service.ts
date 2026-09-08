import apiClient from './client'
import type { ApiResponse, Teacher } from '@/types'

export const teacherService = {
  async list(q?: string): Promise<Teacher[]> {
    const { data } = await apiClient.get<ApiResponse<Teacher[]>>('/perpustakaan/teachers', {
      params: q ? { q } : undefined,
    })
    return data.data ?? []
  },
}
