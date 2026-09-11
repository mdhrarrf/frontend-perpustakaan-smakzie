import { useEffect, useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { loanService } from '@/api/loan.service'
import type { StandbyItem } from '@/types'
import { BookOpen, RotateCcw, Clock, ArrowRight } from 'lucide-react'
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
    <div className="flex-1 min-h-[calc(100vh-2.75rem)] bg-gradient-to-br from-slate-50 via-sky-50/40 to-blue-50/50 flex flex-col overflow-hidden relative selection:bg-blue-100">
      {/* Decorative ambient background accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />

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
          <span className="inline-block bg-blue-50 text-blue-700 text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3 border border-blue-200/60">
            Layanan Mandiri
          </span>
          <p className="text-slate-800 text-2xl font-bold tracking-tight">Selamat datang! Apa yang ingin Anda lakukan?</p>
        </div>

        <div className="grid grid-cols-2 gap-8 w-full max-w-3xl">
          <button
            onClick={() => navigate('/kiosk/borrow')}
            className="group flex flex-col items-center gap-5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 text-white rounded-[2.5rem] p-10 transition-all duration-200 shadow-xl shadow-blue-500/25 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 border border-blue-400/20"
          >
            <div className="p-4 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform">
              <BookOpen size={56} />
            </div>
            <div className="text-center">
              <span className="text-3xl font-black tracking-wide block">Pinjam Buku</span>
              <span className="text-blue-100 text-sm font-medium mt-1 block">Individu atau rombongan kelas</span>
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

      {/* Today's loan ticker (Above footer) */}
      {items && items.length > 0 && (
        <div className="absolute bottom-2 left-0 right-0 px-10 z-10">
          <LoanTicker items={items} />
        </div>
      )}
    </div>
  )
}

function LoanTicker({ items }: { items: StandbyItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isInteracting = useRef(false)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startScrollLeft = useRef(0)
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRewinding = useRef(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || items.length === 0) return

    let animId: number
    // Kecepatan santai dan mudah dibaca: ~0.5px per frame
    const speed = 0.5

    const tick = () => {
      if (!isInteracting.current && !isDragging.current && !isRewinding.current && el) {
        const maxScroll = el.scrollWidth - el.clientWidth
        if (maxScroll > 10) {
          if (el.scrollLeft >= maxScroll - 2) {
            isRewinding.current = true
            // Beri jeda 2.5 detik di ujung kanan agar kartu terakhir terbaca jelas
            setTimeout(() => {
              if (!scrollRef.current) return
              scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
              // Beri jeda 1.5 detik di posisi awal sebelum mulai bergulir lagi
              setTimeout(() => {
                isRewinding.current = false
              }, 1500)
            }, 2500)
          } else {
            el.scrollLeft += speed
          }
        }
      }
      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [items])

  const pause = () => {
    isInteracting.current = true
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
  }

  const resume = (delay = 1500) => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => {
      isInteracting.current = false
    }, delay)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    pause()
    if (!scrollRef.current) return
    startX.current = e.pageX - scrollRef.current.offsetLeft
    startScrollLeft.current = scrollRef.current.scrollLeft
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 1.2
    scrollRef.current.scrollLeft = startScrollLeft.current - walk
  }

  const handleMouseUp = () => {
    isDragging.current = false
    resume(2000)
  }

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/90 shadow-lg shadow-slate-200/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-blue-600" />
          <p className="text-slate-600 text-xs font-bold uppercase tracking-wider">
            Dipinjam Hari Ini ({items.length} transaksi)
          </p>
        </div>
        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Bergulir otomatis • Bisa digeser mouse
        </span>
      </div>

      <style>{`
        .kiosk-ticker::-webkit-scrollbar {
          height: 6px;
        }
        .kiosk-ticker::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 9999px;
        }
        .kiosk-ticker::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .kiosk-ticker::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      <div
        ref={scrollRef}
        onMouseEnter={pause}
        onMouseLeave={() => { isDragging.current = false; resume(1500) }}
        onTouchStart={pause}
        onTouchEnd={() => resume(2000)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="kiosk-ticker flex gap-3 overflow-x-auto pb-2 select-none cursor-grab active:cursor-grabbing"
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="flex-shrink-0 bg-slate-50 hover:bg-slate-100/90 rounded-xl px-5 py-3 min-w-[280px] max-w-[360px] border border-slate-200 shadow-sm transition-colors cursor-grab active:cursor-grabbing select-none"
          >
            <p className="text-slate-900 text-base font-bold line-clamp-1">{item.judul}</p>
            <p className="text-slate-500 text-xs font-medium mt-1">{item.kelas}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold">
              <span className="text-slate-500">Pinjam <span className="text-slate-700">{item.borrowed_at}</span></span>
              <ArrowRight size={12} className="text-slate-400 flex-shrink-0" />
              <span className="text-slate-500">Kembali <span className="text-blue-600">{item.due_at}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
