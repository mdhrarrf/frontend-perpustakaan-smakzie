import apiClient from './client'
import type { ApiResponse, PaginatedResponse, Student, Violation, Loan } from '@/types'

const BASE = '/perpustakaan/students'

export interface StudentClass {
  id: number
  nama: string
  tingkat: 'X' | 'XI' | 'XII' | string
  tingkat_num: number
  jurusan?: string
}

export const studentService = {
  async classes(): Promise<StudentClass[]> {
    const { data } = await apiClient.get<ApiResponse<StudentClass[]>>(`${BASE}/classes`)
    return data.data!
  },

  async list(params: Record<string, unknown> = {}): Promise<ApiResponse<PaginatedResponse<Student>>> {
    const { data } = await apiClient.get(BASE, { params })
    return data
  },

  async search(q: string, by: 'nis' | 'nisn' | 'barcode' | 'auto' = 'auto'): Promise<Student | Student[]> {
    const { data } = await apiClient.get<ApiResponse<Student | Student[]>>(`${BASE}/search`, { params: { q, by } })
    return data.data!
  },

  async get(id: number): Promise<Student> {
    const { data } = await apiClient.get<ApiResponse<Student>>(`${BASE}/${id}`)
    return data.data!
  },

  async create(payload: Partial<Student>): Promise<Student> {
    const { data } = await apiClient.post<ApiResponse<Student>>(BASE, payload)
    return data.data!
  },

  async update(id: number, payload: Partial<Student>): Promise<Student> {
    const { data } = await apiClient.put<ApiResponse<Student>>(`${BASE}/${id}`, payload)
    return data.data!
  },

  async loans(id: number, params = {}): Promise<ApiResponse<PaginatedResponse<Loan>>> {
    const { data } = await apiClient.get(`${BASE}/${id}/loans`, { params })
    return data
  },

  async violations(id: number): Promise<Violation[]> {
    const { data } = await apiClient.get<ApiResponse<Violation[]>>(`${BASE}/${id}/violations`)
    return data.data!
  },
}
