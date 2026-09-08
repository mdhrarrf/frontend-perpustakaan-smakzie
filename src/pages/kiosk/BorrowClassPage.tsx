import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { studentService } from '@/api/student.service'
import { bookService } from '@/api/book.service'
import { loanService } from '@/api/loan.service'
import { teacherService } from '@/api/teacher.service'
import { uploadService } from '@/api/index'
import { WebcamCapture } from '@/components/kiosk/WebcamCapture'
import { BarcodeScanner } from '@/components/kiosk/BarcodeScanner'
import { useKioskStore } from '@/store/kiosk.store'
import { getErrorMessage } from '@/api/client'
import {
  ArrowLeft, AlertTriangle, CheckCircle2, Loader2, Plus, Minus, X,
  Search, UserCheck, GraduationCap, BookOpen, ChevronDown, Check,
  Sparkles, RotateCcw, BookCheck, Lock, ShieldCheck
} from 'lucide-react'
import type { Student, Book, Teacher } from '@/types'
import { formatDate } from '@/utils'

type Step = 'scan-student' | 'class-details' | 'scan-books' | 'photo' | 'confirm'
const DEFAULT_DUE_DAYS = 14

export function KioskBorrowClass() {
  const navigate  = useNavigate()
  const stationId = useKioskStore((s) => s.stationId)

  const [step, setStep] = useState<Step>('scan-student')
  const [student, setStudent] = useState<Student | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [teacherSearch, setTeacherSearch] = useState('')
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false)
  const teacherSearchRef = useRef<HTMLInputElement>(null)

  const [classInfo, setClassInfo] = useState({
    class_name: '',
    teacher_name: '',
    subject_name: '',
    purpose: 'Pembelajaran tatap muka di kelas',
  })

  const [books, setBooks] = useState<{ book: Book; quantity: number }[]>([])
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Memproses...')

  // Fetch daftar 94 guru aktif beserta mata pelajarannya dari database platform
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['kiosk-teachers'],
    queryFn: () => teacherService.list(),
    staleTime: 5 * 60 * 1000,
  })

  // Filter guru berdasarkan pencarian nama atau NIP
  const filteredTeachers = teachers.filter((t) => {
    const q = teacherSearch.toLowerCase().trim()
    if (!q) return true
    return (
      t.nama.toLowerCase().includes(q) ||
      (t.nip && t.nip.includes(q))
    )
  })

  const dueAt = new Date()
  dueAt.setDate(dueAt.getDate() + DEFAULT_DUE_DAYS)
  dueAt.setHours(23, 59, 0, 0)

  // ─── Step 1: Scan Kartu Siswa (Perwakilan) ───
  async function handleStudentScan(code: string) {
    setIsLoading(true)
    setError(null)
    setLoadingMessage('Mencari data siswa perwakilan...')
    try {
      const data = await studentService.search(code, 'barcode')
      const s = Array.isArray(data) ? data[0] : data

      if (!s) {
        setError('Siswa tidak ditemukan. Periksa kembali kartu pelajar Anda.')
        return
      }

      if (s.status !== 'active') {
        setError('Kartu siswa tidak aktif. Hubungi petugas perpustakaan.')
        return
      }

      setStudent(s)
      // Rombel kelas TERKUNCI dari kartu pelajar siswa, tidak boleh diubah manual
      setClassInfo((prev) => ({
        ...prev,
        class_name: s.kelas || '',
      }))

      setStep('class-details')
    } catch {
      setError('Siswa perwakilan tidak ditemukan. Pastikan kartu pelajar terbaca dengan benar.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle pemilihan guru dari searchable dropdown
  function handleSelectTeacher(teacher: Teacher) {
    setSelectedTeacher(teacher)
    setIsTeacherDropdownOpen(false)
    setTeacherSearch('')

    // Jika guru hanya mengampu 1 mapel, otomatis pilih mapel tersebut
    const autoSubject = teacher.subjects.length === 1 ? teacher.subjects[0].nama : ''

    setClassInfo((prev) => ({
      ...prev,
      teacher_name: teacher.nama,
      subject_name: autoSubject,
    }))
  }

  // ─── Step 3: Scan Buku ───
  async function handleBookScan(code: string) {
    setIsLoading(true)
    setError(null)
    setLoadingMessage('Mencari data buku...')
    try {
      const res = await bookService.scanSmart(code)
      const b = res.data!

      if ((b.jumlah_tersedia ?? 0) < 1 && !res.meta?.registered) {
        setError(`Stok buku "${b.judul}" sedang tidak tersedia atau habis.`)
        return
      }

      setBooks((prev) => {
        const exists = prev.find((x) => x.book.id === b.id)
        if (exists) {
          return prev.map((x) =>
            x.book.id === b.id ? { ...x, quantity: x.quantity + 1 } : x
          )
        }
        return [...prev, { book: b, quantity: 1 }]
      })
    } catch {
      setError('Buku tidak ditemukan. Pastikan barcode atau kode buku terdaftar.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Submit Peminjaman Kelas ───
  const borrowMutation = useMutation({
    mutationFn: async () => {
      if (!student) throw new Error('Siswa perwakilan belum dipilih.')

      const promises = books.map(({ book, quantity }) => {
        const isSlims = book.kode_buku?.startsWith('SLIMS-')
        return loanService.create({
          loan_type:    'class',
          student_id:   student.id, // Siswa perwakilan yang discan
          ...(isSlims
            ? { slims_biblio_id: book.id }
            : { book_id: book.id }
          ),
          due_at:       dueAt.toISOString().slice(0, 16),
          borrow_photo: photoPath ?? undefined,
          station_id:   stationId,
          class_name:   classInfo.class_name,
          teacher_name: classInfo.teacher_name,
          subject_name: classInfo.subject_name || undefined,
          purpose:      classInfo.purpose || 'Pembelajaran di kelas',
          quantity,
        })
      })

      return Promise.all(promises)
    },
    onSuccess: () => {
      const totalCount = books.reduce((a, b) => a + b.quantity, 0)
      navigate('/kiosk/success', {
        state: {
          type: 'borrow_class',
          book_count: totalCount,
          due_at: dueAt,
        },
      })
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  const totalQuantity = books.reduce((a, b) => a + b.quantity, 0)

  return (
    <div className="flex-1 min-h-[calc(100vh-2.75rem)] bg-gradient-to-br from-slate-50 via-purple-50/40 to-indigo-50/40 flex flex-col p-4 sm:p-6 lg:p-8 text-slate-900 justify-between">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (step === 'class-details') setStep('scan-student')
              else if (step === 'scan-books') setStep('class-details')
              else if (step === 'photo') setStep('scan-books')
              else if (step === 'confirm') setStep('photo')
              else navigate('/kiosk/borrow')
            }}
            className="p-2.5 bg-white hover:bg-slate-100 rounded-2xl border border-slate-200 text-slate-700 shadow-sm transition-all cursor-pointer"
            title="Kembali"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Peminjaman Buku Kelas
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              Layanan mandiri peminjaman paket buku pelajaran rombel
            </p>
          </div>
        </div>

        {/* Stepper indicator */}
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 px-3.5 py-1.5 rounded-full shadow-xs text-xs font-bold text-slate-600">
          <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
          <span>
            {step === 'scan-student' && 'Langkah 1: Scan Kartu Siswa'}
            {step === 'class-details' && 'Langkah 2: Data Guru & Mapel'}
            {step === 'scan-books' && 'Langkah 3: Scan Buku'}
            {step === 'photo' && 'Langkah 4: Foto Dokumentasi'}
            {step === 'confirm' && 'Konfirmasi Peminjaman'}
          </span>
        </div>
      </div>

      {/* ── Error Alert ── */}
      {error && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4 text-rose-900 shadow-sm max-w-4xl mx-auto w-full">
          <AlertTriangle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700">
            <X size={18} />
          </button>
        </div>
      )}

      {/* ── Main Step Content ── */}
      <div className="flex-1 flex flex-col justify-center">

        {/* ─── Step 1: Scan Kartu Siswa (Perwakilan) ─── */}
        {step === 'scan-student' && (
          <div key="scan-student" className="animate-kiosk-step flex flex-col items-center justify-center gap-6 max-w-lg mx-auto w-full my-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <UserCheck size={32} />
              </div>
              <h2 className="text-slate-900 text-2xl sm:text-3xl font-extrabold tracking-tight">
                Scan Kartu Pelajar Perwakilan
              </h2>
              <p className="text-slate-600 text-sm mt-1.5 font-medium max-w-md">
                Dekatkan barcode kartu pelajar siswa perwakilan rombel kelas yang meminjam buku
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 w-full">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="animate-spin text-violet-600" size={40} />
                  <p className="text-slate-600 font-semibold text-base">{loadingMessage}</p>
                </div>
              ) : (
                <BarcodeScanner
                  onScan={handleStudentScan}
                  placeholder="Scan barcode kartu pelajar..."
                  kioskMode
                  autoFocus
                />
              )}
            </div>
          </div>
        )}

        {/* ─── Step 2: Detail Kelas, Guru Pengajar & Mata Pelajaran (RESPONSIVE GRID) ─── */}
        {step === 'class-details' && (
          <div key="class-details" className="animate-kiosk-step max-w-5xl mx-auto w-full my-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

              {/* KOLOM KIRI: Identitas Terkunci (Siswa & Kelas Rombel) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {/* Kartu Identitas Siswa & Kelas (Terkunci) */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-md flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 text-xs bg-violet-50 text-violet-700 font-bold px-3 py-1 rounded-full border border-violet-200">
                        <ShieldCheck size={14} className="text-violet-600" />
                        Terverifikasi Kartu Pelajar
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep('scan-student')}
                        className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <RotateCcw size={12} /> Ganti Siswa
                      </button>
                    </div>

                    {/* Info Siswa */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Siswa Perwakilan</p>
                        <p className="text-lg font-extrabold text-slate-900 leading-tight mt-0.5">{student?.nama}</p>
                        <p className="text-xs text-slate-500 mt-0.5">NIS: <span className="font-mono font-bold text-slate-700">{student?.nis}</span></p>
                      </div>

                      {/* Info Kelas Rombel — TERKUNCI, TIDAK BISA DIUBAH */}
                      <div className="bg-gradient-to-br from-violet-50 to-indigo-50/70 border-2 border-violet-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-violet-800 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Lock size={12} className="text-violet-600" />
                            Kelas Rombel (Terkunci)
                          </span>
                          <span className="text-[11px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md">
                            Sesuai Dapodik
                          </span>
                        </div>
                        <p className="text-2xl font-black text-violet-950 tracking-tight">
                          {classInfo.class_name || student?.kelas || '—'}
                        </p>
                        <p className="text-[11px] text-violet-700/80 mt-1">
                          Buku paket akan dipinjamkan atas nama rombel kelas ini.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Keperluan Peminjaman */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <label className="text-xs text-slate-600 font-bold uppercase tracking-wider block mb-1.5">
                      Keperluan / Keterangan
                    </label>
                    <input
                      value={classInfo.purpose}
                      onChange={(e) => setClassInfo((p) => ({ ...p, purpose: e.target.value }))}
                      placeholder="Misal: Pembelajaran di kelas / Lab"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* KOLOM KANAN: Pilihan Guru Pengajar & Mata Pelajaran */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-md flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    {/* Header Pilihan */}
                    <div className="border-b border-slate-100 pb-2">
                      <h3 className="text-lg font-bold text-slate-900">Guru Pengajar & Mata Pelajaran</h3>
                      <p className="text-xs text-slate-500">Pilih guru penanggung jawab dan mata pelajaran yang sedang diajarkan</p>
                    </div>

                    {/* 1. Guru Pengajar (Searchable Dropdown) */}
                    <div className="relative">
                      <label className="text-xs text-slate-700 font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>1. Guru Pengajar / Penanggung Jawab *</span>
                        <span className="text-[11px] text-violet-600 font-bold">{teachers.length} Guru Aktif</span>
                      </label>

                      {selectedTeacher ? (
                        /* Guru Terpilih Badge */
                        <div className="flex items-center justify-between bg-violet-50/90 border-2 border-violet-300 rounded-2xl p-3 sm:p-3.5 shadow-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                              <GraduationCap size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-slate-900 font-extrabold text-sm sm:text-base leading-tight truncate flex items-center gap-1.5">
                                {selectedTeacher.nama}
                                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5 truncate">
                                {selectedTeacher.nip ? `NIP: ${selectedTeacher.nip}` : 'Guru Pengajar'} · {selectedTeacher.subjects.length} Mapel Diampu
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTeacher(null)
                              setClassInfo((p) => ({ ...p, teacher_name: '', subject_name: '' }))
                              setIsTeacherDropdownOpen(true)
                              setTimeout(() => teacherSearchRef.current?.focus(), 100)
                            }}
                            className="text-xs bg-white hover:bg-slate-100 text-violet-700 font-bold px-3 py-1.5 rounded-xl border border-violet-200 shadow-xs cursor-pointer transition-all flex-shrink-0 ml-2"
                          >
                            Ganti
                          </button>
                        </div>
                      ) : (
                        /* Search Box saat guru belum dipilih */
                        <div className="relative">
                          <div className="relative">
                            <input
                              ref={teacherSearchRef}
                              type="text"
                              value={teacherSearch}
                              onChange={(e) => {
                                setTeacherSearch(e.target.value)
                                setIsTeacherDropdownOpen(true)
                              }}
                              onFocus={() => setIsTeacherDropdownOpen(true)}
                              placeholder="Ketik nama guru (cth: Luddie, Abdul, Ani, Susi)..."
                              className="w-full pl-10 pr-10 py-3 text-sm sm:text-base bg-white border-2 border-slate-300 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-100 shadow-xs transition-all"
                            />
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            {teacherSearch && (
                              <button
                                type="button"
                                onClick={() => setTeacherSearch('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>

                          {/* Dropdown Hasil Pencarian Guru */}
                          {isTeacherDropdownOpen && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                              {isLoadingTeachers ? (
                                <div className="py-4 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
                                  <Loader2 className="animate-spin" size={16} /> Memuat data guru...
                                </div>
                              ) : filteredTeachers.length === 0 ? (
                                <div className="py-4 text-center text-slate-500 text-xs">
                                  Guru dengan nama "{teacherSearch}" tidak ditemukan.
                                </div>
                              ) : (
                                filteredTeachers.map((t) => (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleSelectTeacher(t)}
                                    className="w-full px-3.5 py-2.5 text-left hover:bg-violet-50/80 flex items-center justify-between transition-colors cursor-pointer group"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <p className="text-slate-900 font-bold text-sm group-hover:text-violet-700 truncate">{t.nama}</p>
                                      <p className="text-xs text-slate-500 truncate">
                                        {t.nip ? `NIP: ${t.nip}` : 'Guru Pengajar'} · {t.subjects.length} Mapel
                                      </p>
                                    </div>
                                    <span className="text-[11px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full group-hover:bg-violet-200 group-hover:text-violet-800 flex-shrink-0">
                                      Pilih
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2. Mata Pelajaran yang Diampu Guru */}
                    <div>
                      <label className="text-xs text-slate-700 font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>2. Mata Pelajaran yang Diampu *</span>
                        {selectedTeacher && (
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                            <Sparkles size={12} /> {selectedTeacher.subjects.length} Mapel Tersedia
                          </span>
                        )}
                      </label>

                      {!selectedTeacher ? (
                        <div className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-400 select-none">
                          Pilih guru pengajar terlebih dahulu
                        </div>
                      ) : selectedTeacher.subjects.length === 1 ? (
                        /* Mapel tunggal langsung otomatis terpilih */
                        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                              <BookOpen size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-slate-900 font-bold text-sm truncate">{selectedTeacher.subjects[0].nama}</p>
                              <p className="text-xs text-emerald-700 font-medium">Otomatis Terpilih (Mapel Tunggal)</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex-shrink-0 ml-2">
                            Pasti
                          </span>
                        </div>
                      ) : (
                        /* Pilihan dropdown & chip jika guru mengampu > 1 mapel */
                        <div className="space-y-2">
                          <div className="relative">
                            <select
                              value={classInfo.subject_name}
                              onChange={(e) => setClassInfo((p) => ({ ...p, subject_name: e.target.value }))}
                              className="w-full appearance-none px-4 py-2.5 text-sm font-semibold bg-white border-2 border-slate-300 rounded-2xl text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-100 shadow-xs pr-10 cursor-pointer"
                            >
                              <option value="">-- Pilih Salah Satu Mata Pelajaran --</option>
                              {selectedTeacher.subjects.map((s) => (
                                <option key={s.id} value={s.nama}>
                                  {s.nama} ({s.kelompok || s.kode})
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                          </div>

                          {/* Quick Chips Touchscreen */}
                          <div className="flex flex-wrap gap-1.5">
                            {selectedTeacher.subjects.map((s) => {
                              const isSelected = classInfo.subject_name === s.nama
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => setClassInfo((p) => ({ ...p, subject_name: s.nama }))}
                                  className={`text-xs px-2.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                                    isSelected
                                      ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {isSelected && <Check size={12} />}
                                  <span className="truncate max-w-[200px]">{s.nama}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tombol Lanjut ke Scan Buku */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('scan-books')}
                      disabled={!classInfo.class_name || !classInfo.teacher_name || !classInfo.subject_name}
                      className="w-full py-4 rounded-2xl font-bold text-base sm:text-lg bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white shadow-lg shadow-violet-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-violet-600"
                    >
                      Lanjut ke Scan Buku Pelajaran →
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ─── Step 3: Scan Buku Paket / Pelajaran ─── */}
        {step === 'scan-books' && (
          <div key="scan-books" className="animate-kiosk-step max-w-4xl mx-auto w-full my-auto flex flex-col gap-4">
            {/* Top context banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl px-4 py-2.5 shadow-xs">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700">
                <span className="bg-violet-100 text-violet-800 px-2.5 py-0.5 rounded-lg">{classInfo.class_name}</span>
                <span>·</span>
                <span>Guru: <strong className="text-slate-900">{classInfo.teacher_name}</strong></span>
                <span>·</span>
                <span className="text-slate-500 font-medium">{classInfo.subject_name}</span>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                Total {totalQuantity} Eksemplar
              </span>
            </div>

            {/* Scanner Area */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md">
              <div className="text-center mb-3">
                <h3 className="text-lg font-extrabold text-slate-900">Scan Barcode / QR Buku Pelajaran</h3>
                <p className="text-xs text-slate-500">Scan berulang untuk menambah jumlah buku yang sama, atau gunakan tombol kuantitas di bawah</p>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-4 gap-2">
                  <Loader2 className="animate-spin text-violet-600" size={32} />
                  <p className="text-slate-600 font-semibold text-sm">{loadingMessage}</p>
                </div>
              ) : (
                <BarcodeScanner onScan={handleBookScan} placeholder="Scan barcode / QR buku paket..." kioskMode autoFocus />
              )}
            </div>

            {/* Daftar Buku Terpilih */}
            {books.length > 0 && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Daftar {books.length} Judul Buku:</span>
                  <span className="text-violet-700">{totalQuantity} Total Buku</span>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {books.map(({ book, quantity }) => (
                    <div key={book.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5">
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-9 h-9 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center flex-shrink-0 font-bold">
                          <BookOpen size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-900 font-bold text-sm leading-tight truncate">{book.judul}</p>
                          <p className="text-xs text-slate-500 truncate">{book.penulis || 'Penulis tidak tercatat'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setBooks((p) => p.map((x) => x.book.id === book.id && x.quantity > 1 ? { ...x, quantity: x.quantity - 1 } : x))}
                          className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center text-base font-bold border border-slate-200 cursor-pointer"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-slate-900 text-base font-black w-7 text-center tabular-nums">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setBooks((p) => p.map((x) => x.book.id === book.id ? { ...x, quantity: x.quantity + 1 } : x))}
                          className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center text-base font-bold border border-slate-200 cursor-pointer"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setBooks((p) => p.filter((x) => x.book.id !== book.id))}
                          className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200 cursor-pointer ml-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setStep('photo')}
                  className="w-full py-3.5 rounded-2xl font-bold text-base bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white shadow-md shadow-violet-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={20} /> Lanjut ke Foto Dokumentasi ({totalQuantity} Buku) →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── Step 4: Foto Dokumentasi Perwakilan ─── */}
        {step === 'photo' && (
          <div key="photo" className="animate-kiosk-step max-w-md mx-auto w-full my-auto flex flex-col items-center justify-center gap-4">
            <div className="text-center">
              <h2 className="text-slate-900 text-2xl font-extrabold tracking-tight">Dokumentasi Foto Perwakilan</h2>
              <p className="text-slate-600 text-xs mt-1 font-medium">Foto siswa perwakilan yang mengambil buku rombel kelas</p>
            </div>
            <WebcamCapture
              onCapture={async (b64) => {
                const { path } = await uploadService.photo(b64, 'borrow')
                setPhotoPath(path)
                setStep('confirm')
              }}
              kioskMode
              autoCapture
              autoCaptureDelay={5}
            />
            <button
              type="button"
              onClick={() => setStep('confirm')}
              className="text-slate-600 hover:text-slate-900 text-sm font-bold bg-white border border-slate-200 px-5 py-2 rounded-full shadow-xs transition-all cursor-pointer"
            >
              Lewati Foto →
            </button>
          </div>
        )}

        {/* ─── Step 5: Konfirmasi Peminjaman Kelas ─── */}
        {step === 'confirm' && (
          <div key="confirm" className="animate-kiosk-step max-w-md mx-auto w-full my-auto flex flex-col items-center justify-center gap-4">
            <div className="bg-white rounded-3xl p-6 w-full space-y-3 border border-slate-200/80 shadow-xl shadow-slate-200/50">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mx-auto mb-1">
                <BookCheck size={26} />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 text-center tracking-tight">Konfirmasi Peminjaman Kelas</h2>

              <div className="space-y-2.5 divide-y divide-slate-100 text-xs sm:text-sm">
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Siswa Perwakilan</span>
                  <span className="text-slate-900 font-bold text-right truncate max-w-[200px]">{student?.nama}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Rombel Kelas</span>
                  <span className="text-violet-700 font-black">{classInfo.class_name}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Guru Pengajar</span>
                  <span className="text-slate-900 font-bold">{classInfo.teacher_name}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Mata Pelajaran</span>
                  <span className="text-slate-900 font-bold truncate max-w-[200px]">{classInfo.subject_name || '—'}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Total Buku</span>
                  <span className="text-violet-700 font-black text-base">{totalQuantity} eksemplar</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Jatuh Tempo</span>
                  <span className="text-slate-900 font-bold">{formatDate(dueAt.toISOString())}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setStep('scan-books')}
                className="flex-1 py-3.5 rounded-2xl font-bold text-base bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-200 shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} /> Batal
              </button>
              <button
                type="button"
                onClick={() => borrowMutation.mutate()}
                disabled={borrowMutation.isPending}
                className="flex-1 py-3.5 rounded-2xl font-bold text-base bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/25 cursor-pointer flex items-center justify-center gap-2"
              >
                {borrowMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                {borrowMutation.isPending ? 'Memproses...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
