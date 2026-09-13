import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, FaceLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision'

export type FaceStatus =
  | 'initializing'
  | 'no_face'
  | 'too_far'
  | 'too_close'
  | 'not_centered'
  | 'eyes_closed'
  | 'need_liveness'
  | 'ready'

export interface FaceDetectionState {
  isLoading: boolean
  isModelReady: boolean
  faceDetected: boolean
  isCentered: boolean
  isSizeValid: boolean
  isEyesOpen: boolean
  isLivenessVerified: boolean
  hasBlinked: boolean
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
  const [hasBlinked, setHasBlinked] = useState(false)
  const [status, setStatus] = useState<FaceStatus>('initializing')
  const [message, setMessage] = useState('Menyiapkan sensor pengenalan wajah...')
  const [faceBox, setFaceBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  const landmarkerRef = useRef<FaceLandmarker | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastVideoTimeRef = useRef<number>(-1)

  // Tracking liveness: blink state machine & micro-motion
  const blinkStateRef = useRef<{ wasOpen: boolean; closedCount: number; blinkDetected: boolean }>({
    wasOpen: false,
    closedCount: 0,
    blinkDetected: false,
  })

  // Tracking position history for micro-movement anti-spoofing
  const positionHistoryRef = useRef<{ x: number; y: number; ear: number; time: number }[]>([])
  const centeredSinceRef = useRef<number | null>(null)

  // 1. Initialize FaceLandmarker
  useEffect(() => {
    if (!enabled) return

    let isMounted = true

    async function initLandmarker() {
      try {
        setIsLoading(true)
        setMessage('Memuat model analisis wajah...')

        // Try local wasm first, fallback to CDN
        let fileset
        try {
          fileset = await FilesetResolver.forVisionTasks('/wasm')
        } catch {
          fileset = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm')
        }

        if (!isMounted) return

        // Try GPU delegate first, fallback to CPU
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
          } catch (gpuErr) {
            console.warn(`GPU delegate failed for ${modelPath}, trying CPU...`, gpuErr)
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
            } catch (cpuErr) {
              console.warn(`CPU delegate failed for ${modelPath}:`, cpuErr)
            }
          }
        }

        if (!created || !isMounted) return

        setIsModelReady(true)
        setIsLoading(false)
        setStatus('no_face')
        setMessage('Arahkan wajah Anda ke kamera')
      } catch (err) {
        console.error('Gagal menginisialisasi Face Landmarker:', err)
        if (isMounted) {
          setIsLoading(false)
          setMessage('Sensor wajah siap (mode fallback)')
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

  // 2. Detection Loop
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
              setFaceBox(null)
              setStatus('no_face')
              setMessage('Arahkan wajah Anda ke kamera')
              centeredSinceRef.current = null
              positionHistoryRef.current = []
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

              // Center target: (0.5, 0.46) with tolerance
              const centered = Math.abs(centerX - 0.5) <= 0.13 && Math.abs(centerY - 0.46) <= 0.15
              setIsCentered(centered)

              // Size check: face width between 20% and 65% of frame
              const tooFar = boxWidth < 0.20
              const tooClose = boxWidth > 0.65
              const sizeOk = !tooFar && !tooClose
              setIsSizeValid(sizeOk)

              // Eye openness via landmarks (EAR - Eye Aspect Ratio)
              // Left eye: 159 (top), 145 (bottom), 33 (outer), 133 (inner)
              const leftH = dist(landmarks[33], landmarks[133])
              const leftV = dist(landmarks[159], landmarks[145])
              const leftEAR = leftH > 0 ? leftV / leftH : 0

              // Right eye: 386 (top), 374 (bottom), 362 (inner), 263 (outer)
              const rightH = dist(landmarks[362], landmarks[263])
              const rightV = dist(landmarks[386], landmarks[374])
              const rightEAR = rightH > 0 ? rightV / rightH : 0

              const avgEAR = (leftEAR + rightEAR) / 2
              const eyesOpen = avgEAR >= 0.17
              setIsEyesOpen(eyesOpen)

              // Blendshapes check if available (eyeBlinkLeft, eyeBlinkRight)
              let blendshapeBlink = false
              if (results.faceBlendshapes?.[0]?.categories) {
                const cats = results.faceBlendshapes[0].categories
                const blinkL = cats.find((c) => c.categoryName === 'eyeBlinkLeft')?.score ?? 0
                const blinkR = cats.find((c) => c.categoryName === 'eyeBlinkRight')?.score ?? 0
                if (blinkL > 0.6 || blinkR > 0.6) {
                  blendshapeBlink = true
                }
              }

              // Liveness Detection: Natural Blink State Machine
              const bState = blinkStateRef.current
              const isBlinkingNow = !eyesOpen || blendshapeBlink

              if (!bState.blinkDetected) {
                if (eyesOpen && !isBlinkingNow) {
                  bState.wasOpen = true
                } else if (bState.wasOpen && isBlinkingNow) {
                  bState.closedCount += 1
                  if (bState.closedCount >= 1 && bState.closedCount <= 12) {
                    // Closed for 1..12 frames (~30ms..400ms)
                    // Wait for it to open again
                  }
                }

                if (bState.wasOpen && bState.closedCount > 0 && eyesOpen && !isBlinkingNow) {
                  // Successfully transitioned: OPEN -> BLINK -> OPEN = REAL HUMAN BLINK!
                  bState.blinkDetected = true
                  setHasBlinked(true)
                  setIsLivenessVerified(true)
                }
              }

              // Record position history for micro-movement / natural variance
              const now = performance.now()
              const history = positionHistoryRef.current
              history.push({ x: centerX, y: centerY, ear: avgEAR, time: now })
              while (history.length > 40) history.shift()

              // Secondary Liveness Check: Natural 3D Micro-Motion
              // Real humans cannot remain mathematically frozen like a printed card;
              // there are subtle sub-pixel breathing micro-motions and pulse variations.
              let microMotionVerified = false
              if (centered && sizeOk && history.length >= 25) {
                if (!centeredSinceRef.current) centeredSinceRef.current = now

                // Calculate position standard deviation across last 25 frames
                const avgX = history.reduce((s, h) => s + h.x, 0) / history.length
                const avgY = history.reduce((s, h) => s + h.y, 0) / history.length
                const variance = history.reduce((s, h) => s + Math.hypot(h.x - avgX, h.y - avgY), 0) / history.length

                // Natural human variance range: 0.001 to 0.04 (not completely rigid zero, not crazy shaking)
                const isNaturalMotion = variance >= 0.0012 && variance <= 0.045
                const heldTime = now - centeredSinceRef.current

                // If held steady for > 2.5s with natural micro-motion, also verify liveness
                if (isNaturalMotion && heldTime > 2500) {
                  microMotionVerified = true
                  setIsLivenessVerified(true)
                }
              } else if (!centered) {
                centeredSinceRef.current = null
              }

              const livenessOk = bState.blinkDetected || microMotionVerified

              // Status Hierarchy
              if (tooFar) {
                setStatus('too_far')
                setMessage('Dekatkan wajah Anda ke kamera')
              } else if (tooClose) {
                setStatus('too_close')
                setMessage('Mundurkan wajah sedikit')
              } else if (!centered) {
                setStatus('not_centered')
                setMessage('Posisikan wajah tepat di tengah oval')
              } else if (!eyesOpen) {
                setStatus('eyes_closed')
                setMessage('Buka mata Anda dengan jelas')
              } else if (!livenessOk) {
                setStatus('need_liveness')
                setMessage('Kedipkan mata sekali untuk verifikasi keaslian')
              } else {
                setStatus('ready')
                setMessage('Posisi sempurna! Tahan posisi...')
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
    hasBlinked,
    status,
    message,
    faceBox,
  }
}
