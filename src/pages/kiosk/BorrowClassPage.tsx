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

  const kBtn = 'flex items-center justify-center gap-3 rounded-2xl font-bold text-xl px-8 py-5 min-h-[80px] transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-900'

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/kiosk/borrow')} className="text-slate-400 hover:text-white"><ArrowLeft size={28} /></button>
        <h1 className="text-2xl font-bold text-white">Peminjaman Kelas</h1>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-900/50 border border-red-700 rounded-2xl p-5 mb-6">
          <AlertTriangle size={24} className="text-red-400 flex-shrink-0" />
          <p className="text-red-200 text-lg">{error}</p>
        </div>
      )}

      {step === 'class-info' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-lg mx-auto w-full">
          <div className="text-center">
            <p className="text-white text-2xl font-bold mb-2">Informasi Kelas</p>
            <p className="text-slate-400 text-lg">Masukkan data kelas yang meminjam</p>
          </div>
          <div className="space-y-4 w-full">
            <div>
              <label className="text-slate-300 text-lg mb-2 block">Nama Kelas *</label>
              <input
                value={classInfo.class_name}
                onChange={(e) => setClassInfo(p => ({ ...p, class_name: e.target.value }))}
                placeholder="X-A"
                className="w-full px-5 py-4 text-xl bg-slate-800 border-2 border-slate-600 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="text-slate-300 text-lg mb-2 block">Nama Guru *</label>
              <input
                value={classInfo.teacher_name}
                onChange={(e) => setClassInfo(p => ({ ...p, teacher_name: e.target.value }))}
                placeholder="Nama lengkap guru"
                className="w-full px-5 py-4 text-xl bg-slate-800 border-2 border-slate-600 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="text-slate-300 text-lg mb-2 block">Mata Pelajaran</label>
              <input
                value={classInfo.subject_name}
                onChange={(e) => setClassInfo(p => ({ ...p, subject_name: e.target.value }))}
                placeholder="Opsional"
                className="w-full px-5 py-4 text-xl bg-slate-800 border-2 border-slate-600 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
          <button
            onClick={() => setStep('scan-books')}
            disabled={!classInfo.class_name || !classInfo.teacher_name}
            className={`${kBtn} w-full bg-primary-600 hover:bg-primary-500 text-white focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Lanjut → Scan Buku
          </button>
        </div>
      )}

      {step === 'scan-books' && (
        <div className="flex-1 flex flex-col gap-6">
          <div className="text-center">
            <p className="text-white text-2xl font-bold mb-1">Scan Buku yang Dipinjam</p>
            <p className="text-slate-400">Kelas: {classInfo.class_name} · Guru: {classInfo.teacher_name}</p>
          </div>
          <BarcodeScanner onScan={handleBookScan} placeholder="Scan QR/barcode buku + Enter" kioskMode autoFocus />

          {books.length > 0 && (
            <div className="space-y-3">
              <p className="text-slate-400 font-medium">{books.length} judul buku:</p>
              {books.map(({ book, quantity }) => (
                <div key={book.id} className="flex items-center justify-between bg-slate-800 rounded-xl px-5 py-4">
                  <div>
                    <p className="text-white font-medium">{book.judul}</p>
                    <p className="text-slate-400 text-sm">{book.penulis}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setBooks(p => p.map(x => x.book.id === book.id && x.quantity > 1 ? { ...x, quantity: x.quantity - 1 } : x))} className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-xl">−</button>
                    <span className="text-white text-xl font-bold w-8 text-center">{quantity}</span>
                    <button onClick={() => setBooks(p => p.map(x => x.book.id === book.id ? { ...x, quantity: x.quantity + 1 } : x))} className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-xl">+</button>
                    <button onClick={() => setBooks(p => p.filter(x => x.book.id !== book.id))} className="w-10 h-10 rounded-full bg-red-900/50 hover:bg-red-800 text-red-400 flex items-center justify-center"><X size={18} /></button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setStep('photo')}
                className={`${kBtn} w-full bg-primary-600 hover:bg-primary-500 text-white focus:ring-primary-400 mt-4`}
              >
                <CheckCircle2 size={24} /> Selesai Scan ({books.reduce((a,b) => a + b.quantity, 0)} buku)
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'photo' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-white text-2xl font-bold mb-2">Foto Dokumentasi</p>
            <p className="text-slate-400 text-lg">Foto guru yang mengambil buku</p>
          </div>
          <WebcamCapture onCapture={async (b64) => { const { path } = await uploadService.photo(b64, 'borrow'); setPhotoPath(path); setStep('confirm') }} kioskMode autoCapture autoCaptureDelay={5} />
          <button onClick={() => setStep('confirm')} className="text-slate-500 hover:text-slate-300 text-lg">Lewati →</button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-xl mx-auto w-full">
          <div className="bg-slate-800 rounded-3xl p-8 w-full space-y-4">
            <h2 className="text-2xl font-bold text-white text-center">Konfirmasi</h2>
            <div className="flex justify-between"><span className="text-slate-400 text-lg">Kelas</span><span className="text-white text-lg font-medium">{classInfo.class_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 text-lg">Guru</span><span className="text-white text-lg font-medium">{classInfo.teacher_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 text-lg">Total Buku</span><span className="text-white text-lg font-bold">{books.reduce((a,b) => a + b.quantity, 0)} eksemplar</span></div>
            <div className="flex justify-between"><span className="text-slate-400 text-lg">Jatuh Tempo</span><span className="text-white text-lg font-medium">{formatDate(dueAt.toISOString())}</span></div>
          </div>
          <div className="flex gap-4 w-full">
            <button onClick={() => setStep('scan-books')} className={`${kBtn} flex-1 bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500`}><ArrowLeft size={24}/> Batal</button>
            <button onClick={() => borrowMutation.mutate()} disabled={borrowMutation.isPending} className={`${kBtn} flex-1 bg-primary-600 hover:bg-primary-500 text-white focus:ring-primary-400`}>
              {borrowMutation.isPending ? <Loader2 className="animate-spin" size={24}/> : <CheckCircle2 size={24}/>}
              {borrowMutation.isPending ? 'Memproses...' : 'Konfirmasi'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
