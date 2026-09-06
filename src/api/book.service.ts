import apiClient from './client'
import type { ApiResponse, Book, BookCategory, PaginatedResponse } from '@/types'

export interface BookFilters {
  q?: string
  status?: string
  kategori_id?: number
  available_only?: boolean
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
  per_page?: number
  page?: number
}

const BASE = '/perpustakaan/books'

export const bookService = {
  async list(filters: BookFilters = {}): Promise<ApiResponse<PaginatedResponse<Book>>> {
    const { data } = await apiClient.get(BASE, { params: filters })
    return data
  },

  async get(id: number): Promise<Book> {
    const { data } = await apiClient.get<ApiResponse<Book>>(`${BASE}/${id}`)
    return data.data!
  },

  async scan(code: string): Promise<Book> {
    const { data } = await apiClient.get<ApiResponse<Book>>(`${BASE}/scan`, { params: { code } })
    return data.data!
  },

  async create(formData: FormData): Promise<Book> {
    const { data } = await apiClient.post<ApiResponse<Book>>(BASE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data!
  },

  async update(id: number, formData: FormData): Promise<Book> {
    formData.append('_method', 'PUT')
    const { data } = await apiClient.post<ApiResponse<Book>>(`${BASE}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data!
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`)
  },

  async categories(): Promise<BookCategory[]> {
    const { data } = await apiClient.get<ApiResponse<BookCategory[]>>(`${BASE}/categories`)
    return data.data!
  },
}
