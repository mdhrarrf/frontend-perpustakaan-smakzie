import { useState, useEffect } from 'react'

/**
 * useLiveClock — Mengembalikan jam dan tanggal yang terus diperbarui setiap detik.
 * Tidak membutuhkan trigger apapun; jam berjalan otomatis menggunakan setInterval.
 */
export function useLiveClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    // Update setiap 1 detik persis
    const interval = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return { now, timeStr, dateStr }
}
