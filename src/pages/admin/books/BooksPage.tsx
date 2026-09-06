import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { bookService } from '@/api/book.service'
import { Card, CardHeader, CardBody, EmptyState } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { BookStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/utils'
import { BookOpen, Plus, Search, Filter, Trash2, Edit } from 'lucide-react'
import { getErrorMessage } from '@/api/client'

export function AdminBooksPage() {
  const qc = useQueryClient()
  const [q,          setQ]          = useState('')
  const [status,     setStatus]     = useState('')
  const [kategoriId, setKategoriId] = useState('')
  const [page,       setPage]       = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-books', { q, status, kategoriId, page }],
    queryFn: () => bookService.list({ q, status, kategori_id: kategoriId ? +kategoriId : undefined, page }),
  })

  const { data: categories } = useQuery({
    queryKey: ['book-categories'],
    queryFn: bookService.categories,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bookService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-books'] }),
  })

  const books = data?.data?.data ?? []
  const meta  = data?.data

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Buku</h1>
          <p className="text-sm text-slate-500">Kelola koleksi buku perpustakaan</p>
        </div>
        <Link to="/admin/books/create">
          <Button><Plus size={16} /> Tambah Buku</Button>
        </Link>
      </div>

      {/* Filter bar */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48">
              <Input
                placeholder="Cari judul, penulis, ISBN..."
                leftIcon={<Search size={15} />}
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1) }}
              />
            </div>
            <select
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
              <option value="archived">Diarsipkan</option>
            </select>
            <select
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={kategoriId}
              onChange={(e) => { setKategoriId(e.target.value); setPage(1) }}
            >
              <option value="">Semua Kategori</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.nama}</option>
              ))}
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <CardBody><div className="h-40 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" /></div></CardBody>
        ) : books.length === 0 ? (
          <CardBody>
            <EmptyState icon={<BookOpen size={48} />} title="Belum ada buku" description="Tambah buku pertama untuk memulai." />
          </CardBody>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left">Buku</th>
                    <th className="px-6 py-3 text-left">Kode</th>
                    <th className="px-6 py-3 text-left">Kategori</th>
                    <th className="px-6 py-3 text-center">Stok</th>
                    <th className="px-6 py-3 text-left">Harga</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {book.cover ? (
                            <img src={book.cover} alt={book.judul} className="w-10 h-12 object-cover rounded shadow-sm flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-12 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                              <BookOpen size={16} className="text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link to={`/admin/books/${book.id}`} className="font-medium text-slate-900 hover:text-primary-600 line-clamp-1">{book.judul}</Link>
                            <p className="text-xs text-slate-400 truncate">{book.penulis}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{book.kode_buku}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{book.kategori?.nama ?? '—'}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-xs space-y-0.5">
                          <div className="font-semibold text-slate-900">{book.jumlah_tersedia}<span className="text-slate-400">/{book.jumlah_total}</span></div>
                          {book.jumlah_dipinjam > 0 && <div className="text-blue-600">{book.jumlah_dipinjam} dipinjam</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatCurrency(book.harga)}</td>
                      <td className="px-6 py-4"><BookStatusBadge status={book.status} label={book.status_label} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Link to={`/admin/books/${book.id}/edit`}>
                            <Button size="sm" variant="ghost"><Edit size={14} /></Button>
                          </Link>
                          <Button
                            size="sm" variant="ghost"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => { if (confirm('Arsipkan buku ini?')) deleteMutation.mutate(book.id) }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Menampilkan {meta.from}–{meta.to} dari {meta.total} buku
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
                  <Button size="sm" variant="outline" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Berikutnya</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
