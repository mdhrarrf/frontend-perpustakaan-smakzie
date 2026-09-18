import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { lostBookService } from '@/api/index'
import { Card, CardBody, EmptyState } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate, formatCurrency } from '@/utils'
import type { LostBook } from '@/types'
import {
  BookX, CheckCircle2, AlertCircle, X, Banknote, BookOpen,
  ChevronRight, User, Calendar,
} from 'lucide-react'

// ─── Compensation Status Badge ─────────────────────────────────────────────────
function CompensationStatusBadge({ status }: { status: string }) {
  if (status === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle2 size={11} />
        Selesai
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-700">
      <AlertCircle size={11} />
      Belum Diselesaikan
    </span>
  )
}

// ─── Compensation Type Badge ───────────────────────────────────────────────────
function CompensationTypeBadge({ type }: { type: 'uang' | 'buku' | null }) {
  if (type === 'uang') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
        <Banknote size={11} />
        Uang
      </span>
    )
  }
  if (type === 'buku') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700">
        <BookOpen size={11} />
        Buku Sama
      </span>
    )
  }
  return <span className="text-slate-400 text-xs">—</span>
}

// ─── Resolve Modal ─────────────────────────────────────────────────────────────
interface ResolveModalProps {
  lostBook: LostBook
  onClose: () => void
  onSuccess: () => void
}

