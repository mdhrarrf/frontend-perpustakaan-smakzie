/**
 * Smart Persistent Cache Manager (IndexedDB + Memory + localStorage)
 * Dirancang untuk Zero-Fail Reads data master perpustakaan (Guru, Mapel, Kelas, Kategori Buku).
 *
 * FITUR:
 * 1. 0ms Initial Data: Menyimpan data sinkron di memori/localStorage untuk render instan frame pertama.
 * 2. High-Capacity IndexedDB: Menyimpan data terstruktur dengan kapasitas besar dan aman dari batas quota.
 * 3. Zero-Fail Reads: Jika koneksi server/internet drop/timeout/500, otomatis melayani data lokal tanpa error.
 * 4. Stale-While-Revalidate: Mengambil data terbaru di latar belakang saat online.
 */

export interface CacheRecord<T> {
  key: string
  data: T
  timestamp: number
  ttlMs: number
}

const DB_NAME = 'smakzie_perpustakaan_offline_v1'
const STORE_NAME = 'master_cache'
const DB_VERSION = 1
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000 // 24 jam default

class PersistentMasterCache {
  private memoryCache = new Map<string, CacheRecord<unknown>>()
  private dbPromise: Promise<IDBDatabase | null> | null = null

  constructor() {
    this.initSyncStorage()
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.initIndexedDB()
    }
  }

  /**
   * Baca sinkron dari memory/localStorage saat booting agar 0ms delay saat render awal
   */
  private initSyncStorage() {
    if (typeof window === 'undefined') return
    try {
      const keys = ['master_teachers', 'master_classes', 'master_categories', 'master_subjects']
      for (const k of keys) {
        const raw = localStorage.getItem(`cache_${k}`)
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as CacheRecord<unknown>
            this.memoryCache.set(k, parsed)
          } catch {
            // ignore JSON error
          }
        }
      }
    } catch {
      // ignore localStorage restriction/disabled
    }
  }

  private async getDB(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise
    if (typeof window === 'undefined' || !('indexedDB' in window)) return null

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION)
        request.onupgradeneeded = () => {
          const db = request.result
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'key' })
          }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => {
          console.warn('[OfflineCache] Gagal membuka IndexedDB, fallback ke localStorage/memory.')
          resolve(null)
        }
      } catch (err) {
        console.warn('[OfflineCache] Exception saat membuka IndexedDB:', err)
        resolve(null)
      }
    })

    return this.dbPromise
  }

  private async initIndexedDB() {
    const db = await this.getDB()
    if (!db) return
    try {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAll()
      request.onsuccess = () => {
        const items = request.result as CacheRecord<unknown>[]
        if (Array.isArray(items)) {
          for (const item of items) {
            this.memoryCache.set(item.key, item)
          }
        }
      }
    } catch (err) {
      console.warn('[OfflineCache] Gagal membaca init IndexedDB:', err)
    }
  }

  /**
   * Mengambil data secara sinkron dari memori (0ms) untuk initialData React Query
   */
  getSync<T>(key: string): T | null {
    const mem = this.memoryCache.get(key)
    if (mem && mem.data !== undefined) {
      return mem.data as T
    }
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`cache_${key}`)
        if (raw) {
          const parsed = JSON.parse(raw) as CacheRecord<T>
          this.memoryCache.set(key, parsed)
          return parsed.data
        }
      } catch {
        // ignore
      }
    }
    return null
  }

  /**
   * Mengambil data secara asinkron dari IndexedDB / Memory
   */
  async get<T>(key: string): Promise<T | null> {
    const mem = this.memoryCache.get(key)
    if (mem && mem.data !== undefined) {
      return mem.data as T
    }

    const db = await this.getDB()
    if (!db) {
      return this.getSync<T>(key)
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const req = store.get(key)
        req.onsuccess = () => {
          const res = req.result as CacheRecord<T> | undefined
          if (res && res.data !== undefined) {
            this.memoryCache.set(key, res)
            resolve(res.data)
          } else {
            resolve(this.getSync<T>(key))
          }
        }
        req.onerror = () => resolve(this.getSync<T>(key))
      } catch {
        resolve(this.getSync<T>(key))
      }
    })
  }

  /**
   * Menyimpan data ke IndexedDB + Memory + localStorage
   */
  async set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): Promise<void> {
    const record: CacheRecord<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttlMs,
    }

    // 1. Simpan di memory (instan)
    this.memoryCache.set(key, record)

    // 2. Simpan di localStorage (backup cepat)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`cache_${key}`, JSON.stringify(record))
      }
    } catch {
      // Kuota localStorage penuh atau private browsing, aman diabaikan
    }

    // 3. Simpan di IndexedDB (kapasitas besar & persisten)
    const db = await this.getDB()
    if (!db) return

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const req = store.put(record)
        req.onsuccess = () => resolve()
        req.onerror = () => resolve()
      } catch {
        resolve()
      }
    })
  }

  /**
   * Fetch data dengan proteksi offline (Zero-Fail Reads).
   * Menjalankan fetcher; jika sukses memperbarui cache; jika jaringan putus/gagal/timeout,
   * menyajikan data dari cache lokal tanpa melempar error.
   */
  async fetchWithOfflineFallback<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { ttlMs?: number; allowStaleOnError?: boolean }
  ): Promise<T> {
    const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS

    try {
      const freshData = await fetcher()
      // Simpan fresh data jika valid (non-null/non-empty array)
      if (freshData !== null && freshData !== undefined) {
        if (!Array.isArray(freshData) || freshData.length > 0) {
          this.set(key, freshData, ttlMs).catch(() => {})
        }
      }
      return freshData
    } catch (networkError) {
      console.warn(`[OfflineCache] Jaringan/server terkendala untuk key "${key}". Mencari cadangan cache lokal...`, networkError)

      // Ambil cadangan lokal
      const cachedData = await this.get<T>(key)
      if (cachedData !== null && cachedData !== undefined) {
        if (Array.isArray(cachedData) && cachedData.length === 0) {
          // Cache lokal kosong, lempar error asli
          throw networkError
        }
        console.info(`[OfflineCache] Berhasil menyajikan data lokal untuk "${key}" (Zero-Fail Read).`)
        return cachedData
      }

      // Jika benar-benar belum pernah tersimpan di cache, rethrow error
      throw networkError
    }
  }
}

export const persistentMasterCache = new PersistentMasterCache()
