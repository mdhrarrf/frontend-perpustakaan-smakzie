import { Outlet, useLocation } from 'react-router-dom'
import { Footer } from './Footer'

/**
 * KioskLayout — Fullscreen, tanpa navigasi.
 * Memberikan animasi transisi halaman yang halus saat berpindah rute kiosk.
 */
export function KioskLayout() {
  const location = useLocation()

  return (
    <div className="kiosk-body overflow-x-hidden min-h-screen flex flex-col justify-between">
      <div key={location.pathname} className="flex-1 w-full animate-kiosk-page flex flex-col">
        <Outlet />
      </div>
      <Footer variant="kiosk" />
    </div>
  )
}
