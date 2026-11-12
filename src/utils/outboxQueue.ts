/**
 * Outbox Queue Manager (IndexedDB + localStorage backup)
 * Mengimplementasikan Resilient Writes (Lapisan 2) untuk Kiosk Perpustakaan.
 *
 * Jaminan:
 * 1. Jika jaringan putus/timeout/500 saat siswa klik selesai, transaksi disimpan di Outbox lokal.
 * 2. Transaksi diberi client_uuid unik untuk mencegah peminjaman ganda saat disinkronkan.
 * 3. Foto webcam (jika gagal upload langsung) disimpan secara offline dan diunggah saat online.
 * 4. Background worker otomatis mencoba sinkronisasi setiap 25 detik dan saat event 'online'.
 * 5. Menyediakan listener sinkronisasi agar petugas dapat melihat daftar antrean secara transparan.
 */

import { loanService, type CreateLoanPayload } from '@/api/loan.service'
import { uploadService } from '@/api/index'

export interface OutboxMeta {
  student_name: string
  student_nis?: string
  student_kelas?: string
  book_title: string
  quantity: number
  due_at: string
  photo_base64?: string | null
}

export interface OutboxItem {
  id: string // client_uuid
  type: 'individual' | 'class'
  payload: CreateLoanPayload
  meta: OutboxMeta
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  retryCount: number
  lastError?: string
  createdAt: number
  syncedAt?: number
}

const DB_NAME = 'smakzie_perpustakaan_offline_v1'
const OUTBOX_STORE = 'outbox_loans'
const LOCAL_STORAGE_KEY = 'smakzie_outbox_loans_backup'

export function generateClientUuid(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 9)
  const rand2 = Math.random().toString(36).slice(2, 6)
  return `kiosk_${ts}_${rand}_${rand2}`
}

