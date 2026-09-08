// Type definitions untuk Platform Perpustakaan SMK Negeri 1 Cianjur

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────
export interface AuthUser {
  id: number
  name: string
  username: string | null
  email: string
  phone: string | null
  avatar: string | null
  status: string
  token?: string
  token_type?: string
}

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

// ─────────────────────────────────────────────
// Book
// ─────────────────────────────────────────────
export interface BookCategory {
  id: number
  nama: string
  kode: string | null
  deskripsi: string | null
}

export interface Book {
  id: number
  kode_buku: string
  kode_qr: string | null
  kode_barcode: string | null
  judul: string
  penulis: string
  penerbit: string | null
  tahun_terbit: number | null
  isbn: string | null
  kategori_id: number | null
  kategori: BookCategory | null
  sinopsis: string | null
  cover: string | null
  harga: number
  jumlah_total: number
  jumlah_tersedia: number
  jumlah_dipinjam: number
  jumlah_hilang: number
  lokasi_rak: string | null
  status: 'active' | 'inactive' | 'archived'
  status_label: string
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────
// Student
// ─────────────────────────────────────────────
export interface Student {
  id: number
  nis: string
  nisn: string | null
  nama: string
  kelas: string | null
  angkatan: number | null
  jenis_kelamin: 'L' | 'P' | null
  foto: string | null
  status: 'active' | 'inactive' | 'alumni'
  status_label: string
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────
// Teacher & Subject
// ─────────────────────────────────────────────
export interface Subject {
  id: number
  kode: string
  nama: string
  kelompok?: string
}

export interface Teacher {
  id: number
  nip: string | null
  nama: string
  jenis_kelamin: 'L' | 'P'
  subjects: Subject[]
}

// ─────────────────────────────────────────────
// Loan
// ─────────────────────────────────────────────
export type LoanType   = 'individual' | 'class'
export type LoanStatus = 'active' | 'returned' | 'overdue' | 'lost'

export interface LoanItem {
  id: number
  book: Book
  quantity: number
}

export interface ViolationSummary {
  id: number
  late_days: number
  penalty_start_date: string
  penalty_end_date: string
  status: string
  status_label: string
}

export interface Loan {
  id: number
  loan_number: string
  loan_type: LoanType
  loan_type_label: string
  student: Student
  class_name: string | null
  teacher_name: string | null
  subject_name: string | null
  purpose: string | null
  borrowed_at: string
  due_at: string
  returned_at: string | null
  borrow_photo: string | null
  return_photo: string | null
  status: LoanStatus
  status_label: string
  late_days: number
  notes: string | null
  station_id: string | null
  items: LoanItem[]
  violation: ViolationSummary | null
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────
// Violation
// ─────────────────────────────────────────────
export type ViolationStatus = 'active' | 'expired' | 'resolved'

export interface Violation {
  id: number
  student: Student
  book: Book
  loan_id: number
  late_days: number
  penalty_start_date: string
  penalty_end_date: string
  status: ViolationStatus
  status_label: string
  created_at: string
}

// ─────────────────────────────────────────────
// Lost Book
// ─────────────────────────────────────────────
export interface LostBook {
  id: number
  loan_id: number
  book: Book
  student: Student
  harga_buku: number
  compensation_type: 'uang' | 'buku' | null
  compensation_status: 'pending' | 'resolved'
  resolved_at: string | null
  notes: string | null
  created_at: string
}

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────
export interface DashboardStats {
  total_buku: number
  buku_tersedia: number
  buku_dipinjam: number
  buku_hilang: number
  total_siswa: number
  pinjam_hari_ini: number
  kembali_hari_ini: number
  pinjam_aktif: number
  terlambat: number
  pelanggaran_aktif: number
  buku_hilang_pending: number
  stok_kritis: number
}

export interface ChartDataPoint {
  date: string
  label: string
  pinjam: number
  kembali: number
}

// ─────────────────────────────────────────────
// API Response
// ─────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

// ─────────────────────────────────────────────
// Audit Log
// ─────────────────────────────────────────────
export interface AuditLog {
  id: number
  user_id: number | null
  role: string | null
  action: string
  module: string
  record_id: number | null
  description: string
  ip_address: string | null
  created_at: string
}

// ─────────────────────────────────────────────
// Standby Screen
// ─────────────────────────────────────────────
export interface StandbyItem {
  judul: string
  quantity: number
  loan_type: LoanType
  loan_type_label: string
  kelas: string
  borrowed_at: string
  due_at: string
}
