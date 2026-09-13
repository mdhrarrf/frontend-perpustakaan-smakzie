import { Outlet, useLocation } from 'react-router-dom'
import { Footer } from './Footer'
import { useKioskAutoReload } from '@/hooks/useKioskAutoReload'

/**
 * KioskLayout — Fullscreen, tanpa navigasi.
 * Memberikan animasi transisi halaman yang halus saat berpindah rute kiosk.
 *
 * Auto-reload: Setiap 5 menit cek apakah ada versi build baru di server.
 * Jika ada, halaman di-reload otomatis tanpa menghapus cookies/izin kamera.
 */
export function KioskLayout() {
  const location = useLocation()

  // Cek versi build terbaru setiap 5 menit, reload jika ada update
  useKioskAutoReload(5 * 60 * 1000)

  return (
    <div className="kiosk-body overflow-x-hidden min-h-screen flex flex-col justify-between">
      <div key={location.pathname} className="flex-1 w-full animate-kiosk-page flex flex-col">
        <Outlet />
      </div>
      <Footer variant="kiosk" />
    </div>
  )
}
