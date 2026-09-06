import { Outlet } from 'react-router-dom'

/**
 * KioskLayout — Fullscreen, tanpa navigasi.
 * Semua interaksi kiosk diatur oleh masing-masing halaman.
 * Tidak butuh autentikasi.
 */
export function KioskLayout() {
  return (
    <div className="kiosk-body">
      <Outlet />
    </div>
  )
}
