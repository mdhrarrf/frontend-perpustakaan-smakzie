import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { loanService } from '@/api/loan.service'
import { BookOpen, RotateCcw, Clock } from 'lucide-react'
import { cn } from '@/utils'

export function KioskStandby() {
  const navigate = useNavigate()

  const { data: items, refetch } = useQuery({
    queryKey: ['kiosk-standby'],
    queryFn: loanService.standby,
    refetchInterval: 30_000, // refresh tiap 30 detik
  })

  // Tampilkan waktu
  const now = new Date()
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/60 flex flex-col overflow-hidden relative selection:bg-indigo-100">
      {/* Decorative ambient background accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header (Absolute Top) */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-10 py-8 z-10">
        <div className="flex items-center gap-4">
          <img src="/logo-smakzie.png" alt="Logo SMK Negeri 1 Cianjur" className="w-16 h-16 object-contain drop-shadow" />
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Perpustakaan SMK Negeri 1 Cianjur</h1>
            <p className="text-slate-500 text-sm font-medium">Self-Service Kiosk Pelajar</p>
          </div>
        </div>
        <div className="text-right bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{timeStr}</p>
          <p className="text-slate-500 text-xs font-semibold mt-0.5 uppercase tracking-wider">{dateStr}</p>
        </div>
      </div>

      {/* Main CTA Buttons (Centered in whole screen) */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-10 z-0">
        <div className="text-center">
          <span className="inline-block bg-indigo-50 text-indigo-700 text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3 border border-indigo-200/60">
            Layanan Mandiri
          </span>
          <p className="text-slate-800 text-2xl font-bold tracking-tight">Selamat datang! Apa yang ingin Anda lakukan?</p>
        </div>

        <div className="grid grid-cols-2 gap-8 w-full max-w-3xl">
          <button
            onClick={() => navigate('/kiosk/borrow')}
            className="group flex flex-col items-center gap-5 bg-gradient-to-br from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:scale-95 text-white rounded-[2.5rem] p-10 transition-all duration-200 shadow-xl shadow-indigo-500/25 cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-offset-2 border border-indigo-400/20"
          >
            <div className="p-4 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform">
              <BookOpen size={56} />
            </div>
            <div className="text-center">
              <span className="text-3xl font-black tracking-wide block">Pinjam Buku</span>
              <span className="text-indigo-100 text-sm font-medium mt-1 block">Individu atau rombongan kelas</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/kiosk/return')}
            className="group flex flex-col items-center gap-5 bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white rounded-[2.5rem] p-10 transition-all duration-200 shadow-xl shadow-emerald-500/25 cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-300 focus:ring-offset-2 border border-emerald-400/20"
          >
            <div className="p-4 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform">
              <RotateCcw size={56} />
            </div>
            <div className="text-center">
              <span className="text-3xl font-black tracking-wide block">Kembalikan Buku</span>
              <span className="text-emerald-100 text-sm font-medium mt-1 block">Scan kartu dan kembalikan</span>
            </div>
          </button>
        </div>
      </div>

      {/* Today's loan ticker (Absolute Bottom) */}
      {items && items.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 px-10 pb-8 z-10">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/90 shadow-lg shadow-slate-200/50">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-indigo-600" />
              <p className="text-slate-600 text-xs font-bold uppercase tracking-wider">Dipinjam Hari Ini ({items.length} transaksi)</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {items.map((item, i) => (
                <div key={i} className="flex-shrink-0 bg-slate-50 hover:bg-slate-100/80 rounded-xl px-5 py-3 min-w-[220px] border border-slate-200 shadow-sm transition-colors">
                  <p className="text-slate-900 text-base font-bold line-clamp-1">{item.judul}</p>
                  <p className="text-slate-500 text-xs font-medium mt-1">{item.kelas} · {item.borrowed_at}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
