import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { studentService } from '@/api/student.service'
import { bookService } from '@/api/book.service'
import { loanService } from '@/api/loan.service'
import { uploadService } from '@/api/index'
import { WebcamCapture } from '@/components/kiosk/WebcamCapture'
import { BarcodeScanner } from '@/components/kiosk/BarcodeScanner'
import { useKioskStore } from '@/store/kiosk.store'
import { getErrorMessage } from '@/api/client'
import { ArrowLeft, AlertTriangle, CheckCircle2, Loader2, Plus, X } from 'lucide-react'
import type { Student, Book } from '@/types'
import { formatDate } from '@/utils'

type Step = 'class-info' | 'scan-books' | 'photo' | 'confirm'
const DEFAULT_DUE_DAYS = 14

export function KioskBorrowClass() {
  const navigate  = useNavigate()
  const stationId = useKioskStore((s) => s.stationId)

  const [step, setStep]     = useState<Step>('class-info')
  const [classInfo, setClassInfo] = useState({ class_name: '', teacher_name: '', subject_name: '' })
  const [books,    setBooks] = useState<{ book: Book; quantity: number }[]>([])
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [error,   setError]  = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const dueAt = new Date()
  dueAt.setDate(dueAt.getDate() + DEFAULT_DUE_DAYS)
  dueAt.setHours(23, 59, 0, 0)

  async function handleBookScan(code: string) {
    setIsLoading(true); setError(null)
    try {
      const b = await bookService.scan(code)
      if (b.jumlah_tersedia < 1) { setError('Stok buku ini habis.'); return }
      setBooks(prev => {
        const exists = prev.find(x => x.book.id === b.id)
        if (exists) return prev.map(x => x.book.id === b.id ? { ...x, quantity: x.quantity + 1 } : x)
        return [...prev, { book: b, quantity: 1 }]
      })
    } catch { setError('Buku tidak ditemukan.') }
    finally { setIsLoading(false) }
  }

  const borrowMutation = useMutation({
    mutationFn: async () => {
      const promises = books.map(({ book, quantity }) =>
        loanService.create({
          loan_type:    'class',
          student_id:   1, // class loan tidak butuh student spesifik — gunakan system user
          book_id:      book.id,
          due_at:       dueAt.toISOString().slice(0, 16),
          borrow_photo: photoPath ?? undefined,
          station_id:   stationId,
          class_name:   classInfo.class_name,
          teacher_name: classInfo.teacher_name,
          subject_name: classInfo.subject_name,
          quantity,
        })
      )
      return Promise.all(promises)
    },
    onSuccess: () => navigate('/kiosk/success', { state: { type: 'borrow_class', book_count: books.length } }),
    onError:   (err) => setError(getErrorMessage(err)),
  })

  const kBtn = 'flex items-center justify-center gap-3 rounded-2xl font-bold text-xl px-8 py-5 min-h-[80px] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-4 focus:ring-offset-2'

  return (
    <div className="flex-1 min-h-[calc(100vh-2.75rem)] bg-gradient-to-br from-slate-50 via-purple-50/40 to-indigo-50/40 flex flex-col p-8 text-slate-900">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/kiosk/borrow')}
          className="p-3 bg-white hover:bg-slate-100 rounded-2xl border border-slate-200 text-slate-700 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Peminjaman Kelas</h1>
          <p className="text-slate-500 text-sm font-medium">Peminjaman buku paket / pelajaran untuk rombel kelas</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6 text-rose-900 shadow-sm">
          <AlertTriangle size={24} className="text-rose-600 flex-shrink-0 mt-0.5" />
          <p className="text-base font-semibold">{error}</p>
        </div>
      )}

      {step === 'class-info' && (
        <div key="class-info" className="animate-kiosk-step flex-1 flex flex-col items-center justify-center gap-6 max-w-lg mx-auto w-full">
          <div className="text-center">
            <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Informasi Kelas & Guru</h2>
            <p className="text-slate-600 text-base mt-1 font-medium">Masukkan data rombel kelas yang meminjam buku</p>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-4 w-full">
            <div>
              <label className="text-slate-700 text-sm font-bold uppercase tracking-wider mb-2 block">Nama Kelas *</label>
              <input
                value={classInfo.class_name}
                onChange={(e) => setClassInfo(p => ({ ...p, class_name: e.target.value }))}
                placeholder="Contoh: X RPL 1"
                className="w-full px-5 py-4 text-xl bg-white border-2 border-slate-300 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-100 shadow-sm"
              />
            </div>
            <div>
              <label className="text-slate-700 text-sm font-bold uppercase tracking-wider mb-2 block">Nama Guru Pengajar *</label>
              <input
                value={classInfo.teacher_name}
                onChange={(e) => setClassInfo(p => ({ ...p, teacher_name: e.target.value }))}
                placeholder="Nama lengkap guru penanggung jawab"
                className="w-full px-5 py-4 text-xl bg-white border-2 border-slate-300 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-100 shadow-sm"
              />
            </div>
            <div>
              <label className="text-slate-700 text-sm font-bold uppercase tracking-wider mb-2 block">Mata Pelajaran</label>
              <input
                value={classInfo.subject_name}
                onChange={(e) => setClassInfo(p => ({ ...p, subject_name: e.target.value }))}
                placeholder="Opsional (misal: Pemrograman Web)"
                className="w-full px-5 py-4 text-xl bg-white border-2 border-slate-300 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-100 shadow-sm"
              />
            </div>
          </div>
          <button
            onClick={() => setStep('scan-books')}
            disabled={!classInfo.class_name || !classInfo.teacher_name}
            className={`${kBtn} w-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/30 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Lanjut → Scan Buku
          </button>
        </div>
      )}

      {step === 'scan-books' && (
        <div key="scan-books" className="animate-kiosk-step flex-1 flex flex-col gap-6 max-w-2xl mx-auto w-full">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-6 py-2 mb-2 shadow-sm text-sm font-bold text-slate-700">
              Kelas {classInfo.class_name} · Guru: {classInfo.teacher_name}
            </div>
            <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Scan Buku yang Dipinjam</h2>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
            <BarcodeScanner onScan={handleBookScan} placeholder="Scan barcode / QR buku" kioskMode autoFocus />
          </div>

          {books.length > 0 && (
            <div className="space-y-3">
              <p className="text-slate-600 font-bold text-base">{books.length} Judul Buku Terpilih:</p>
              {books.map(({ book, quantity }) => (
                <div key={book.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
                  <div>
                    <p className="text-slate-900 font-bold text-lg">{book.judul}</p>
                    <p className="text-slate-500 text-sm font-medium">{book.penulis}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setBooks(p => p.map(x => x.book.id === book.id && x.quantity > 1 ? { ...x, quantity: x.quantity - 1 } : x))}
                      className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center text-xl font-bold border border-slate-200"
                    >−</button>
                    <span className="text-slate-900 text-xl font-extrabold w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setBooks(p => p.map(x => x.book.id === book.id ? { ...x, quantity: x.quantity + 1 } : x))}
                      className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center text-xl font-bold border border-slate-200"
                    >+</button>
                    <button
                      onClick={() => setBooks(p => p.filter(x => x.book.id !== book.id))}
                      className="w-11 h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200"
                    ><X size={20} /></button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setStep('photo')}
                className={`${kBtn} w-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/30 mt-4`}
              >
                <CheckCircle2 size={24} /> Selesai Scan ({books.reduce((a,b) => a + b.quantity, 0)} buku)
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'photo' && (
        <div key="photo" className="animate-kiosk-step flex-1 flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Dokumentasi Foto Guru</h2>
            <p className="text-slate-600 text-base mt-1 font-medium">Foto guru atau perwakilan yang mengambil buku</p>
          </div>
          <WebcamCapture onCapture={async (b64) => { const { path } = await uploadService.photo(b64, 'borrow'); setPhotoPath(path); setStep('confirm') }} kioskMode autoCapture autoCaptureDelay={5} />
          <button
            onClick={() => setStep('confirm')}
            className="text-slate-600 hover:text-slate-900 text-base font-bold bg-white border border-slate-200 px-6 py-2.5 rounded-full shadow-sm transition-all"
          >
            Lewati Foto →
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <div key="confirm" className="animate-kiosk-step flex-1 flex flex-col items-center justify-center gap-6 max-w-lg mx-auto w-full">
          <div className="bg-white rounded-3xl p-8 w-full space-y-4 border border-slate-200/80 shadow-xl shadow-slate-200/50">
            <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-4 tracking-tight">Konfirmasi Peminjaman Kelas</h2>
            <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500 font-medium">Kelas</span><span className="text-slate-900 font-bold">{classInfo.class_name}</span></div>
            <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500 font-medium">Guru</span><span className="text-slate-900 font-bold">{classInfo.teacher_name}</span></div>
            <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500 font-medium">Total Buku</span><span className="text-violet-700 font-extrabold">{books.reduce((a,b) => a + b.quantity, 0)} eksemplar</span></div>
            <div className="flex justify-between py-2"><span className="text-slate-500 font-medium">Jatuh Tempo</span><span className="text-slate-900 font-bold">{formatDate(dueAt.toISOString())}</span></div>
          </div>
          <div className="flex gap-4 w-full">
            <button
              onClick={() => setStep('scan-books')}
              className={`${kBtn} flex-1 bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-200 shadow-sm`}
            ><ArrowLeft size={24}/> Batal</button>
            <button
              onClick={() => borrowMutation.mutate()}
              disabled={borrowMutation.isPending}
              className={`${kBtn} flex-1 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/30`}
            >
              {borrowMutation.isPending ? <Loader2 className="animate-spin" size={24}/> : <CheckCircle2 size={24}/>}
              {borrowMutation.isPending ? 'Memproses...' : 'Konfirmasi'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
