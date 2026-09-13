import { useCallback, useEffect, useRef, useState } from 'react'

interface UseWebcamOptions {
  onCapture?: (base64: string) => void
  onNoWebcam?: () => void
}

export function useWebcam({ onCapture, onNoWebcam }: UseWebcamOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isReady, setIsReady] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNoWebcam, setIsNoWebcam] = useState(false)
  const [isPermissionDenied, setIsPermissionDenied] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const start = useCallback(async () => {
    setError(null)
    setIsNoWebcam(false)
    setIsPermissionDenied(false)

    // 1. Cek apakah perangkat browser mendukung mediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsNoWebcam(true)
      setError('Browser tidak mendukung akses kamera.')
      onNoWebcam?.()
      return
    }

    // 2. Cek apakah ada perangkat videoinput fisik yang tercolok
    try {
      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((d) => d.kind === 'videoinput')
        if (videoDevices.length === 0) {
          setIsNoWebcam(true)
          setError('Kamera tidak ditemukan atau tercabut.')
          onNoWebcam?.()
          return
        }
      }
    } catch {
      // jika enumerateDevices gagal/dibatasi, lanjutkan ke getUserMedia
    }

    // 3. Minta akses kamera secara otomatis
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setIsReady(true)
      }
    } catch (err) {
      const errorName = err instanceof Error ? err.name : ''
      const msg = err instanceof Error ? err.message : 'Kamera tidak dapat diakses.'

      // Jika kamera fisik memang tidak ada / rusak / tercabut
      if (
        errorName === 'NotFoundError' ||
        errorName === 'DevicesNotFoundError' ||
        msg.includes('NotFound') ||
        msg.includes('not found')
      ) {
        setIsNoWebcam(true)
        setError('Kamera tidak terdeteksi atau tercabut.')
        onNoWebcam?.()
      } else if (
        errorName === 'NotAllowedError' ||
        errorName === 'PermissionDeniedError' ||
        msg.includes('Permission') ||
        msg.includes('NotAllowed')
      ) {
        // Kamera ada fisik tapi permission belum di-allow
        setIsPermissionDenied(true)
        setError('Izin kamera belum diizinkan. Silakan klik "Izinkan" (Allow) pada browser.')
      } else {
        setError('Kamera tidak dapat digunakan: ' + msg)
      }
    }
  }, [onNoWebcam])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setIsReady(false)
  }, [])

  const capture = useCallback((): string | null => {
    if (!videoRef.current || !isReady) return null

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(videoRef.current, 0, 0)
    const base64 = canvas.toDataURL('image/jpeg', 0.85)
    setCapturedImage(base64)
    onCapture?.(base64)
    return base64
  }, [isReady, onCapture])

  const retake = useCallback(() => {
    setCapturedImage(null)
  }, [])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    videoRef,
    isReady,
    isCapturing,
    error,
    isNoWebcam,
    isPermissionDenied,
    capturedImage,
    start,
    stop,
    capture,
    retake,
  }
}
