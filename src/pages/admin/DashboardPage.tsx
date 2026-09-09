import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/api/index'
import { loanService } from '@/api/loan.service'
import { StatCard, Card, CardHeader, CardBody, LoadingCard } from '@/components/ui/Card'
import { LoanStatusBadge } from '@/components/ui/Badge'
import { formatDate, formatDateTime } from '@/utils'
import {
  BookOpen, Users, ClipboardList, AlertTriangle,
  PackageX, RotateCcw, TrendingUp, Layers,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export function AdminDashboard() {
  const stats  = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.stats,
    refetchInterval: 5_000, // Live poll tiap 5 detik
  })
  const chart  = useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: () => dashboardService.chart(7),
    refetchInterval: 10_000, // Live poll tiap 10 detik
  })
  const today  = useQuery({
    queryKey: ['loans-today'],
    queryFn: loanService.today,
    refetchInterval: 5_000, // Live poll tiap 5 detik
  })

  const s = stats.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Ringkasan aktivitas perpustakaan hari ini</p>
      </div>

      {/* Stats */}
      {stats.isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <LoadingCard key={i} />)}
        </div>
      ) : s && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Buku Fisik" value={s.total_buku ? s.total_buku.toLocaleString('id-ID') : '0'} icon={<BookOpen size={20} />}       color="blue" />
          <StatCard label="Buku Tersedia"    value={s.buku_tersedia ? s.buku_tersedia.toLocaleString('id-ID') : '0'} icon={<Layers size={20} />}     color="green" />
          <StatCard label="Sedang Dipinjam"  value={s.pinjam_aktif ?? 0}     icon={<ClipboardList size={20} />}  color="blue" />
          <StatCard label="Total Siswa"      value={s.total_siswa ? s.total_siswa.toLocaleString('id-ID') : '0'} icon={<Users size={20} />}          color="emerald" />
          <StatCard label="Pinjam Hari Ini"  value={s.pinjam_hari_ini ?? 0}  icon={<TrendingUp size={20} />}     color="blue" />
          <StatCard label="Kembali Hari Ini" value={s.kembali_hari_ini ?? 0} icon={<RotateCcw size={20} />}      color="green" />
          <StatCard label="Terlambat"        value={s.terlambat ?? 0}        icon={<AlertTriangle size={20} />}  color="red" />
          <StatCard label="Buku Hilang Pending" value={s.buku_hilang_pending ?? 0} icon={<PackageX size={20} />} color="yellow" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Aktivitas 7 Hari Terakhir</h2>
          </CardHeader>
          <CardBody>
            {chart.isLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
              </div>
            ) : chart.data && (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chart.data.loan_chart} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pinjam" name="Dipinjam" fill="#2563eb" radius={[4,4,0,0]} />
                  <Bar dataKey="kembali" name="Dikembalikan" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* Top Books */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Buku Terpopuler</h2>
          </CardHeader>
          <CardBody className="p-0">
            {chart.isLoading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Memuat data...</div>
            ) : (!chart.data?.top_books || chart.data.top_books.length === 0) ? (
              <div className="p-8 text-center text-slate-400 text-sm">Belum ada aktivitas peminjaman buku.</div>
            ) : (
              chart.data.top_books.map((book: any, idx: number) => (
                <div key={book.id ?? idx} className="flex items-center gap-3 px-6 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate" title={book.judul}>{book.judul}</p>
                    <p className="text-xs text-slate-400 truncate">{book.penulis || '—'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">{book.jumlah_dipinjam} eks</span>
                    {book.transaksi_count && (
                      <p className="text-[10px] text-slate-400 font-medium">{book.transaksi_count}x transaksi</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      {/* Today's Loans */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Transaksi Hari Ini</h2>
        </CardHeader>
        {today.isLoading ? (
          <CardBody><div className="h-20 flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500" /></div></CardBody>
        ) : (today.data?.length ?? 0) === 0 ? (
          <CardBody><p className="text-sm text-slate-400 text-center py-6">Belum ada transaksi hari ini.</p></CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left">No. Transaksi</th>
                  <th className="px-6 py-3 text-left">Siswa</th>
                  <th className="px-6 py-3 text-left">Buku</th>
                  <th className="px-6 py-3 text-left">Jatuh Tempo</th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {today.data?.map((loan) => (
                  <tr key={loan.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-mono text-xs">{loan.loan_number}</td>
                    <td className="px-6 py-3">
                      <p className="font-medium">{loan.student?.nama}</p>
                      <p className="text-xs text-slate-400">{loan.student?.nis}</p>
                    </td>
                    <td className="px-6 py-3">
                      {loan.items?.[0]?.book?.judul ?? (loan.items?.[0] as any)?.book_title_snapshot ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-xs">{formatDateTime(loan.due_at)}</td>
                    <td className="px-6 py-3">
                      <LoanStatusBadge status={loan.status} label={loan.status_label} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
