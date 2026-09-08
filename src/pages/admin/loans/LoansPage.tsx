import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { loanService } from '@/api/loan.service'
import { Card, CardBody, EmptyState } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoanStatusBadge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { formatDateTime } from '@/utils'
import { ClipboardList, Search } from 'lucide-react'

export function AdminLoansPage() {
  const [q, setQ]         = useState('')
  const [status, setStatus] = useState('')
  const [type, setType]   = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]   = useState('')
  const [page, setPage]   = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-loans', { q, status, type, dateFrom, dateTo, page }],
    queryFn: () => loanService.list({ q, status, loan_type: type, date_from: dateFrom, date_to: dateTo, page }),
  })

  const loans = data?.data?.data ?? []
  const meta  = data?.data

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Peminjaman</h1>
          <p className="text-sm text-slate-500">Semua transaksi peminjaman buku</p>
        </div>
      </div>

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
                      <td className="px-6 py-3 font-mono text-xs">{loan.loan_number}</td>
                      <td className="px-6 py-3">
                        <p className="font-medium">{loan.student?.nama}</p>
                        <p className="text-xs text-slate-400">{loan.student?.nis}</p>
                      </td>
                      <td className="px-6 py-3">
                        <p className="line-clamp-1">{loan.items?.[0]?.book?.judul ?? '—'}</p>
                        {(loan.items?.[0]?.quantity ?? 1) > 1 && <p className="text-xs text-slate-400">{loan.items[0].quantity} eks</p>}
                      </td>
                      <td className="px-6 py-3">{loan.loan_type_label}</td>
                      <td className="px-6 py-3 text-xs">{formatDateTime(loan.borrowed_at)}</td>
                      <td className="px-6 py-3 text-xs">{formatDateTime(loan.due_at)}</td>
                      <td className="px-6 py-3">
                        <LoanStatusBadge status={loan.status} label={loan.status_label} />
                        {loan.late_days > 0 && <span className="ml-1 text-xs text-red-500">+{loan.late_days}h</span>}
                      </td>
                      <td className="px-6 py-3">
                        <Link to={`/admin/loans/${loan.id}`}><Button size="sm" variant="ghost">Lihat</Button></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && (
              <Pagination
                currentPage={meta.current_page}
                lastPage={meta.last_page}
                total={meta.total}
                from={meta.from}
                to={meta.to}
                perPage={meta.per_page}
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
