/**
 * faceCompare.ts
 * Membandingkan 2 foto menggunakan MediaPipe FaceLandmarker (mode IMAGE).
 * Menggunakan fetch() untuk download gambar sebagai blob agar tidak ada
 * masalah CORS "tainted canvas" saat MediaPipe membaca pixel.
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

/**
 * Load an image from either a base64 data URL or a remote URL.
 * For remote URLs: uses fetch() to get a blob ObjectURL so MediaPipe
 * can safely read pixels without CORS "tainted canvas" issues.
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
  // Base64 data URLs load directly — no CORS issue
  if (src.startsWith('data:')) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(new Error(`Failed to load base64 image: ${e}`))
      img.src = src
    })
  }

  // Remote URL: fetch as blob to avoid canvas taint
  let objectUrl: string | null = null
  try {
    const res = await fetch(src, { mode: 'cors', credentials: 'omit' })
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching image`)
    const blob = await res.blob()
    objectUrl = URL.createObjectURL(blob)
  } catch (fetchErr) {
    // Fallback: try loading with crossOrigin attribute
    console.warn('[faceCompare] fetch failed, trying crossOrigin img:', fetchErr)
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Cannot load image: ${src}`))
      img.src = src
    })
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      resolve(img)
    }
    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      reject(new Error(`Failed to decode blob image from: ${src}`))
    }
    img.src = objectUrl!
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

  // Load both images (parallel for speed)
  const [img1, img2] = await Promise.all([loadImage(src1), loadImage(src2)])

  const r1 = landmarker.detect(img1)
  const r2 = landmarker.detect(img2)

  const lms1 = r1.faceLandmarks?.[0] ?? []
  const lms2 = r2.faceLandmarks?.[0] ?? []

  console.log(`[faceCompare] lms1=${lms1.length} lms2=${lms2.length}`)

  if (lms1.length === 0 && lms2.length === 0)
    return { match: false, score: 0, hasNoFace1: true, hasNoFace2: true }
  if (lms1.length === 0)
    return { match: false, score: 0, hasNoFace1: true, hasNoFace2: false }
  if (lms2.length === 0)
    return { match: false, score: 0, hasNoFace1: false, hasNoFace2: true }

  const v1 = normalizeLandmarks(lms1 as Landmark[])
  const v2 = normalizeLandmarks(lms2 as Landmark[])
  const score = cosineSimilarity(v1, v2)

  console.log(`[faceCompare] score=${score.toFixed(4)} threshold=${threshold} match=${score >= threshold}`)

  return { match: score >= threshold, score, hasNoFace1: false, hasNoFace2: false }
}
