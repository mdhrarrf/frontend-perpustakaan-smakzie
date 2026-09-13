import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * useKioskAutoReload — Secara periodik memeriksa apakah ada versi build baru
 * yang sudah di-deploy ke server. Jika ada perubahan, halaman akan di-reload
 * secara otomatis menggunakan window.location.reload() yang TIDAK menghapus
 * cookies, localStorage, izin kamera, atau izin mikrofon.
 *
 * Cara kerja:
 * - Fetch HEAD ke /index.html setiap 5 menit
 * - Bandingkan ETag (atau Last-Modified) dengan nilai sebelumnya
 * - Jika berbeda → ada deployment baru → reload halaman
 *
 * Hanya aktif saat berada di halaman /kiosk (bukan di admin/staff).
 */
export function useKioskAutoReload(intervalMs = 5 * 60 * 1000) {
  const location = useLocation()
  const lastEtagRef = useRef<string | null>(null)
  const isKiosk = location.pathname.startsWith('/kiosk')

  useEffect(() => {
    if (!isKiosk) return

    const checkForUpdate = async () => {
      try {
        // Gunakan cache-busting minimal agar browser tidak cache response HEAD
        const res = await fetch('/index.html', {
          method: 'HEAD',
          cache: 'no-store',
        })

        // Ambil penanda versi: preferensi ETag, fallback ke Last-Modified
        const etag = res.headers.get('etag') || res.headers.get('last-modified')

        if (etag === null) return // Tidak bisa mendeteksi versi, abaikan

        if (lastEtagRef.current === null) {
          // Simpan versi saat ini sebagai baseline
          lastEtagRef.current = etag
        } else if (lastEtagRef.current !== etag) {
          // Versi berbeda → ada deployment baru → reload
          console.info('[KioskAutoReload] Versi baru terdeteksi. Memuat ulang halaman...')
          window.location.reload()
        }
      } catch {
        // Abaikan error jaringan (kiosk mungkin offline sementara)
      }
    }

    // Jalankan sekali saat mount untuk merekam baseline
    checkForUpdate()

    // Lalu polling setiap intervalMs
    const timer = setInterval(checkForUpdate, intervalMs)
    return () => clearInterval(timer)
  }, [isKiosk, intervalMs])
}
