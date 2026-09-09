import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { studentService } from '@/api/student.service'
import { bookService } from '@/api/book.service'
import { loanService } from '@/api/loan.service'
import { violationService, uploadService } from '@/api/index'
import { WebcamCapture } from '@/components/kiosk/WebcamCapture'
import { BarcodeScanner } from '@/components/kiosk/BarcodeScanner'
import { useKioskStore } from '@/store/kiosk.store'
import { getErrorMessage } from '@/api/client'
import { ArrowLeft, AlertTriangle, CheckCircle2, Loader2, BookOpen, Clock, AlertCircle, X } from 'lucide-react'
import type { Student, Book, Loan } from '@/types'
import { formatDate } from '@/utils'

type Step = 'scan-student' | 'active-loan-warning' | 'scan-book' | 'pick-duration' | 'photo' | 'confirm'

const MAX_DUE_DAYS = 7

const steps = [
  { id: 'scan-student', label: 'Scan Siswa' },
  { id: 'scan-book', label: 'Scan Buku' },
  { id: 'pick-duration', label: 'Durasi' },
  { id: 'photo', label: 'Foto' },
  { id: 'confirm', label: 'Konfirmasi' },
]

export function KioskBorrowIndividual() {
  const navigate  = useNavigate()
  const stationId = useKioskStore((s) => s.stationId)

  const [step,           setStep]          = useState<Step>('scan-student')
  const [student,        setStudent]        = useState<Student | null>(null)
  const [book,           setBook]           = useState<Book | null>(null)
  const [activeLoan,     setActiveLoan]     = useState<Loan | null>(null)
  const [photoPath,      setPhotoPath]      = useState<string | null>(null)
  const [error,          setError]          = useState<string | null>(null)
  const [isLoading,      setIsLoading]      = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Memproses...')
  const [dueDays,        setDueDays]        = useState(7)

  const currentStepIndex = (() => {
    switch (step) {
      case 'scan-student':
      case 'active-loan-warning':
        return 0
      case 'scan-book':
        return 1
      case 'pick-duration':
        return 2
      case 'photo':
        return 3
      case 'confirm':
        return 4
      default:
        return 0
    }
  })()

  // Smart Step-Back Navigation
  function handleBack() {
    if (step === 'confirm') setStep('photo')
    else if (step === 'photo') setStep('pick-duration')
    else if (step === 'pick-duration') setStep('scan-book')
    else if (step === 'scan-book') {
      setStudent(null)
      setBook(null)
      setStep('scan-student')
    }
    else if (step === 'active-loan-warning') {
      setActiveLoan(null)
      setStudent(null)
      setStep('scan-student')
    }
    else navigate('/kiosk/borrow')
  }

  const getDueAt = () => {
    const d = new Date()
    d.setDate(d.getDate() + dueDays)
    d.setHours(23, 59, 0, 0)
    return d
  }

  // ─── Step 1: Scan Siswa ───
  async function handleStudentScan(code: string) {
    setIsLoading(true); setError(null); setLoadingMessage('Memproses data siswa...')
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

      setLoadingMessage('Mengecek riwayat peminjaman...')
      const loansRes = await studentService.loans(s.id, { status: 'active,overdue', per_page: 1 })
      const rawLoans = loansRes.data?.data ?? []
      const activeLoans = rawLoans.filter((l: Loan) => l.status === 'active' || l.status === 'overdue')

      if (activeLoans.length > 0) {
        setActiveLoan(activeLoans[0])
        setStep('active-loan-warning')
      } else {
        setStep('scan-book')
      }
    } catch {
      setError('Siswa tidak ditemukan. Pastikan kartu pelajar terbaca dengan benar.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Step 2: Scan Buku ───
  async function handleBookScan(code: string) {
    setIsLoading(true); setError(null)
    setLoadingMessage('Mencari buku...')
    try {
      const result = await bookService.scanSmart(code)
      const b = result.data!
      const meta = result.meta ?? null

      if ((b.jumlah_tersedia ?? 0) < 1 && !meta?.registered) {
        setError('Maaf, stok buku ini sedang habis.')
        return
      }

      const v = await violationService.check(student!.id, b.id)
      if (!v.allowed) {
        setError(`Tidak dapat meminjam buku ini. Terkena sanksi keterlambatan hingga ${formatDate(v.violation?.penalty_end_date)}.`)
        return
      }

      setBook(b)
      setStep('pick-duration')
    } catch {
      setError('Buku tidak ditemukan. Pastikan barcode terbaca dengan jelas.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePhotoCapture(base64: string) {
    try {
      const { path } = await uploadService.photo(base64, 'borrow')
      setPhotoPath(path)
    } catch { /* optional */ }
    setStep('confirm')
  }

  const borrowMutation = useMutation({
    mutationFn: () => {
      const isSlimsBook = book?.kode_buku?.startsWith('SLIMS-')
      return loanService.create({
        loan_type:    'individual',
        student_id:   student!.id,
        ...(isSlimsBook
          ? { slims_biblio_id: book!.id }
          : { book_id: book!.id }
        ),
        due_at:       getDueAt().toISOString().slice(0, 16),
        borrow_photo: photoPath ?? undefined,
        station_id:   stationId,
      })
    },
    onSuccess: () => navigate('/kiosk/success', { state: { type: 'borrow', book_title: book?.judul, due_at: getDueAt() } }),
    onError:   (err) => setError(getErrorMessage(err)),
  })

  const kBtn = 'flex items-center justify-center gap-3 rounded-2xl font-bold text-lg sm:text-xl px-8 py-4 sm:py-5 min-h-[64px] sm:min-h-[72px] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-4 focus:ring-offset-2'

  const activeLoanBookTitle = activeLoan?.items?.[0]?.book?.judul
    ?? (activeLoan?.items?.[0] as any)?.book_title_snapshot
    ?? 'Buku Tidak Diketahui'

  const isOverdue = activeLoan?.status === 'overdue'

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
              Peminjaman Individu
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              Peminjaman buku mandiri untuk 1 siswa
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

          {/* ─── Step 1: Scan Siswa ─── */}
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
                  Scan kartu pelajar Anda atau ketik NIS secara manual
                </p>
              </div>

              <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
                <BarcodeScanner onScan={handleStudentScan} placeholder="Scan kartu pelajar / ketik NIS..." kioskMode autoFocus />
              </div>
            </div>
          )}

          {/* ─── Step: Active Loan Warning ─── */}
          {step === 'active-loan-warning' && student && activeLoan && (
            <div key="active-loan-warning" className="animate-kiosk-step flex flex-col items-center justify-center gap-6 max-w-xl mx-auto w-full">
              <div className={`w-full rounded-3xl p-6 sm:p-8 border-2 shadow-lg ${isOverdue ? 'bg-rose-50 border-rose-300' : 'bg-amber-50 border-amber-300'}`}>
                <div className="flex flex-col items-center gap-4 text-center">
                  <AlertCircle size={48} className={isOverdue ? 'text-rose-600' : 'text-amber-600'} />
                  <h2 className={`text-2xl font-extrabold ${isOverdue ? 'text-rose-900' : 'text-amber-900'}`}>
                    {isOverdue ? 'Buku Terlambat Dikembalikan' : 'Masih Ada Buku yang Dipinjam'}
                  </h2>
                  <p className={`text-sm sm:text-base font-medium ${isOverdue ? 'text-rose-800' : 'text-amber-800'}`}>
                    {isOverdue
                      ? 'Anda memiliki buku yang telah melewati batas jatuh tempo. Silakan kembalikan terlebih dahulu.'
                      : 'Anda masih memiliki pinjaman buku yang belum dikembalikan. Kembalikan buku tersebut sebelum meminjam yang baru.'
                    }
                  </p>

                  <div className="bg-white rounded-2xl p-5 w-full mt-2 text-left space-y-3 border border-slate-200/80 shadow-sm">
                    <div className="flex items-start gap-3">
                      <BookOpen size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Judul Buku</p>
                        <p className="text-slate-900 font-bold text-base sm:text-lg">{activeLoanBookTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock size={20} className="text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Jatuh Tempo</p>
                        <p className={`font-bold text-sm sm:text-base ${isOverdue ? 'text-rose-600' : 'text-amber-700'}`}>
                          {formatDate(activeLoan.due_at)}
                          {isOverdue && <span className="ml-2 text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">Terlambat {activeLoan.late_days} hari</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => navigate('/kiosk/return')}
                  className={`${kBtn} w-full ${isOverdue ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'} text-white shadow-lg`}
                >
                  <CheckCircle2 size={24} />
                  Kembalikan Buku Dulu
                </button>
                <button
                  onClick={() => { setActiveLoan(null); setStudent(null); setStep('scan-student') }}
                  className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-3.5 rounded-2xl text-sm sm:text-base font-bold shadow-sm transition-all cursor-pointer"
                >
                  ← Ganti Kartu Pelajar
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 2: Scan Buku ─── */}
          {step === 'scan-book' && student && (
            <div key="scan-book" className="animate-kiosk-step flex flex-col items-center justify-center gap-6 max-w-xl mx-auto w-full">
              <div className="text-center">
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-2 border border-indigo-200/60">
                  Langkah 2 dari {steps.length} • Scan Buku
                </span>
                <h2 className="text-slate-900 text-2xl sm:text-3xl font-extrabold tracking-tight">Scan Barcode Buku</h2>
                <p className="text-slate-600 text-base sm:text-lg mt-1 font-medium">Arahkan barcode atau QR pada buku ke scanner</p>
              </div>

              <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
                <BarcodeScanner onScan={handleBookScan} placeholder="Scan barcode / QR buku..." kioskMode autoFocus />
              </div>
            </div>
          )}

          {/* ─── Step 3: Pick Duration ─── */}
          {step === 'pick-duration' && student && book && (
            <div key="pick-duration" className="animate-kiosk-step flex flex-col items-center justify-center gap-6 max-w-xl mx-auto w-full">
              <div className="text-center">
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-2 border border-indigo-200/60">
                  Langkah 3 dari {steps.length} • Durasi
                </span>
                <h2 className="text-slate-900 text-2xl sm:text-3xl font-extrabold tracking-tight">Durasi Peminjaman</h2>
                <p className="text-slate-600 text-base sm:text-lg mt-1 font-medium">Pilih berapa hari Anda ingin meminjam buku ini</p>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-8 w-full border border-slate-200/80 shadow-xl shadow-slate-200/50">
                <div className="grid grid-cols-7 gap-2.5 mb-6">
                  {Array.from({ length: MAX_DUE_DAYS }, (_, i) => i + 1).map(day => (
                    <button
                      key={day}
                      onClick={() => setDueDays(day)}
                      className={`aspect-square rounded-2xl text-xl font-extrabold transition-all active:scale-95 focus:outline-none cursor-pointer ${
                        dueDays === day
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 scale-105 shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                <div className="text-center bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-1">
                  <p className="text-slate-800 text-base sm:text-lg font-medium">
                    Lama pinjam: <span className="text-indigo-600 font-extrabold text-2xl">{dueDays}</span> Hari
                  </p>
                  <p className="text-slate-500 text-sm">
                    Jatuh tempo: <span className="text-slate-900 font-bold">{formatDate(getDueAt().toISOString())}</span> (23:59)
                  </p>
                </div>
              </div>

              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setStep('scan-book')}
                  className={`${kBtn} flex-1 bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-200 shadow-sm`}
                >
                  <ArrowLeft size={22} /> Ganti Buku
                </button>
                <button
                  onClick={() => setStep('photo')}
                  className={`${kBtn} flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30`}
                >
                  <CheckCircle2 size={22} /> Lanjut ke Foto →
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 4: Photo ─── */}
          {step === 'photo' && book && (
            <div key="photo" className="animate-kiosk-step flex flex-col items-center justify-center gap-6 max-w-xl mx-auto w-full">
              <div className="text-center">
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-2 border border-indigo-200/60">
                  Langkah 4 dari {steps.length} • Foto
                </span>
                <h2 className="text-slate-900 text-2xl sm:text-3xl font-extrabold tracking-tight">Foto Siswa</h2>
                <p className="text-slate-600 text-base sm:text-lg mt-1 font-medium">Ambil foto bukti peminjaman</p>
              </div>

              <WebcamCapture onCapture={handlePhotoCapture} autoCapture autoCaptureDelay={5} kioskMode />

              <button
                onClick={() => setStep('confirm')}
                className="text-slate-600 hover:text-slate-900 text-sm sm:text-base font-bold bg-white hover:bg-slate-50 border border-slate-200 px-6 py-2.5 rounded-full shadow-sm transition-all cursor-pointer"
              >
                Lewati Foto →
              </button>
            </div>
          )}

          {/* ─── Step 5: Confirm ─── */}
          {step === 'confirm' && student && book && (
            <div key="confirm" className="animate-kiosk-step flex flex-col items-center justify-center gap-6 max-w-xl mx-auto w-full">
              <div className="text-center">
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-2 border border-indigo-200/60">
                  Langkah 5 dari {steps.length} • Konfirmasi
                </span>
                <h2 className="text-slate-900 text-2xl sm:text-3xl font-extrabold tracking-tight">Konfirmasi Peminjaman</h2>
                <p className="text-slate-600 text-base sm:text-lg mt-1 font-medium">Pastikan data peminjaman sudah sesuai</p>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-8 w-full space-y-3 border border-slate-200/80 shadow-xl shadow-slate-200/50">
                {[
                  { label: 'Siswa',       value: `${student.nama} (${student.nis})` },
                  { label: 'Kelas',       value: student.kelas ?? '—' },
                  { label: 'Judul Buku',  value: book.judul },
                  { label: 'Penulis',     value: book.penulis || '—' },
                  { label: 'Lama Pinjam', value: `${dueDays} hari` },
                  { label: 'Jatuh Tempo', value: formatDate(getDueAt().toISOString()) + ' (23:59)' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-start gap-4 py-2.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 text-sm sm:text-base font-medium">{label}</span>
                    <span className="text-slate-900 text-sm sm:text-base font-bold text-right">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setStep('pick-duration')}
                  className={`${kBtn} flex-1 bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-200 shadow-sm`}
                >
                  <ArrowLeft size={22} /> Batal / Ubah
                </button>
                <button
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
