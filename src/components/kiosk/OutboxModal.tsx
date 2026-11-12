import { useState, useEffect } from 'react'
import { outboxQueue, type OutboxItem } from '@/utils/outboxQueue'
import {
  RotateCcw, CheckCircle2, Clock, AlertTriangle, X, Cloud, CloudOff,
  RefreshCw, BookOpen, Trash2
} from 'lucide-react'
import { formatDateTime } from '@/utils'

interface OutboxModalProps {
  isOpen: boolean
  onClose: () => void
}

export function OutboxModal({ isOpen, onClose }: OutboxModalProps) {
  const [items, setItems] = useState<OutboxItem[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const unsubscribe = outboxQueue.subscribe((all) => {
      setItems(all)
    })
    return () => unsubscribe()
  }, [isOpen])

  if (!isOpen) return null

  const pendingCount = items.filter((x) => x.status === 'pending' || x.status === 'syncing' || x.status === 'failed').length

  async function handleSyncNow() {
    setIsSyncing(true)
    setSyncResult(null)
    try {
      const res = await outboxQueue.syncAll()
      setSyncResult(`Selesai: ${res.success} berhasil disinkronkan, ${res.failed} gagal dicoba lagi.`)
    } catch {
      setSyncResult('Gagal menghubungi server saat sinkronisasi.')
    } finally {
      setIsSyncing(false)
    }
  }

  async function handleClearSynced() {
    await outboxQueue.clearSyncedItems()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${pendingCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {pendingCount > 0 ? <CloudOff size={20} /> : <Cloud size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Antrean Transaksi Offline</h2>
              <p className="text-xs text-slate-500">
                {pendingCount > 0
                  ? `${pendingCount} transaksi tersimpan lokal menunggu sinkronisasi ke server`
                  : 'Seluruh transaksi telah berhasil tersinkronkan ke server'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-4">
          {syncResult && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800 font-medium">
              {syncResult}
            </div>
          )}

          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 size={40} className="mx-auto text-emerald-600 mb-2" />
              <p className="font-bold text-slate-800 text-sm">Tidak Ada Antrean Tertunda</p>
              <p className="text-xs text-slate-500 mt-0.5">Semua transaksi peminjaman telah tercatat di server perpustakaan.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="pt-4 first:pt-0 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      item.type === 'class'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {item.type === 'class' ? 'Peminjaman Kelas' : 'Individu'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {item.id.slice(0, 18)}...
                    </span>
                  </div>

                  <p className="font-bold text-slate-900 text-sm mt-1 truncate">
                    {item.meta.book_title}
                    {item.meta.quantity > 1 ? ` (${item.meta.quantity} eks)` : ''}
                  </p>

                  <p className="text-xs text-slate-600 mt-0.5">
                    Peminjam: <span className="font-semibold">{item.meta.student_name}</span>
                    {item.meta.student_kelas ? ` • ${item.meta.student_kelas}` : ''}
                  </p>

                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Clock size={12} />
                    Dicatat: {formatDateTime(new Date(item.createdAt).toISOString())} WIB
                  </p>

                  {item.lastError && (
                    <p className="text-[11px] text-rose-600 mt-1 bg-rose-50 p-1.5 rounded-lg border border-rose-100">
                      Catatan: {item.lastError}
                    </p>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  {item.status === 'synced' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                      <CheckCircle2 size={13} /> Tersinkronkan
                    </span>
                  ) : item.status === 'syncing' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl">
                      <RefreshCw size={13} className="animate-spin" /> Menyinkronkan...
                    </span>
                  ) : item.status === 'failed' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl">
                      <AlertTriangle size={13} /> Menunggu Jaringan
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                      <Clock size={13} /> Dalam Antrean
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClearSynced}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-3 py-2 rounded-xl hover:bg-slate-200/60 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={14} /> Bersihkan yang Sudah Sinkron
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing || pendingCount === 0}
              className="text-xs font-bold px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
