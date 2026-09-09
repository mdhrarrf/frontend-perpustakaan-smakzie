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
  Search, BookOpen, ChevronDown, Check, Clock
} from 'lucide-react'
import type { Student, Book, Teacher } from '@/types'
import { formatDate } from '@/utils'

type Step = 'scan-student' | 'class-details' | 'scan-books' | 'return-time' | 'photo' | 'confirm'

const steps = [
  { id: 'scan-student', label: 'Scan Siswa' },
  { id: 'class-details', label: 'Guru & Mapel' },
  { id: 'scan-books', label: 'Scan Buku' },
  { id: 'return-time', label: 'Batas Jam' },
  { id: 'photo', label: 'Foto' },
  { id: 'confirm', label: 'Konfirmasi' },
]

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
    purpose: 'Pembelajaran di kelas',
  })

  const [books, setBooks] = useState<{ book: Book; quantity: number }[]>([])
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Memproses...')

  // Fetch daftar guru aktif beserta mata pelajarannya
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['kiosk-teachers'],
    queryFn: () => teacherService.list(),
    staleTime: 5 * 60 * 1000,
  })

  // Filter guru berdasarkan nama atau NIP
  const filteredTeachers = teachers.filter((t) => {
    const q = teacherSearch.toLowerCase().trim()
    if (!q) return true
    return (
      t.nama.toLowerCase().includes(q) ||
      (t.nip && t.nip.includes(q))
    )
  })

  const currentStepIndex = (() => {
    switch (step) {
      case 'scan-student': return 0
      case 'class-details': return 1
      case 'scan-books': return 2
      case 'return-time': return 3
      case 'photo': return 4
      case 'confirm': return 5
      default: return 0
    }
  })()

  // Smart Step-Back Navigation
  function handleBack() {
    if (step === 'confirm') setStep('photo')
    else if (step === 'photo') setStep('return-time')
    else if (step === 'return-time') setStep('scan-books')
    else if (step === 'scan-books') setStep('class-details')
    else if (step === 'class-details') {
      setStudent(null)
      setClassInfo({
        class_name: '',
        teacher_name: '',
        subject_name: '',
        purpose: 'Pembelajaran di kelas',
      })
      setSelectedTeacher(null)
      setStep('scan-student')
    }
    else navigate('/kiosk/borrow')
  }

  // Batas jam pengembalian (default: jam sekolah, e.g. +2 jam dari sekarang)
  const [hourStr, setHourStr] = useState(() => {
    const d = new Date()
    const curH = d.getHours()
    let h = curH + 2
    if (h < 7 || h > 17) h = 14 // default jam sekolah jika di luar jam
    return String(h).padStart(2, '0')
  })

  const [minStr, setMinStr] = useState(() => {
    const d = new Date()
    const rem = d.getMinutes() % 15
    let m = d.getMinutes() + (rem !== 0 ? (15 - rem) : 0)
    if (m >= 60) m = 0
    return String(m).padStart(2, '0')
  })

  const returnTime = `${hourStr.padStart(2, '0')}:${minStr.padStart(2, '0')}`

  function handleHourChange(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 2)
    setHourStr(digits)
  }

  function handleHourBlur() {
    let h = parseInt(hourStr, 10)
    if (isNaN(h) || h < 0) h = 7
    if (h > 23) h = 16
    setHourStr(String(h).padStart(2, '0'))
  }

  function handleMinChange(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 2)
    setMinStr(digits)
  }

  function handleMinBlur() {
    let m = parseInt(minStr, 10)
    if (isNaN(m) || m < 0) m = 0
    if (m > 59) m = 59
    setMinStr(String(m).padStart(2, '0'))
  }

  function setPresetTime(hh: number, mm: number) {
    setHourStr(String(hh).padStart(2, '0'))
    setMinStr(String(mm).padStart(2, '0'))
  }

  function setPlusHours(additionalHours: number) {
    const d = new Date()
    const newH = Math.min(23, d.getHours() + additionalHours)
    setHourStr(String(newH).padStart(2, '0'))
    setMinStr(String(d.getMinutes()).padStart(2, '0'))
  }

  function getDueAt(): Date {
    const h = parseInt(hourStr, 10) || 15
    const m = parseInt(minStr, 10) || 30
    const d = new Date()
    d.setHours(h, m, 0, 0)
    return d
  }

  const dueAt = getDueAt()
  const isDueAtValid = dueAt.getTime() > Date.now()

  // ─── Step 1: Scan Kartu Siswa ───
  async function handleStudentScan(code: string) {
    setIsLoading(true)
    setError(null)
    setLoadingMessage('Mencari data siswa...')
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
      setClassInfo((prev) => ({
        ...prev,
        class_name: s.kelas || '',
      }))

      setStep('class-details')
    } catch {
      setError('Siswa tidak ditemukan. Pastikan kartu pelajar terbaca dengan benar.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle pemilihan guru
  function handleSelectTeacher(teacher: Teacher) {
    setSelectedTeacher(teacher)
    setIsTeacherDropdownOpen(false)
    setTeacherSearch('')

    const autoSubject = teacher.subjects.length === 1 ? teacher.subjects[0].nama : ''

    setClassInfo((prev) => ({
      ...prev,
      teacher_name: teacher.nama,
      subject_name: autoSubject,
    }))
  }

  // ─── Step 3: Scan Buku (hanya 1 judul diizinkan untuk kelas) ───
  async function handleBookScan(code: string) {
    setError(null)
    // Sudah ada buku terpilih — tidak perlu scan lagi, cukup atur quantity
    if (books.length > 0) return

    setIsLoading(true)
    setLoadingMessage('Mencari data buku...')
    try {
      const res = await bookService.scanSmart(code)
      const b = res.data!

      if ((b.jumlah_tersedia ?? 0) < 1 && !res.meta?.registered) {
        setError(`Stok buku "${b.judul}" tidak mencukupi atau habis.`)
        return
      }

      setBooks([{ book: b, quantity: 1 }])
    } catch {
      setError('Buku tidak ditemukan. Pastikan barcode terbaca dengan jelas.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleQuantityChange(bookId: number, val: string) {
    if (val === '') {
      setBooks((p) => p.map((x) => x.book.id === bookId ? { ...x, quantity: 0 } : x))
      return
    }
    const q = parseInt(val, 10)
    if (isNaN(q) || q < 1) return
    setBooks((p) => p.map((x) => {
      if (x.book.id === bookId) {
        const maxStock = x.book.jumlah_tersedia && x.book.jumlah_tersedia > 0 ? x.book.jumlah_tersedia : 999
        return { ...x, quantity: Math.min(q, maxStock) }
      }
      return x
    }))
  }

  function handleQuantityBlur(bookId: number, currentQty: number) {
    if (!currentQty || currentQty < 1) {
      setBooks((p) => p.map((x) => x.book.id === bookId ? { ...x, quantity: 1 } : x))
    }
  }

  function handleAddQuantity(bookId: number, delta: number) {
    setBooks((p) => p.map((x) => {
      if (x.book.id === bookId) {
        const newQty = Math.max(1, (x.quantity || 0) + delta)
        const maxStock = x.book.jumlah_tersedia && x.book.jumlah_tersedia > 0 ? x.book.jumlah_tersedia : 999
        return { ...x, quantity: Math.min(newQty, maxStock) }
      }
      return x
    }))
  }

  // ─── Submit Peminjaman Kelas ───
  const borrowMutation = useMutation({
    mutationFn: async () => {
      if (!student) throw new Error('Siswa perwakilan belum dipilih.')

      const promises = books.map(({ book, quantity }) => {
        const isSlims = book.kode_buku?.startsWith('SLIMS-')
        return loanService.create({
          loan_type:    'class',
          student_id:   student.id,
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

  const kBtn = 'flex items-center justify-center gap-3 rounded-2xl font-bold text-lg sm:text-xl px-8 py-4 sm:py-5 min-h-[64px] sm:min-h-[72px] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-4 focus:ring-offset-2'

  return (
    <div className="flex-1 min-h-[calc(100vh-2.75rem)] bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/40 flex flex-col p-4 sm:p-6 lg:p-8 text-slate-900 justify-between">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={handleBack}
            className="p-3 bg-white hover:bg-slate-100 rounded-2xl border border-slate-200 text-slate-700 shadow-sm transition-all cursor-pointer"
            title="Kembali"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Peminjaman Kelas
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              Peminjaman buku pelajaran rombel kelas
            </p>
          </div>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="hidden sm:flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-slate-200/80 px-4 py-2 rounded-2xl shadow-xs">
          <div className="flex items-center gap-1.5">
            {steps.map((st, idx) => (
              <div
                key={st.id}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStepIndex
                    ? 'w-6 bg-indigo-600'
                    : idx < currentStepIndex
                    ? 'w-2 bg-indigo-400'
                    : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-slate-600">
            Langkah {currentStepIndex + 1} dari {steps.length} • {steps[currentStepIndex]?.label}
          </span>
        </div>

        {/* Mobile Stepper */}
        <div className="sm:hidden flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-slate-200/80 px-3 py-1.5 rounded-full shadow-xs text-xs font-bold text-slate-600">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span>Langkah {currentStepIndex + 1}/{steps.length}</span>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 mb-4 text-rose-900 shadow-sm max-w-xl mx-auto w-full">
          <AlertTriangle size={24} className="text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm sm:text-base font-semibold">{error}</div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700 cursor-pointer">
            <X size={20} />
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
          <Loader2 className="text-indigo-600 animate-spin" size={40} />
          <p className="text-slate-800 text-xl font-bold">{loadingMessage}</p>
        </div>
      )}

      {/* ── Main Content Area ── */}
      {!isLoading && (
        <div className="flex-1 flex flex-col justify-center items-center my-auto w-full">

          {/* ─── Step 1: Scan Kartu Siswa ─── */}
          {step === 'scan-student' && (
            <div key="scan-student" className="animate-kiosk-step flex flex-col items-center justify-center gap-6 max-w-xl mx-auto w-full">
              <div className="text-center">
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-2 border border-indigo-200/60">
                  Langkah 1 dari {steps.length} • Scan Siswa
                </span>
                <h2 className="text-slate-900 text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Scan Kartu Pelajar
                </h2>
                <p className="text-slate-600 text-base sm:text-lg mt-1 font-medium">
                  Scan kartu pelajar perwakilan kelas atau ketik NIS
                </p>
              </div>

              <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
                <BarcodeScanner
                  onScan={handleStudentScan}
                  placeholder="Scan kartu pelajar / ketik NIS..."
                  kioskMode
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* ─── Step 2: Guru Pengajar & Mata Pelajaran (CLEAN SINGLE CARD) ─── */}
          {step === 'class-details' && (
            <div key="class-details" className="animate-kiosk-step max-w-xl mx-auto w-full my-auto">
              <div className="text-center mb-6">
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-2 border border-indigo-200/60">
                  Langkah 2 dari {steps.length} • Guru & Mapel
                </span>
                <h2 className="text-slate-900 text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Pilih Guru & Mata Pelajaran
                </h2>
                <p className="text-slate-600 text-base sm:text-lg mt-1 font-medium">
                  Tentukan guru pengajar dan mata pelajaran untuk peminjaman ini
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-5">
                {/* Siswa & Kelas Info Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Perwakilan</p>
                    <p className="text-base font-bold text-slate-900 truncate">
                      {student?.nama} <span className="text-slate-500 font-normal">({student?.nis})</span>
                    </p>
                    <p className="text-sm font-bold text-indigo-600 mt-0.5">
                      Kelas: {classInfo.class_name || student?.kelas || '—'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('scan-student')}
                    className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
                  >
                    Ganti
                  </button>
                </div>

                {/* 1. Guru Pengajar */}
                <div className="relative">
                  <label className="text-xs text-slate-700 font-bold uppercase tracking-wider mb-2 block">
                    Guru Pengajar *
                  </label>

                  {selectedTeacher ? (
                    <div className="flex items-center justify-between bg-indigo-50/80 border-2 border-indigo-200 rounded-2xl p-3.5">
                      <div className="min-w-0 pr-2">
                        <p className="text-slate-900 font-bold text-base leading-tight truncate">
                          {selectedTeacher.nama}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {selectedTeacher.nip ? `NIP: ${selectedTeacher.nip}` : 'Guru Pengajar'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTeacher(null)
                          setClassInfo((p) => ({ ...p, teacher_name: '', subject_name: '' }))
                          setIsTeacherDropdownOpen(true)
                          setTimeout(() => teacherSearchRef.current?.focus(), 100)
                        }}
                        className="text-xs bg-white hover:bg-slate-100 text-indigo-700 font-bold px-3 py-1.5 rounded-xl border border-indigo-200 cursor-pointer transition-all flex-shrink-0"
                      >
                        Ganti Guru
                      </button>
                    </div>
                  ) : (
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
                          placeholder="Ketik nama guru..."
                          className="w-full pl-10 pr-10 py-3.5 text-base bg-white border-2 border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
                        />
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        {teacherSearch && (
                          <button
                            type="button"
                            onClick={() => setTeacherSearch('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      {isTeacherDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                          {isLoadingTeachers ? (
                            <div className="py-4 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
                              <Loader2 className="animate-spin" size={16} /> Memuat guru...
                            </div>
                          ) : filteredTeachers.length === 0 ? (
                            <div className="py-4 text-center text-slate-500 text-xs">
                              Guru "{teacherSearch}" tidak ditemukan.
                            </div>
                          ) : (
                            filteredTeachers.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => handleSelectTeacher(t)}
                                className="w-full px-4 py-3 text-left hover:bg-indigo-50/80 flex items-center justify-between transition-colors cursor-pointer"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="text-slate-900 font-bold text-sm truncate">{t.nama}</p>
                                  <p className="text-xs text-slate-500 truncate">
                                    {t.nip ? `NIP: ${t.nip}` : 'Guru'}
                                  </p>
                                </div>
                                <span className="text-xs text-indigo-600 font-bold flex-shrink-0">
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

                {/* 2. Mata Pelajaran */}
                <div>
                  <label className="text-xs text-slate-700 font-bold uppercase tracking-wider mb-2 block">
                    Mata Pelajaran *
                  </label>

                  {!selectedTeacher ? (
                    <div className="w-full px-4 py-3 text-sm bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-400 select-none">
                      Pilih guru pengajar terlebih dahulu
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <select
                          value={classInfo.subject_name}
                          onChange={(e) => setClassInfo((p) => ({ ...p, subject_name: e.target.value }))}
                          className="w-full appearance-none px-4 py-3 text-base font-medium bg-white border-2 border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 pr-10 cursor-pointer"
                        >
                          <option value="">-- Pilih Mata Pelajaran --</option>
                          {selectedTeacher.subjects.map((s) => (
                            <option key={s.id} value={s.nama}>
                              {s.nama}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                      </div>

                      {/* Quick Chips jika guru mengampu > 1 mapel */}
                      {selectedTeacher.subjects.length > 1 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedTeacher.subjects.map((s) => {
                            const isSelected = classInfo.subject_name === s.nama
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => setClassInfo((p) => ({ ...p, subject_name: s.nama }))}
                                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                }`}
                              >
                                {isSelected && <Check size={12} />}
                                <span className="truncate max-w-[200px]">{s.nama}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tombol Lanjut */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('scan-books')}
                    disabled={!classInfo.class_name || !classInfo.teacher_name || !classInfo.subject_name}
                    className={`${kBtn} w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 disabled:shadow-none`}
                  >
                    Lanjut ke Scan Buku →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 3: Scan Buku Paket / Pelajaran ─── */}
          {step === 'scan-books' && (
            <div key="scan-books" className="animate-kiosk-step max-w-xl mx-auto w-full my-auto flex flex-col gap-5">
              <div className="text-center">
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-2 border border-indigo-200/60">
                  Langkah 3 dari {steps.length} • Scan Buku
                </span>
                <h2 className="text-slate-900 text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {books.length === 0 ? 'Scan Barcode Buku' : 'Atur Jumlah Buku'}
                </h2>
                <p className="text-slate-600 text-base sm:text-lg mt-1 font-medium">
                  {books.length === 0
                    ? 'Arahkan barcode atau QR pada buku pelajaran ke scanner'
                    : 'Masukkan jumlah buku yang akan dipinjam oleh kelas'}
                </p>
              </div>

              {/* Context Bar */}
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-xs">
                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium min-w-0">
                  <span className="font-bold text-indigo-600 flex-shrink-0">{classInfo.class_name}</span>
                  <span className="flex-shrink-0">·</span>
                  <span className="truncate">{classInfo.teacher_name}</span>
                  <span className="flex-shrink-0">·</span>
                  <span className="text-slate-500 truncate">{classInfo.subject_name}</span>
                </div>
              </div>

              {/* ── Belum scan: tampilkan scanner ── */}
              {books.length === 0 && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
                  <BarcodeScanner onScan={handleBookScan} placeholder="Scan barcode / QR buku..." kioskMode autoFocus />
                </div>
              )}

              {/* ── Sudah scan: tampilkan UI quantity ── */}
              {books.length > 0 && (() => {
                const selectedBook = books[0].book
                const selectedQty  = books[0].quantity
                // Untuk peminjaman kelas, tidak dibatasi stok sistem — kelas bisa pinjam banyak eksemplar
                const CLASS_MAX = 99

                return (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 flex flex-col gap-6">
                    {/* Info Buku */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={28} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-900 font-extrabold text-base sm:text-lg leading-tight truncate">{selectedBook.judul}</p>
                        <p className="text-sm text-slate-500 mt-0.5 truncate">{selectedBook.penulis || '—'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBooks([])}
                        className="flex-shrink-0 w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200 cursor-pointer transition-colors"
                        title="Ganti buku"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Quantity Control */}
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Jumlah Eksemplar</p>

                      {/* Tombol − Angka + */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setBooks([{ book: selectedBook, quantity: Math.max(1, selectedQty - 1) }])}
                          disabled={selectedQty <= 1}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-800 flex items-center justify-center border border-slate-200 cursor-pointer shadow-sm transition-colors"
                        >
                          <Minus size={22} />
                        </button>

                        <input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max={CLASS_MAX}
                          value={selectedQty === 0 ? '' : selectedQty}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const raw = e.target.value
                            if (raw === '') { setBooks([{ book: selectedBook, quantity: 0 }]); return }
                            const q = parseInt(raw, 10)
                            if (!isNaN(q) && q >= 1) setBooks([{ book: selectedBook, quantity: Math.min(q, CLASS_MAX) }])
                          }}
                          onBlur={() => {
                            if (!selectedQty || selectedQty < 1) setBooks([{ book: selectedBook, quantity: 1 }])
                          }}
                          className="w-28 sm:w-32 h-14 sm:h-16 text-center font-black text-3xl sm:text-4xl text-slate-900 bg-white border-2 border-indigo-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-2xl shadow-inner tabular-nums focus:outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => setBooks([{ book: selectedBook, quantity: Math.min(selectedQty + 1, CLASS_MAX) }])}
                          disabled={selectedQty >= CLASS_MAX}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white flex items-center justify-center border border-indigo-600 cursor-pointer shadow-sm transition-colors"
                        >
                          <Plus size={22} />
                        </button>
                      </div>

                      {/* Preset langsung set angka */}
                      <div className="flex items-center gap-2">
                        {[10, 20, 30, 36].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setBooks([{ book: selectedBook, quantity: preset }])}
                            className={`px-4 py-2 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
                              selectedQty === preset
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>

                      <p className="text-xs text-slate-400 font-medium">
                        Ketik angka atau tap preset — maks {CLASS_MAX} eksemplar
                      </p>
                    </div>

                    {/* Lanjut Button */}
                    <button
                      type="button"
                      onClick={() => setStep('return-time')}
                      disabled={selectedQty < 1}
                      className={`${kBtn} w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      Lanjut ke Batas Waktu ({selectedQty} Buku) →
                    </button>
                  </div>
                )
              })()}
            </div>
          )}

          {/* ─── Step 4: Batas Waktu Pengembalian ─── */}
          {step === 'return-time' && (
            <div key="return-time" className="animate-kiosk-step flex flex-col items-center justify-center gap-6 max-w-xl mx-auto w-full my-auto">
              <div className="text-center">
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-2 border border-indigo-200/60">
                  Langkah 4 dari {steps.length} • Batas Jam
                </span>
                <h2 className="text-slate-900 text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Batas Jam Pengembalian
                </h2>
                <p className="text-slate-600 text-base sm:text-lg mt-1 font-medium">
                  Tentukan jam pengembalian buku pelajaran hari ini
                </p>
              </div>

              {/* Card Pengaturan Waktu */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 w-full border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-6">

                {/* Jam & Menit Terpusat (100% Center) */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jam</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={hourStr}
                        onChange={(e) => handleHourChange(e.target.value)}
                        onBlur={handleHourBlur}
                        onFocus={(e) => e.target.select()}
                        className="w-24 sm:w-28 h-16 sm:h-20 text-center font-black text-4xl sm:text-5xl text-slate-900 bg-slate-50 border-2 border-indigo-200 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl tabular-nums focus:outline-none transition-all shadow-inner"
                      />
                    </div>

                    <span className="text-4xl sm:text-5xl font-black text-slate-300 mt-5 select-none">:</span>

                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menit</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={minStr}
                        onChange={(e) => handleMinChange(e.target.value)}
                        onBlur={handleMinBlur}
                        onFocus={(e) => e.target.select()}
                        className="w-24 sm:w-28 h-16 sm:h-20 text-center font-black text-4xl sm:text-5xl text-slate-900 bg-slate-50 border-2 border-indigo-200 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl tabular-nums focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Cepat */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {[
                    { label: '+1 Jam', action: () => setPlusHours(1) },
                    { label: '+2 Jam', action: () => setPlusHours(2) },
                    { label: '+3 Jam', action: () => setPlusHours(3) },
                    { label: '12:00',  action: () => setPresetTime(12, 0) },
                    { label: '15:30',  action: () => setPresetTime(15, 30) },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={p.action}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 font-bold text-sm rounded-xl border border-indigo-200 transition-all cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Info Jatuh Tempo Ringkas */}
                <div className={`rounded-2xl p-4 border text-center transition-all ${
                  isDueAtValid ? 'bg-slate-50 border-slate-200/80' : 'bg-rose-50 border-rose-200'
                }`}>
                  {isDueAtValid ? (
                    <p className="text-slate-700 text-sm sm:text-base font-medium">
                      Batas Pengembalian:{' '}
                      <span className="text-indigo-600 font-extrabold text-lg tabular-nums">
                        {returnTime} WIB
                      </span>{' '}
                      (Hari Ini)
                    </p>
                  ) : (
                    <p className="text-rose-700 font-bold text-sm">
                      Jam pengembalian harus lebih dari waktu sekarang.
                    </p>
                  )}
                </div>

              </div>

              {/* Tombol Aksi di Luar Card (Konsisten dengan Seluruh Step Lain) */}
              <div className="flex gap-4 w-full">
                <button
                  type="button"
                  onClick={() => setStep('scan-books')}
                  className={`${kBtn} flex-1 bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-200 shadow-sm`}
                >
                  <ArrowLeft size={22} /> Batal / Ubah
                </button>
                <button
                  type="button"
                  onClick={() => setStep('photo')}
                  disabled={!isDueAtValid}
                  className={`${kBtn} flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  Lanjut ke Foto →
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 5: Foto Dokumentasi ─── */}
          {step === 'photo' && (
            <div key="photo" className="animate-kiosk-step flex flex-col items-center justify-center gap-6 max-w-xl mx-auto w-full my-auto">
              <div className="text-center">
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-2 border border-indigo-200/60">
                  Langkah 5 dari {steps.length} • Foto
                </span>
                <h2 className="text-slate-900 text-2xl sm:text-3xl font-extrabold tracking-tight">Foto Siswa</h2>
                <p className="text-slate-600 text-base sm:text-lg mt-1 font-medium">Ambil foto bukti peminjaman buku kelas</p>
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
                className="text-slate-600 hover:text-slate-900 text-sm sm:text-base font-bold bg-white hover:bg-slate-50 border border-slate-200 px-6 py-2.5 rounded-full shadow-sm transition-all cursor-pointer"
              >
                Lewati Foto →
              </button>
            </div>
          )}

          {/* ─── Step 6: Konfirmasi Peminjaman Kelas ─── */}
          {step === 'confirm' && (
            <div key="confirm" className="animate-kiosk-step flex flex-col items-center justify-center gap-6 max-w-xl mx-auto w-full my-auto">
              <div className="text-center">
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-2 border border-indigo-200/60">
                  Langkah 6 dari {steps.length} • Konfirmasi
                </span>
                <h2 className="text-slate-900 text-2xl sm:text-3xl font-extrabold tracking-tight">Konfirmasi Peminjaman</h2>
                <p className="text-slate-600 text-base sm:text-lg mt-1 font-medium">Pastikan data peminjaman sudah sesuai</p>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-8 w-full space-y-3 border border-slate-200/80 shadow-xl shadow-slate-200/50">
                {[
                  { label: 'Siswa',          value: `${student?.nama} (${student?.nis})` },
                  { label: 'Kelas',          value: classInfo.class_name },
                  { label: 'Guru',           value: classInfo.teacher_name },
                  { label: 'Mata Pelajaran', value: classInfo.subject_name || '—' },
                  { label: 'Total Buku',     value: `${totalQuantity} buku` },
                  { label: 'Jatuh Tempo',    value: `${formatDate(dueAt.toISOString())}, pukul ${returnTime} WIB` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-start gap-4 py-2.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 text-sm sm:text-base font-medium">{label}</span>
                    <span className="text-slate-900 text-sm sm:text-base font-bold text-right">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 w-full">
                <button
                  type="button"
                  onClick={() => setStep('return-time')}
                  className={`${kBtn} flex-1 bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-200 shadow-sm`}
                >
                  <ArrowLeft size={22} /> Batal / Ubah
                </button>
                <button
                  type="button"
                  onClick={() => borrowMutation.mutate()}
                  disabled={borrowMutation.isPending}
                  className={`${kBtn} flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30`}
                >
                  {borrowMutation.isPending ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                  {borrowMutation.isPending ? 'Memproses...' : 'Konfirmasi Pinjam'}
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
