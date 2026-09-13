/**
 * faceCompare.ts
 * Membandingkan 2 foto menggunakan MediaPipe FaceLandmarker (mode IMAGE).
 */
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision'

type Landmark = { x: number; y: number; z: number }

let landmarkerInstance: FaceLandmarker | null = null
let initPromise: Promise<FaceLandmarker> | null = null

async function getLandmarker(): Promise<FaceLandmarker> {
  if (landmarkerInstance) return landmarkerInstance
  if (initPromise) return initPromise

  initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks('/wasm').catch(() =>
      FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )
    )
    const lm = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: '/models/face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'IMAGE',
      numFaces: 1,
      minFaceDetectionConfidence: 0.4,
      minFacePresenceConfidence: 0.4,
      minTrackingConfidence: 0.4,
    })
    landmarkerInstance = lm
    return lm
  })()

  return initPromise
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function normalizeLandmarks(lms: Landmark[]): number[] {
  if (lms.length === 0) return []
  const cx = lms.reduce((s, l) => s + l.x, 0) / lms.length
  const cy = lms.reduce((s, l) => s + l.y, 0) / lms.length
  const xs = lms.map((l) => l.x)
  const ys = lms.map((l) => l.y)
  const faceW = Math.max(...xs) - Math.min(...xs)
  const faceH = Math.max(...ys) - Math.min(...ys)
  const scale = Math.max(faceW, faceH) || 1
  const vec: number[] = []
  for (const l of lms) {
    vec.push((l.x - cx) / scale, (l.y - cy) / scale, l.z / scale)
  }
  return vec
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

export type FaceCompareResult = {
  match: boolean
  score: number
  hasNoFace1: boolean
  hasNoFace2: boolean
}

export async function compareFaces(
  src1: string,
  src2: string,
  threshold = 0.80
): Promise<FaceCompareResult> {
  const landmarker = await getLandmarker()
  const [img1, img2] = await Promise.all([loadImage(src1), loadImage(src2)])
  const r1 = landmarker.detect(img1)
  const r2 = landmarker.detect(img2)
  const lms1 = r1.faceLandmarks?.[0] ?? []
  const lms2 = r2.faceLandmarks?.[0] ?? []
  if (lms1.length === 0 && lms2.length === 0)
    return { match: false, score: 0, hasNoFace1: true, hasNoFace2: true }
  if (lms1.length === 0)
    return { match: false, score: 0, hasNoFace1: true, hasNoFace2: false }
  if (lms2.length === 0)
    return { match: false, score: 0, hasNoFace1: false, hasNoFace2: true }
  const v1 = normalizeLandmarks(lms1 as Landmark[])
  const v2 = normalizeLandmarks(lms2 as Landmark[])
  const score = cosineSimilarity(v1, v2)
  return { match: score >= threshold, score, hasNoFace1: false, hasNoFace2: false }
}
