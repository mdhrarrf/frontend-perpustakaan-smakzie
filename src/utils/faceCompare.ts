/**
 * faceCompare.ts
 * Verifikasi identitas wajah menggunakan face-api.js (faceRecognitionNet).
 *
 * Berbeda dengan landmark similarity (yang hanya mengukur geometri wajah dan
 * menghasilkan false-positive tinggi karena semua manusia punya proporsi mirip),
 * face-api.js menggunakan 128-dimensional embedding vector yang dilatih khusus
 * untuk identity recognition.
 *
 * Euclidean distance antar descriptor:
 *  - < 0.45 : orang yang sama (strict threshold untuk kiosk)
 *  - >= 0.45: orang berbeda -> BLOKIR pengembalian
 */
import * as faceapi from 'face-api.js'

const MODEL_URL = '/models/face-api'
let modelsLoaded = false
let loadPromise: Promise<void> | null = null

async function ensureModels(): Promise<void> {
  if (modelsLoaded) return
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])
    modelsLoaded = true
    console.log('[faceCompare] Models loaded')
  })()

  return loadPromise
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  // base64 -> load directly
  if (src.startsWith('data:')) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(new Error(`base64 image load failed: ${e}`))
      img.src = src
    })
  }

  // Remote URL: fetch as blob to avoid CORS canvas-taint issues
  try {
    const res = await fetch(src, { mode: 'cors', credentials: 'omit' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Blob image load failed: ${src}`)) }
      img.src = url
    })
  } catch (fetchErr) {
    console.warn('[faceCompare] fetch failed, trying crossOrigin img:', fetchErr)
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Cannot load image: ${src}`))
      img.src = src
    })
  }
}

export type FaceCompareResult = {
  match: boolean
  /** 0–1 score: makin tinggi makin mirip (ditampilkan ke user sebagai %) */
  score: number
  hasNoFace1: boolean
  hasNoFace2: boolean
}

/**
 * @param src1      URL foto arsip peminjaman (borrow_photo dari server)
 * @param src2      base64 foto pengembalian (returnPhotoPreview dari webcam)
 * @param threshold Jarak euclidean maksimum agar dianggap sama orang (default 0.45)
 *                  0.6 = longgar (default face-api), 0.45 = ketat (kiosk)
 */
export async function compareFaces(
  src1: string,
  src2: string,
  threshold = 0.45
): Promise<FaceCompareResult> {
  await ensureModels()

  const [img1, img2] = await Promise.all([loadImage(src1), loadImage(src2)])

  const opts = new faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.3,
  })

  const [det1, det2] = await Promise.all([
    faceapi.detectSingleFace(img1, opts).withFaceLandmarks(true).withFaceDescriptor(),
    faceapi.detectSingleFace(img2, opts).withFaceLandmarks(true).withFaceDescriptor(),
  ])

  console.log('[faceCompare] det1:', det1 ? 'found' : 'NOT FOUND', '| det2:', det2 ? 'found' : 'NOT FOUND')

  if (!det1 && !det2) return { match: false, score: 0, hasNoFace1: true, hasNoFace2: true }
  if (!det1)          return { match: false, score: 0, hasNoFace1: true, hasNoFace2: false }
  if (!det2)          return { match: false, score: 0, hasNoFace1: false, hasNoFace2: true }

  const distance = faceapi.euclideanDistance(det1.descriptor, det2.descriptor)
  // Convert distance ke score 0-1: distance 0 = score 1.0, distance 1.0 = score 0
  const score = Math.max(0, 1 - distance)

  console.log(`[faceCompare] euclidean distance=${distance.toFixed(4)} threshold=${threshold} match=${distance < threshold} score=${score.toFixed(4)}`)

  return {
    match: distance < threshold,
    score,
    hasNoFace1: false,
    hasNoFace2: false,
  }
}
