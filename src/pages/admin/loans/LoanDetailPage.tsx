import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { loanService } from '@/api/loan.service'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoanStatusBadge, ViolationStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, formatDateTime } from '@/utils'
import { ArrowLeft, RotateCcw, PackageX } from 'lucide-react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'

export function AdminLoanDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { data: loan, isLoading } = useQuery({
    queryKey: ['loan', id],
    queryFn: () => loanService.get(Number(id)),
    enabled: !!id,
  })

  const returnMutation = useMutation({
    mutationFn: () => loanService.processReturn(Number(id), {}),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['loan', id] })
      setSuccess(result.is_late
        ? `Buku dikembalikan. Terlambat ${result.late_days} hari — pelanggaran telah dicatat.`
        : 'Buku berhasil dikembalikan.')
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  const lostMutation = useMutation({
    mutationFn: () => loanService.markLost(Number(id), {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loan', id] })
      setSuccess('Buku ditandai sebagai hilang.')
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  if (isLoading) return <div className="flex items-center justify-center h-60"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>
  if (!loan) return null

  const canReturn = ['active', 'overdue'].includes(loan.status)

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft size={16} /></Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900">{loan.loan_number}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <LoanStatusBadge status={loan.status} label={loan.status_label} />
            <span className="text-xs text-slate-400">{loan.loan_type_label}</span>
          </div>
        </div>
        {canReturn && (
          <div className="flex gap-2">
            <Button variant="danger" size="sm" onClick={() => { if (confirm('Tandai buku ini hilang?')) lostMutation.mutate() }} loading={lostMutation.isPending}>
              <PackageX size={14} /> Hilang
            </Button>
            <Button size="sm" onClick={() => { if (confirm('Proses pengembalian buku ini?')) returnMutation.mutate() }} loading={returnMutation.isPending}>
              <RotateCcw size={14} /> Kembalikan
            </Button>
          </div>
        )}
      </div>

      {error   && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
      {success && <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Informasi Peminjaman</h2></CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              {[
                { label: 'Tanggal Pinjam',  value: formatDateTime(loan.borrowed_at) },
                { label: 'Jatuh Tempo',     value: formatDateTime(loan.due_at) },
                { label: 'Tanggal Kembali', value: loan.returned_at ? formatDateTime(loan.returned_at) : '—' },
                { label: 'Keterlambatan',   value: loan.late_days > 0 ? `${loan.late_days} hari` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-medium text-slate-900">{value}</dd>
                </div>
              ))}
              {loan.loan_type === 'class' && <>
                <div className="flex justify-between"><dt className="text-slate-500">Kelas</dt><dd className="font-medium">{loan.class_name}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Guru</dt><dd className="font-medium">{loan.teacher_name}</dd></div>
              </>}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Data Peminjam</h2></CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Nama</dt><dd className="font-medium">{loan.student?.nama}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">NIS</dt><dd className="font-mono">{loan.student?.nis}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Kelas</dt><dd className="font-medium">{loan.student?.kelas ?? '—'}</dd></div>
            </dl>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-slate-800">Buku yang Dipinjam</h2></CardHeader>
        <CardBody className="p-0">
          {loan.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-6 py-4">
              {item.book.cover && <img src={item.book.cover} alt={item.book.judul} className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0" />}
              <div className="flex-1">
                <p className="font-medium text-slate-900">{item.book.judul}</p>
                <p className="text-sm text-slate-500">{item.book.penulis}</p>
                <p className="text-xs text-slate-400 font-mono">{item.book.kode_buku}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">×{item.quantity}</p>
                <p className="text-xs text-slate-400">{formatCurrency(item.book.harga)}/eks</p>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {loan.violation && (
        <Card className="border-red-200">
          <CardHeader className="bg-red-50"><h2 className="font-semibold text-red-700">Pelanggaran</h2></CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Keterlambatan</dt><dd className="font-bold text-red-600">{loan.violation.late_days} hari</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Sanksi Mulai</dt><dd className="font-medium">{formatDate(loan.violation.penalty_start_date)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Sanksi Berakhir</dt><dd className="font-medium">{formatDate(loan.violation.penalty_end_date)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><ViolationStatusBadge status={loan.violation.status} label={loan.violation.status_label} /></dd></div>
            </dl>
          </CardBody>
        </Card>
      )}

      {/* Foto dokumentasi */}
      {(loan.borrow_photo || loan.return_photo) && (
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Foto Dokumentasi</h2></CardHeader>
          <CardBody>
            <div className="flex gap-4">
              {loan.borrow_photo && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Saat Peminjaman</p>
                  <img src={loan.borrow_photo} alt="Foto pinjam" className="w-40 h-28 object-cover rounded-lg shadow" />
                </div>
              )}
              {loan.return_photo && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Saat Pengembalian</p>
                  <img src={loan.return_photo} alt="Foto kembali" className="w-40 h-28 object-cover rounded-lg shadow" />
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
