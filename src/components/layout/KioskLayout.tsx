import { Outlet, useLocation } from 'react-router-dom'

/**
 * KioskLayout — Fullscreen, tanpa navigasi.
 * Memberikan animasi transisi halaman yang halus saat berpindah rute kiosk.
 */
export function KioskLayout() {
  const location = useLocation()

  return (
    <div className="kiosk-body overflow-x-hidden">
      <div key={location.pathname} className="min-h-screen w-full animate-kiosk-page">
        <Outlet />
      </div>
    </div>
  )
}
