import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, FaceLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision'

export type FaceStatus =
  | 'initializing'
  | 'no_face'
  | 'too_far'
  | 'too_close'
  | 'not_centered'
  | 'eyes_closed'
  | 'ready'

export interface FaceDetectionState {
  isLoading: boolean
  isModelReady: boolean
  faceDetected: boolean
  isCentered: boolean
  isSizeValid: boolean
  isEyesOpen: boolean
  isLivenessVerified: boolean
  isSeverelyOut: boolean
  status: FaceStatus
  message: string
  faceBox: { x: number; y: number; width: number; height: number } | null
}

interface UseFaceDetectionOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>
  enabled?: boolean
}

// Distance helper
function dist(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y)
}

export function useFaceDetection({ videoRef, enabled = true }: UseFaceDetectionOptions): FaceDetectionState {
  const [isLoading, setIsLoading] = useState(true)
  const [isModelReady, setIsModelReady] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [isCentered, setIsCentered] = useState(false)
  const [isSizeValid, setIsSizeValid] = useState(false)
  const [isEyesOpen, setIsEyesOpen] = useState(false)
  const [isLivenessVerified, setIsLivenessVerified] = useState(false)
  const [isSeverelyOut, setIsSeverelyOut] = useState(false)
  const [status, setStatus] = useState<FaceStatus>('initializing')
  const [message, setMessage] = useState('Menyiapkan kamera...')
  const [faceBox, setFaceBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  const landmarkerRef = useRef<FaceLandmarker | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastVideoTimeRef = useRef<number>(-1)

  // Tracking liveness: natural blink or natural presence
  const stablePresenceFramesRef = useRef<number>(0)
  const blinkDetectedRef = useRef<boolean>(false)
  const wasOpenRef = useRef<boolean>(false)

  // 1. Initialize FaceLandmarker
  useEffect(() => {
    if (!enabled) return

    let isMounted = true

    async function initLandmarker() {
      try {
        setIsLoading(true)
        setMessage('Menyiapkan sensor...')

        // Try local wasm first, fallback to CDN
        let fileset
        try {
          fileset = await FilesetResolver.forVisionTasks('/wasm')
        } catch {
          fileset = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm')
        }

        if (!isMounted) return

        // Try local model first, then CDN; GPU delegate first, fallback to CPU
        let landmarker: FaceLandmarker
        const modelPaths = ['/models/face_landmarker.task', 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task']

        let created = false
        for (const modelPath of modelPaths) {
          try {
            landmarker = await FaceLandmarker.createFromOptions(fileset, {
              baseOptions: {
                modelAssetPath: modelPath,
                delegate: 'GPU',
              },
              runningMode: 'VIDEO',
              numFaces: 1,
              outputFaceBlendshapes: true,
            })
            landmarkerRef.current = landmarker
            created = true
            break
          } catch {
            try {
              landmarker = await FaceLandmarker.createFromOptions(fileset, {
                baseOptions: {
                  modelAssetPath: modelPath,
                  delegate: 'CPU',
                },
                runningMode: 'VIDEO',
                numFaces: 1,
                outputFaceBlendshapes: true,
              })
              landmarkerRef.current = landmarker
              created = true
              break
            } catch {
              // Try next model path
            }
          }
        }

        if (!created || !isMounted) return

        setIsModelReady(true)
        setIsLoading(false)
        setStatus('no_face')
        setMessage('Arahkan wajah Anda ke dalam lingkaran')
      } catch (err) {
        console.error('Face detector load error:', err)
        if (isMounted) {
          setIsLoading(false)
          setMessage('Sensor siap')
        }
      }
    }

    initLandmarker()

    return () => {
      isMounted = false
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close()
        } catch { /* ignore */ }
        landmarkerRef.current = null
      }
    }
  }, [enabled])

  // 2. Detection Loop with Generous/Smooth Tolerances
  useEffect(() => {
    if (!enabled || !isModelReady) return

    let isActive = true

    const detectFrame = () => {
      if (!isActive) return

      const video = videoRef.current
      const landmarker = landmarkerRef.current

      if (video && landmarker && video.readyState >= 2 && !video.paused) {
        const currentTime = video.currentTime
        if (currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = currentTime

          try {
            const results = landmarker.detectForVideo(video, performance.now())
            const landmarks = results.faceLandmarks?.[0]

            if (!landmarks || landmarks.length === 0) {
              setFaceDetected(false)
              setIsCentered(false)
              setIsSizeValid(false)
              setIsEyesOpen(false)
              setIsSeverelyOut(true)
              setFaceBox(null)
              setStatus('no_face')
              setMessage('Arahkan wajah Anda ke dalam lingkaran')
              stablePresenceFramesRef.current = 0
            } else {
              setFaceDetected(true)

              // Compute bounding box
              let minX = 1, maxX = 0, minY = 1, maxY = 0
              for (const p of landmarks) {
                if (p.x < minX) minX = p.x
                if (p.x > maxX) maxX = p.x
                if (p.y < minY) minY = p.y
                if (p.y > maxY) maxY = p.y
              }

              const boxWidth = maxX - minX
              const boxHeight = maxY - minY
              const centerX = (minX + maxX) / 2
              const centerY = (minY + maxY) / 2

              setFaceBox({
                x: minX,
                y: minY,
                width: boxWidth,
                height: boxHeight,
              })

              // Center target: generous tolerance (0.5 ± 0.18, 0.46 ± 0.20)
              const centered = Math.abs(centerX - 0.5) <= 0.18 && Math.abs(centerY - 0.46) <= 0.20
              setIsCentered(centered)

              // Severely out of frame (only cancels countdown if true)
              const severelyOut = Math.abs(centerX - 0.5) > 0.28 || Math.abs(centerY - 0.46) > 0.30 || boxWidth < 0.12 || boxWidth > 0.85
              setIsSeverelyOut(severelyOut)

              // Distance tolerance: width between 16% and 72%
              const tooFar = boxWidth < 0.16
              const tooClose = boxWidth > 0.72
              const sizeOk = !tooFar && !tooClose
              setIsSizeValid(sizeOk)

              // Eye openness via landmarks (EAR) - very forgiving threshold
              const leftH = dist(landmarks[33], landmarks[133])
              const leftV = dist(landmarks[159], landmarks[145])
              const leftEAR = leftH > 0 ? leftV / leftH : 0

              const rightH = dist(landmarks[362], landmarks[263])
              const rightV = dist(landmarks[386], landmarks[374])
              const rightEAR = rightH > 0 ? rightV / rightH : 0

              const avgEAR = (leftEAR + rightEAR) / 2
              // Forgiving threshold for spectacles / normal lighting
              const eyesOpen = avgEAR >= 0.14
              setIsEyesOpen(eyesOpen)

              // Natural presence & liveness detection
              // If face is centered & size is OK:
              if (centered && sizeOk) {
                stablePresenceFramesRef.current += 1

                // Detect blink if user blinks naturally
                if (eyesOpen) {
                  wasOpenRef.current = true
                } else if (wasOpenRef.current && !eyesOpen) {
                  blinkDetectedRef.current = true
                }

                // If stable for ~15 frames (~0.5s) OR blink detected -> liveness verified!
                if (stablePresenceFramesRef.current >= 15 || blinkDetectedRef.current) {
                  setIsLivenessVerified(true)
                }
              } else {
                stablePresenceFramesRef.current = Math.max(0, stablePresenceFramesRef.current - 1)
              }

              // Status Hierarchy
              if (tooFar) {
                setStatus('too_far')
                setMessage('Maju sedikit ke kamera')
              } else if (tooClose) {
                setStatus('too_close')
                setMessage('Mundur sedikit dari kamera')
              } else if (!centered) {
                setStatus('not_centered')
                setMessage('Posisikan wajah di dalam lingkaran')
              } else if (!eyesOpen) {
                setStatus('eyes_closed')
                setMessage('Buka mata Anda')
              } else {
                setStatus('ready')
                setMessage('Wajah pas. Tahan posisi...')
              }
            }
          } catch {
            // ignore frame error
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(detectFrame)
    }

    animFrameRef.current = requestAnimationFrame(detectFrame)

    return () => {
      isActive = false
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [enabled, isModelReady, videoRef])

  return {
    isLoading,
    isModelReady,
    faceDetected,
    isCentered,
    isSizeValid,
    isEyesOpen,
    isLivenessVerified,
    isSeverelyOut,
    status,
    message,
    faceBox,
  }
}
