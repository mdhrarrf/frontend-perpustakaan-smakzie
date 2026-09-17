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
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/utils'

interface WebcamCaptureProps {
  onCapture: (base64: string) => void
  onRetake?: () => void
  onNoWebcam?: () => void
  autoCapture?: boolean
  autoCaptureDelay?: number
  className?: string
  kioskMode?: boolean
  faceDetection?: boolean
  showPreview?: boolean
}

export function WebcamCapture({
  onCapture,
  onRetake,
  onNoWebcam,
  autoCapture = true,
  autoCaptureDelay = 1,
  className,
  kioskMode = false,
  faceDetection = true,
  showPreview = false,
}: WebcamCaptureProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isFlashing, setIsFlashing] = useState(false)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isCountingDownRef = useRef(false)
  const autoSkipTriggeredRef = useRef(false)

  const webcam = useWebcam({
    onCapture: (base64) => {
      setIsFlashing(true)
      setTimeout(() => setIsFlashing(false), 300)
      onCapture(base64)
    },
    onNoWebcam: () => {
      // Jika kamera tidak ada / rusak / tercabut di mode kiosk, skip otomatis
      if (kioskMode && !autoSkipTriggeredRef.current) {
        autoSkipTriggeredRef.current = true
        setTimeout(() => {
          onNoWebcam?.()
        }, 1200)
      }
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
  useEffect(() => {
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
      // Saat countdown berjalan: HANYA batal jika wajah hilang atau keluar drastis dari frame
      if (!face.faceDetected || face.isSeverelyOut) {
        setCountdown(null)
      }
    } else {
      // Mulai countdown saat posisi wajah sudah pas
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

  const buttonSize = kioskMode ? 'kiosk' : 'lg'

  // 1. Kondisi: Kamera Fisik Tidak Ditemukan / Tercabut / Rusak -> Auto-Skip
  if (webcam.isNoWebcam) {
    return (
      <div className={cn('flex flex-col items-center gap-4 p-8 bg-amber-50 border border-amber-200 rounded-3xl max-w-md mx-auto shadow-sm text-center animate-kiosk-page', className)}>
        <Camera className="w-12 h-12 text-amber-600 animate-pulse" />
        <div>
          <h3 className="text-amber-900 font-extrabold text-lg sm:text-xl">Kamera Tidak Terdeteksi</h3>
          <p className="text-amber-800 text-sm mt-1 font-medium">
            Perangkat kamera tidak ditemukan atau kabel webcam tercabut.
          </p>
          <p className="text-amber-700 text-xs mt-2 font-semibold bg-amber-100/80 px-3 py-1.5 rounded-full inline-block">
            Melanjutkan peminjaman secara otomatis...
          </p>
        </div>
      </div>
    )
  }

  // 2. Kondisi: Kamera Tercolok tapi Permission Belum Di-Allow di Browser
  if (webcam.isPermissionDenied) {
    return (
      <div className={cn('flex flex-col items-center gap-5 p-8 bg-blue-50 border border-blue-200 rounded-3xl max-w-md mx-auto shadow-sm text-center animate-kiosk-page', className)}>
        <ShieldAlert className="w-12 h-12 text-blue-600" />
        <div>
          <h3 className="text-blue-950 font-extrabold text-lg sm:text-xl">Izin Kamera Diperlukan</h3>
          <p className="text-slate-600 text-sm mt-1 leading-relaxed">
            Kamera terhubung, namun browser memblokir akses izin kamera. Silakan klik ikon gembok/kamera di sebelah kiri bilah alamat (URL) browser dan pilih <span className="font-bold text-blue-700">"Izinkan" (Allow)</span>.
          </p>
        </div>
        <Button variant="primary" size={buttonSize} onClick={() => webcam.start()} className="w-full">
          <RefreshCw size={18} /> Coba Sambungkan Lagi
        </Button>
      </div>
    )
  }

  // 3. Kondisi: Error Kamera Lainnya
  if (webcam.error) {
    return (
      <div className={cn('flex flex-col items-center gap-4 p-8 bg-rose-50 border border-rose-200 rounded-3xl max-w-md mx-auto shadow-sm text-center', className)}>
        <AlertCircle className="w-12 h-12 text-rose-600" />
        <p className="text-center text-rose-800 font-bold text-base sm:text-lg">{webcam.error}</p>
        <Button variant="outline" size={buttonSize} onClick={() => webcam.start()} className="mt-2">
          <RefreshCw size={18} /> Coba Sambungkan Lagi
        </Button>
      </div>
    )
  }

  // 4. Kondisi: Foto Berhasil Diambil (Preview) - Hanya jika showPreview bernilai true
  if (showPreview && webcam.capturedImage) {
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

  // 5. Tampilan Kamera Aktif
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

        {/* ─── CLEAN, NATURAL OVAL GUIDE ─── */}
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

              {/* Soft dark vignette outside oval */}
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

            {/* Circular Countdown Badge */}
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

      {/* ─── INSTRUCTION BANNER (SMK BRANDING) ─── */}
      <div
        className={cn(
          'w-full rounded-2xl px-5 py-3.5 border transition-all duration-200 flex items-center gap-3 shadow-xs',
          isReadyOrCounting
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
            : 'bg-white border-slate-200 text-slate-800'
        )}
      >
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

        <div className="flex-1">
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
    </div>
  )
}
