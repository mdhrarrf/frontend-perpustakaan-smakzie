import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { studentService } from '@/api/student.service'
import { loanService } from '@/api/loan.service'
import { bookService } from '@/api/book.service'
import { uploadService } from '@/api/index'
import { BarcodeScanner } from '@/components/kiosk/BarcodeScanner'
import { WebcamCapture } from '@/components/kiosk/WebcamCapture'
import { useKioskStore } from '@/store/kiosk.store'
import { getErrorMessage } from '@/api/client'
import { formatDateTime, formatDate, formatNis, formatStudentLabel } from '@/utils'
import { compareFaces } from '@/utils/faceCompare'
import {
  ArrowLeft, ArrowRight, AlertTriangle, CheckCircle2, Loader2, RotateCcw,
  Clock, Check, User, Camera, ShieldCheck, ShieldX, ShieldAlert, BookOpen,
  Sparkles,
} from 'lucide-react'
import type { Student, Loan } from '@/types'

type Step = 'scan-student' | 'confirm-student' | 'scan-book' | 'select-loan' | 'photo' | 'confirm'
type FaceMatchStatus = 'idle' | 'checking' | 'match' | 'mismatch' | 'no_face' | 'unknown'

const steps = [
  { id: 'scan-student', label: 'Scan Siswa' },
  { id: 'scan-book',    label: 'Scan Buku' },
  { id: 'photo',        label: 'Foto' },
  { id: 'confirm',      label: 'Konfirmasi' },
]