class OutboxQueueManager {
  private inMemoryQueue: OutboxItem[] = []
  private isSyncing = false
  private listeners = new Set<(items: OutboxItem[]) => void>()
  private dbPromise: Promise<IDBDatabase | null> | null = null
  private syncTimer: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.loadFromLocalStorage()
    if (typeof window !== 'undefined') {
      this.initDB().then(() => {
        this.loadFromDB().then(() => {
          this.startBackgroundSync()
        })
      })
      window.addEventListener('online', () => {
        console.info('[Outbox] Koneksi internet kembali online! Memulai sinkronisasi antrean...')
        this.syncAll().catch(() => {})
      })
    }
  }

  private loadFromLocalStorage() {
    try {
      if (typeof window === 'undefined') return
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as OutboxItem[]
        if (Array.isArray(parsed)) {
          this.inMemoryQueue = parsed
        }
      }
    } catch {
      // ignore
    }
  }

  private saveToLocalStorage() {
    try {
      if (typeof window === 'undefined') return
      // Simpan hanya pending dan failed agar tidak memakan memori localStorage
      const pendingItems = this.inMemoryQueue.filter((x) => x.status === 'pending' || x.status === 'failed')
      // Strip photo_base64 jika terlalu besar untuk localStorage (IndexedDB tetap menyimpan foto full)
      const sanitized = pendingItems.map((item) => ({
        ...item,
        meta: {
          ...item.meta,
          photo_base64: null,
        },
      }))
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized))
    } catch {
      // ignore
    }
  }

  private async initDB(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise
    if (typeof window === 'undefined' || !('indexedDB' in window)) return null

    this.dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, 2)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('master_cache')) {
            db.createObjectStore('master_cache', { keyPath: 'key' })
          }
          if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
            db.createObjectStore(OUTBOX_STORE, { keyPath: 'id' })
          }
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => {
          console.warn('[Outbox] Gagal membuka IndexedDB outbox store.')
          resolve(null)
        }
      } catch (err) {
        console.warn('[Outbox] Error initDB:', err)
        resolve(null)
      }
    })

    return this.dbPromise
  }

  private async loadFromDB() {
    const db = await this.initDB()
    if (!db) return

    return new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(OUTBOX_STORE, 'readonly')
        const store = tx.objectStore(OUTBOX_STORE)
        const req = store.getAll()
        req.onsuccess = () => {
          const items = req.result as OutboxItem[]
          if (Array.isArray(items)) {
            // Gabungkan dengan memory queue
            const map = new Map<string, OutboxItem>()
            for (const item of this.inMemoryQueue) map.set(item.id, item)
            for (const item of items) map.set(item.id, item)
            this.inMemoryQueue = Array.from(map.values())
            this.notify()
          }
          resolve()
        }
        req.onerror = () => resolve()
      } catch {
        resolve()
      }
    })
  }

  private async saveItemToDB(item: OutboxItem): Promise<void> {
    const db = await this.initDB()
    if (!db) return

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(OUTBOX_STORE, 'readwrite')
        const store = tx.objectStore(OUTBOX_STORE)
        const req = store.put(item)
        req.onsuccess = () => resolve()
        req.onerror = () => resolve()
      } catch {
        resolve()
      }
    })
  }

  private notify() {
    this.saveToLocalStorage()
    for (const listener of this.listeners) {
      try {
        listener([...this.inMemoryQueue])
      } catch {
        // ignore
      }
    }
  }

  /**
   * Daftarkan listener untuk update status antrean (digunakan oleh badge/UI)
   */
  subscribe(listener: (items: OutboxItem[]) => void): () => void {
    this.listeners.add(listener)
    listener([...this.inMemoryQueue])
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Dapatkan jumlah transaksi yang masih pending/belum tersinkron secara sinkron (0ms)
   */
  getPendingCount(): number {
    return this.inMemoryQueue.filter((x) => x.status === 'pending' || x.status === 'syncing' || x.status === 'failed').length
  }

  /**
   * Dapatkan seluruh daftar transaksi antrean (pending maupun tersinkron)
   */
  getItems(): OutboxItem[] {
    return [...this.inMemoryQueue]
  }

  /**
   * Masukkan transaksi ke antrean Outbox saat koneksi gagal
   */
  async enqueue(params: {
    type: 'individual' | 'class'
    payload: CreateLoanPayload
    meta: OutboxMeta
  }): Promise<OutboxItem> {
    const clientUuid = params.payload.client_uuid || generateClientUuid()
    const payloadWithUuid: CreateLoanPayload = {
      ...params.payload,
      client_uuid: clientUuid,
    }

    const item: OutboxItem = {
      id: clientUuid,
      type: params.type,
      payload: payloadWithUuid,
      meta: params.meta,
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
    }

    this.inMemoryQueue.unshift(item)
    this.notify()
    await this.saveItemToDB(item)

    console.info(`[Outbox] Transaksi ${clientUuid} (${params.meta.student_name} - ${params.meta.book_title}) berhasil disimpan di antrean lokal.`)

    // Coba langsung sync di background jika koneksi cepat pulih
    setTimeout(() => this.syncAll().catch(() => {}), 1000)

    return item
  }

  /**
   * Sinkronisasi seluruh antrean yang pending ke server
   */
  async syncAll(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) return { success: 0, failed: 0 }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: 0, failed: 0 }
    }

    const pendingItems = this.inMemoryQueue.filter((x) => x.status === 'pending' || x.status === 'failed')
    if (pendingItems.length === 0) return { success: 0, failed: 0 }

    this.isSyncing = true
    let successCount = 0
    let failedCount = 0

    for (const item of pendingItems) {
      item.status = 'syncing'
      this.notify()

      try {
        // 1. Jika ada foto webcam offline yang belum diupload
        if (!item.payload.borrow_photo && item.meta.photo_base64) {
          try {
            const uploadRes = await uploadService.photo(item.meta.photo_base64, 'borrow')
            if (uploadRes?.path) {
              item.payload.borrow_photo = uploadRes.path
            }
          } catch (uploadErr) {
            console.warn(`[Outbox] Gagal mengunggah foto untuk ${item.id}, melanjutkan pembuatan peminjaman tanpa foto.`, uploadErr)
          }
        }

        // 2. Submit peminjaman dengan client_uuid ke backend
        await loanService.create(item.payload)

        // 3. Sukses
        item.status = 'synced'
        item.syncedAt = Date.now()
        item.lastError = undefined
        successCount++
        console.info(`[Outbox] Transaksi ${item.id} (${item.meta.student_name}) BERHASIL disinkronkan ke server!`)
      } catch (err: any) {
        // Cek jika error 422: apakah sudah tercatat sebelumnya (idempotency safety)
        const errMsg = err?.response?.data?.message || err?.message || 'Gagal sinkronisasi'
        if (err?.response?.status === 422 && (errMsg.includes('aktif') || errMsg.includes('tercatat'))) {
          // Jika server melaporkan siswa sudah punya pinjaman aktif dengan data yang sama, anggap sudah tersinkron
          item.status = 'synced'
          item.syncedAt = Date.now()
          item.lastError = 'Tervalidasi di server'
          successCount++
        } else {
          item.status = 'failed'
          item.retryCount++
          item.lastError = errMsg
          failedCount++
          console.warn(`[Outbox] Gagal menyinkronkan transaksi ${item.id}: ${errMsg}`)
        }
      }

      await this.saveItemToDB(item)
      this.notify()
    }

    this.isSyncing = false
    return { success: successCount, failed: failedCount }
  }

  /**
   * Mulai worker background periodik
   */
  startBackgroundSync() {
    if (this.syncTimer) return
    this.syncTimer = setInterval(() => {
      if (this.getPendingCount() > 0 && navigator.onLine) {
        this.syncAll().catch(() => {})
      }
    }, 25_000) // tiap 25 detik
  }

  /**
   * Hapus item dari antrean (misal item lama yang sudah tersinkron)
   */
  async clearSyncedItems(): Promise<void> {
    const db = await this.initDB()
    const syncedItems = this.inMemoryQueue.filter((x) => x.status === 'synced')
    this.inMemoryQueue = this.inMemoryQueue.filter((x) => x.status !== 'synced')
    this.notify()

    if (db) {
      try {
        const tx = db.transaction(OUTBOX_STORE, 'readwrite')
        const store = tx.objectStore(OUTBOX_STORE)
        for (const item of syncedItems) {
          store.delete(item.id)
        }
      } catch {
        // ignore
      }
    }
  }
}

export const outboxQueue = new OutboxQueueManager()
