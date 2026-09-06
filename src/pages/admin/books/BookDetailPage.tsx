import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { bookService } from '@/api/book.service'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BookStatusBadge, LoanStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, formatDateTime } from '@/utils'
import { ArrowLeft, Edit, BookOpen, QrCode } from 'lucide-react'

export function AdminBookDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: book, isLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: () => bookService.get(Number(id)),
    enabled: !!id,
  })

  if (isLoading) return <div className="flex items-center justify-center h-60"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>
  if (!book) return <div className="text-center py-20 text-slate-400">Buku tidak ditemukan.</div>

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft size={16} /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{book.judul}</h1>
          <p className="text-sm text-slate-500">{book.kode_buku}</p>
        </div>
        <Link to={`/admin/books/${id}/edit`}><Button size="sm"><Edit size={14} /> Edit</Button></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Cover & QR */}
        <Card>
          <CardBody className="flex flex-col items-center gap-4">
            {book.cover ? (
              <img src={book.cover} alt={book.judul} className="w-40 h-52 object-cover rounded-lg shadow" />
            ) : (
              <div className="w-40 h-52 bg-slate-100 rounded-lg flex items-center justify-center">
                <BookOpen size={40} className="text-slate-300" />
              </div>
            )}
            <div className="w-full text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Kode Buku</p>
              <p className="font-mono font-bold text-slate-800">{book.kode_buku}</p>
            </div>
          </CardBody>
        </Card>

        {/* Detail */}
        <Card className="lg:col-span-2">
          <CardHeader><h2 className="font-semibold text-slate-800">Informasi Buku</h2></CardHeader>
          <CardBody>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {[
                { label: 'Judul',       value: book.judul },
                { label: 'Penulis',     value: book.penulis },
                { label: 'Penerbit',    value: book.penerbit ?? '—' },
                { label: 'Tahun Terbit', value: book.tahun_terbit ?? '—' },
                { label: 'ISBN',        value: book.isbn ?? '—' },
                { label: 'Kategori',    value: book.kategori?.nama ?? '—' },
                { label: 'Lokasi Rak',  value: book.lokasi_rak ?? '—' },
                { label: 'Harga Buku',  value: formatCurrency(book.harga) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-medium text-slate-900 mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>

            {book.sinopsis && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <dt className="text-xs text-slate-500 mb-1">Sinopsis</dt>
                <p className="text-sm text-slate-700 leading-relaxed">{book.sinopsis}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Stock Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Eksemplar',  value: book.jumlah_total,    color: 'text-slate-800' },
          { label: 'Tersedia',         value: book.jumlah_tersedia, color: 'text-green-600' },
          { label: 'Sedang Dipinjam',  value: book.jumlah_dipinjam, color: 'text-blue-600' },
          { label: 'Hilang',           value: book.jumlah_hilang,   color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
