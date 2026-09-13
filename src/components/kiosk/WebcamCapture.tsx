import { useEffect, useRef, useState, useCallback } from 'react'
import { useWebcam } from '@/hooks/useWebcam'
import { useFaceDetection } from '@/hooks/useFaceDetection'
import { Button } from '@/components/ui/Button'
import {
  Camera,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  User,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/utils'

interface WebcamCaptureProps {
  onCapture: (base64: string) => void
  onRetake?: () => void
  autoCapture?: boolean
  autoCaptureDelay?: number
  className?: string
  kioskMode?: boolean
  faceDetection?: boolean
}

export function WebcamCapture({
  onCapture,
  onRetake,
  autoCapture = true,
  autoCaptureDelay = 5,
  className,
  kioskMode = false,
  faceDetection = true,
}: WebcamCaptureProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isFlashing, setIsFlashing] = useState(false)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isCountingDownRef = useRef(false)

  const webcam = useWebcam({
    onCapture: (base64) => {
      setIsFlashing(true)
      setTimeout(() => setIsFlashing(false), 300)
      onCapture(base64)
    },
  })

  // Hook Face Detection
  const face = useFaceDetection({
    videoRef: webcam.videoRef,
    enabled: faceDetection && kioskMode && !webcam.capturedImage && webcam.isReady,
  })

  // Start / Stop camera
  useEffect(() => {
    webcam.start()
    return () => webcam.stop()
  }, [])

  // Sync ref with state
  useEffect(() => {
    isCountingDownRef.current = countdown !== null && countdown > 0
  }, [countdown])

  // Manage Countdown trigger with relaxed tolerance:
  // Once countdown starts, normal micro-movements DO NOT cancel it!
  // It only cancels if face is lost completely OR moves severely out of the frame.
  useEffect(() => {
    // Non-face-detection fallback
    if (!faceDetection || !kioskMode) {
      if (autoCapture && webcam.isReady && !webcam.capturedImage && countdown === null) {
        setCountdown(autoCaptureDelay)
      }
      return
    }

    if (webcam.capturedImage) {
      if (countdown !== null) setCountdown(null)
      return
    }

    if (isCountingDownRef.current) {
      // While counting down: ONLY cancel if face is lost or completely out of frame
      if (!face.faceDetected || face.isSeverelyOut) {
        setCountdown(null)
      }
    } else {
      // Start countdown when face is in position
      if (face.status === 'ready') {
        setCountdown(autoCaptureDelay)
      }
    }
  }, [face.status, face.faceDetected, face.isSeverelyOut, faceDetection, kioskMode, autoCapture, autoCaptureDelay, webcam.isReady, webcam.capturedImage, countdown])

  // Countdown timer tick
  useEffect(() => {
    if (countdown === null) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
      return
    }

    if (countdown <= 0) {
      webcam.capture()
      setCountdown(null)
      return
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [countdown])

  const handleManualCapture = useCallback(() => {
    setCountdown(null)
    webcam.capture()
  }, [webcam])

  const buttonSize = kioskMode ? 'kiosk' : 'lg'

  // Error State
  if (webcam.error) {
    return (
      <div className={cn('flex flex-col items-center gap-4 p-8 bg-rose-50 border border-rose-200 rounded-3xl max-w-md mx-auto shadow-sm', className)}>
        <AlertCircle className="w-12 h-12 text-rose-600" />
        <p className="text-center text-rose-800 font-bold text-base sm:text-lg">{webcam.error}</p>
        <p className="text-center text-slate-500 text-xs">
          Pastikan kamera terhubung dan izin browser telah diaktifkan.
        </p>
        <Button variant="outline" size={buttonSize} onClick={() => webcam.start()} className="mt-2">
          <RefreshCw size={18} /> Coba Sambungkan Lagi
        </Button>
      </div>
    )
  }

  // Captured Image Preview State
  if (webcam.capturedImage) {
    return (
      <div className={cn('flex flex-col items-center gap-6 w-full max-w-md mx-auto animate-kiosk-page', className)}>
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border-2 border-emerald-500 shadow-xl w-full aspect-[4/3]">
          <img
            src={webcam.capturedImage}
            alt="Foto Siswa"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md text-white text-xs sm:text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 size={15} />
            <span>Foto Tersimpan</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full">
          <Button
            variant="secondary"
            size={buttonSize}
            className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
            onClick={() => {
              webcam.retake()
              setCountdown(null)
              onRetake?.()
            }}
          >
            <RefreshCw size={18} />
            <span>Foto Ulang</span>
          </Button>
        </div>
      </div>
    )
  }

  // Active Camera View with Clean, Non-AI, Professional Kiosk Framing
  const isReadyOrCounting = face.status === 'ready' || (countdown !== null && countdown > 0)

  return (
    <div className={cn('flex flex-col items-center gap-4 w-full max-w-lg mx-auto select-none', className)}>
      {/* Video Viewport Container */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-lg w-full aspect-[4/3]">
        <video
          ref={webcam.videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />

        {/* Shutter Flash Animation */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white animate-out fade-out duration-300 z-40 pointer-events-none" />
        )}

        {/* Loading Camera Indicator */}
        {!webcam.isReady && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-3 z-30">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm font-medium">Menghubungkan kamera...</p>
          </div>
        )}

        {/* ─── CLEAN, NATURAL OVAL GUIDE (NO SCI-FI / NO GAMER HUD) ─── */}
        {webcam.isReady && faceDetection && kioskMode && (
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center">
            {/* Elegant SVG Cutout Mask */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <mask id="clean-face-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <ellipse cx="50%" cy="46%" rx="30%" ry="39%" fill="black" />
                </mask>
              </defs>

              {/* Soft, calm dark vignette outside oval */}
              <rect
                width="100%"
                height="100%"
                fill="rgba(15, 23, 42, 0.38)"
                mask="url(#clean-face-mask)"
              />

              {/* Clean minimalist guide outline */}
              <ellipse
                cx="50%"
                cy="46%"
                rx="30%"
                ry="39%"
                fill="none"
                stroke={isReadyOrCounting ? '#10b981' : 'rgba(255, 255, 255, 0.45)'}
                strokeWidth={isReadyOrCounting ? 3.5 : 2}
                className="transition-all duration-300"
              />
            </svg>

            {/* Circular Countdown Badge (Clean & Centered) */}
            {countdown !== null && countdown > 0 && (
              <div className="relative z-30 flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
                <div className="w-20 h-20 rounded-full bg-slate-900/80 backdrop-blur-md border-2 border-emerald-400 flex items-center justify-center shadow-lg">
                  <span className="text-white font-extrabold text-4xl tabular-nums">
                    {countdown}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── CLEAN & PROFESSIONAL INSTRUCTION BANNER (SMK BRANDING) ─── */}
      <div
        className={cn(
          'w-full rounded-2xl px-5 py-3.5 border transition-all duration-200 flex items-center justify-between gap-3 shadow-xs',
          isReadyOrCounting
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
            : 'bg-white border-slate-200 text-slate-800'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              isReadyOrCounting
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
            )}
          >
            {isReadyOrCounting ? (
              <CheckCircle2 size={18} />
            ) : (
              <User size={18} />
            )}
          </div>

          <div>
            <p className="font-bold text-sm sm:text-base leading-tight">
              {countdown !== null && countdown > 0
                ? `Foto dalam ${countdown} detik... Tahan posisi`
                : face.message}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isReadyOrCounting
                ? 'Wajah pas di tengah lingkaran. Jangan bergerak.'
                : 'Posisikan wajah Anda tepat di dalam bingkai oval di atas.'}
            </p>
          </div>
        </div>

        {/* Quick Instant Snap Button */}
        <button
          type="button"
          onClick={handleManualCapture}
          className="flex-shrink-0 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
        >
          <Camera size={13} />
          <span>Ambil Sekarang</span>
        </button>
      </div>
    </div>
  )
}