function ResolveModal({ lostBook, onClose, onSuccess }: ResolveModalProps) {
  const qc = useQueryClient()
  const [compensationType, setCompensationType] = useState<'uang' | 'buku'>('uang')
  const [notes, setNotes] = useState(lostBook.notes ?? '')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      lostBookService.resolve(lostBook.id, {
        compensation_type: compensationType,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-lost-books'] })
      onSuccess()
    },
    onError: (err: any) => {
      setErrorMsg(
        err?.response?.data?.message || err.message || 'Gagal menyelesaikan kompensasi.'
      )
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 rounded-xl">
              <BookX size={18} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Selesaikan Kompensasi</h2>
              <p className="text-xs text-slate-500">Tandai buku hilang sebagai terselesaikan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Info ringkasan buku & siswa */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 flex-shrink-0 mt-0.5">
                <BookOpen size={14} className="text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Buku</p>
                <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mt-0.5">
                  {lostBook.book?.judul ?? '—'}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  {lostBook.book?.kode_buku ?? '—'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 flex-shrink-0 mt-0.5">
                <User size={14} className="text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Siswa</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{lostBook.student?.nama ?? '—'}</p>
                <p className="text-xs text-slate-400">
                  {lostBook.student?.nis ?? '—'}
                  {lostBook.student?.kelas ? ` · ${lostBook.student.kelas}` : ''}
                </p>
              </div>
            </div>

            {lostBook.harga_buku > 0 && (
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Estimasi Harga Buku</span>
                <span className="text-sm font-bold text-amber-700">
                  {formatCurrency(lostBook.harga_buku)}
                </span>
              </div>
            )}
          </div>

          {/* Bentuk kompensasi */}
          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Bentuk Kompensasi *
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {([
                { value: 'uang' as const, label: 'Uang', sub: 'Ganti rugi tunai', Icon: Banknote },
                { value: 'buku' as const, label: 'Buku Sama', sub: 'Ganti buku baru', Icon: BookOpen },
              ]).map(({ value, label, sub, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCompensationType(value)}
                  className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    compensationType === value
                      ? 'border-primary-500 bg-primary-50/60'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    compensationType === value ? 'bg-primary-100' : 'bg-slate-100'
                  }`}>
                    <Icon size={16} className={compensationType === value ? 'text-primary-600' : 'text-slate-500'} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold leading-tight ${
                      compensationType === value ? 'text-primary-900' : 'text-slate-700'
                    }`}>
                      {label}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
              Catatan <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan penyelesaian..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-all"
            />
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-6 py-4 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1"
          >
            {mutation.isPending ? 'Menyimpan...' : 'Selesaikan'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function AdminLostBooksPage() {
  const [compensationStatus, setCompensationStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [resolveTarget, setResolveTarget] = useState<LostBook | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-lost-books', { compensationStatus, page }],
    queryFn: () =>
      lostBookService.list({
        compensation_status: compensationStatus || undefined,
        page,
        per_page: 20,
      }),
  })

  const lostBooks: LostBook[] = (data?.data as any)?.data ?? []
  const meta = (data?.data as any)?.meta ?? null

  function handleResolveSuccess() {
    setResolveTarget(null)
    setSuccessMsg('Kompensasi buku hilang berhasil diselesaikan.')
    setTimeout(() => setSuccessMsg(null), 5000)
  }

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Buku Hilang</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manajemen kompensasi buku yang dinyatakan hilang
        </p>
      </div>

      {/* ── Success Banner ── */}
      {successMsg && (
        <div className="p-4 rounded-xl flex items-start gap-3 text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Berhasil</p>
            <p className="text-xs opacity-90 mt-0.5">{successMsg}</p>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {([
          { value: 'pending',  label: 'Belum Diselesaikan' },
          { value: 'resolved', label: 'Sudah Diselesaikan' },
          { value: '',         label: 'Semua' },
        ] as const).map(({ value, label }) => (
          <Button
            key={value}
            size="sm"
            variant={compensationStatus === value ? 'primary' : 'outline'}
            onClick={() => { setCompensationStatus(value); setPage(1) }}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* ── Table Card ── */}
      <Card>
        {isLoading ? (
          <CardBody>
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
            </div>
          </CardBody>
        ) : lostBooks.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<BookX size={48} />}
              title="Tidak ada data buku hilang"
              description={
                compensationStatus === 'pending'
                  ? 'Tidak ada buku hilang yang menunggu diselesaikan.'
                  : compensationStatus === 'resolved'
                  ? 'Belum ada kompensasi yang telah diselesaikan.'
                  : 'Belum ada catatan buku hilang.'
              }
            />
          </CardBody>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left">Siswa</th>
                    <th className="px-6 py-3 text-left">Buku</th>
                    <th className="px-6 py-3 text-right">Harga Buku</th>
                    <th className="px-6 py-3 text-left">Kompensasi</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Tercatat</th>
                    <th className="px-6 py-3 text-left">Diselesaikan</th>
                    <th className="px-6 py-3 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {lostBooks.map((lb) => (
                    <tr key={lb.id} className="border-t border-slate-50 hover:bg-slate-50/50">

                      {/* Siswa */}
                      <td className="px-6 py-3">
                        <p className="font-medium text-slate-900">{lb.student?.nama ?? '—'}</p>
                        <p className="text-xs text-slate-400">{lb.student?.nis ?? '—'}</p>
                        {lb.student?.kelas && (
                          <p className="text-xs text-slate-400">{lb.student.kelas}</p>
                        )}
                      </td>

                      {/* Buku */}
                      <td className="px-6 py-3 max-w-[200px]">
                        <p className="font-medium text-slate-900 line-clamp-2 leading-snug">
                          {lb.book?.judul ?? '—'}
                        </p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {lb.book?.kode_buku ?? '—'}
                        </p>
                      </td>

                      {/* Harga */}
                      <td className="px-6 py-3 text-right whitespace-nowrap">
                        {lb.harga_buku > 0 ? (
                          <span className="font-semibold text-slate-800">
                            {formatCurrency(lb.harga_buku)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Bentuk Kompensasi */}
                      <td className="px-6 py-3">
                        <CompensationTypeBadge type={lb.compensation_type} />
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3">
                        <CompensationStatusBadge status={lb.compensation_status} />
                      </td>

                      {/* Tercatat */}
                      <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400 flex-shrink-0" />
                          {formatDate(lb.created_at)}
                        </div>
                      </td>

                      {/* Diselesaikan */}
                      <td className="px-6 py-3 text-xs whitespace-nowrap">
                        {lb.resolved_at ? (
                          <div className="flex items-center gap-1 text-green-700">
                            <CheckCircle2 size={12} className="flex-shrink-0" />
                            {formatDate(lb.resolved_at)}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {lb.loan_id && (
                            <Link to={`/admin/loans/${lb.loan_id}`}>
                              <Button size="sm" variant="ghost" className="gap-1 text-xs whitespace-nowrap">
                                Transaksi
                                <ChevronRight size={13} />
                              </Button>
                            </Link>
                          )}
                          {lb.compensation_status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 whitespace-nowrap"
                              onClick={() => setResolveTarget(lb)}
                            >
                              <CheckCircle2 size={13} />
                              Selesaikan
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && (
              <Pagination
                meta={meta}
                currentPage={page}
                onPageChange={setPage}
                itemLabel="entri"
              />
            )}
          </>
        )}
      </Card>

      {/* ── Resolve Modal ── */}
      {resolveTarget && (
        <ResolveModal
          lostBook={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onSuccess={handleResolveSuccess}
        />
      )}
    </div>
  )
}
