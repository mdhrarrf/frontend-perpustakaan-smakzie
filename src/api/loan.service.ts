import apiClient from './client'
import type { ApiResponse, Loan, PaginatedResponse, StandbyItem } from '@/types'

const BASE = '/perpustakaan/loans'

export interface CreateLoanPayload {
  loan_type: 'individual' | 'class'
  student_id: number
  book_id: number
  due_at: string
  borrow_photo?: string
  station_id?: string
  notes?: string
  // Class only
  class_name?: string
  teacher_name?: string
  subject_name?: string
  purpose?: string
  quantity?: number
}

export interface ReturnLoanPayload {
  return_photo?: string
  notes?: string
}

export interface ReturnResult {
  loan: Loan
  late_days: number
  is_late: boolean
  violation: {
    id: number
    late_days: number
    penalty_start_date: string
    penalty_end_date: string
  } | null
}

export const loanService = {
  async list(params: Record<string, unknown> = {}): Promise<ApiResponse<PaginatedResponse<Loan>>> {
    const { data } = await apiClient.get(BASE, { params })
    return data
  },

  async active(params = {}): Promise<ApiResponse<PaginatedResponse<Loan>>> {
    const { data } = await apiClient.get(`${BASE}/active`, { params })
    return data
  },

  async today(): Promise<Loan[]> {
    const { data } = await apiClient.get<ApiResponse<Loan[]>>(`${BASE}/today`)
    return data.data!
  },

  async standby(): Promise<StandbyItem[]> {
    const { data } = await apiClient.get<ApiResponse<StandbyItem[]>>(`${BASE}/standby`)
    return data.data!
  },

  async get(id: number): Promise<Loan> {
    const { data } = await apiClient.get<ApiResponse<Loan>>(`${BASE}/${id}`)
    return data.data!
  },

  async create(payload: CreateLoanPayload): Promise<Loan> {
    const { data } = await apiClient.post<ApiResponse<Loan>>(BASE, payload)
    return data.data!
  },

  async processReturn(id: number, payload: ReturnLoanPayload): Promise<ReturnResult> {
    const { data } = await apiClient.post<ApiResponse<ReturnResult>>(`${BASE}/${id}/return`, payload)
    return data.data!
  },

  async markLost(id: number, payload: { harga_buku?: number; compensation_type?: string; notes?: string }): Promise<void> {
    await apiClient.post(`${BASE}/${id}/mark-lost`, payload)
  },
}
