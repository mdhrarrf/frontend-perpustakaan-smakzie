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
}

/**
 * BarcodeScanner
 *
 * Menggunakan input keyboard mode — scanner barcode/QR fisik
 * bertindak sebagai keyboard yang mengirimkan karakter diakhiri Enter.
 * Komponen ini menerima input tersebut dan memanggil onScan saat Enter ditekan.
 *
 * Compatible dengan semua scanner USB/Bluetooth yang mode HID keyboard.
 */
export function BarcodeScanner({
  onScan,
  placeholder = 'Scan kode / ketik...',
  label,
  autoFocus = true,
  kioskMode = false,
  className,
}: BarcodeScannerProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus saat mount
  useEffect(() => {
    if (autoFocus) {
      const timeout = setTimeout(() => inputRef.current?.focus(), 200)
      return () => clearTimeout(timeout)
    }
  }, [autoFocus])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && value.trim()) {
        e.preventDefault()
        onScan(value.trim())
        setValue('')
      }
    },
    [value, onScan]
  )

  // Klik area → focus ke input (untuk kiosk)
  const handleAreaClick = () => inputRef.current?.focus()

  return (
    <div className={cn('flex flex-col gap-2', className)} onClick={handleAreaClick}>
      {kioskMode ? (
        <div className="flex flex-col items-center gap-4">
          {label && <p className="text-slate-700 text-xl font-medium">{label}</p>}
          <div className="flex items-center gap-4 w-full max-w-md">
            <Scan className="text-primary-600 flex-shrink-0" size={32} />
            <KioskInput
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoComplete="off"
              className="bg-white border-2 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 shadow-sm rounded-2xl"
            />
          </div>
          <p className="text-slate-400 text-xs font-medium">Arahkan scanner ke kode atau ketik lalu tekan Enter</p>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Scan className="text-slate-400 flex-shrink-0" size={18} />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}
    </div>
  )
}
