import apiClient from './client'
import type { ApiResponse, Teacher, Subject } from '@/types'
import { persistentMasterCache } from '@/utils/persistentCache'

export const teacherService = {
  async list(q?: string): Promise<Teacher[]> {
    // Jika ada pencarian spesifik 'q'
    if (q && q.trim()) {
      try {
        const { data } = await apiClient.get<ApiResponse<Teacher[]>>('/perpustakaan/teachers', {
          params: { q },
        })
        return data.data ?? []
      } catch (err) {
        // Fallback filter lokal dari cache jika jaringan bermasalah saat mencari
        const cached = await persistentMasterCache.get<Teacher[]>('master_teachers')
        if (cached && cached.length > 0) {
          const needle = q.toLowerCase().trim()
          return cached.filter((t) =>
            t.nama.toLowerCase().includes(needle) || (t.nip && t.nip.includes(needle))
          )
        }
        throw err
      }
    }

    // Mengambil seluruh guru dengan Zero-Fail Offline Fallback
    return persistentMasterCache.fetchWithOfflineFallback<Teacher[]>(
      'master_teachers',
      async () => {
        const { data } = await apiClient.get<ApiResponse<Teacher[]>>('/perpustakaan/teachers')
        return data.data ?? []
      },
      { ttlMs: 24 * 60 * 60 * 1000 }
    )
  },

  async subjects(): Promise<Subject[]> {
    return persistentMasterCache.fetchWithOfflineFallback<Subject[]>(
      'master_subjects',
      async () => {
        const { data } = await apiClient.get<ApiResponse<Subject[]>>('/perpustakaan/teachers/subjects')
        return data.data ?? []
      },
      { ttlMs: 24 * 60 * 60 * 1000 }
    )
  },
}
