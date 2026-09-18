import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { violationService } from '@/api/index'
import { Card, CardBody, EmptyState } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate } from '@/utils'
import {
  AlertTriangle, Search, CheckCircle2, Clock, ShieldCheck,
  ChevronRight, X, User, BookOpen, AlertCircle, Info,
} from 'lucide-react'

// ─── Status Badge ─────────────────────────────────────────────────────────────
function ViolationBadge({ status }: { status: string }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
        <AlertCircle size={11} className="shrink-0" />
        Aktif
      </span>
    )
  }
  if (status === 'expired') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <Clock size={11} className="shrink-0" />
        Kadaluarsa
      </span>
    )
  }
  if (status === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={11} className="shrink-0" />
        Diselesaikan
      </span>
    )
  }
  return <span className="text-slate-400 text-xs">—</span>
}

// ─── Modal Bebaskan Sanksi ───────────────────────────────────────────────────
interface ResolveModalProps {
  violation: any
  onClose: () => void
  onSuccess: () => void
}

function ResolveViolationModal({ violation, onClose, onSuccess }: ResolveModalProps) {
  const qc = useQueryClient()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => violationService.resolve(violation.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-violations'] })
      qc.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
      onSuccess()
    },
    onError: (err: any) => {
      setErrorMsg(
        err?.response?.data?.message || err.message || 'Gagal membebaskan sanksi pelanggaran.'
      )
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <ShieldCheck size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Bebaskan Sanksi</h2>
              <p className="text-xs text-slate-500">Selesaikan sanksi lebih awal untuk siswa ini</p>
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
        <div className="px-6 py-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 flex-shrink-0 mt-0.5">
                <User size={14} className="text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Siswa</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{violation.student?.nama ?? '—'}</p>
                <p className="text-xs text-slate-400">
                  {violation.student?.nis ?? '—'}
                  {violation.student?.kelas ? ` · ${violation.student.kelas}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 flex-shrink-0 mt-0.5">
                <BookOpen size={14} className="text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Buku Terblokir</p>
                <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mt-0.5">
                  {violation.book?.judul ?? violation.book_title_snapshot ?? '—'}
                </p>
                {violation.book?.kode_buku && (
                  <p className="text-xs text-slate-400 font-mono">{violation.book.kode_buku}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 text-xs">
              <span className="text-slate-500">Masa Sanksi Berakhir:</span>
              <span className="font-semibold text-rose-700">{formatDate(violation.penalty_end_date)}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Dengan membebaskan sanksi ini, siswa akan dapat kembali meminjam buku tersebut di Kiosk atau pelayanan staf tanpa harus menunggu masa sanksi berakhir.
          </p>

          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800">
              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
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
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {mutation.isPending ? 'Memproses...' : 'Bebaskan Sanksi'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function AdminViolationsPage() {
  const [q, setQ]           = useState('')
  const [status, setStatus] = useState('active')
  const [page, setPage]     = useState(1)
  const [resolveTarget, setResolveTarget] = useState<any | null>(null)
  const [successMsg, setSuccessMsg]       = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-violations', { status, q, page }],
    queryFn: () => violationService.list({ status: status || 'all', q: q || undefined, page }),
  })

  const rawData    = (data?.data as any)
  const violations = rawData?.data ?? []
  const meta       = rawData?.meta ?? null
  const counts     = rawData?.counts ?? null

  function handleResolveSuccess() {
    setResolveTarget(null)
    setSuccessMsg('Sanksi siswa berhasil dibebaskan lebih awal.')
    setTimeout(() => setSuccessMsg(null), 5000)
  }

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pelanggaran & Sanksi</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Daftar sanksi keterlambatan pengembalian buku (sanksi berlaku per buku)
        </p>
      </div>

      {/* ── Information Banner ── */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5 text-xs text-slate-600 leading-relaxed">
        <Info size={18} className="text-primary-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 text-sm">Ketentuan Sistem Pelanggaran</p>
          <div className="grid sm:grid-cols-3 gap-2 mt-1.5 text-slate-600">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="font-bold text-rose-700 block mb-0.5">• Aktif</span>
              Siswa sedang menjalani masa sanksi (dilarang meminjam buku tersebut hingga tanggal sanksi berakhir).
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 block mb-0.5">• Kadaluarsa</span>
              Masa sanksi telah berakhir secara otomatis karena melewati tanggal sanksi. Siswa bebas meminjam kembali.
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="font-bold text-emerald-700 block mb-0.5">• Diselesaikan</span>
              Sanksi telah diputihkan atau dibebaskan lebih awal oleh petugas perpustakaan.
            </div>
          </div>
        </div>
      </div>

      {/* ── Success Feedback Banner ── */}
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

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {([
            { value: 'active',   label: 'Aktif',        count: counts?.active },
            { value: 'expired',  label: 'Kadaluarsa',   count: counts?.expired },
            { value: 'resolved', label: 'Diselesaikan', count: counts?.resolved },
            { value: '',         label: 'Semua',        count: counts?.all },
          ] as const).map(({ value, label, count }) => (
            <Button
              key={value}
              size="sm"
              variant={status === value ? 'primary' : 'outline'}
              onClick={() => { setStatus(value); setPage(1) }}
              className="gap-1.5"
            >
              <span>{label}</span>
              {typeof count === 'number' && (
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  status === value
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="sm:w-72">
          <Input
            placeholder="Cari siswa, NIS, judul buku..."
            leftIcon={<Search size={15} />}
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* ── Data Table Card ── */}
      <Card>
        {isLoading ? (
          <CardBody>
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
            </div>
          </CardBody>
        ) : violations.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<AlertTriangle size={48} />}
              title="Tidak ada data pelanggaran"
              description={
                status === 'active'
                  ? 'Saat ini tidak ada siswa yang memiliki sanksi aktif.'
                  : status === 'expired'
                  ? 'Belum ada sanksi yang berstatus kadaluarsa.'
                  : status === 'resolved'
                  ? 'Belum ada sanksi yang diselesaikan lebih awal.'
                  : 'Tidak ditemukan catatan pelanggaran.'
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
                    <th className="px-6 py-3 text-left">Buku Terblokir</th>
                    <th className="px-6 py-3 text-center">Terlambat</th>
                    <th className="px-6 py-3 text-left">Sanksi Mulai</th>
                    <th className="px-6 py-3 text-left">Sanksi Berakhir</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v: any) => (
                    <tr key={v.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                      {/* Siswa */}
                      <td className="px-6 py-3">
                        <p className="font-medium text-slate-900">{v.student?.nama ?? '—'}</p>
                        <p className="text-xs text-slate-400">
                          {v.student?.nis ?? '—'}
                          {v.student?.kelas ? ` · ${v.student.kelas}` : ''}
                        </p>
                      </td>

                      {/* Buku */}
                      <td className="px-6 py-3 max-w-[240px]">
                        <p className="font-medium text-slate-900 line-clamp-2 leading-snug">
                          {v.book?.judul ?? v.book_title_snapshot ?? '—'}
                        </p>
                        {v.book?.kode_buku && (
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{v.book.kode_buku}</p>
                        )}
                      </td>

                      {/* Terlambat */}
                      <td className="px-6 py-3 text-center">
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 text-xs">
                          {v.late_days} hari
                        </span>
                      </td>

                      {/* Sanksi Mulai */}
                      <td className="px-6 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(v.penalty_start_date)}
                      </td>

                      {/* Sanksi Berakhir */}
                      <td className="px-6 py-3 text-xs font-medium whitespace-nowrap">
                        <span className={v.status === 'active' ? 'text-rose-700 font-semibold' : 'text-slate-600'}>
                          {formatDate(v.penalty_end_date)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3">
                        <ViolationBadge status={v.status} />
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {v.loan_id && (
                            <Link to={`/admin/loans/${v.loan_id}`}>
                              <Button size="sm" variant="ghost" className="gap-1 text-xs whitespace-nowrap">
                                Transaksi
                                <ChevronRight size={13} />
                              </Button>
                            </Link>
                          )}
                          {v.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 whitespace-nowrap"
                              onClick={() => setResolveTarget(v)}
                            >
                              <ShieldCheck size={13} />
                              Bebaskan
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
                itemLabel="pelanggaran"
              />
            )}
          </>
        )}
      </Card>

      {/* ── Resolve Modal ── */}
      {resolveTarget && (
        <ResolveViolationModal
          violation={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onSuccess={handleResolveSuccess}
        />
      )}
    </div>
  )
}

