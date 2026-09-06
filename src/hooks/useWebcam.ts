import { useCallback, useEffect, useRef, useState } from 'react'

interface UseWebcamOptions {
  onCapture?: (base64: string) => void
}

export function useWebcam({ onCapture }: UseWebcamOptions = {}) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isReady,   setIsReady]   = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const start = useCallback(async () => {
    setError(null)
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
      const msg = err instanceof Error ? err.message : 'Kamera tidak dapat diakses.'
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setError('Kamera tidak diizinkan. Periksa permission browser.')
      } else if (msg.includes('NotFound')) {
        setError('Kamera tidak ditemukan pada perangkat ini.')
      } else {
        setError('Kamera tidak dapat digunakan. ' + msg)
      }
    }
  }, [])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setIsReady(false)
  }, [])

  const capture = useCallback((): string | null => {
    if (!videoRef.current || !isReady) return null

    const canvas  = document.createElement('canvas')
    canvas.width  = videoRef.current.videoWidth
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
    return () => { stop() }
  }, [stop])

  return {
    videoRef,
    isReady,
    isCapturing,
    error,
    capturedImage,
    start,
    stop,
    capture,
    retake,
  }
}
