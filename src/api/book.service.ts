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

  // Smart Scan: mengembalikan full response termasuk meta (registered, data_source)
  async scanSmart(code: string): Promise<ApiResponse<Book> & { meta?: { registered: boolean; registration_type?: string; data_source?: string } }> {
    const { data } = await apiClient.get<ApiResponse<Book>>(`${BASE}/scan`, { params: { code } })
    return data as ApiResponse<Book> & { meta?: { registered: boolean; registration_type?: string; data_source?: string } }
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

  async authors(q?: string): Promise<string[]> {
    const { data } = await apiClient.get<ApiResponse<string[]>>(`${BASE}/authors`, { params: { q } })
    return data.data ?? []
  },

  async publishers(q?: string): Promise<string[]> {
    const { data } = await apiClient.get<ApiResponse<string[]>>(`${BASE}/publishers`, { params: { q } })
    return data.data ?? []
  },

  async getItems(id: number): Promise<BookItemsResponse> {
    const { data } = await apiClient.get<ApiResponse<BookItemsResponse>>(`${BASE}/${id}/items`)
    return data.data!
  },
}

export interface BookItem {
  item_id: number
  item_code: string
  call_number: string
  coll_type: string
  status: string
  status_label: string
}

export interface BookItemsResponse {
  biblio_id: number
  judul: string
  penulis: string
  isbn: string
  call_number?: string
  lokasi_rak: string
  items: BookItem[]
}
