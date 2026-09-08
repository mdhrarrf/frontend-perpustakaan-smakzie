import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { loanService } from '@/api/loan.service'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoanStatusBadge, ViolationStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, formatDateTime } from '@/utils'
import { ArrowLeft, RotateCcw, PackageX, Camera, ZoomIn, X } from 'lucide-react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'

export function AdminLoanDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<{ url: string; label: string } | null>(null)

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
          <CardHeader>
            <div className="flex items-center gap-2">
              <Camera size={18} className="text-slate-500" />
              <h2 className="font-semibold text-slate-800">Foto Dokumentasi</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loan.borrow_photo && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">Saat Peminjaman</span>
                    <span className="text-[11px] text-slate-400">Kamera Kiosk/Petugas</span>
                  </div>
                  <div
                    onClick={() => setPreviewImage({ url: loan.borrow_photo!, label: 'Foto Saat Peminjaman' })}
                    className="relative group cursor-pointer overflow-hidden rounded-lg bg-slate-100 aspect-video flex items-center justify-center border border-slate-200"
                  >
                    <img
                      src={loan.borrow_photo}
                      alt="Foto Saat Peminjaman"
                      className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.removeAttribute('style')
                      }}
                    />
                    <div style={{ display: 'none' }} className="flex flex-col items-center justify-center p-4 text-center text-slate-400">
                      <Camera size={28} className="mb-1 text-slate-300" />
                      <p className="text-xs">Foto tidak dapat dimuat</p>
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium">
                      <ZoomIn size={16} /> Perbesar Foto
                    </div>
                  </div>
                </div>
              )}

              {loan.return_photo && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">Saat Pengembalian</span>
                    <span className="text-[11px] text-slate-400">Kamera Kiosk/Petugas</span>
                  </div>
                  <div
                    onClick={() => setPreviewImage({ url: loan.return_photo!, label: 'Foto Saat Pengembalian' })}
                    className="relative group cursor-pointer overflow-hidden rounded-lg bg-slate-100 aspect-video flex items-center justify-center border border-slate-200"
                  >
                    <img
                      src={loan.return_photo}
                      alt="Foto Saat Pengembalian"
                      className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.removeAttribute('style')
                      }}
                    />
                    <div style={{ display: 'none' }} className="flex flex-col items-center justify-center p-4 text-center text-slate-400">
                      <Camera size={28} className="mb-1 text-slate-300" />
                      <p className="text-xs">Foto tidak dapat dimuat</p>
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium">
                      <ZoomIn size={16} /> Perbesar Foto
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Modal Preview Foto */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/90">
              <span className="text-sm font-semibold text-slate-200">{previewImage.label}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black/50 overflow-auto max-h-[80vh]">
              <img
                src={previewImage.url}
                alt={previewImage.label}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
