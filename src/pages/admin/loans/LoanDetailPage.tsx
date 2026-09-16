import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { loanService } from '@/api/loan.service'
import { bookService } from '@/api/book.service'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoanStatusBadge, ViolationStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, formatDateTime } from '@/utils'
import { ArrowLeft, RotateCcw, PackageX, Camera, ZoomIn, X, Pencil, Search, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'

function isPlaceholder(title?: string) {
  return typeof title === 'string' && title.startsWith('Buku [')
}

// ─── Modal Koreksi Buku ───────────────────────────────────────────────────────
function FixBookModal({
  loanId,
  currentTitle,
  onClose,
  onSuccess,
}: {
  loanId: number
  currentTitle: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [mode, setMode] = useState<'slims' | 'manual'>('slims')
  const [search, setSearch] = useState('')
  const [selectedBiblioId, setSelectedBiblioId] = useState<number | null>(null)
  const [selectedTitle, setSelectedTitle] = useState('')
  const [manualTitle, setManualTitle] = useState('')
  const [manualAuthor, setManualAuthor] = useState('')
  const [fixError, setFixError] = useState<string | null>(null)

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['slims-search-fix', search],
    queryFn: () => bookService.list({ q: search, per_page: 10 }),
    enabled: search.length >= 2 && mode === 'slims',
  })

  const books = (searchResults?.data as any)?.data ?? []

  const fixMutation = useMutation({
    mutationFn: () => {
      if (mode === 'slims' && selectedBiblioId) {
        return loanService.fixBook(loanId, { slims_biblio_id: selectedBiblioId })
      }
      if (mode === 'manual' && manualTitle.trim()) {
        return loanService.fixBook(loanId, {
          book_title_snapshot: manualTitle.trim(),
          book_author_snapshot: manualAuthor.trim() || undefined,
        })
      }
      return Promise.reject(new Error('Pilih buku atau masukkan judul'))
    },
    onSuccess: () => { onSuccess(); onClose() },
    onError: (err) => setFixError(getErrorMessage(err)),
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Koreksi Judul Buku</h2>
            <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
              <AlertTriangle size={11} />
              Data saat ini: <span className="font-mono ml-1">{currentTitle}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-100">
          {(['slims', 'manual'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMode(tab)}
              className={`flex-1 py-3 text-sm font-medium transition border-b-2 ${
                mode === tab
                  ? 'border-primary-500 text-primary-600 bg-primary-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab === 'slims' ? 'Cari di Katalog SLiMS' : 'Input Judul Manual'}
            </button>
          ))}
        </div>

        <div className="px-6 py-5 space-y-4">
          {mode === 'slims' ? (
            <>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="Ketik judul buku..."
                  value={search}
                  autoFocus
                  onChange={(e) => { setSearch(e.target.value); setSelectedBiblioId(null); setSelectedTitle('') }}
                />
              </div>

              {isSearching && <div className="text-center py-3 text-sm text-slate-400">Mencari...</div>}

              {!isSearching && books.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-auto max-h-52 divide-y divide-slate-100">
                  {books.map((book: any) => (
                    <button
                      key={book.id}
                      onClick={() => { setSelectedBiblioId(book.id); setSelectedTitle(book.judul) }}
                      className={`w-full text-left px-4 py-3 text-sm transition hover:bg-primary-50 ${
                        selectedBiblioId === book.id ? 'bg-primary-50 border-l-2 border-primary-500' : ''
                      }`}
                    >
                      <p className="font-medium text-slate-900 line-clamp-1">{book.judul}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{book.penulis} · ID SLiMS: {book.id}</p>
                    </button>
                  ))}
                </div>
              )}

              {!isSearching && search.length >= 2 && books.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-3">Tidak ada buku ditemukan. Coba tab "Input Manual".</p>
              )}

              {selectedBiblioId && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-800">
                  <CheckCircle2 size={14} className="text-primary-600 shrink-0" />
                  <span className="font-medium line-clamp-1">{selectedTitle}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Judul Buku <span className="text-red-500">*</span></label>
                <input
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="Masukkan judul buku yang benar..."
                  value={manualTitle}
                  autoFocus
                  onChange={(e) => setManualTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Penulis <span className="text-slate-400">(opsional)</span></label>
                <input
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="Nama penulis..."
                  value={manualAuthor}
                  onChange={(e) => setManualAuthor(e.target.value)}
                />
              </div>
            </>
          )}

          {fixError && (
            <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{fixError}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-2 justify-end border-t border-slate-100 pt-4">
          <Button variant="ghost" size="sm" onClick={onClose}>Batal</Button>
          <Button
            size="sm"
            onClick={() => fixMutation.mutate()}
            loading={fixMutation.isPending}
            disabled={
              (mode === 'slims' && !selectedBiblioId) ||
              (mode === 'manual' && !manualTitle.trim())
            }
          >
            Simpan Koreksi
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Halaman Detail Peminjaman ────────────────────────────────────────────────
export function AdminLoanDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<{ url: string; label: string } | null>(null)
  const [showFixModal, setShowFixModal] = useState(false)

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
  const placeholderItem = loan.items?.find((item: any) => isPlaceholder(item.book?.judul))
  const hasPlaceholder = !!placeholderItem

  return (
    <div className="max-w-3xl space-y-5">
      {/* Title + Actions */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft size={16} /></Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900">{loan.loan_number}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <LoanStatusBadge status={loan.status} label={loan.status_label} />
            <span className="text-xs text-slate-400">{loan.loan_type_label}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {hasPlaceholder && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFixModal(true)}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Pencil size={13} /> Koreksi Buku
            </Button>
          )}
          {canReturn && (
            <>
              <Button variant="danger" size="sm" onClick={() => { if (confirm('Tandai buku ini hilang?')) lostMutation.mutate() }} loading={lostMutation.isPending}>
                <PackageX size={14} /> Hilang
              </Button>
              <Button size="sm" onClick={() => { if (confirm('Proses pengembalian buku ini?')) returnMutation.mutate() }} loading={returnMutation.isPending}>
                <RotateCcw size={14} /> Kembalikan
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Banner peringatan placeholder */}
      {hasPlaceholder && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Judul buku belum teridentifikasi</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Barcode yang dipindai siswa tidak dikenali sistem secara otomatis. Klik <strong>Koreksi Buku</strong> untuk menetapkan judul yang benar.
            </p>
          </div>
        </div>
      )}

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
          {loan.items?.map((item: any) => (
            <div key={item.id} className="flex items-center gap-4 px-6 py-4">
              {item.book.cover && <img src={item.book.cover} alt={item.book.judul} className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0" />}
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <p className={`font-medium leading-snug ${isPlaceholder(item.book?.judul) ? 'text-amber-700' : 'text-slate-900'}`}>
                    {item.book.judul}
                  </p>
                  {isPlaceholder(item.book?.judul) && (
                    <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded mt-0.5">
                      <AlertTriangle size={9} /> Perlu Koreksi
                    </span>
                  )}
                </div>
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
                    <img src={loan.borrow_photo} alt="Foto Saat Peminjaman" className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.removeAttribute('style') }} />
                    <div style={{ display: 'none' }} className="flex flex-col items-center justify-center p-4 text-center text-slate-400">
                      <Camera size={28} className="mb-1 text-slate-300" /><p className="text-xs">Foto tidak dapat dimuat</p>
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
                    <img src={loan.return_photo} alt="Foto Saat Pengembalian" className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.removeAttribute('style') }} />
                    <div style={{ display: 'none' }} className="flex flex-col items-center justify-center p-4 text-center text-slate-400">
                      <Camera size={28} className="mb-1 text-slate-300" /><p className="text-xs">Foto tidak dapat dimuat</p>
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/90">
              <span className="text-sm font-semibold text-slate-200">{previewImage.label}</span>
              <button onClick={() => setPreviewImage(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"><X size={18} /></button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black/50 overflow-auto max-h-[80vh]">
              <img src={previewImage.url} alt={previewImage.label} className="max-w-full max-h-[75vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Modal Koreksi Buku */}
      {showFixModal && (
        <FixBookModal
          loanId={Number(id)}
          currentTitle={placeholderItem?.book?.judul ?? ''}
          onClose={() => setShowFixModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['loan', id] })
            qc.invalidateQueries({ queryKey: ['admin-loans'] })
            setSuccess('Judul buku berhasil dikoreksi.')
          }}
        />
      )}
    </div>
  )
}

