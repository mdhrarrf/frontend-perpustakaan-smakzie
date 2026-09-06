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
import { ArrowLeft, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import type { Student, Book } from '@/types'
import { formatDate } from '@/utils'

type Step = 'scan-student' | 'scan-book' | 'photo' | 'confirm' | 'processing'

const DEFAULT_DUE_DAYS = 7

export function KioskBorrowIndividual() {
  const navigate  = useNavigate()
  const stationId = useKioskStore((s) => s.stationId)

  const [step,      setStep]    = useState<Step>('scan-student')
  const [student,   setStudent] = useState<Student | null>(null)
  const [book,      setBook]    = useState<Book | null>(null)
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [error,     setError]   = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const dueAt = new Date()
  dueAt.setDate(dueAt.getDate() + DEFAULT_DUE_DAYS)
  dueAt.setHours(23, 59, 0, 0)

  async function handleStudentScan(code: string) {
    setIsLoading(true); setError(null)
    try {
      const data = await studentService.search(code, 'barcode')
      const s = Array.isArray(data) ? data[0] : data
      if (s.status !== 'active') { setError('Kartu siswa tidak aktif. Hubungi petugas perpustakaan.'); return }
      setStudent(s)
      setStep('scan-book')
    } catch { setError('Siswa tidak ditemukan. Pastikan kartu pelajar terbaca dengan benar.') }
    finally { setIsLoading(false) }
  }

  async function handleBookScan(code: string) {
    setIsLoading(true); setError(null)
    try {
      const b = await bookService.scan(code)
      if (b.jumlah_tersedia < 1) { setError('Maaf, stok buku ini sedang habis.'); return }
      // Cek violation per buku
      const v = await violationService.check(student!.id, b.id)
      if (!v.allowed) {
        setError(`Tidak dapat meminjam buku ini. Terkena sanksi keterlambatan hingga ${formatDate(v.violation?.penalty_end_date)}.`)
        return
      }
      setBook(b)
      setStep('photo')
    } catch { setError('Buku tidak ditemukan. Pastikan QR/barcode terbaca dengan benar.') }
    finally { setIsLoading(false) }
  }

  async function handlePhotoCapture(base64: string) {
    try {
      const { path } = await uploadService.photo(base64, 'borrow')
      setPhotoPath(path)
    } catch { /* optional */ }
    setStep('confirm')
  }

  const borrowMutation = useMutation({
    mutationFn: () => loanService.create({
      loan_type:    'individual',
      student_id:   student!.id,
      book_id:      book!.id,
      due_at:       dueAt.toISOString().slice(0, 16),
      borrow_photo: photoPath ?? undefined,
      station_id:   stationId,
    }),
    onSuccess: () => navigate('/kiosk/success', { state: { type: 'borrow', book_title: book?.judul, due_at: dueAt } }),
    onError:   (err) => setError(getErrorMessage(err)),
  })

  const kBtn = 'flex items-center justify-center gap-3 rounded-2xl font-bold text-xl px-8 py-5 min-h-[80px] transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-900'

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/kiosk/borrow')} className="text-slate-400 hover:text-white transition-colors"><ArrowLeft size={28} /></button>
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
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="text-primary-400 animate-spin" size={32} />
          <p className="text-slate-300 text-xl">Memproses...</p>
        </div>
      )}

      {/* Step: Scan Student */}
      {step === 'scan-student' && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-slate-300 text-2xl font-semibold mb-2">Langkah 1 dari 3</p>
            <p className="text-slate-400 text-lg">Scan atau ketik NIS pada kartu pelajar Anda</p>
          </div>
          <div className="w-full max-w-lg">
            <BarcodeScanner onScan={handleStudentScan} placeholder="Scan kartu / ketik NIS + Enter" kioskMode autoFocus />
          </div>
        </div>
      )}

      {/* Step: Scan Book */}
      {step === 'scan-book' && !isLoading && student && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-slate-800 rounded-full px-5 py-2.5 mb-4">
              <CheckCircle2 size={20} className="text-green-400" />
              <p className="text-slate-200 text-lg font-medium">{student.nama}</p>
            </div>
            <p className="text-slate-300 text-2xl font-semibold mb-2">Langkah 2 dari 3</p>
            <p className="text-slate-400 text-lg">Scan QR/barcode buku yang ingin dipinjam</p>
          </div>
          <div className="w-full max-w-lg">
            <BarcodeScanner onScan={handleBookScan} placeholder="Scan QR/barcode buku + Enter" kioskMode autoFocus />
          </div>
        </div>
      )}

      {/* Step: Photo */}
      {step === 'photo' && book && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-slate-300 text-2xl font-semibold mb-2">Langkah 3 dari 3</p>
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

      {/* Step: Confirm */}
      {step === 'confirm' && student && book && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-lg mx-auto w-full">
          <div className="bg-slate-800 rounded-3xl p-8 w-full space-y-4">
            <h2 className="text-2xl font-bold text-white text-center mb-2">Konfirmasi Peminjaman</h2>
            {[
              { label: 'Peminjam', value: `${student.nama} (${student.nis})` },
              { label: 'Kelas',   value: student.kelas ?? '—' },
              { label: 'Buku',    value: book.judul },
              { label: 'Penulis', value: book.penulis },
              { label: 'Jatuh Tempo', value: formatDate(dueAt.toISOString()) + ' (23:59)' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start gap-4">
                <span className="text-slate-400 text-lg">{label}</span>
                <span className="text-white text-lg font-medium text-right">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-4 w-full">
            <button onClick={() => setStep('scan-student')} className={`${kBtn} flex-1 bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500`}>
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
