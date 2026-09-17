import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookService } from '@/api/book.service'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Save, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
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

interface YearPickerProps {
  value?: string
  onChange: (year: string) => void
  label?: string
}

function YearPicker({ value, onChange, label = 'Tahun Terbit' }: YearPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentYear = new Date().getFullYear() // Dinamis mengikuti tahun berjalan saat ini
  
  const initialYear = value ? Number(value) : currentYear
  const [decadeStart, setDecadeStart] = useState(() => Math.floor(initialYear / 12) * 12)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (value) {
      const yr = Number(value)
      if (!isNaN(yr)) {
        setDecadeStart(Math.floor(yr / 12) * 12)
      }
    }
  }, [value])

  const years = Array.from({ length: 12 }, (_, i) => decadeStart + i)

  return (
    <div className="relative" ref={popoverRef}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1.5 flex items-center justify-between w-full px-3 py-2 text-sm border border-slate-200 bg-white rounded-lg transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-left"
      >
        <span className={value ? "text-slate-900 font-medium" : "text-slate-400"}>
          {value ? `Tahun ${value}` : "Pilih Tahun Terbit..."}
        </span>
        <Calendar size={16} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDecadeStart(prev => prev - 12); }}
              className="p-1 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
              title="Dekade Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-700">
              {decadeStart} – {decadeStart + 11}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (decadeStart + 12 <= currentYear + 11) {
                  setDecadeStart(prev => prev + 12)
                }
              }}
              disabled={decadeStart + 12 > currentYear}
              className="p-1 rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Dekade Berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {years.map((year) => {
              const isSelected = String(year) === value
              const isFuture = year > currentYear // Tidak bisa memilih tahun masa depan!
              return (
                <button
                  key={year}
                  type="button"
                  disabled={isFuture}
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange(String(year))
                    setIsOpen(false)
                  }}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors ${
                    isSelected
                      ? "bg-primary-600 text-white shadow-sm"
                      : isFuture
                      ? "text-slate-300 cursor-not-allowed bg-slate-50/50"
                      : "text-slate-700 hover:bg-slate-100 hover:text-primary-600"
                  }`}
                >
                  {year}
                </button>
              )
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(String(currentYear))
                setDecadeStart(Math.floor(currentYear / 12) * 12)
                setIsOpen(false)
              }}
              className="text-primary-600 hover:underline font-medium"
            >
              Tahun Ini ({currentYear})
            </button>
            {value && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange('')
                  setIsOpen(false)
                }}
                className="text-slate-400 hover:text-red-500 font-medium"
              >
                Hapus
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function computeLiveCallNumber(judul?: string, penulis?: string, lokasi?: string): string {
  let classNum = '000'
  if (lokasi && lokasi.trim()) {
    const parts = lokasi.trim().split(/\s+/)
    classNum = parts[0]
  } else if (judul) {
    const t = judul.toLowerCase()
    if (/(bahasa jepang|jlpt|nihongo)/i.test(t)) classNum = '495.6'
    else if (/(bahasa inggris|english|splash smart)/i.test(t)) classNum = '420'
    else if (/(basa sunda|bahasa sunda|panggelar)/i.test(t)) classNum = '499.2232'
    else if (/(bahasa indonesia|cerdas cergas|bersastra indonesia)/i.test(t)) classNum = '410'
    else if (/(matematika|kalkulus|aljabar|tka matematika)/i.test(t)) classNum = '510'
    else if (/(fisika)/i.test(t)) classNum = '530'
    else if (/(kimia)/i.test(t)) classNum = '660'
    else if (/(biologi|ipa|ilmu pengetahuan alam)/i.test(t)) classNum = '500'
    else if (/(pancasila|kewarganegaraan|ppkn)/i.test(t)) classNum = '320'
    else if (/(agama islam|pendidikan agama|budi pekerti|allah|tuhan)/i.test(t)) classNum = '297'
    else if (/(sejarah)/i.test(t)) classNum = '959.8'
    else if (/(penduduk|demografi|sensus|supas)/i.test(t)) classNum = '312'
    else if (/(akuntansi|myob)/i.test(t)) classNum = '657'
    else if (/(pemasaran|marketing|bisnis)/i.test(t)) classNum = '658.8'
    else if (/(manajemen perkantoran|humas|kearsipan)/i.test(t)) classNum = '650'
    else if (/(ekonomi)/i.test(t)) classNum = '330'
    else if (/(jaringan|komputer|informatika|pemrograman)/i.test(t)) classNum = '004.6'
    else if (/(desain grafis|seni)/i.test(t)) classNum = '741.6'
    else if (/(psikologi|motivasi)/i.test(t)) classNum = '153.2'
    else if (/(novel|fiksi|cerpen|guru aini|matahari|bumi)/i.test(t)) classNum = '813'
  }

  let authorCutter = 'XXX'
  if (penulis && penulis.trim()) {
    const firstAuthor = penulis.split(/[,&]|(\s+dan\s+)/i)[0]
    const cleaned = firstAuthor
      .replace(/\b(drs|dra|prof|dr|ir|h|hj|s\.pd|m\.pd|s\.e|m\.m|m\.kom|m\.hum|s\.t|s\.si|m\.si|mf|dkk|et al)\b/gi, '')
      .replace(/\b(al-|el-)/gi, '')
      .replace(/[^a-zA-Z\s]/g, '')
      .trim()
    const words = cleaned.split(/\s+/).filter(Boolean)
    if (words.length > 0) {
      const target = words.length > 1 && words[words.length - 1].length >= 2 ? words[words.length - 1] : words[0]
      authorCutter = target.slice(0, 3).toUpperCase().padEnd(3, 'X')
    }
  }

  let titleCutter = 'x'
  if (judul && judul.trim()) {
    const cleanTitle = judul.replace(/^[^a-zA-Z]+/, '')
    if (cleanTitle.length > 0) {
      titleCutter = cleanTitle.charAt(0).toLowerCase()
    }
  }

  return `${classNum} ${authorCutter} ${titleCutter}`
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

  const { register, handleSubmit, reset, setValue, watch } = useForm<BookFormData>()
  const watchJudul   = watch('judul')
  const watchPenulis = watch('penulis')
  const watchLokasi  = watch('lokasi_rak')
  const liveCallNumber = computeLiveCallNumber(watchJudul, watchPenulis, watchLokasi)

  const [displayHarga, setDisplayHarga] = useState<string>('')
  const [rawHarga, setRawHarga]         = useState<string>('')
  const [displayIsbn, setDisplayIsbn]   = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')

  // Ambil history pengarang & penerbit dari master SLiMS untuk autocomplete
  const { data: authorsList } = useQuery({
    queryKey: ['book-authors-suggestions'],
    queryFn: () => bookService.authors(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: publishersList } = useQuery({
    queryKey: ['book-publishers-suggestions'],
    queryFn: () => bookService.publishers(),
    staleTime: 5 * 60 * 1000,
  })

  // List pilihan tahun terbit (tahun depan sampai 1970)
  const currentYear = new Date().getFullYear() + 1
  const yearOptions = Array.from({ length: currentYear - 1970 + 1 }, (_, i) => currentYear - i)

  function formatRupiah(value: string | number | undefined | null): string {
    if (!value) return ''
    const clean = String(value).replace(/\D/g, '')
    if (!clean) return ''
    return new Intl.NumberFormat('id-ID').format(Number(clean))
  }

  function handleHargaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const clean = e.target.value.replace(/\D/g, '')
    setRawHarga(clean)
    setDisplayHarga(clean ? formatRupiah(clean) : '')
    setValue('harga', clean)
  }

  // Format otomatis ISBN: hanya angka yang diinput, strip disisipkan otomatis (978-xxx-xxx-xxx-x)
  function formatIsbn(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 13)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
    if (digits.length <= 12) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}-${digits.slice(9)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}-${digits.slice(9, 12)}-${digits.slice(12, 13)}`
  }

  function handleIsbnChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatIsbn(e.target.value)
    setDisplayIsbn(formatted)
    setValue('isbn', formatted)
  }

  // Guard untuk mencegah ketik karakter non-angka
  function allowOnlyNumbers(e: React.KeyboardEvent<HTMLInputElement>) {
    if (
      !/[0-9]/.test(e.key) &&
      !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'Enter', 'Home', 'End'].includes(e.key) &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault()
    }
  }

  useEffect(() => {
    if (book) {
      const hrg = book.harga ? String(book.harga) : ''
      setRawHarga(hrg)
      setDisplayHarga(hrg ? formatRupiah(hrg) : '')

      const formattedIsbn = book.isbn ? formatIsbn(book.isbn) : ''
      setDisplayIsbn(formattedIsbn)

      const yr = book.tahun_terbit ? String(book.tahun_terbit) : ''
      setSelectedYear(yr)

      reset({
        judul:        book.judul,
        penulis:      book.penulis,
        penerbit:     book.penerbit ?? '',
        tahun_terbit: yr,
        isbn:         formattedIsbn,
        kategori_id:  book.kategori_id?.toString() ?? '',
        sinopsis:     book.sinopsis ?? '',
        harga:        hrg,
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
      // Pastikan harga, isbn, dan tahun terbit murni dikirim
      if (rawHarga) fd.set('harga', rawHarga)
      if (displayIsbn) fd.set('isbn', displayIsbn)
      if (selectedYear) fd.set('tahun_terbit', selectedYear)
      if (coverFile) fd.append('cover', coverFile)
      return isEdit ? bookService.update(Number(id), fd) : bookService.create(fd)
    },
    onSuccess: (book) => {
      qc.invalidateQueries({ queryKey: ['admin-books'] })
      qc.invalidateQueries({ queryKey: ['book', String(book.id)] })
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
              <Input
                {...register('judul', { required: true })}
                label="Judul Buku"
                placeholder="Contoh: Pemrograman Web Lanjut, Laskar Pelangi"
                required
                className="md:col-span-2"
              />
              <div>
                <Input
                  {...register('penulis', { required: true })}
                  label="Penulis"
                  list="authors-suggestions"
                  placeholder="Contoh: Andrea Hirata, Tere Liye, Drs. H. Ahmad"
                  required
                />
                <datalist id="authors-suggestions">
                  {authorsList?.map((author) => (
                    <option key={author} value={author} />
                  ))}
                </datalist>
              </div>
              <div>
                <Input
                  {...register('penerbit')}
                  label="Penerbit"
                  list="publishers-suggestions"
                  placeholder="Contoh: Erlangga, Gramedia Pustaka Utama, Metagraf"
                />
                <datalist id="publishers-suggestions">
                  {publishersList?.map((publisher) => (
                    <option key={publisher} value={publisher} />
                  ))}
                </datalist>
              </div>
              <YearPicker
                value={selectedYear}
                onChange={(year) => {
                  setSelectedYear(year)
                  setValue('tahun_terbit', year)
                }}
              />
              <Input
                label="ISBN"
                placeholder="Contoh: 978-602-291-000-0"
                value={displayIsbn}
                onChange={handleIsbnChange}
                onKeyDown={allowOnlyNumbers}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Sinopsis</label>
              <textarea
                {...register('sinopsis')}
                rows={4}
                className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none placeholder:text-slate-400"
                placeholder="Contoh: Buku ini membahas konsep dasar kejuruan, logika terstruktur, serta contoh studi kasus nyata untuk siswa..."
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
                  <option value="">— Pilih Kategori (Contoh: Reference, Mapel, Fiction) —</option>
                  {categories?.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
                </select>
              </div>
              <Input
                {...register('lokasi_rak')}
                label="Klasifikasi DDC / Lokasi Rak"
                placeholder="Contoh: 813, 153.2, 420, atau RAK-A-01"
              />

              {/* Live Preview Nomor Panggil */}
              <div className="col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Nomor Panggil SLiMS (Call Number)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Format: [Klasifikasi DDC] [3 Huruf Pengarang] [1 Huruf Judul]</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Otomatis dicetak:</span>
                  <span className="font-mono text-sm font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm text-primary-700 tracking-wide">
                    {liveCallNumber}
                  </span>
                </div>
              </div>

              <Input
                {...register('jumlah_total', { required: true })}
                label="Jumlah Eksemplar"
                placeholder="Contoh: 5"
                onKeyDown={allowOnlyNumbers}
                required
              />
              <Input
                label="Harga Buku (Rp)"
                placeholder="Contoh: 75.000"
                value={displayHarga}
                onChange={handleHargaChange}
                onKeyDown={allowOnlyNumbers}
                leftIcon={<span className="text-xs font-bold text-slate-500">Rp</span>}
              />
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
                <p className="text-xs text-slate-400 mt-1">Maks 2MB. Format: JPG, PNG, WebP (Tersinkron otomatis ke SLiMS)</p>
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
