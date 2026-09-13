import { useEffect, useRef, useState, useCallback } from 'react'
import { useWebcam } from '@/hooks/useWebcam'
import { useFaceDetection } from '@/hooks/useFaceDetection'
import { Button } from '@/components/ui/Button'
import {
  Camera,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ScanFace,
  Eye,
  ShieldCheck,
  Maximize2,
  Sparkles,
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

  const webcam = useWebcam({
    onCapture: (base64) => {
      // Shutter flash animation
      setIsFlashing(true)
      setTimeout(() => setIsFlashing(false), 350)
      onCapture(base64)
    },
  })

  // Hook Face Detection & Liveness
  const face = useFaceDetection({
    videoRef: webcam.videoRef,
    enabled: faceDetection && kioskMode && !webcam.capturedImage && webcam.isReady,
  })

  // Start/Stop camera on mount/unmount
  useEffect(() => {
    webcam.start()
    return () => webcam.stop()
  }, [])

  // Manage Countdown based on Face Recognition status
  useEffect(() => {
    // If not using face detection, fallback to old autoCapture behavior
    if (!faceDetection || !kioskMode) {
      if (autoCapture && webcam.isReady && !webcam.capturedImage && countdown === null) {
        setCountdown(autoCaptureDelay)
      }
      return
    }

    // With Face Detection: ONLY count down when face.status === 'ready'
    if (face.status === 'ready' && !webcam.capturedImage) {
      if (countdown === null) {
        setCountdown(autoCaptureDelay)
      }
    } else {
      // If position lost, eyes closed, or not verified -> RESET countdown
      if (countdown !== null) {
        setCountdown(null)
      }
    }
  }, [face.status, faceDetection, kioskMode, autoCapture, autoCaptureDelay, webcam.isReady, webcam.capturedImage, countdown])

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
        <AlertCircle className="w-12 h-12 text-rose-600 animate-pulse" />
        <p className="text-center text-rose-800 font-bold text-base sm:text-lg">{webcam.error}</p>
        <p className="text-center text-slate-500 text-xs">
          Pastikan browser diizinkan mengakses kamera perangkat ini.
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
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border-4 border-emerald-500 shadow-2xl w-full aspect-[4/3]">
          <img
            src={webcam.capturedImage}
            alt="Foto Siswa Terverifikasi"
            className="w-full h-full object-cover"
          />
          {/* Success stamp overlay */}
          <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md text-white text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow">
            <CheckCircle2 size={16} />
            <span>Foto Terverifikasi</span>
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

  // Active Camera View with Face Recognition HUD
  return (
    <div className={cn('flex flex-col items-center gap-4 w-full max-w-lg mx-auto select-none', className)}>
      {/* Video Viewport Container */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-700/60 shadow-2xl w-full aspect-[4/3]">
        <video
          ref={webcam.videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />

        {/* Shutter Flash Effect */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white animate-out fade-out duration-300 z-40 pointer-events-none" />
        )}

        {/* Loading Overlay */}
        {!webcam.isReady && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-base font-medium">Mengaktifkan kamera...</p>
          </div>
        )}

        {/* ─── HUD OVERLAY: OVAL GUIDE & FACE FRAME ─── */}
        {webcam.isReady && faceDetection && kioskMode && (
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4">
            {/* SVG Dark Vignette Cutout + Dynamic Oval Border */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <mask id="face-oval-mask">
                  {/* White reveals everything */}
                  <rect width="100%" height="100%" fill="white" />
                  {/* Black cuts out the face oval */}
                  <ellipse cx="50%" cy="46%" rx="29%" ry="38%" fill="black" />
                </mask>
              </defs>

              {/* Darkened mask outside the oval */}
              <rect
                width="100%"
                height="100%"
                fill="rgba(15, 23, 42, 0.48)"
                mask="url(#face-oval-mask)"
              />

              {/* Oval Border with Dynamic Colors */}
              <ellipse
                cx="50%"
                cy="46%"
                rx="29%"
                ry="38%"
                fill="none"
                stroke={
                  face.status === 'ready'
                    ? '#10b981' // emerald
                    : face.status === 'need_liveness'
                    ? '#3b82f6' // blue
                    : face.status === 'no_face' || face.status === 'initializing'
                    ? '#94a3b8' // slate
                    : '#f59e0b' // amber
                }
                strokeWidth={face.status === 'ready' ? 5 : 3}
                strokeDasharray={
                  face.status === 'no_face' || face.status === 'initializing' ? '8 6' : 'none'
                }
                className={cn(
                  'transition-all duration-300',
                  face.status === 'ready' && 'filter drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]',
                  face.status === 'need_liveness' && 'animate-pulse'
                )}
              />

              {/* Four HUD Viewfinder Corner Accents around the Oval */}
              <g
                stroke={face.status === 'ready' ? '#10b981' : '#60a5fa'}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                opacity="0.85"
              >
                {/* Top-Left */}
                <path d="M 50 40 L 35 40 A 10 10 0 0 0 25 50 L 25 65" />
                {/* Top-Right */}
                <path d="M 430 40 L 445 40 A 10 10 0 0 1 455 50 L 455 65" />
                {/* Bottom-Left */}
                <path d="M 50 320 L 35 320 A 10 10 0 0 1 25 310 L 25 295" />
                {/* Bottom-Right */}
                <path d="M 430 320 L 445 320 A 10 10 0 0 0 455 310 L 455 295" />
              </g>
            </svg>

            {/* Top HUD: Realtime Criteria Badges */}
            <div className="relative z-30 flex items-center justify-between w-full">
              {/* Status Pill */}
              <div
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md flex items-center gap-1.5 shadow transition-colors',
                  face.status === 'ready'
                    ? 'bg-emerald-500/90 text-white'
                    : face.status === 'need_liveness'
                    ? 'bg-blue-600/90 text-white animate-pulse'
                    : face.status === 'no_face'
                    ? 'bg-slate-900/80 text-slate-300 border border-slate-700'
                    : 'bg-amber-500/90 text-white'
                )}
              >
                <ScanFace size={15} />
                <span>
                  {face.status === 'ready'
                    ? 'Siap Foto'
                    : face.status === 'need_liveness'
                    ? 'Verifikasi Keaslian'
                    : face.status === 'no_face'
                    ? 'Mencari Wajah'
                    : 'Sesuaikan Posisi'}
                </span>
              </div>

              {/* Criteria Indicators */}
              <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/60 text-[11px] font-semibold text-slate-300">
                <span className={cn('px-1.5 py-0.5 rounded', face.isCentered ? 'text-emerald-400 font-bold' : 'text-slate-500')}>
                  {face.isCentered ? '✓' : '•'} Tengah
                </span>
                <span className={cn('px-1.5 py-0.5 rounded', face.isSizeValid ? 'text-emerald-400 font-bold' : 'text-slate-500')}>
                  {face.isSizeValid ? '✓' : '•'} Jarak
                </span>
                <span className={cn('px-1.5 py-0.5 rounded', face.isEyesOpen ? 'text-emerald-400 font-bold' : 'text-slate-500')}>
                  {face.isEyesOpen ? '✓' : '•'} Mata
                </span>
                <span className={cn('px-1.5 py-0.5 rounded', face.isLivenessVerified ? 'text-emerald-400 font-bold' : 'text-blue-400')}>
                  {face.isLivenessVerified ? '✓ Asli' : 'Blink'}
                </span>
              </div>
            </div>

            {/* Center Big Countdown Display */}
            {countdown !== null && countdown > 0 && (
              <div className="relative z-30 m-auto flex flex-col items-center justify-center animate-in zoom-in-50 duration-200">
                <div className="w-24 h-24 rounded-full bg-slate-950/80 backdrop-blur-md border-4 border-emerald-400 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                  <span className="text-white font-black text-6xl tabular-nums drop-shadow">
                    {countdown}
                  </span>
                </div>
                <span className="text-white text-xs font-bold uppercase tracking-wider mt-2 bg-emerald-600/90 px-3 py-0.5 rounded-full backdrop-blur-sm shadow">
                  Tahan Posisi...
                </span>
              </div>
            )}

            {/* Bottom prompt inside video if needed */}
            <div className="relative z-30" />
          </div>
        )}
      </div>

      {/* ─── DYNAMIC INSTRUCTION BANNER (BELOW CAMERA) ─── */}
      <div
        className={cn(
          'w-full rounded-2xl p-4 border flex items-center gap-3 transition-all duration-300 shadow-sm',
          face.status === 'ready'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : face.status === 'need_liveness'
            ? 'bg-blue-50 border-blue-300 text-blue-950'
            : face.status === 'no_face'
            ? 'bg-slate-100 border-slate-200 text-slate-800'
            : 'bg-amber-50 border-amber-300 text-amber-950'
        )}
      >
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            face.status === 'ready'
              ? 'bg-emerald-200 text-emerald-800'
              : face.status === 'need_liveness'
              ? 'bg-blue-200 text-blue-800 animate-bounce'
              : face.status === 'no_face'
              ? 'bg-slate-200 text-slate-700'
              : 'bg-amber-200 text-amber-800'
          )}
        >
          {face.status === 'ready' ? (
            <Sparkles size={22} className="animate-spin" style={{ animationDuration: '3s' }} />
          ) : face.status === 'need_liveness' ? (
            <Eye size={22} />
          ) : face.status === 'no_face' ? (
            <ScanFace size={22} />
          ) : (
            <Maximize2 size={22} />
          )}
        </div>

        <div className="flex-1">
          <p className="font-extrabold text-sm sm:text-base leading-tight">
            {countdown !== null && countdown > 0
              ? `Foto otomatis dalam ${countdown} detik...`
              : face.message}
          </p>
          <p className="text-xs opacity-80 mt-0.5">
            {face.status === 'ready'
              ? 'Wajah dan keaslian terverifikasi. Jangan bergerak.'
              : face.status === 'need_liveness'
              ? 'Kedipkan mata Anda ke kamera untuk memastikan Anda manusia asli (bukan foto).'
              : face.status === 'no_face'
              ? 'Pastikan pencahayaan cukup dan wajah terlihat jelas di kamera.'
              : 'Posisikan wajah Anda tepat di dalam bingkai oval di atas.'}
          </p>
        </div>
      </div>

      {/* Manual Capture Fallback Button */}
      <div className="flex items-center justify-center gap-3 w-full">
        <button
          type="button"
          onClick={handleManualCapture}
          className="text-slate-500 hover:text-slate-800 text-xs font-semibold hover:underline flex items-center gap-1.5 py-1 px-3 cursor-pointer"
        >
          <Camera size={14} />
          <span>Kendala posisi? Klik di sini untuk Ambil Foto Manual</span>
        </button>
      </div>
    </div>
  )
}
