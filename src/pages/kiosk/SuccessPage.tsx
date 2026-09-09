import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, Home, BookOpen, Clock, RotateCcw } from 'lucide-react'
import { formatDate } from '@/utils'

interface SuccessState {
  type: 'borrow' | 'borrow_class' | 'return' | 'return_late'
  book_title?: string
  due_at?: string | Date
  book_count?: number
  late_days?: number
  penalty_end?: string
}

const AUTO_REDIRECT_SECS = 10

export function KioskSuccessPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const state     = (location.state ?? {}) as SuccessState
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECS)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { navigate('/kiosk'); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [navigate])

  const isLate = state.type === 'return_late'

  const content = (() => {
    switch (state.type) {
      case 'borrow':
        return {
          icon:     <CheckCircle2 size={60} className="text-indigo-600" />,
          title:    'Peminjaman Berhasil!',
          subtitle: state.book_title ? `"${state.book_title}"` : undefined,
          info:     state.due_at
            ? `Kembalikan paling lambat ${formatDate(new Date(state.due_at).toISOString())}`
            : undefined,
        }
      case 'borrow_class':
        return {
          icon:     <BookOpen size={60} className="text-indigo-600" />,
          title:    'Peminjaman Kelas Berhasil!',
          subtitle: `${state.book_count ?? 0} eksemplar buku pelajaran dipinjam`,
          info:     state.due_at
            ? `Kembalikan paling lambat ${formatDate(new Date(state.due_at).toISOString())}`
            : undefined,
        }
      case 'return':
        return {
          icon:     <RotateCcw size={60} className="text-indigo-600" />,
          title:    'Buku Berhasil Dikembalikan!',
          subtitle: state.book_title ? `"${state.book_title}"` : undefined,
          info:     'Terima kasih telah mengembalikan buku tepat waktu.',
        }
      case 'return_late':
        return {
          icon:     <AlertTriangle size={60} className="text-amber-500" />,
          title:    'Pengembalian Terlambat',
          subtitle: state.book_title ? `"${state.book_title}"` : undefined,
          info:     undefined,
        }
      default:
        return {
          icon:     <CheckCircle2 size={60} className="text-indigo-600" />,
          title:    'Berhasil!',
          subtitle: undefined,
          info:     undefined,
        }
    }
  })()

  return (
    <div className="flex-1 min-h-[calc(100vh-2.75rem)] bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/40 flex flex-col items-center justify-center gap-8 p-6 sm:p-10 text-slate-900">

      <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white flex items-center justify-center shadow-2xl border-4 ${
        isLate ? 'border-amber-400 shadow-amber-200/60' : 'border-indigo-200 shadow-indigo-200/60'
      }`}>
        {content.icon}
      </div>

      <div className="text-center max-w-lg flex flex-col items-center gap-3">
        <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
          isLate ? 'text-amber-800' : 'text-slate-900'
        }`}>
          {content.title}
        </h1>

        {content.subtitle && (
          <p className="text-base sm:text-xl font-bold text-slate-700 bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm w-full">
            {content.subtitle}
          </p>
        )}

        {content.info && (
          <p className="text-slate-500 text-sm sm:text-base font-medium flex items-center gap-1.5">
            <Clock size={14} className="flex-shrink-0" />
            {content.info}
          </p>
        )}

        {isLate && (
          <div className="bg-white border-2 border-amber-300 rounded-2xl p-5 text-left w-full space-y-2 shadow-md shadow-amber-100/60 mt-1">
            <p className="text-amber-800 text-base font-bold">
              Terlambat <span className="text-rose-700">{state.late_days} hari</span>
            </p>
            {state.penalty_end && (
              <p className="text-slate-700 text-sm font-semibold">
                Sanksi berlaku hingga:{' '}
                <span className="text-slate-900 font-extrabold">{formatDate(state.penalty_end)}</span>
              </p>
            )}
            <p className="text-slate-400 text-xs font-medium pt-2 border-t border-slate-100">
              Sanksi hanya berlaku untuk peminjaman mandiri buku sejenis.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
        <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-extrabold text-sm flex items-center justify-center tabular-nums">
          {countdown}
        </span>
        <span>Otomatis kembali ke menu utama...</span>
      </div>

      <button
        type="button"
        onClick={() => navigate('/kiosk')}
        className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl px-10 py-4 sm:py-5 text-lg sm:text-xl font-bold min-h-[64px] sm:min-h-[72px] shadow-xl shadow-indigo-600/25 transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-300"
      >
        <Home size={22} />
        Kembali ke Layar Utama
      </button>

    </div>
  )
}
