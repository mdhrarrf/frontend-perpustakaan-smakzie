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

  const kBtn = 'flex items-center justify-center gap-3 rounded-2xl font-bold text-xl px-8 py-5 min-h-[80px] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-4 focus:ring-offset-2'

  // Helper: nama buku dari active loan
  const activeLoanBookTitle = activeLoan?.items?.[0]?.book?.judul
    ?? (activeLoan?.items?.[0] as any)?.book_title_snapshot
    ?? 'Buku Tidak Diketahui'

  const isOverdue = activeLoan?.status === 'overdue'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/40 flex flex-col p-8 text-slate-900">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/kiosk/borrow')}
          className="p-3 bg-white hover:bg-slate-100 rounded-2xl border border-slate-200 text-slate-700 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Peminjaman Individu</h1>
          <p className="text-slate-500 text-sm font-medium">Layanan mandiri peminjaman buku perpustakaan</p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6 text-rose-900 shadow-sm">
          <AlertTriangle size={24} className="text-rose-600 flex-shrink-0 mt-0.5" />
          <p className="text-base font-semibold">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <Loader2 className="text-indigo-600 animate-spin" size={40} />
          <p className="text-slate-800 text-xl font-bold">{loadingMessage}</p>
          {loadingMessage.includes('Mencari') && (
            <p className="text-slate-500 text-sm text-center max-w-xs font-medium">
              Sistem sedang mencari data buku di internet secara otomatis...
            </p>
          )}
        </div>
      )}

      {/* Smart Scan Notification */}
      {smartScanInfo?.registered && !isLoading && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4 text-blue-900 shadow-sm">
          <CheckCircle2 size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-950 font-bold">✨ Buku Baru Otomatis Didaftarkan!</p>
            <p className="text-blue-700 text-sm mt-1 font-medium">{smartScanInfo.message}</p>
          </div>
        </div>
      )}

      {/* ─── Step: Scan Student ─── */}
      {step === 'scan-student' && !isLoading && (
        <div key="scan-student" className="animate-kiosk-step flex-1 flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <span className="inline-block bg-indigo-50 text-indigo-700 text-sm font-bold uppercase tracking-wider px-4 py-1 rounded-full mb-2 border border-indigo-200/60">
              Langkah 1 dari 4
            </span>
            <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Identifikasi Kartu Pelajar</h2>
            <p className="text-slate-600 text-lg mt-1 font-medium">Scan kartu pelajar Anda atau ketik NIS secara manual</p>
          </div>
          <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
            <BarcodeScanner onScan={handleStudentScan} placeholder="Scan kartu / NIS / NISN" kioskMode autoFocus />
          </div>
        </div>
      )}

      {/* ─── Step: Active Loan Warning ─── */}
      {step === 'active-loan-warning' && !isLoading && student && activeLoan && (
        <div key="active-loan-warning" className="animate-kiosk-step flex-1 flex flex-col items-center justify-center gap-6 max-w-lg mx-auto w-full">
          {/* Badge siswa */}
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-5 py-2.5 shadow-sm">
            <CheckCircle2 size={20} className="text-emerald-600" />
            <p className="text-slate-800 text-base font-bold">{student.nama}</p>
          </div>

          {/* Peringatan Card */}
          <div className={`w-full rounded-3xl p-8 border-2 shadow-lg ${isOverdue ? 'bg-rose-50 border-rose-300' : 'bg-amber-50 border-amber-300'}`}>
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle size={48} className={isOverdue ? 'text-rose-600' : 'text-amber-600'} />
              <h2 className={`text-2xl font-extrabold ${isOverdue ? 'text-rose-900' : 'text-amber-900'}`}>
                {isOverdue ? '⚠️ Buku Terlambat Dikembalikan!' : '📚 Masih Ada Buku yang Dipinjam'}
              </h2>
              <p className={`text-base font-medium ${isOverdue ? 'text-rose-800' : 'text-amber-800'}`}>
                {isOverdue
                  ? 'Anda memiliki buku yang telah melewati batas jatuh tempo. Silakan kembalikan terlebih dahulu.'
                  : 'Anda masih memiliki tanggungan buku yang belum dikembalikan. Kembalikan buku tersebut sebelum meminjam yang baru.'
                }
              </p>

              {/* Detail buku yang dipinjam */}
              <div className="bg-white rounded-2xl p-5 w-full mt-2 text-left space-y-3 border border-slate-200/80 shadow-sm">
                <div className="flex items-start gap-3">
                  <BookOpen size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Judul Buku</p>
                    <p className="text-slate-900 font-bold text-lg">{activeLoanBookTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Jatuh Tempo</p>
                    <p className={`font-bold text-base ${isOverdue ? 'text-rose-600' : 'text-amber-700'}`}>
                      {formatDate(activeLoan.due_at)}
                      {isOverdue && <span className="ml-2 text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">Terlambat {activeLoan.late_days} hari</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-400 text-xs font-medium">No. Peminjaman:</span>
                  <span className="text-slate-700 text-xs font-mono font-semibold">{activeLoan.loan_number}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => navigate('/kiosk/return')}
              className={`${kBtn} w-full ${isOverdue ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'} text-white shadow-lg`}
            >
              <CheckCircle2 size={24} />
              Kembalikan Buku Dulu
            </button>
            <button
              onClick={() => { setActiveLoan(null); setStep('scan-student') }}
              className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-4 rounded-2xl text-base font-bold shadow-sm transition-all"
            >
              ← Ganti Kartu Pelajar
            </button>
          </div>
        </div>
      )}

      {/* ─── Step: Scan Book ─── */}
      {step === 'scan-book' && !isLoading && student && (
        <div key="scan-book" className="animate-kiosk-step flex-1 flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-5 py-2.5 mb-3 shadow-sm">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <p className="text-slate-800 text-base font-bold">{student.nama} ({student.nis})</p>
            </div>
            <div>
              <span className="inline-block bg-indigo-50 text-indigo-700 text-sm font-bold uppercase tracking-wider px-4 py-1 rounded-full mb-2 border border-indigo-200/60">
                Langkah 2 dari 4
              </span>
              <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Scan Buku</h2>
              <p className="text-slate-600 text-lg mt-1 font-medium">Arahkan barcode pada buku ke scanner</p>
            </div>
          </div>
          <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
            <BarcodeScanner onScan={handleBookScan} placeholder="Scan barcode / QR buku" kioskMode autoFocus />
          </div>
        </div>
      )}

      {/* ─── Step: Pick Duration ─── */}
      {step === 'pick-duration' && !isLoading && student && book && (
        <div key="pick-duration" className="animate-kiosk-step flex-1 flex flex-col items-center justify-center gap-6 max-w-lg mx-auto w-full">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-5 py-2.5 mb-3 shadow-sm">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <p className="text-slate-800 text-base font-bold line-clamp-1">{book.judul}</p>
            </div>
            <span className="inline-block bg-indigo-50 text-indigo-700 text-sm font-bold uppercase tracking-wider px-4 py-1 rounded-full mb-2 border border-indigo-200/60">
              Langkah 3 dari 4
            </span>
            <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Berapa Lama Meminjam?</h2>
            <p className="text-slate-600 text-base mt-1 font-medium">Pilih durasi peminjaman (maksimal {MAX_DUE_DAYS} hari)</p>
          </div>

          {/* Duration Picker Card */}
          <div className="bg-white rounded-3xl p-8 w-full border border-slate-200/80 shadow-xl shadow-slate-200/50">
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
              <p className="text-slate-800 text-lg font-medium">
                Lama pinjam: <span className="text-indigo-600 font-extrabold text-2xl">{dueDays}</span> Hari
              </p>
              <p className="text-slate-500 text-sm">
                Jatuh tempo: <span className="text-slate-900 font-bold">{formatDate(getDueAt().toISOString())}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <button
              onClick={() => setStep('scan-book')}
              className={`${kBtn} flex-1 bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-200 shadow-sm`}
            >
              <ArrowLeft size={24} /> Ganti Buku
            </button>
            <button
              onClick={() => setStep('photo')}
              className={`${kBtn} flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30`}
            >
              <CheckCircle2 size={24} /> Lanjutkan
            </button>
          </div>
        </div>
      )}

      {/* ─── Step: Photo ─── */}
      {step === 'photo' && book && (
        <div key="photo" className="animate-kiosk-step flex-1 flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <span className="inline-block bg-indigo-50 text-indigo-700 text-sm font-bold uppercase tracking-wider px-4 py-1 rounded-full mb-2 border border-indigo-200/60">
              Langkah 4 dari 4
            </span>
            <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Dokumentasi Foto</h2>
            <p className="text-slate-600 text-base mt-1 font-medium">Foto otomatis diambil untuk bukti peminjaman</p>
            <div className="inline-block bg-white border border-slate-200 rounded-xl px-5 py-2 mt-3 shadow-sm">
              <p className="text-slate-900 font-bold">{book.judul}</p>
            </div>
          </div>
          <WebcamCapture onCapture={handlePhotoCapture} autoCapture autoCaptureDelay={5} kioskMode />
          <button
            onClick={() => setStep('confirm')}
            className="text-slate-600 hover:text-slate-900 text-base font-bold bg-white border border-slate-200 px-6 py-2.5 rounded-full shadow-sm transition-all"
          >
            Lewati Foto →
          </button>
        </div>
      )}

      {/* ─── Step: Confirm ─── */}
      {step === 'confirm' && student && book && (
        <div key="confirm" className="animate-kiosk-step flex-1 flex flex-col items-center justify-center gap-6 max-w-lg mx-auto w-full">
          <div className="bg-white rounded-3xl p-8 w-full space-y-4 border border-slate-200/80 shadow-xl shadow-slate-200/50">
            <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-4 tracking-tight">Konfirmasi Peminjaman</h2>
            {[
              { label: 'Peminjam',    value: `${student.nama} (${student.nis})` },
              { label: 'Kelas',       value: student.kelas ?? '—' },
              { label: 'Buku',        value: book.judul },
              { label: 'Penulis',     value: book.penulis },
              { label: 'Lama Pinjam', value: `${dueDays} hari` },
              { label: 'Jatuh Tempo', value: formatDate(getDueAt().toISOString()) + ' (23:59)' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start gap-4 py-2 border-b border-slate-100 last:border-0">
                <span className="text-slate-500 text-base font-medium">{label}</span>
                <span className="text-slate-900 text-base font-bold text-right">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-4 w-full">
            <button
              onClick={() => setStep('pick-duration')}
              className={`${kBtn} flex-1 bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-200 shadow-sm`}
            >
              <ArrowLeft size={24} /> Batal
            </button>
            <button
              onClick={() => borrowMutation.mutate()}
              disabled={borrowMutation.isPending}
              className={`${kBtn} flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30`}
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
