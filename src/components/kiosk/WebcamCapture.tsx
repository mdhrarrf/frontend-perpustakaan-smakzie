import { useEffect, useRef, useState } from 'react'
import { useWebcam } from '@/hooks/useWebcam'
import { Button } from '@/components/ui/Button'
import { Camera, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/utils'

interface WebcamCaptureProps {
  onCapture: (base64: string) => void
  onRetake?: () => void
  autoCapture?: boolean   // Untuk kiosk: auto capture setelah countdown
  autoCaptureDelay?: number
  className?: string
  kioskMode?: boolean
}

export function WebcamCapture({
  onCapture,
  onRetake,
  autoCapture = false,
  autoCaptureDelay = 3,
  className,
  kioskMode = false,
}: WebcamCaptureProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const webcam = useWebcam({
    onCapture,
  })

  useEffect(() => {
    webcam.start()
    return () => webcam.stop()
  }, [])

  useEffect(() => {
    if (autoCapture && webcam.isReady && !webcam.capturedImage) {
      setCountdown(autoCaptureDelay)
    }
  }, [autoCapture, webcam.isReady, webcam.capturedImage, autoCaptureDelay])

  useEffect(() => {
    if (countdown === null) return

    if (countdown <= 0) {
      webcam.capture()
      setCountdown(null)
      return
    }

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [countdown])

  const buttonSize = kioskMode ? 'kiosk' : 'lg'

  if (webcam.error) {
    return (
      <div className={cn('flex flex-col items-center gap-4 p-6 bg-red-50 rounded-xl', className)}>
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className={cn('text-center text-red-600', kioskMode && 'text-xl')}>{webcam.error}</p>
        <Button variant="outline" size={buttonSize} onClick={() => webcam.start()}>
          <RefreshCw size={18} /> Coba Lagi
        </Button>
      </div>
    )
  }

  if (webcam.capturedImage) {
    return (
      <div className={cn('flex flex-col items-center gap-4', className)}>
        <img
          src={webcam.capturedImage}
          alt="Foto yang diambil"
          className="rounded-xl object-cover shadow"
          style={{ width: 320, height: 240 }}
        />
        <Button
          variant="secondary"
          size={buttonSize}
          onClick={() => {
            webcam.retake()
            onRetake?.()
          }}
        >
          <RefreshCw size={18} />
          {kioskMode ? 'Ambil Ulang' : 'Foto Ulang'}
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative rounded-xl overflow-hidden bg-slate-800 shadow-lg" style={{ width: 320, height: 240 }}>
        <video
          ref={webcam.videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Countdown overlay */}
        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-bold" style={{ fontSize: kioskMode ? 80 : 48 }}>
              {countdown}
            </span>
          </div>
        )}

        {/* Loading overlay */}
        {!webcam.isReady && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <p className={cn('text-white', kioskMode && 'text-xl')}>Mengakses kamera…</p>
          </div>
        )}
      </div>

      {!autoCapture && (
        <Button
          variant="primary"
          size={buttonSize}
          disabled={!webcam.isReady}
          onClick={() => webcam.capture()}
        >
          <Camera size={kioskMode ? 28 : 18} />
          {kioskMode ? 'Ambil Foto' : 'Capture'}
        </Button>
      )}

      {autoCapture && countdown !== null && (
        <p className={cn('text-slate-400', kioskMode && 'text-xl')}>
          Foto otomatis dalam {countdown} detik…
        </p>
      )}
    </div>
  )
}
