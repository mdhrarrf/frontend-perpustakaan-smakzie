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
import { ArrowLeft, AlertTriangle, CheckCircle2, Loader2, BookOpen, Clock, AlertCircle } from 'lucide-react'
import type { Student, Book, Loan } from '@/types'
import { formatDate } from '@/utils'

type Step = 'scan-student' | 'active-loan-warning' | 'scan-book' | 'pick-duration' | 'photo' | 'confirm'

const MAX_DUE_DAYS = 7

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
  const [smartScanInfo,  setSmartScanInfo]  = useState<{ registered: boolean; message: string } | null>(null)
  const [loadingMessage, setLoadingMessage] = useState('Memproses...')
  const [dueDays,        setDueDays]        = useState(7) // Default 7 hari

  // Hitung tanggal jatuh tempo berdasarkan dueDays yang dipilih siswa
  const getDueAt = () => {
    const d = new Date()
    d.setDate(d.getDate() + dueDays)
    d.setHours(23, 59, 0, 0)
    return d
  }

  // ─── Step 1: Scan Siswa ───
  async function handleStudentScan(code: string) {
    setIsLoading(true); setError(null); setLoadingMessage('Memproses...')
    try {
      const data = await studentService.search(code, 'barcode')
      const s = Array.isArray(data) ? data[0] : data

      if (s.status !== 'active') {
        setError('Kartu siswa tidak aktif. Hubungi petugas perpustakaan.')
        return
      }

      setStudent(s)

      // Cek apakah siswa masih punya peminjaman aktif
      setLoadingMessage('Mengecek riwayat peminjaman...')
      const loansRes = await studentService.loans(s.id, { status: 'active,overdue', per_page: 1 })
      const rawLoans = loansRes.data?.data ?? []
      const activeLoans = rawLoans.filter((l: Loan) => l.status === 'active' || l.status === 'overdue')

      if (activeLoans.length > 0) {
        // Ada pinjaman aktif — tampilkan peringatan
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
    setIsLoading(true); setError(null); setSmartScanInfo(null)
    setLoadingMessage('🔍 Mencari buku...')
    try {
      const result = await bookService.scanSmart(code)
      const b = result.data!
      const meta = result.meta ?? null

      if (meta?.registered) {
        setSmartScanInfo({ registered: true, message: result.message ?? 'Buku otomatis didaftarkan ke perpustakaan.' })
      }

      if ((b.jumlah_tersedia ?? 0) < 1 && !meta?.registered) {
        setError('Maaf, stok buku ini sedang habis.')
        return
      }

      // Cek violation per buku
      const v = await violationService.check(student!.id, b.id)
      if (!v.allowed) {
        setError(`Tidak dapat meminjam buku ini. Terkena sanksi keterlambatan hingga ${formatDate(v.violation?.penalty_end_date)}.`)
        return
      }

      setBook(b)
      setStep('pick-duration') // Langsung ke pilih durasi
    } catch {
      setError('Buku tidak ditemukan. Pastikan QR/barcode terbaca dengan benar.')
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
        student_id:  student!.id,
        ...(isSlimsBook
          ? { slims_biblio_id: book!.id }
          : { book_id: book!.id }
        ),
        due_at:       getDueAt().toISOString().slice(0, 16),
        borrow_photo: photoPath ?? undefined,
        station_id:  stationId,
      })
    },
    onSuccess: () => navigate('/kiosk/success', { state: { type: 'borrow', book_title: book?.judul, due_at: getDueAt() } }),
    onError:   (err) => setError(getErrorMessage(err)),
  })

  const kBtn = 'flex items-center justify-center gap-3 rounded-2xl font-bold text-xl px-8 py-5 min-h-[80px] transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-900'

  // Helper: nama buku dari active loan
  const activeLoanBookTitle = activeLoan?.items?.[0]?.book?.judul
    ?? (activeLoan?.items?.[0] as any)?.book_title_snapshot
    ?? 'Buku Tidak Diketahui'

  const isOverdue = activeLoan?.status === 'overdue'

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/kiosk/borrow')} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={28} />
        </button>
        <h1 className="text-2xl font-bold text-white">Peminjaman Individu</h1>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-900/50 border border-red-700 rounded-2xl p-5 mb-6">
          <AlertTriangle size={24} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-200 text-lg">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <Loader2 className="text-primary-400 animate-spin" size={40} />
          <p className="text-slate-300 text-xl">{loadingMessage}</p>
          {loadingMessage.includes('Mencari') && (
            <p className="text-slate-500 text-sm text-center max-w-xs">
              Sistem sedang mencari data buku di internet secara otomatis...
            </p>
          )}
        </div>
      )}

      {/* Smart Scan Notification */}
      {smartScanInfo?.registered && !isLoading && (
        <div className="flex items-start gap-3 bg-blue-900/40 border border-blue-600 rounded-2xl p-5 mb-4">
          <CheckCircle2 size={24} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-200 font-semibold">✨ Buku Baru Otomatis Didaftarkan!</p>
            <p className="text-blue-300 text-sm mt-1">{smartScanInfo.message}</p>
          </div>
        </div>
      )}

      {/* ─── Step: Scan Student ─── */}
      {step === 'scan-student' && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-slate-300 text-2xl font-semibold mb-2">Langkah 1 dari 4</p>
            <p className="text-slate-400 text-lg">Scan atau ketik NIS pada kartu pelajar Anda</p>
          </div>
          <div className="w-full max-w-lg">
            <BarcodeScanner onScan={handleStudentScan} placeholder="Scan kartu / ketik NIS + Enter" kioskMode autoFocus />
          </div>
        </div>
      )}

      {/* ─── Step: Active Loan Warning ─── */}
      {step === 'active-loan-warning' && !isLoading && student && activeLoan && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-lg mx-auto w-full">
          {/* Badge siswa */}
          <div className="inline-flex items-center gap-2 bg-slate-800 rounded-full px-5 py-2.5">
            <CheckCircle2 size={20} className="text-green-400" />
            <p className="text-slate-200 text-lg font-medium">{student.nama}</p>
          </div>

          {/* Peringatan */}
          <div className={`w-full rounded-3xl p-8 border-2 ${isOverdue ? 'bg-red-900/40 border-red-500' : 'bg-amber-900/40 border-amber-500'}`}>
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle size={48} className={isOverdue ? 'text-red-400' : 'text-amber-400'} />
              <h2 className={`text-2xl font-bold ${isOverdue ? 'text-red-300' : 'text-amber-300'}`}>
                {isOverdue ? '⚠️ Buku Terlambat Dikembalikan!' : '📚 Masih Ada Buku Dipinjam'}
              </h2>
              <p className={`text-lg ${isOverdue ? 'text-red-200' : 'text-amber-200'}`}>
                {isOverdue
                  ? 'Kamu masih memiliki buku yang TERLAMBAT dikembalikan. Kembalikan segera!'
                  : 'Kamu masih memiliki buku yang belum dikembalikan. Kembalikan dulu sebelum meminjam buku baru.'
                }
              </p>

              {/* Detail buku yang dipinjam */}
              <div className="bg-slate-800/80 rounded-2xl p-5 w-full mt-2 text-left space-y-3">
                <div className="flex items-start gap-3">
                  <BookOpen size={20} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-sm">Buku yang dipinjam</p>
                    <p className="text-white font-semibold text-lg">{activeLoanBookTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-slate-400 text-sm">Jatuh tempo</p>
                    <p className={`font-semibold text-lg ${isOverdue ? 'text-red-400' : 'text-amber-400'}`}>
                      {formatDate(activeLoan.due_at)}
                      {isOverdue && <span className="ml-2 text-sm">({activeLoan.late_days} hari terlambat)</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm">No. Peminjaman:</span>
                  <span className="text-slate-300 text-sm font-mono">{activeLoan.loan_number}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tombol */}
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => navigate('/kiosk/return')}
              className={`${kBtn} w-full ${isOverdue ? 'bg-red-700 hover:bg-red-600 focus:ring-red-500' : 'bg-amber-700 hover:bg-amber-600 focus:ring-amber-500'} text-white`}
            >
              <CheckCircle2 size={24} />
              Kembalikan Buku Dulu
            </button>
            <button
              onClick={() => { setActiveLoan(null); setStep('scan-student') }}
              className="text-slate-500 hover:text-slate-300 text-lg transition-colors py-2"
            >
              ← Ganti Kartu Pelajar
            </button>
          </div>
        </div>
      )}

      {/* ─── Step: Scan Book ─── */}
      {step === 'scan-book' && !isLoading && student && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-slate-800 rounded-full px-5 py-2.5 mb-4">
              <CheckCircle2 size={20} className="text-green-400" />
              <p className="text-slate-200 text-lg font-medium">{student.nama}</p>
            </div>
            <p className="text-slate-300 text-2xl font-semibold mb-2">Langkah 2 dari 4</p>
            <p className="text-slate-400 text-lg">Scan QR/barcode buku yang ingin dipinjam</p>
          </div>
          <div className="w-full max-w-lg">
            <BarcodeScanner onScan={handleBookScan} placeholder="Scan QR/barcode buku + Enter" kioskMode autoFocus />
          </div>
        </div>
      )}

      {/* ─── Step: Pick Duration ─── */}
      {step === 'pick-duration' && !isLoading && student && book && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-lg mx-auto w-full">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-slate-800 rounded-full px-5 py-2.5 mb-4">
              <CheckCircle2 size={20} className="text-green-400" />
              <p className="text-slate-200 text-lg font-medium">{book.judul}</p>
            </div>
            <p className="text-slate-300 text-2xl font-semibold mb-2">Langkah 3 dari 4</p>
            <p className="text-slate-400 text-lg">Berapa lama ingin meminjam?</p>
            <p className="text-slate-500 text-sm mt-1">Maksimal {MAX_DUE_DAYS} hari</p>
          </div>

          {/* Duration Picker */}
          <div className="bg-slate-800 rounded-3xl p-8 w-full">
            <div className="grid grid-cols-7 gap-2 mb-6">
              {Array.from({ length: MAX_DUE_DAYS }, (_, i) => i + 1).map(day => (
                <button
                  key={day}
                  onClick={() => setDueDays(day)}
                  className={`aspect-square rounded-xl text-xl font-bold transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                    dueDays === day
                      ? 'bg-primary-600 text-white focus:ring-primary-400 scale-105 shadow-lg shadow-primary-900'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600 focus:ring-slate-500'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="text-center space-y-1">
              <p className="text-white text-lg">
                Meminjam selama <span className="text-primary-400 font-bold text-2xl">{dueDays}</span> hari
              </p>
              <p className="text-slate-400">
                Jatuh tempo: <span className="text-amber-400 font-semibold">{formatDate(getDueAt().toISOString())}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <button
              onClick={() => setStep('scan-book')}
              className={`${kBtn} flex-1 bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500`}
            >
              <ArrowLeft size={24} /> Ganti Buku
            </button>
            <button
              onClick={() => setStep('photo')}
              className={`${kBtn} flex-1 bg-primary-600 hover:bg-primary-500 text-white focus:ring-primary-400`}
            >
              <CheckCircle2 size={24} /> Lanjutkan
            </button>
          </div>
        </div>
      )}

      {/* ─── Step: Photo ─── */}
      {step === 'photo' && book && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-slate-300 text-2xl font-semibold mb-2">Langkah 4 dari 4</p>
            <p className="text-slate-400 text-lg">Ambil foto untuk dokumentasi</p>
            <div className="inline-block bg-slate-800 rounded-xl px-5 py-2 mt-3">
              <p className="text-white font-medium">{book.judul}</p>
            </div>
          </div>
          <WebcamCapture onCapture={handlePhotoCapture} autoCapture autoCaptureDelay={5} kioskMode />
          <button onClick={() => setStep('confirm')} className="text-slate-500 hover:text-slate-300 text-lg transition-colors">
            Lewati foto →
          </button>
        </div>
      )}

      {/* ─── Step: Confirm ─── */}
      {step === 'confirm' && student && book && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-lg mx-auto w-full">
          <div className="bg-slate-800 rounded-3xl p-8 w-full space-y-4">
            <h2 className="text-2xl font-bold text-white text-center mb-2">Konfirmasi Peminjaman</h2>
            {[
              { label: 'Peminjam',    value: `${student.nama} (${student.nis})` },
              { label: 'Kelas',       value: student.kelas ?? '—' },
              { label: 'Buku',        value: book.judul },
              { label: 'Penulis',     value: book.penulis },
              { label: 'Lama Pinjam', value: `${dueDays} hari` },
              { label: 'Jatuh Tempo', value: formatDate(getDueAt().toISOString()) + ' (23:59)' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start gap-4">
                <span className="text-slate-400 text-lg">{label}</span>
                <span className="text-white text-lg font-medium text-right">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-4 w-full">
            <button onClick={() => setStep('pick-duration')} className={`${kBtn} flex-1 bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500`}>
              <ArrowLeft size={24} /> Batal
            </button>
            <button onClick={() => borrowMutation.mutate()} disabled={borrowMutation.isPending} className={`${kBtn} flex-1 bg-primary-600 hover:bg-primary-500 text-white focus:ring-primary-400`}>
              {borrowMutation.isPending ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
              {borrowMutation.isPending ? 'Memproses...' : 'Konfirmasi'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
