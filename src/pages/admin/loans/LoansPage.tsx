import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { loanService } from '@/api/loan.service'
import { Card, CardBody, EmptyState } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoanStatusBadge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { formatDateTime } from '@/utils'
import { ClipboardList, Search, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'

export function AdminLoansPage() {
  const qc = useQueryClient()
  const [q, setQ]         = useState('')
  const [status, setStatus] = useState('')
  const [type, setType]   = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]   = useState('')
  const [page, setPage]   = useState(1)
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const syncMutation = useMutation({
    mutationFn: () => loanService.syncSlims(),
    onSuccess: (res) => {
      setSyncFeedback({
        type: 'success',
        message: res.data?.message || res.message || 'Sinkronisasi dengan SLiMS berhasil.',
      })
      qc.invalidateQueries({ queryKey: ['admin-loans'] })
      setTimeout(() => setSyncFeedback(null), 8000)
    },
    onError: (err: any) => {
      setSyncFeedback({
        type: 'error',
        message: err?.response?.data?.message || err.message || 'Gagal menyinkronkan dengan SLiMS.',
      })
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-loans', { q, status, type, dateFrom, dateTo, page }],
    queryFn: () => loanService.list({ q, status, loan_type: type, date_from: dateFrom, date_to: dateTo, page }),
  })

  const loans = (data?.data as any)?.data ?? []
  const meta  = (data?.data as any)?.meta ?? data?.data

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Peminjaman</h1>
          <p className="text-sm text-slate-500">Semua transaksi peminjaman buku</p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <RefreshCw size={15} className={syncMutation.isPending ? "animate-spin" : ""} />
            {syncMutation.isPending ? "Menyinkronkan..." : "Sinkronkan SLiMS"}
          </Button>
        </div>
      </div>

      {syncFeedback && (
        <div className={`p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in duration-200 ${
          syncFeedback.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {syncFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold">{syncFeedback.type === 'success' ? 'Sinkronisasi SLiMS Sukses' : 'Sinkronisasi SLiMS Gagal'}</p>
            <p className="text-xs opacity-90 mt-0.5">{syncFeedback.message}</p>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48">
              <Input placeholder="Cari nomor transaksi, siswa..." leftIcon={<Search size={15} />} value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
            </div>
            <select className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="returned">Dikembalikan</option>
              <option value="overdue">Terlambat</option>
              <option value="lost">Hilang</option>
            </select>
            <select className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" value={type} onChange={(e) => { setType(e.target.value); setPage(1) }}>
              <option value="">Semua Tipe</option>
              <option value="individual">Individu</option>
              <option value="class">Kelas</option>
            </select>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
            <Input type="date" value={dateTo}   onChange={(e) => setDateTo(e.target.value)}   className="w-40" />
          </div>
        </CardBody>
      </Card>

      <Card>
        {isLoading ? (
          <CardBody><div className="h-40 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" /></div></CardBody>
        ) : loans.length === 0 ? (
          <CardBody><EmptyState icon={<ClipboardList size={48} />} title="Belum ada transaksi" /></CardBody>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left">No. Transaksi</th>
                    <th className="px-6 py-3 text-left">Siswa</th>
                    <th className="px-6 py-3 text-left">Buku</th>
                    <th className="px-6 py-3 text-left">Tipe</th>
                    <th className="px-6 py-3 text-left">Dipinjam</th>
                    <th className="px-6 py-3 text-left">Jatuh Tempo</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => (
                    <tr key={loan.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-mono text-xs">
                        <div>{loan.loan_number}</div>
                        {loan.sync_source === 'slims' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 mt-1 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                            SLiMS #{loan.slims_loan_id}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-medium">{loan.student?.nama}</p>
                        <p className="text-xs text-slate-400">{loan.student?.nis}</p>
                      </td>
                      <td className="px-6 py-3">
                        {(() => {
                          const title = loan.items?.[0]?.book?.judul ?? '—'
                          const isPlaceholder = title.startsWith('Buku [') || loan.items?.some((i) => (i.book?.judul ?? '').startsWith('Buku ['))
                          return (
                            <div>
                              <p className="line-clamp-1 font-medium text-slate-800">{title}</p>
                              {isPlaceholder && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                  Perlu Koreksi
                                </span>
                              )}
                              {(loan.items?.[0]?.quantity ?? 1) > 1 && <p className="text-xs text-slate-400 mt-0.5">{loan.items[0].quantity} eks</p>}
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-6 py-3">{loan.loan_type_label}</td>
                      <td className="px-6 py-3 text-xs">{formatDateTime(loan.borrowed_at)}</td>
                      <td className="px-6 py-3 text-xs">{formatDateTime(loan.due_at)}</td>
                      <td className="px-6 py-3">
                        <LoanStatusBadge status={loan.status} label={loan.status_label} />
                        {loan.late_days > 0 && <span className="ml-1 text-xs text-red-500">+{loan.late_days}h</span>}
                      </td>
                      <td className="px-6 py-3">
                        {(() => {
                          const isPlaceholder = (loan.items?.[0]?.book?.judul ?? '').startsWith('Buku [') || loan.items?.some((i) => (i.book?.judul ?? '').startsWith('Buku ['))
                          return (
                            <Link to={`/admin/loans/${loan.id}`}>
                              <Button
                                size="sm"
                                variant={isPlaceholder ? "outline" : "ghost"}
                                className={isPlaceholder ? "border-amber-400 text-amber-700 bg-amber-50/60 hover:bg-amber-100 text-xs font-semibold" : ""}
                              >
                                {isPlaceholder ? 'Koreksi' : 'Lihat'}
                              </Button>
                            </Link>
                          )
                        })()}
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
                itemLabel="transaksi"
              />
            )}
          </>
        )}
      </Card>
    </div>
  )
}
