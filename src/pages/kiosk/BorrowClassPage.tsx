import { useState, useRef, useEffect } from 'react'
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
  Sparkles, RotateCcw, BookCheck
} from 'lucide-react'
import type { Student, Book, Teacher, Subject } from '@/types'
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
    purpose: '',
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
      // Otomatis isi kelas berdasarkan rombel siswa yang scan
      setClassInfo((prev) => ({
        ...prev,
        class_name: s.kelas || prev.class_name,
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

  const kBtn = 'flex items-center justify-center gap-3 rounded-2xl font-bold text-xl px-8 py-5 min-h-[80px] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-4 focus:ring-offset-2'

  return (
    <div className="flex-1 min-h-[calc(100vh-2.75rem)] bg-gradient-to-br from-slate-50 via-purple-50/40 to-indigo-50/40 flex flex-col p-6 sm:p-8 text-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (step === 'class-details') setStep('scan-student')
              else if (step === 'scan-books') setStep('class-details')
              else if (step === 'photo') setStep('scan-books')
              else if (step === 'confirm') setStep('photo')
              else navigate('/kiosk/borrow')
            }}
            className="p-3 bg-white hover:bg-slate-100 rounded-2xl border border-slate-200 text-slate-700 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Peminjaman Buku Kelas</h1>
            <p className="text-slate-500 text-sm font-medium">Layanan mandiri peminjaman paket buku pelajaran rombel</p>
          </div>
        </div>

        {student && (
          <div className="hidden sm:flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-violet-200 px-4 py-2 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">{student.nama}</p>
              <p className="text-xs text-slate-500">{student.kelas} · NIS: {student.nis}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6 text-rose-900 shadow-sm max-w-2xl mx-auto w-full animate-shake">
          <AlertTriangle size={24} className="text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-base font-semibold">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700">
            <X size={20} />
          </button>
        </div>
      )}

      {/* ─── Step 1: Scan Kartu Siswa (Perwakilan) ─── */}
      {step === 'scan-student' && (
        <div key="scan-student" className="animate-kiosk-step flex-1 flex flex-col items-center justify-center gap-6 max-w-xl mx-auto w-full">
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-violet-100 text-violet-700 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <UserCheck size={40} />
            </div>
            <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Scan Kartu Pelajar Perwakilan</h2>
            <p className="text-slate-600 text-base mt-2 font-medium">
              Dekatkan barcode kartu pelajar siswa yang mewakili rombel kelas ke scanner
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 w-full">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="animate-spin text-violet-600" size={48} />
                <p className="text-slate-600 font-semibold text-lg">{loadingMessage}</p>
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

      {/* ─── Step 2: Detail Kelas, Guru Pengajar & Mata Pelajaran ─── */}
      {step === 'class-details' && (
        <div key="class-details" className="animate-kiosk-step flex-1 flex flex-col items-center justify-center gap-6 max-w-2xl mx-auto w-full">
          <div className="text-center">
            <span className="inline-block bg-violet-50 text-violet-700 text-xs font-bold uppercase tracking-widest px-3.5 py-1 rounded-full mb-2 border border-violet-200">
              Langkah 2 dari 4
            </span>
            <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Pilih Guru & Mata Pelajaran</h2>
            <p className="text-slate-600 text-base mt-1 font-medium">
              Data rombel terisi otomatis dari kartu perwakilan siswa
            </p>
          </div>

          {/* Kartu Identitas Perwakilan Siswa */}
          {student && (
            <div className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-2xl p-5 shadow-lg shadow-indigo-500/15 w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <UserCheck size={26} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-white/20 uppercase tracking-wider font-bold px-2 py-0.5 rounded-md">Perwakilan</span>
                    <span className="text-xs text-violet-100">NIS: {student.nis}</span>
                  </div>
                  <p className="text-lg font-extrabold leading-tight mt-0.5">{student.nama}</p>
                  <p className="text-xs text-violet-200">Kelas: <span className="font-bold text-white">{student.kelas}</span></p>
                </div>
              </div>
              <button
                onClick={() => setStep('scan-student')}
                className="text-xs bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} /> Ganti
              </button>
            </div>
          )}

          {/* Form Kelas, Guru, & Mapel */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-5 w-full">
            {/* Input Kelas Rombel */}
            <div>
              <label className="text-slate-700 text-sm font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Nama Kelas Rombel *</span>
                <span className="text-xs text-slate-400 font-normal lowercase">(otomatis dari kartu siswa)</span>
              </label>
              <input
                value={classInfo.class_name}
                onChange={(e) => setClassInfo((p) => ({ ...p, class_name: e.target.value }))}
                placeholder="Contoh: XII PPLG-RPL 1"
                className="w-full px-5 py-4 text-lg font-bold bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 focus:bg-white focus:outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-100 shadow-sm transition-all"
              />
            </div>

            {/* Searchable Combobox Guru Pengajar */}
            <div className="relative">
              <label className="text-slate-700 text-sm font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Guru Pengajar / Penanggung Jawab *</span>
                <span className="text-xs text-violet-600 font-bold">{teachers.length} Guru Terdaftar</span>
              </label>

              {/* Status Guru Terpilih */}
              {selectedTeacher ? (
                <div className="flex items-center justify-between bg-violet-50/80 border-2 border-violet-300 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold">
                      <GraduationCap size={22} />
                    </div>
                    <div>
                      <p className="text-slate-900 font-extrabold text-base leading-tight flex items-center gap-2">
                        {selectedTeacher.nama}
                        <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
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
                    className="text-xs bg-white hover:bg-slate-100 text-violet-700 font-bold px-3 py-2 rounded-xl border border-violet-200 shadow-xs cursor-pointer transition-all"
                  >
                    Ganti Guru
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
                      placeholder="Ketik nama guru pengajar (cth: Luddie, Abdul, Ani, Susi)..."
                      className="w-full pl-12 pr-10 py-4 text-base bg-white border-2 border-slate-300 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-100 shadow-sm transition-all"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    {teacherSearch && (
                      <button
                        type="button"
                        onClick={() => setTeacherSearch('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Hasil Pencarian Guru */}
                  {isTeacherDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-30 max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {isLoadingTeachers ? (
                        <div className="py-6 text-center text-slate-500 flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin" size={20} /> Memuat data guru...
                        </div>
                      ) : filteredTeachers.length === 0 ? (
                        <div className="py-6 text-center text-slate-500 text-sm">
                          Guru dengan nama "{teacherSearch}" tidak ditemukan.
                        </div>
                      ) : (
                        filteredTeachers.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSelectTeacher(t)}
                            className="w-full px-4 py-3 text-left hover:bg-violet-50/80 flex items-center justify-between transition-colors cursor-pointer group"
                          >
                            <div>
                              <p className="text-slate-900 font-bold text-base group-hover:text-violet-700">{t.nama}</p>
                              <p className="text-xs text-slate-500">
                                {t.nip ? `NIP: ${t.nip}` : 'Guru Pengajar'} · {t.subjects.length} Mata Pelajaran
                              </p>
                            </div>
                            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full group-hover:bg-violet-200 group-hover:text-violet-800">
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

            {/* Dropdown Mata Pelajaran Yang Diampu */}
            <div>
              <label className="text-slate-700 text-sm font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Mata Pelajaran yang Sedang Diajarkan *</span>
                {selectedTeacher && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <Sparkles size={14} /> Terhubung dengan data guru
                  </span>
                )}
              </label>

              {!selectedTeacher ? (
                <div className="w-full px-5 py-4 text-base bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 select-none">
                  Pilih guru pengajar di atas terlebih dahulu
                </div>
              ) : selectedTeacher.subjects.length === 1 ? (
                /* Auto-selected single subject */
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <p className="text-slate-900 font-bold text-base">{selectedTeacher.subjects[0].nama}</p>
                      <p className="text-xs text-emerald-700 font-medium">
                        {selectedTeacher.subjects[0].kelompok || selectedTeacher.subjects[0].kode} · Otomatis Terpilih
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                    Tunggal
                  </span>
                </div>
              ) : (
                /* Multiple subjects: Interactive Dropdown + Quick Tap Chips */
                <div className="space-y-3">
                  <div className="relative">
                    <select
                      value={classInfo.subject_name}
                      onChange={(e) => setClassInfo((p) => ({ ...p, subject_name: e.target.value }))}
                      className="w-full appearance-none px-5 py-4 text-base font-semibold bg-white border-2 border-slate-300 rounded-2xl text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-100 shadow-sm pr-12 cursor-pointer"
                    >
                      <option value="">-- Pilih Mata Pelajaran yang Diampu Guru --</option>
                      {selectedTeacher.subjects.map((s) => (
                        <option key={s.id} value={s.nama}>
                          {s.nama} ({s.kelompok || s.kode})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                  </div>

                  {/* Quick-tap Chips for Touchscreen */}
                  <div className="flex flex-wrap gap-2">
                    {selectedTeacher.subjects.map((s) => {
                      const isSelected = classInfo.subject_name === s.nama
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setClassInfo((p) => ({ ...p, subject_name: s.nama }))}
                          className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                            isSelected
                              ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                        >
                          {isSelected && <Check size={14} />}
                          {s.nama}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Keperluan / Catatan (Opsional) */}
            <div>
              <label className="text-slate-700 text-sm font-bold uppercase tracking-wider mb-2 block">
                Keperluan / Keterangan (Opsional)
              </label>
              <input
                value={classInfo.purpose}
                onChange={(e) => setClassInfo((p) => ({ ...p, purpose: e.target.value }))}
                placeholder="Contoh: Praktik di Lab Komputer / Teori Kelas"
                className="w-full px-5 py-3.5 text-base bg-white border-2 border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-100 shadow-sm"
              />
            </div>
          </div>

          <button
            onClick={() => setStep('scan-books')}
            disabled={!classInfo.class_name || !classInfo.teacher_name || !classInfo.subject_name}
            className={`${kBtn} w-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/30 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Lanjut → Scan Buku Pelajaran
          </button>
        </div>
      )}

      {/* ─── Step 3: Scan Buku Paket / Pelajaran ─── */}
      {step === 'scan-books' && (
        <div key="scan-books" className="animate-kiosk-step flex-1 flex flex-col gap-6 max-w-2xl mx-auto w-full">
          <div className="text-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-white border border-slate-200 rounded-full px-5 py-2 mb-2 shadow-sm text-sm font-bold text-slate-700">
              <span className="text-violet-700">{classInfo.class_name}</span>
              <span>·</span>
              <span>Guru: {classInfo.teacher_name}</span>
              <span>·</span>
              <span className="text-slate-500 font-medium">{classInfo.subject_name}</span>
            </div>
            <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Scan Buku Pelajaran yang Dipinjam</h2>
            <p className="text-slate-600 text-base mt-1 font-medium">
              Scan barcode / QR cover atau label buku paket yang akan dibawa ke kelas
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <Loader2 className="animate-spin text-violet-600" size={36} />
                <p className="text-slate-600 font-semibold">{loadingMessage}</p>
              </div>
            ) : (
              <BarcodeScanner onScan={handleBookScan} placeholder="Scan barcode / QR buku paket..." kioskMode autoFocus />
            )}
          </div>

          {books.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-700 font-bold text-base">{books.length} Judul Buku Terpilih:</p>
                <span className="text-xs bg-violet-100 text-violet-800 font-extrabold px-3 py-1 rounded-full">
                  Total {totalQuantity} Eksemplar
                </span>
              </div>

              {books.map(({ book, quantity }) => (
                <div key={book.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center flex-shrink-0 font-bold">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <p className="text-slate-900 font-bold text-lg leading-tight">{book.judul}</p>
                      <p className="text-slate-500 text-sm font-medium mt-0.5">{book.penulis || 'Penulis tidak tercatat'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setBooks((p) => p.map((x) => x.book.id === book.id && x.quantity > 1 ? { ...x, quantity: x.quantity - 1 } : x))}
                      className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center text-xl font-bold border border-slate-200 cursor-pointer"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="text-slate-900 text-2xl font-black w-8 text-center tabular-nums">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setBooks((p) => p.map((x) => x.book.id === book.id ? { ...x, quantity: x.quantity + 1 } : x))}
                      className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center text-xl font-bold border border-slate-200 cursor-pointer"
                    >
                      <Plus size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setBooks((p) => p.filter((x) => x.book.id !== book.id))}
                      className="w-11 h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200 cursor-pointer ml-1"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setStep('photo')}
                className={`${kBtn} w-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/30 mt-4`}
              >
                <CheckCircle2 size={24} /> Lanjut ke Foto ({totalQuantity} buku)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Step 4: Foto Dokumentasi Perwakilan ─── */}
      {step === 'photo' && (
        <div key="photo" className="animate-kiosk-step flex-1 flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Dokumentasi Foto Perwakilan</h2>
            <p className="text-slate-600 text-base mt-1 font-medium">Foto siswa perwakilan yang mengambil buku rombel kelas</p>
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
            onClick={() => setStep('confirm')}
            className="text-slate-600 hover:text-slate-900 text-base font-bold bg-white border border-slate-200 px-6 py-2.5 rounded-full shadow-sm transition-all cursor-pointer"
          >
            Lewati Foto →
          </button>
        </div>
      )}

      {/* ─── Step 5: Konfirmasi Peminjaman Kelas ─── */}
      {step === 'confirm' && (
        <div key="confirm" className="animate-kiosk-step flex-1 flex flex-col items-center justify-center gap-6 max-w-lg mx-auto w-full">
          <div className="bg-white rounded-3xl p-8 w-full space-y-4 border border-slate-200/80 shadow-xl shadow-slate-200/50">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center mx-auto mb-2">
              <BookCheck size={32} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-4 tracking-tight">Konfirmasi Peminjaman Kelas</h2>

            <div className="space-y-3 divide-y divide-slate-100 text-sm">
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500 font-medium">Siswa Perwakilan</span>
                <span className="text-slate-900 font-bold text-right">{student?.nama} ({student?.nis})</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500 font-medium">Rombel Kelas</span>
                <span className="text-violet-700 font-black">{classInfo.class_name}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500 font-medium">Guru Pengajar</span>
                <span className="text-slate-900 font-bold">{classInfo.teacher_name}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500 font-medium">Mata Pelajaran</span>
                <span className="text-slate-900 font-bold">{classInfo.subject_name || '—'}</span>
              </div>
              {classInfo.purpose && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 font-medium">Keperluan</span>
                  <span className="text-slate-700 font-semibold">{classInfo.purpose}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500 font-medium">Total Buku</span>
                <span className="text-violet-700 font-black text-lg">{totalQuantity} eksemplar</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500 font-medium">Jatuh Tempo</span>
                <span className="text-slate-900 font-bold">{formatDate(dueAt.toISOString())}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <button
              onClick={() => setStep('scan-books')}
              className={`${kBtn} flex-1 bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-200 shadow-sm`}
            >
              <ArrowLeft size={24} /> Batal
            </button>
            <button
              onClick={() => borrowMutation.mutate()}
              disabled={borrowMutation.isPending}
              className={`${kBtn} flex-1 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/30`}
            >
              {borrowMutation.isPending ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
              {borrowMutation.isPending ? 'Memproses...' : 'Konfirmasi'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