export function KioskReturnPage() {
  const navigate  = useNavigate()
  const stationId = useKioskStore((s) => s.stationId)

  const [step,               setStep]               = useState<Step>('scan-student')
  const [student,            setStudent]            = useState<Student | null>(null)
  const [activeLoans,        setActiveLoans]        = useState<Loan[]>([])
  const [selectedLoan,       setSelectedLoan]       = useState<Loan | null>(null)
  const [scannedBarcode,     setScannedBarcode]     = useState<string | null>(null)
  const [reconciledTitle,    setReconciledTitle]    = useState<string | null>(null)
  const [photoPath,          setPhotoPath]          = useState<string | null>(null)
  const [returnPhotoPreview, setReturnPhotoPreview] = useState<string | null>(null)
  const [error,        setError]      = useState<string | null>(null)
  const [isLoading,    setIsLoading]  = useState(false)

  // Face match verification state
  const [faceMatchStatus, setFaceMatchStatus] = useState<FaceMatchStatus>('idle')
  const [faceMatchScore,  setFaceMatchScore]  = useState<number>(0)
  const faceCheckDoneRef = useRef(false)

  const currentStepIndex = (() => {
    switch (step) {
      case 'scan-student':
      case 'confirm-student':
        return 0
      case 'scan-book':
      case 'select-loan':
        return 1
      case 'photo':
        return 2
      case 'confirm':
        return 3
      default:
        return 0
    }
  })()

  const kBtn = 'flex items-center justify-center gap-2 sm:gap-3 rounded-2xl font-bold text-base sm:text-lg lg:text-xl px-5 sm:px-8 py-3 sm:py-4 lg:py-5 min-h-[50px] sm:min-h-[58px] lg:min-h-[68px] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none'

  // Trigger face comparison once when entering confirm step
  useEffect(() => {
    if (step !== 'confirm') { faceCheckDoneRef.current = false; return }
    if (faceCheckDoneRef.current) return
    faceCheckDoneRef.current = true

    const borrowPhoto   = selectedLoan?.borrow_photo
    const returnPreview = returnPhotoPreview

    if (!borrowPhoto || !returnPreview) {
      setFaceMatchStatus('unknown')
      return
    }

    setFaceMatchStatus('checking')
    compareFaces(borrowPhoto, returnPreview)   // default threshold 0.45 Euclidean distance
      .then((result) => {
        setFaceMatchScore(result.score)
        if (result.hasNoFace1 || result.hasNoFace2) {
          setFaceMatchStatus('no_face')
        } else if (result.match) {
          setFaceMatchStatus('match')
        } else {
          setFaceMatchStatus('mismatch')
        }
      })
      .catch((err) => {
        console.warn('Face comparison failed:', err)
        setFaceMatchStatus('unknown')
      })
  }, [step, selectedLoan, returnPhotoPreview])

  function handleBack() {
    if (step === 'confirm') setStep('photo')
    else if (step === 'photo') setStep('scan-book')
    else if (step === 'select-loan') setStep('scan-book')
    else if (step === 'scan-book') setStep('confirm-student')
    else if (step === 'confirm-student') reset()
    else navigate('/kiosk')
  }

  async function handleStudentScan(code: string) {
    setIsLoading(true); setError(null)
    try {
      const data = await studentService.search(code, 'barcode')
      const s = Array.isArray(data) ? data[0] : data
      if (!s) {
        setError('Siswa tidak ditemukan. Pastikan NIS/NISN yang Anda masukkan sudah benar atau kartu pelajar terbaca dengan jelas.')
        return
      }
      if (s.status !== 'active') {
        setError('Kartu siswa tidak aktif. Hubungi petugas perpustakaan.')
        return
      }
      setStudent(s)
      setStep('confirm-student')
    } catch (err) {
      setError(getErrorMessage(err) || 'Siswa tidak ditemukan. Pastikan NIS/NISN yang Anda masukkan sudah benar atau kartu pelajar terbaca dengan jelas.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Step 1.5: Konfirmasi Siswa & Cek Pinjaman Aktif untuk Kembali ───
  async function handleProceedFromStudentConfirm() {
    if (!student) return
    setIsLoading(true); setError(null)
    try {
      const loanData = await studentService.loans(student.id, { status: 'active,overdue' })
      const rawLoans = loanData.data?.data ?? []
      const loans = rawLoans.filter((l: Loan) => l.status === 'active' || l.status === 'overdue')

      if (loans.length === 0) {
        setError('Tidak ada peminjaman aktif. Anda tidak memiliki tanggungan buku yang sedang dipinjam.')
        return
      }
      setActiveLoans(loans)
      setStep('scan-book')
    } catch (err) {
      setError(getErrorMessage(err) || 'Gagal memuat data peminjaman siswa.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Step 2: Handler Scan Barcode Buku Fisik (Auto-Reconciliation) ───
  async function handleBookScan(code: string) {
    const trimmedCode = code.trim()
    if (!trimmedCode) return
    setIsLoading(true); setError(null)

    try {
      // 1. Cari buku fisik di database / SLiMS
      let scannedBook: any = null
      try {
        scannedBook = await bookService.scan(trimmedCode)
      } catch (err) {
        console.warn('Book scan lookup warning:', err)
      }

      // Ambil kode angka saja untuk suffix matching (misal LTBCT002 -> 002)
      const digitsOnly = trimmedCode.replace(/\D/g, '')

      // 2. Cari kecocokan di activeLoans siswa ini
      // Prioritas 1: Exact item code match
      let matchedLoan = activeLoans.find((loan) => {
        const item = loan.items?.[0] as any
        const itemCode = (item?.slims_item_code || '').trim()
        return itemCode && itemCode.toLowerCase() === trimmedCode.toLowerCase()
      })

      // Prioritas 2: Biblio ID match (jika scannedBook ditemukan)
      if (!matchedLoan && scannedBook) {
        matchedLoan = activeLoans.find((loan) => {
          const item = loan.items?.[0] as any
          return (item?.slims_biblio_id && item.slims_biblio_id === scannedBook.id) ||
                 (item?.book_id && item.book_id === scannedBook.id)
        })
      }

      // Prioritas 3: Suffix match (misal peminjaman tercatat '002', buku fisik 'LTBCT002' atau sebaliknya)
      if (!matchedLoan && digitsOnly) {
        matchedLoan = activeLoans.find((loan) => {
          const item = loan.items?.[0] as any
          const itemCode = (item?.slims_item_code || '').trim()
          const itemDigits = itemCode.replace(/\D/g, '')
          return itemDigits && (itemDigits === digitsOnly || digitsOnly.endsWith(itemDigits) || itemDigits.endsWith(digitsOnly))
        })
      }

      // Prioritas 4: Misattributed loan (Biblio 639/640 Manajemen Perkantoran)
      if (!matchedLoan) {
        matchedLoan = activeLoans.find((loan) => {
          const item = loan.items?.[0] as any
          return item?.slims_biblio_id === 639 || item?.slims_biblio_id === 640
        })
      }

      // Prioritas 5: Jika siswa hanya punya 1 peminjaman aktif
      if (!matchedLoan && activeLoans.length === 1) {
        matchedLoan = activeLoans[0]
      }

      // Jika tetap tidak ditemukan kecocokan
      if (!matchedLoan) {
        setError(`Buku dengan barcode "${trimmedCode}" tidak cocok dengan daftar pinjaman aktif Anda. Pastikan Anda mengembalikan buku yang tepat atau gunakan tombol "Pilih Manual dari Daftar".`)
        return
      }

      // Berhasil match!
      setSelectedLoan(matchedLoan)
      setScannedBarcode(trimmedCode)
      if (scannedBook?.judul) {
        setReconciledTitle(scannedBook.judul)
      } else {
        setReconciledTitle(null)
      }

      setStep('photo')
    } catch (err) {
      setError(getErrorMessage(err) || 'Terjadi kesalahan saat memproses scan buku.')
    } finally {
      setIsLoading(false)
    }
  }

  function getLoanBookTitle(loan: Loan | null): string {
    if (!loan) return '—'
    const item = loan.items?.[0] as any
    return item?.book?.judul ?? item?.book_title_snapshot ?? `Buku [${item?.id ?? '?'}]`
  }

  const returnMutation = useMutation({
    mutationFn: () => loanService.processReturn(selectedLoan!.id, {
      return_photo: photoPath ?? undefined,
      scanned_barcode: scannedBarcode ?? undefined,
    }),
    onSuccess: (result) => navigate('/kiosk/success', {
      state: {
        type:        result.is_late ? 'return_late' : 'return',
        late_days:   result.late_days,
        penalty_end: result.violation?.penalty_end_date,
        book_title:  reconciledTitle || getLoanBookTitle(selectedLoan),
      }
    }),
    onError: (err) => {
      const msg = getErrorMessage(err)
      if (msg.toLowerCase().includes('dikembalikan') || msg.toLowerCase().includes('returned')) {
        reset()
        setError('Buku ini sudah tercatat dikembalikan. Silakan scan kartu pelajar kembali untuk melihat peminjaman aktif.')
      } else {
        setError(msg)
      }
    },
  })

  function reset() {
    setStep('scan-student'); setStudent(null); setActiveLoans([])
    setSelectedLoan(null); setScannedBarcode(null); setReconciledTitle(null); setPhotoPath(null); setReturnPhotoPreview(null); setError(null)
    setFaceMatchStatus('idle'); setFaceMatchScore(0)
    faceCheckDoneRef.current = false
  }

  const isLoanOverdue = (l: Loan) => {
    if (l.status === 'overdue') return true
    const dueTime = new Date(l.due_at).getTime()
    return Date.now() > dueTime + 30 * 60 * 1000
  }

  // Badge UI for face match result
  function FaceMatchBadge() {
    switch (faceMatchStatus) {
      case 'checking':
        return (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mt-3">
            <Loader2 size={16} className="text-blue-600 animate-spin flex-shrink-0" />
            <span className="text-blue-800 text-sm font-semibold">Memverifikasi identitas pengembali...</span>
          </div>
        )
      case 'match':
        return (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mt-3">
            <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
            <div>
              <span className="text-emerald-800 text-sm font-bold">Identitas Terverifikasi</span>
              <span className="text-emerald-600 text-xs ml-2">({Math.round(faceMatchScore * 100)}% sesuai)</span>
            </div>
          </div>
        )
      case 'mismatch':
        return (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-300 rounded-xl px-4 py-3 mt-3">
            <ShieldX size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-rose-800 text-sm font-bold">Wajah Tidak Sesuai Peminjam</p>
              <p className="text-rose-700 text-xs mt-0.5 font-medium">
                Pengembalian tidak dapat dilanjutkan. Hubungi petugas perpustakaan.
              </p>
            </div>
          </div>
        )
      case 'no_face':
        return (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mt-3">
            <ShieldAlert size={16} className="text-amber-600 flex-shrink-0" />
            <span className="text-amber-800 text-sm font-semibold">Foto kurang jelas untuk verifikasi wajah</span>
          </div>
        )
      case 'unknown':
        return (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mt-3">
            <ShieldAlert size={16} className="text-slate-400 flex-shrink-0" />
            <span className="text-slate-600 text-sm font-medium">Verifikasi wajah tidak tersedia</span>
          </div>
        )
      default:
        return null
    }
  }

  // Block return button only on confirmed mismatch
  const isReturnBlocked = faceMatchStatus === 'mismatch'

  return (
    <div className="flex-1 min-h-[calc(100vh-2.75rem)] bg-gradient-to-br from-slate-50 via-teal-50/40 to-emerald-50/40 flex flex-col p-3 sm:p-5 lg:p-8 text-slate-900">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 mb-3 sm:mb-5 lg:mb-6">
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
              Pengembalian Buku Mandiri
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              Layanan mandiri pengembalian buku perpustakaan
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
                    ? 'w-6 bg-emerald-600'
                    : idx < currentStepIndex
                    ? 'w-2 bg-emerald-400'
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
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>Langkah {currentStepIndex + 1}/{steps.length}</span>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 mb-4 text-rose-900 shadow-sm max-w-xl mx-auto w-full">
          <AlertTriangle size={24} className="text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-base font-semibold">{error}</p>
            <div className="flex items-center gap-4 mt-2">
              <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 text-sm font-bold underline cursor-pointer">
                Coba lagi
              </button>
              {step === 'scan-book' && (
                <button onClick={() => { setError(null); setStep('select-loan'); }} className="text-emerald-700 hover:text-emerald-900 text-sm font-bold underline cursor-pointer">
                  Pilih Manual dari Daftar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
            <Loader2 className="text-emerald-600 animate-spin" size={48} />
            <p className="text-slate-800 text-xl font-bold">Memuat data...</p>
          </div>
        </div>
      )}

      {/* ─── Step 1: Scan Student ─── */}
      {step === 'scan-student' && !isLoading && (
        <div key="scan-student" className="animate-kiosk-step flex flex-col items-center gap-6 py-4 max-w-lg mx-auto w-full my-auto">
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-sm">
              <RotateCcw size={36} />
            </div>
            <h2 className="text-slate-900 text-2xl sm:text-3xl font-extrabold tracking-tight">Scan Kartu Pelajar</h2>
            <p className="text-slate-600 text-base sm:text-lg mt-1 font-medium">Tempelkan kartu pelajar ke scanner atau ketik NIS Anda</p>
          </div>
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
            <BarcodeScanner
              onScan={handleStudentScan}
              placeholder="Scan kartu / NIS / NISN"
              kioskMode
              autoFocus
              numericOnly
            />
          </div>
        </div>
      )}

      {/* ─── Step 1.5: Confirm Student Identity ─── */}
      {step === 'confirm-student' && student && !isLoading && (
        <div key="confirm-student" className="animate-kiosk-step flex flex-col items-center justify-center gap-3 sm:gap-5 max-w-xl mx-auto w-full my-auto">
          <div className="text-center">
            <h2 className="text-slate-900 text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              Periksa Identitas Anda
            </h2>
            <p className="text-slate-600 text-xs sm:text-base mt-0.5 font-medium">
              Pastikan data siswa di bawah ini benar sebelum mengembalikan buku
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-7 w-full border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-4">
            {/* Profile Header */}
            <div className="flex items-center gap-4 p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-emerald-100 border border-emerald-200 shadow-inner flex items-center justify-center flex-shrink-0">
                {student.foto ? (
                  <img src={student.foto} alt={student.nama} className="w-full h-full object-cover" />
                ) : (
                  <User className="text-emerald-600 w-8 h-8 sm:w-9 sm:h-9" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Siswa Terdeteksi</p>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate mt-0.5">{student.nama}</h3>
                <p className="text-xs text-slate-500 font-medium">Status: <span className="text-emerald-600 font-bold">Aktif Terdaftar</span></p>
              </div>
            </div>

            {/* Data Fields */}
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {[
                { label: 'Nama Lengkap', value: student.nama },
                { label: 'NIS',          value: formatNis(student.nis) },
                { label: 'NISN',         value: student.nisn || '—' },
                { label: 'Kelas',        value: student.kelas || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2.5 sm:py-3">
                  <span className="text-slate-500 text-xs sm:text-sm font-semibold">{label}</span>
                  <span className="text-slate-900 text-xs sm:text-sm sm:text-base font-bold text-right truncate max-w-[65%]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 sm:gap-4 w-full">
            <button
              type="button"
              onClick={reset}
              className={`${kBtn} flex-1 bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-200 shadow-sm`}
            >
              <ArrowLeft size={20} /> Bukan Saya / Ganti
            </button>
            <button
              type="button"
              onClick={handleProceedFromStudentConfirm}
              className={`${kBtn} flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30`}
            >
              <span>Benar, Lanjutkan</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Scan Buku ─── */}
      {step === 'scan-book' && student && !isLoading && (
        <div key="scan-book" className="animate-kiosk-step flex flex-col items-center justify-center gap-6 max-w-xl mx-auto w-full my-auto">
          <div className="text-center">
            <h2 className="text-slate-900 text-2xl sm:text-3xl font-extrabold tracking-tight">Scan Barcode Buku</h2>
            <p className="text-slate-600 text-base sm:text-lg mt-1 font-medium">Arahkan barcode atau QR pada buku ke scanner</p>
          </div>

          <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
            <BarcodeScanner onScan={handleBookScan} placeholder="Scan barcode / QR buku..." kioskMode autoFocus />
          </div>
        </div>
      )}

      {/* ─── Step 2b: Manual Select Loan (Fallback) ─── */}
      {step === 'select-loan' && student && !isLoading && (
        <div key="select-loan" className="animate-kiosk-step flex flex-col gap-5 max-w-2xl mx-auto w-full py-4 my-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('scan-book')}
              className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} /> Kembali ke Scan Barcode
            </button>
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 shadow-sm text-xs sm:text-sm font-bold text-slate-800">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{formatStudentLabel(student)}</span>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-slate-900 text-2xl sm:text-3xl font-extrabold tracking-tight">Pilih Buku Manual</h2>
            <p className="text-slate-600 text-base mt-1 font-medium">Ketuk buku yang sedang Anda bawa untuk dikembalikan</p>
          </div>

          <div className="space-y-4 w-full">
            {activeLoans.map((loan) => {
              const isLate = isLoanOverdue(loan)
              const bookTitle = getLoanBookTitle(loan)
              const item = loan.items?.[0] as any
              const bookAuthor = item?.book?.penulis ?? item?.book_author_snapshot ?? null
              return (
                <button
                  key={loan.id}
                  onClick={() => {
                    setSelectedLoan(loan)
                    setScannedBarcode(null)
                    setReconciledTitle(null)
                    setStep('photo')
                  }}
                  className={`w-full text-left bg-white hover:border-emerald-400 active:scale-[0.98] rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-2 shadow-sm cursor-pointer ${
                    isLate ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-slate-900 text-xl font-bold">{bookTitle}</p>
                      {bookAuthor && <p className="text-slate-500 mt-1 font-medium text-sm">{bookAuthor}</p>}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="text-slate-500 font-medium">Dipinjam: {formatDate(loan.borrowed_at)}</span>
                        <span className={isLate ? 'text-rose-600 font-bold' : 'text-slate-700 font-medium'}>
                          Jatuh Tempo: {loan.loan_type === 'class' ? formatDateTime(loan.due_at) : formatDate(loan.due_at)}
                        </span>
                      </div>
                    </div>
                    {isLate && (
                      <div className="flex-shrink-0 bg-rose-100 text-rose-700 rounded-xl px-4 py-2 text-xs font-black border border-rose-200">
                        TERLAMBAT
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Step 3: Photo ─── */}
      {step === 'photo' && selectedLoan && (
        <div key="photo" className="animate-kiosk-step flex flex-col items-center justify-center gap-6 max-w-xl mx-auto w-full">
          <div className="text-center">
            <h2 className="text-slate-900 text-2xl sm:text-3xl font-extrabold tracking-tight">Verifikasi & Foto Siswa</h2>
            <p className="text-slate-600 text-base sm:text-lg mt-1 font-medium">Posisikan wajah di dalam lingkaran oval untuk verifikasi otomatis</p>
          </div>

          <WebcamCapture
            onCapture={(base64) => {
              setReturnPhotoPreview(base64)
              setStep('confirm')
              uploadService.photo(base64, 'return')
                .then(({ path }) => setPhotoPath(path))
                .catch((err) => console.warn('Gagal upload foto kembali:', err))
            }}
            onNoWebcam={() => setStep('confirm')}
            autoCapture
            autoCaptureDelay={1}
            kioskMode
          />
        </div>
      )}

      {/* ─── Step 4: Confirm (Landscape 2-Column Layout) ─── */}
      {step === 'confirm' && student && selectedLoan && (
        <div key="confirm" className="animate-kiosk-step flex flex-col items-center gap-4 max-w-4xl lg:max-w-5xl mx-auto w-full py-4 px-0 my-auto">
          {isLoanOverdue(selectedLoan) && (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-amber-900 text-sm sm:text-base font-bold">Pengembalian Melewati Batas Tempo</p>
                  <p className="text-amber-800 text-xs sm:text-sm mt-0.5 font-medium">
                    Sanksi keterlambatan akan dicatat untuk buku ini sesuai dengan ketentuan perpustakaan.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 w-full border border-slate-200/80 shadow-xl shadow-slate-200/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-stretch">

              {/* ─── KOLOM KIRI: KOMPARASI FOTO & VERIFIKASI ─── */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 flex flex-col">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Verifikasi Identitas
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {/* Foto Saat Peminjaman */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-700 mb-1.5">
                      <Clock size={13} className="text-blue-600" />
                      <span>Saat Pinjam</span>
                    </div>
                    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shadow-inner flex items-center justify-center">
                      {selectedLoan.borrow_photo ? (
                        <img
                          src={selectedLoan.borrow_photo}
                          alt="Foto Saat Peminjaman"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                          <User size={28} className="text-slate-300" />
                          <span className="text-[11px] mt-1 font-medium">Tidak ada foto</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 font-medium">Foto Peminjam</span>
                  </div>

                  {/* Foto Saat Pengembalian */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 mb-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>Saat Kembali</span>
                    </div>
                    <div className={`w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-200 border-2 shadow-sm flex items-center justify-center ${
                      faceMatchStatus === 'mismatch' ? 'border-rose-500' :
                      faceMatchStatus === 'match'    ? 'border-emerald-500' :
                      'border-slate-300'
                    }`}>
                      {returnPhotoPreview ? (
                        <img
                          src={returnPhotoPreview}
                          alt="Foto Saat Pengembalian"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                          <Camera size={28} className="text-slate-300" />
                          <span className="text-[11px] mt-1 font-medium">Kamera dilewati</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-emerald-600 mt-1 font-semibold">Pengembali</span>
                  </div>
                </div>

                {/* Face Match Badge */}
                <FaceMatchBadge />
              </div>

              {/* ─── KOLOM KANAN: INFORMASI & AKSI ─── */}
              <div className="flex flex-col justify-between space-y-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">
                    Konfirmasi Pengembalian
                  </h2>

                  {reconciledTitle && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 sm:p-4 mb-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                        <Sparkles size={16} className="text-emerald-600 flex-shrink-0" />
                        <span>Koreksi Otomatis Barcode Fisik</span>
                      </div>
                      <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                        Buku fisik: <span className="font-bold text-emerald-900">{reconciledTitle}</span> (Barcode: <span className="font-mono font-bold">{scannedBarcode}</span>). Data peminjaman disesuaikan otomatis dengan buku fisik.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {[
                      { label: 'Nama',        value: student.nama },
                      { label: 'NIS',         value: formatNis(student.nis) },
                      { label: 'Buku',        value: reconciledTitle || getLoanBookTitle(selectedLoan) },
                      { label: 'Jatuh Tempo', value: selectedLoan.loan_type === 'class' ? formatDateTime(selectedLoan.due_at) : formatDate(selectedLoan.due_at) },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-start gap-4 py-2 border-b border-slate-100 last:border-0">
                        <span className="text-slate-500 text-sm sm:text-base font-medium">{label}</span>
                        <span className="text-slate-900 text-sm sm:text-base font-bold text-right max-w-xs">{value}</span>
                      </div>
                    ))}
                    {photoPath && (
                      <div className="flex justify-between py-2">
                        <span className="text-slate-500 text-sm sm:text-base font-medium">Status Foto</span>
                        <span className="text-emerald-600 text-sm sm:text-base font-bold flex items-center gap-1.5">
                          <Check size={16} strokeWidth={2.5} />
                          Terlampir & Terverifikasi
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mismatch Warning (full-width in right column) */}
                {isReturnBlocked && (
                  <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <ShieldX size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-rose-900 font-bold text-sm">Pengembalian Diblokir</p>
                        <p className="text-rose-700 text-xs mt-1 font-medium leading-relaxed">
                          Wajah pengembali tidak sesuai dengan peminjam. Segera hubungi petugas perpustakaan untuk bantuan.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tombol Aksi */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={reset}
                    className={`${kBtn} flex-1 bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-200 shadow-sm py-3 text-base`}
                  >
                    <ArrowLeft size={20} /> Batal
                  </button>
                  <button
                    onClick={() => returnMutation.mutate()}
                    disabled={returnMutation.isPending || isReturnBlocked}
                    title={isReturnBlocked ? 'Hubungi petugas — wajah tidak sesuai peminjam' : undefined}
                    className={`${kBtn} flex-[1.4] py-3 text-base ${
                      isReturnBlocked
                        ? 'bg-slate-200 text-slate-400 border-2 border-slate-300 cursor-not-allowed hover:translate-y-0 hover:shadow-none'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30'
                    }`}
                  >
                    {returnMutation.isPending
                      ? <><Loader2 className="animate-spin" size={20} /> Memproses...</>
                      : isReturnBlocked
                        ? <><ShieldX size={20} /> Diblokir</>
                        : <><CheckCircle2 size={20} /> Kembalikan Buku</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
