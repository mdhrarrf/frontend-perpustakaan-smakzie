import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookService } from '@/api/book.service'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Save } from 'lucide-react'
import { getErrorMessage } from '@/api/client'

interface BookFormData {
  judul: string
  penulis: string
  penerbit: string
  tahun_terbit: string
  isbn: string
  kategori_id: string
  sinopsis: string
  harga: string
  jumlah_total: string
  lokasi_rak: string
  status: string
}

export function AdminBookForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit   = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [error, setError]               = useState<string | null>(null)
  const [coverFile, setCoverFile]       = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const { data: book } = useQuery({
    queryKey: ['book', id],
    queryFn: () => bookService.get(Number(id)),
    enabled: isEdit,
  })

  const { data: categories } = useQuery({
    queryKey: ['book-categories'],
    queryFn: bookService.categories,
  })

  const { register, handleSubmit, reset } = useForm<BookFormData>()

  useEffect(() => {
    if (book) {
      reset({
        judul:        book.judul,
        penulis:      book.penulis,
        penerbit:     book.penerbit ?? '',
        tahun_terbit: book.tahun_terbit?.toString() ?? '',
        isbn:         book.isbn ?? '',
        kategori_id:  book.kategori_id?.toString() ?? '',
        sinopsis:     book.sinopsis ?? '',
        harga:        book.harga?.toString() ?? '',
        jumlah_total: book.jumlah_total.toString(),
        lokasi_rak:   book.lokasi_rak ?? '',
        status:       book.status ?? 'active',
      })
      if (book.cover) setCoverPreview(book.cover)
    }
  }, [book, reset])

  const saveMutation = useMutation({
    mutationFn: (data: BookFormData) => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
      if (coverFile) fd.append('cover', coverFile)
      return isEdit ? bookService.update(Number(id), fd) : bookService.create(fd)
    },
    onSuccess: (book) => {
      qc.invalidateQueries({ queryKey: ['admin-books'] })
      navigate(`/admin/books/${book.id}`)
    },
    onError: (err: unknown) => setError(getErrorMessage(err)),
  })

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft size={16} /></Button>
        <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Buku' : 'Tambah Buku Baru'}</h1>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-5">
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Informasi Buku</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input {...register('judul', { required: true })} label="Judul Buku" required className="md:col-span-2" />
              <Input {...register('penulis', { required: true })} label="Penulis" required />
              <Input {...register('penerbit')} label="Penerbit" />
              <Input {...register('tahun_terbit')} label="Tahun Terbit" type="number" />
              <Input {...register('isbn')} label="ISBN" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Sinopsis</label>
              <textarea
                {...register('sinopsis')}
                rows={4}
                className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Ringkasan isi buku..."
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Klasifikasi & Stok</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Kategori</label>
                <select {...register('kategori_id')} className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">— Tanpa Kategori —</option>
                  {categories?.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
                </select>
              </div>
              <Input {...register('lokasi_rak')} label="Lokasi Rak" placeholder="RAK-A-01" />
              <Input {...register('jumlah_total', { required: true })} label="Jumlah Eksemplar" type="number" required />
              <Input {...register('harga')} label="Harga Buku (Rp)" type="number" hint="Untuk referensi kompensasi buku hilang" />
              <div>
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select {...register('status')} className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                  <option value="archived">Diarsipkan</option>
                </select>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Cover Buku</h2></CardHeader>
          <CardBody>
            <div className="flex items-start gap-4">
              {coverPreview && (
                <img src={coverPreview} alt="Preview" className="w-24 h-32 object-cover rounded-lg shadow" />
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)) }
                  }}
                  className="text-sm text-slate-500"
                />
                <p className="text-xs text-slate-400 mt-1">Maks 2MB. Format: JPG, PNG, WebP</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Batal</Button>
          <Button type="submit" loading={saveMutation.isPending}>
            <Save size={16} /> {isEdit ? 'Simpan Perubahan' : 'Tambah Buku'}
          </Button>
        </div>
      </form>
    </div>
  )
}
