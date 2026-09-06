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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-4">
          <img src="/logo-smakzie.png" alt="Logo SMK Negeri 1 Cianjur" className="w-14 h-14 object-contain drop-shadow-md" />
          <div>
            <h1 className="text-2xl font-bold text-white">Perpustakaan SMK Negeri 1 Cianjur</h1>
            <p className="text-slate-400 text-sm">Self-Service Kiosk</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-white tabular-nums">{timeStr}</p>
          <p className="text-slate-400 text-sm mt-0.5">{dateStr}</p>
        </div>
      </div>

      {/* Main CTA Buttons */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-10">
        <p className="text-slate-300 text-xl mb-2">Selamat datang! Apa yang ingin Anda lakukan?</p>

        <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
          <button
            onClick={() => navigate('/kiosk/borrow')}
            className="flex flex-col items-center gap-4 bg-primary-600 hover:bg-primary-500 active:scale-95 text-white rounded-3xl p-8 transition-all duration-150 shadow-2xl cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <BookOpen size={56} />
            <span className="text-2xl font-bold">Pinjam Buku</span>
          </button>

          <button
            onClick={() => navigate('/kiosk/return')}
            className="flex flex-col items-center gap-4 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white rounded-3xl p-8 transition-all duration-150 shadow-2xl cursor-pointer focus:outline-none focus:ring-4 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <RotateCcw size={56} />
            <span className="text-2xl font-bold">Kembalikan Buku</span>
          </button>
        </div>
      </div>

      {/* Today's loan ticker */}
      {items && items.length > 0 && (
        <div className="px-10 pb-8">
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-slate-400" />
              <p className="text-slate-400 text-sm font-medium">Dipinjam Hari Ini ({items.length} transaksi)</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {items.map((item, i) => (
                <div key={i} className="flex-shrink-0 bg-slate-700/60 rounded-xl px-4 py-2.5 min-w-48">
                  <p className="text-white text-sm font-medium line-clamp-1">{item.judul}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{item.kelas} · {item.borrowed_at}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
