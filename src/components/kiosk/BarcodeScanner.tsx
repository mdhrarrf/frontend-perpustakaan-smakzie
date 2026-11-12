import { useEffect, useRef, useState, useCallback } from 'react'
import { KioskInput } from '@/components/ui/Input'
import { Scan } from 'lucide-react'
import { cn } from '@/utils'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  placeholder?: string
  label?: string
  autoFocus?: boolean
  kioskMode?: boolean
  className?: string
  numericOnly?: boolean
}

/**
 * BarcodeScanner
 *
 * Komponen scanner barcode tangguh (Zero-Fail HID Keyboard Wedge Catcher):
 * - Otomatis fokus dan refocus saat halaman di-refresh, tab berpindah, atau window diklik.
 * - Global window listener yang menangkap keystroke scanner fisik meskipun cursor/fokus sempat lepas.
 * - Kebal dari modifier key (Shift/CapsLock) dari scanner hardware.
 * - Mendukung mode numericOnly untuk NIS/NISN siswa dan alfanumerik untuk barcode buku.
 */
export function BarcodeScanner({
  onScan,
  placeholder = 'Scan kode / ketik...',
  label,
  autoFocus = true,
  kioskMode = false,
  className,
  numericOnly = false,
}: BarcodeScannerProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const scanBufferRef = useRef<{ buffer: string; lastTime: number }>({ buffer: '', lastTime: 0 })

  // Fungsi penjamin fokus aktif
  const ensureFocus = useCallback(() => {
    if (!autoFocus) return
    const el = inputRef.current
    if (!el) return

    const active = document.activeElement
    // Jangan rebut fokus jika user sedang berinteraksi di input/textarea/select lain
    const isOtherInput =
      active &&
      active !== el &&
      (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')

    if (!isOtherInput) {
      el.focus()
    }
  }, [autoFocus])

  // ─── 1. Progressive Auto-Focus & Global Window Listeners ───
  useEffect(() => {
    if (!autoFocus) return

    // Fokus segera saat mount dan coba berkala di detik-detik awal setelah hard refresh (F5)
    ensureFocus()
    const t1 = setTimeout(ensureFocus, 50)
    const t2 = setTimeout(ensureFocus, 150)
    const t3 = setTimeout(ensureFocus, 300)
    const t4 = setTimeout(ensureFocus, 600)
    const t5 = setTimeout(ensureFocus, 1200)

    // Kembalikan fokus saat window mendapat fokus kembali (misal setelah refresh dari browser toolbar)
    const handleWindowFocus = () => ensureFocus()

    // Kembalikan fokus saat tab browser kembali terlihat
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') ensureFocus()
    }

    // Kembalikan fokus saat user klik/tap di area kosong manapun di layar kiosk
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      // Abaikan jika klik tombol, link, atau form control lain
      if (target.closest('button, a, input, select, textarea, [role="button"]')) return
      ensureFocus()
    }

    // ─── 2. Global HID Barcode Wedge Catcher ───
    // Scanner barcode fisik mengirim input seperti keyboard sangat cepat (< 50ms per key) lalu Enter.
    // Jika fokus sempat lepas (misal setelah refresh), event global ini menangkapnya dan otomatis submit.
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement
      const inputEl = inputRef.current
      if (!inputEl) return

      // Jika user sedang mengetik di input/textarea lain, biarkan normal
      if (
        active &&
        active !== inputEl &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')
      ) {
        return
      }

      // Jika fokus terlepas dari input ini, langsung kembalikan fokus
      if (active !== inputEl) {
        inputEl.focus()
      }

      const now = Date.now()
      const timeDiff = now - scanBufferRef.current.lastTime

      // Jika jeda antar karakter > 250ms, reset buffer (karena ketikan manusia, bukan scanner)
      if (timeDiff > 250) {
        scanBufferRef.current.buffer = ''
      }
      scanBufferRef.current.lastTime = now

      // Deteksi Enter dari scanner hardware di level window
      if (e.key === 'Enter') {
        const buffered = scanBufferRef.current.buffer.trim()
        const domVal = (inputEl.value || value || '').trim()
        const codeToScan = domVal || buffered

        if (codeToScan) {
          e.preventDefault()
          scanBufferRef.current.buffer = ''
          setValue('')
          inputEl.value = ''
          onScan(codeToScan)
        }
        return
      }

      // Kumpulkan karakter yang dapat dicetak ke buffer
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (!numericOnly || /^[0-9]$/.test(e.key)) {
          scanBufferRef.current.buffer += e.key
        }
      }
    }

    // ─── 3. Heartbeat Monitor untuk Kiosk Mode ───
    let intervalId: any = null
    if (kioskMode) {
      intervalId = setInterval(() => {
        if (document.activeElement === document.body || !document.activeElement) {
          ensureFocus()
        }
      }, 1000)
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('click', handleDocumentClick)
    window.addEventListener('keydown', handleGlobalKeyDown)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
      if (intervalId) clearInterval(intervalId)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('click', handleDocumentClick)
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [autoFocus, kioskMode, ensureFocus, numericOnly, onScan, value])

  // Hanya strip non-angka jika numericOnly aktif
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (numericOnly) {
        setValue(e.target.value.replace(/\D/g, ''))
      } else {
        setValue(e.target.value)
      }
    },
    [numericOnly]
  )

  // Handler keyboard langsung pada input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Selalu izinkan Enter untuk submit
      if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        const raw = (
          e.currentTarget?.value ||
          inputRef.current?.value ||
          value ||
          scanBufferRef.current.buffer
        ).trim()

        if (raw) {
          scanBufferRef.current.buffer = ''
          setValue('')
          if (inputRef.current) inputRef.current.value = ''
          onScan(raw)
          return
        }
      }

      if (numericOnly) {
        // Jangan pernah blok modifier keys dari scanner HID (Shift, CapsLock, Ctrl, Alt, Meta)
        if (['Shift', 'CapsLock', 'Control', 'Alt', 'Meta'].includes(e.key)) {
          return
        }

        const isDigit = /^[0-9]$/.test(e.key)
        const isControl = [
          'Backspace',
          'Delete',
          'Tab',
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          'Home',
          'End',
          'Enter',
        ].includes(e.key)
        const isClipboard =
          (e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())

        if (!isDigit && !isControl && !isClipboard) {
          e.preventDefault()
        }
      }
    },
    [value, onScan, numericOnly]
  )

  const handleBlur = useCallback(() => {
    if (kioskMode && autoFocus) {
      setTimeout(ensureFocus, 100)
    }
  }, [kioskMode, autoFocus, ensureFocus])

  const handleAreaClick = () => ensureFocus()

  return (
    <div className={cn('flex flex-col gap-2', className)} onClick={handleAreaClick}>
      {kioskMode ? (
        <div className="flex flex-col items-center gap-4">
          {label && <p className="text-slate-700 text-xl font-medium">{label}</p>}
          <div className="flex items-center gap-4 w-full max-w-md">
            <Scan className="text-primary-600 flex-shrink-0" size={32} />
            <KioskInput
              ref={inputRef}
              type="text"
              inputMode={numericOnly ? 'numeric' : 'text'}
              pattern={numericOnly ? '[0-9]*' : undefined}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={placeholder}
              autoComplete="off"
              className="bg-white border-2 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 shadow-sm rounded-2xl"
            />
          </div>
          <p className="text-slate-400 text-xs font-medium">
            {numericOnly
              ? 'Scan kartu atau ketik NIS / NISN'
              : 'Scan barcode atau ketik kode'}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Scan className="text-slate-400 flex-shrink-0" size={18} />
          <input
            ref={inputRef}
            type="text"
            inputMode={numericOnly ? 'numeric' : 'text'}
            pattern={numericOnly ? '[0-9]*' : undefined}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            autoComplete="off"
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}
    </div>
  )
}
