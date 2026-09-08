import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, BookOpen, Home } from 'lucide-react'
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
    <div className={`flex-1 min-h-[calc(100vh-2.75rem)] flex flex-col items-center justify-center gap-8 p-8 ${
      isLate
        ? 'bg-gradient-to-br from-amber-50 via-rose-50/40 to-slate-50'
        : 'bg-gradient-to-br from-slate-50 via-teal-50/40 to-emerald-50/50'
    }`}>

      {/* Icon */}
      <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl ${
        isLate
          ? 'bg-white border-4 border-amber-500 shadow-amber-200/60'
          : 'bg-white border-4 border-emerald-500 shadow-emerald-200/60'
      }`}>
        {isLate
          ? <AlertTriangle size={64} className="text-amber-600" />
          : <CheckCircle2 size={64} className="text-emerald-600" />}
      </div>

      {/* Message */}
      <div className="text-center max-w-xl">
        {state.type === 'borrow' && (
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Peminjaman Berhasil!</h1>
            {state.book_title && (
              <p className="text-slate-700 text-2xl font-bold bg-white/80 border border-slate-200/80 px-6 py-3 rounded-2xl shadow-sm inline-block">
                "{state.book_title}"
              </p>
            )}
            {state.due_at && (
              <p className="text-slate-600 text-lg font-medium">
                Harap dikembalikan paling lambat{' '}
                <span className="text-indigo-600 font-extrabold">{formatDate(new Date(state.due_at).toISOString())}</span>
              </p>
            )}
          </div>
        )}

        {state.type === 'borrow_class' && (
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Peminjaman Kelas Berhasil!</h1>
            <p className="text-slate-700 text-2xl font-bold bg-white/80 border border-slate-200/80 px-6 py-3 rounded-2xl shadow-sm inline-block">
              {state.book_count} buku pelajaran telah dipinjam
            </p>
            <p className="text-slate-500 text-base font-medium">Selamat belajar untuk siswa dan guru!</p>
          </div>
        )}

        {state.type === 'return' && (
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Buku Berhasil Dikembalikan!</h1>
            {state.book_title && (
              <p className="text-slate-700 text-2xl font-bold bg-white/80 border border-slate-200/80 px-6 py-3 rounded-2xl shadow-sm inline-block">
                "{state.book_title}"
              </p>
            )}
            <p className="text-emerald-700 text-lg font-bold mt-2">Terima kasih telah mengembalikan tepat waktu! 🌟</p>
          </div>
        )}

        {state.type === 'return_late' && (
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold text-rose-900 tracking-tight">Pengembalian Terlambat!</h1>
            {state.book_title && <p className="text-slate-800 text-xl font-bold">"{state.book_title}"</p>}
            <div className="bg-white border-2 border-amber-300 rounded-3xl p-6 text-left space-y-2 shadow-lg shadow-amber-100">
              <p className="text-rose-700 text-lg font-bold">
                ⚠ Terlambat: <span className="text-rose-900">{state.late_days} hari</span>
              </p>
              {state.penalty_end && (
                <p className="text-slate-700 text-base font-semibold">
                  Sanksi peminjaman buku hingga: <span className="text-slate-900 font-extrabold">{formatDate(state.penalty_end)}</span>
                </p>
              )}
              <p className="text-slate-500 text-sm font-medium pt-2 border-t border-slate-100">
                Catatan: Sanksi hanya berlaku untuk peminjaman mandiri buku sejenis.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Auto-redirect notice */}
      <p className="text-slate-400 text-sm font-medium">Layar akan otomatis kembali ke menu utama dalam 8 detik...</p>

      <button
        onClick={() => navigate('/kiosk')}
        className="flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-2xl px-10 py-5 text-xl font-bold min-h-[70px] shadow-xl shadow-slate-900/20 transition-all cursor-pointer"
      >
        <Home size={24} />
        Kembali ke Layar Utama
      </button>
    </div>
  )
}
