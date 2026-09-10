import apiClient from './client'
import type { ApiResponse } from '@/types'

export interface Visitor {
  id: number
  student_id: number | null
  nis: string | null
  nama: string
  kelas: string | null
  keperluan: 'baca' | 'pinjam' | 'kembali'
  loan_id: number | null
  visited_at: string
  notes: string | null
  created_at: string
}

export interface VisitorStats {
  total: number
  baca: number
  pinjam: number
  kembali: number
}

export interface VisitorsResponse {
  visitors: Visitor[] | { data: Visitor[]; current_page: number; last_page: number; total: number }
  stats: VisitorStats
  meta: {
    year: number
    month: number
    week: number | null
  }
}

export interface TextbookLoanItem {
  no_urt: number
  code_buku: string
  call_number: string
  judul_buku: string
  tanggal_pinjam: string
  tanggal_kembali: string
  is_returned: boolean
}

export interface TextbookLoanStudent {
  id: number | null
  nama: string
  nis: string
  nisn: string
  kelas: string
  komli: string
  telepon: string
  alamat: string
}

export interface TextbookLoanForm {
  loan_id: number
  loan_number: string
  loan_type: string
  student: TextbookLoanStudent
  borrowed_at: string
  due_at: string
  returned_at: string | null
  items: TextbookLoanItem[]
}

const BASE = '/perpustakaan/reports'

export const reportService = {
  async getVisitors(params: {
    year?: number
    month?: number
    week?: number
    keperluan?: string
    q?: string
    all?: boolean
  }): Promise<VisitorsResponse> {
    const { data } = await apiClient.get<ApiResponse<VisitorsResponse>>(`${BASE}/visitors`, { params })
    return data.data!
  },

  async addVisitor(payload: {
    nama: string
    kelas?: string
    nis?: string
    keperluan: 'baca' | 'pinjam' | 'kembali'
    student_id?: number
    visited_at?: string
    notes?: string
  }): Promise<Visitor> {
    const { data } = await apiClient.post<ApiResponse<Visitor>>(`${BASE}/visitors`, payload)
    return data.data!
  },

  async deleteVisitor(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/visitors/${id}`)
  },

  async getTextbookLoans(params: {
    student_id?: number
    loan_id?: number
    q?: string
    per_page?: number
  } = {}): Promise<{ data: TextbookLoanForm[]; total: number }> {
    const { data } = await apiClient.get(`${BASE}/textbook-loans`, { params })
    return data.data!
  },
}
