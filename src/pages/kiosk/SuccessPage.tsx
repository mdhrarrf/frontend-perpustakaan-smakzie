import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react'
import { formatDate } from '@/utils'

interface SuccessState {
  type: 'borrow' | 'borrow_class' | 'return' | 'return_late'
  book_title?: string
  due_at?: string | Date
  book_count?: number
  late_days?: number
  penalty_end?: string
}

export function KioskSuccessPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const state     = (location.state ?? {}) as SuccessState

  // Auto-kembali ke standby setelah 8 detik
  useEffect(() => {
    const timer = setTimeout(() => navigate('/kiosk'), 8000)
    return () => clearTimeout(timer)
  }, [navigate])

  const isLate = state.type === 'return_late'
  const isReturn = state.type === 'return' || state.type === 'return_late'

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center gap-8 p-8 ${isLate ? 'bg-gradient-to-br from-red-950 via-slate-900 to-slate-900' : 'bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950'}`}>

      {/* Icon */}
      <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl ${isLate ? 'bg-red-900/50 border-2 border-red-700' : 'bg-teal-900/50 border-2 border-teal-600'}`}>
        {isLate
          ? <AlertTriangle size={64} className="text-red-400" />
          : <CheckCircle2 size={64} className="text-teal-400" />}
      </div>

      {/* Message */}
      <div className="text-center max-w-xl">
        {state.type === 'borrow' && (
          <>
            <h1 className="text-4xl font-bold text-white mb-3">Peminjaman Berhasil!</h1>
            {state.book_title && <p className="text-slate-300 text-xl mb-2">"{state.book_title}"</p>}
            {state.due_at && (
              <p className="text-slate-400 text-lg">
                Harap dikembalikan paling lambat{' '}
                <span className="text-white font-semibold">{formatDate(new Date(state.due_at).toISOString())}</span>
              </p>
            )}
          </>
        )}

        {state.type === 'borrow_class' && (
          <>
            <h1 className="text-4xl font-bold text-white mb-3">Peminjaman Kelas Berhasil!</h1>
            <p className="text-slate-300 text-xl">{state.book_count} buku telah dipinjam untuk kelas Anda.</p>
          </>
        )}

        {state.type === 'return' && (
          <>
            <h1 className="text-4xl font-bold text-white mb-3">Buku Berhasil Dikembalikan!</h1>
            {state.book_title && <p className="text-slate-300 text-xl">"{state.book_title}"</p>}
            <p className="text-teal-400 text-lg mt-2">Terima kasih telah mengembalikan tepat waktu.</p>
          </>
        )}

        {state.type === 'return_late' && (
          <>
            <h1 className="text-4xl font-bold text-red-300 mb-3">Pengembalian Terlambat!</h1>
            {state.book_title && <p className="text-slate-300 text-xl mb-3">"{state.book_title}"</p>}
            <div className="bg-red-900/40 border border-red-700 rounded-2xl p-6 text-left space-y-2">
              <p className="text-red-300 text-lg">
                ⚠ Keterlambatan: <span className="font-bold text-red-200">{state.late_days} hari</span>
              </p>
              {state.penalty_end && (
                <p className="text-red-300 text-lg">
                  Sanksi berlaku hingga: <span className="font-bold text-red-200">{formatDate(state.penalty_end)}</span>
                </p>
              )}
              <p className="text-red-400 text-base mt-2">
                Sanksi hanya berlaku untuk buku ini. Buku lain tidak terpengaruh.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Auto-redirect notice */}
      <p className="text-slate-600 text-lg">Halaman akan kembali ke menu utama dalam 8 detik...</p>

      <button
        onClick={() => navigate('/kiosk')}
        className="flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white rounded-2xl px-10 py-5 text-xl font-semibold min-h-[80px] transition-all"
      >
        <BookOpen size={24} />
        Kembali ke Menu Utama
      </button>
    </div>
  )
}
