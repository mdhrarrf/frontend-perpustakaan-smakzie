import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { violationService } from '@/api/index'
import { Card, CardBody, EmptyState } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ViolationStatusBadge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate } from '@/utils'
import { AlertTriangle, Search } from 'lucide-react'

export function AdminViolationsPage() {
  const [q, setQ]         = useState('')
  const [status, setStatus] = useState('active')
  const [page, setPage]   = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-violations', { status, page }],
    queryFn: () => violationService.list({ status, page }),
  })

  const violations = (data?.data as any)?.data ?? []
  const meta       = (data?.data as any)?.meta ?? data?.data

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pelanggaran</h1>
        <p className="text-sm text-slate-500">Daftar pelanggaran keterlambatan per buku</p>
      </div>

      <div className="flex gap-3">
        {['active','expired','resolved'].map((s) => (
          <Button key={s} size="sm" variant={status === s ? 'primary' : 'outline'} onClick={() => { setStatus(s); setPage(1) }}>
            {s === 'active' ? 'Aktif' : s === 'expired' ? 'Kadaluarsa' : 'Selesai'}
          </Button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <CardBody><div className="h-40 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" /></div></CardBody>
        ) : violations.length === 0 ? (
          <CardBody><EmptyState icon={<AlertTriangle size={48} />} title="Tidak ada pelanggaran" description={`Tidak ada pelanggaran dengan status "${status}".`} /></CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left">Siswa</th>
                  <th className="px-6 py-3 text-left">Buku</th>
                  <th className="px-6 py-3 text-center">Terlambat</th>
                  <th className="px-6 py-3 text-left">Sanksi Mulai</th>
                  <th className="px-6 py-3 text-left">Sanksi Berakhir</th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((v: any) => (
                  <tr key={v.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-3">
                      <p className="font-medium">{v.student?.nama}</p>
                      <p className="text-xs text-slate-400">{v.student?.nis}</p>
                    </td>
                    <td className="px-6 py-3">
                      <p className="line-clamp-1">{v.book?.judul}</p>
                      <p className="text-xs text-slate-400 font-mono">{v.book?.kode_buku}</p>
                    </td>
                    <td className="px-6 py-3 text-center font-bold text-red-600">{v.late_days} hari</td>
                    <td className="px-6 py-3 text-xs">{formatDate(v.penalty_start_date)}</td>
                    <td className="px-6 py-3 text-xs">{formatDate(v.penalty_end_date)}</td>
                    <td className="px-6 py-3"><ViolationStatusBadge status={v.status} label={v.status_label} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta && (
          <Pagination
            meta={meta}
            currentPage={page}
            onPageChange={setPage}
            itemLabel="pelanggaran"
          />
        )}
      </Card>
    </div>
  )
}
