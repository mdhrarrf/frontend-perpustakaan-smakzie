import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookService } from '@/api/book.service'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Save, Calendar, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import { getErrorMessage } from '@/api/client'
import { DDC_CATALOG, searchDdc, detectDdcFromTitle, type DdcItem } from '@/utils/ddc'

interface BookFormData {
  judul: string
  penulis: string
  edisi: string
  penerbit: string
  kota_terbit: string
  tahun_terbit: string
  isbn: string
  topik: string
  sinopsis: string
  kategori_id: string
  klasifikasi: string
  call_number: string
  lokasi_rak: string
  jumlah_total: string
  sumber_pengadaan: string
  harga: string
  status: string
}

interface YearPickerProps {
  value?: string
  onChange: (year: string) => void
  label?: string
}

function YearPicker({ value, onChange, label = 'Tahun Terbit' }: YearPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentYear = new Date().getFullYear()
  
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
    <div className="flex flex-col gap-1.5 relative" ref={popoverRef}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full h-10 px-3 py-2 text-sm border border-slate-200 bg-white rounded-lg transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-left"
      >
        <span className={value ? "text-slate-900 font-medium" : "text-slate-400"}>
          {value ? `Tahun ${value}` : "Pilih Tahun Terbit..."}
        </span>
        <Calendar size={16} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 top-full left-0 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3 space-y-3">
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
              const isFuture = year > currentYear
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

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}

function SelectField({ label, required, hint, children, className = '', ...props }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        className={`w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${className}`}
        {...props}
      >
        {children}
      </select>
      {hint && <span className="text-[11px] text-slate-500 pt-0.5">{hint}</span>}
    </div>
  )
}

interface EksemplarInputProps {
  value: string | number
  onChange: (val: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  required?: boolean
  label?: string
}

function EksemplarInput({
  value,
  onChange,
  onKeyDown,
  required = true,
  label = 'Jumlah Eksemplar',
}: EksemplarInputProps) {
  const numValue = Math.max(1, parseInt(String(value) || '1', 10) || 1)

  const handleStep = (delta: number) => {
    const next = Math.max(1, numValue + delta)
    onChange(String(next))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '')
    onChange(cleaned)
  }

  const handleBlur = () => {
    if (!value || parseInt(String(value), 10) < 1) {
      onChange('1')
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="jumlah_total_input" className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div className="flex items-center h-10 w-full rounded-lg border border-slate-200 bg-white shadow-xs transition-colors focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 overflow-hidden">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => handleStep(-1)}
          disabled={numValue <= 1}
          className="w-10 h-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-25 disabled:cursor-not-allowed border-r border-slate-200 transition-colors select-none"
          title="Kurangi 1"
        >
          <Minus size={15} />
        </button>

        <input
          id="jumlah_total_input"
          type="text"
          inputMode="numeric"
          value={value ?? '1'}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={onKeyDown}
          placeholder="1"
          className="flex-1 h-full text-center font-semibold text-slate-900 bg-transparent text-sm focus:outline-none px-2"
          required={required}
        />

        <button
          type="button"
          tabIndex={-1}
          onClick={() => handleStep(1)}
          className="w-10 h-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:bg-slate-100 border-l border-slate-200 transition-colors select-none"
          title="Tambah 1"
        >
          <Plus size={15} />
        </button>

        <span className="px-3 h-full flex items-center bg-slate-50 border-l border-slate-200 text-xs font-medium text-slate-600 select-none">
          Eksemplar
        </span>
      </div>
    </div>
  )
}

interface DdcInputProps {
  value: string
  onChange: (val: string) => void
}

function DdcInput({ value, onChange }: DdcInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const query = isOpen ? searchTerm : (value || '')
  const suggestions = useMemo(() => searchDdc(query, 7), [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (item: DdcItem) => {
    onChange(item.code)
    setSearchTerm('')
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange(val)
    setSearchTerm(val)
    if (!isOpen) setIsOpen(true)
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5 relative">
      <label htmlFor="klasifikasi_ddc_input" className="text-sm font-medium text-slate-700">
        Klasifikasi DDC
      </label>

      <div className="relative">
        <input
          id="klasifikasi_ddc_input"
          type="text"
          value={value ?? ''}
          onChange={handleInputChange}
          onFocus={() => {
            setSearchTerm(value || '')
            setIsOpen(true)
          }}
          placeholder="Contoh: 005.13, 813, 629.2"
          className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder:text-slate-400"
        />

        {isOpen && suggestions.length > 0 && (
          <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            <div className="divide-y divide-slate-100">
              {suggestions.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                >
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    <span className="font-semibold text-xs text-primary-700 shrink-0">
                      {item.code}
                    </span>
                    <span className="text-xs text-slate-700 truncate">
                      {item.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function computeLiveCallNumber(judul?: string, penulis?: string, klasifikasi?: string): string {
  const hasJudul = !!judul?.trim()
  const hasPenulis = !!penulis?.trim()
  const hasKlasifikasi = !!klasifikasi?.trim()

  // Jika form belum diisi data yang diperlukan, biarkan kosong tanpa menampilkan 000 XXX x
  if (!hasJudul && !hasPenulis && !hasKlasifikasi) {
    return ''
  }

  let classNum = ''
  if (hasKlasifikasi) {
    const parts = (klasifikasi ?? '').trim().split(/\s+/)
    classNum = parts[0]
  } else if (hasJudul) {
    const t = (judul ?? '').toLowerCase()
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
    else classNum = '000'
  } else {
    classNum = '000'
  }

  let authorCutter = ''
  if (hasPenulis) {
    const firstAuthor = (penulis ?? '').split(/[,&]|(\s+dan\s+)/i)[0]
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

  let titleCutter = ''
  if (hasJudul) {
    const cleanTitle = (judul ?? '').replace(/^[^a-zA-Z]+/, '')
    if (cleanTitle.length > 0) {
      titleCutter = cleanTitle.charAt(0).toLowerCase()
    }
  }

  if (!authorCutter && !titleCutter) {
    return classNum && classNum !== '000' ? classNum : ''
  }

  return `${classNum || '000'} ${authorCutter || 'XXX'} ${titleCutter || 'x'}`.trim()
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

  const { register, handleSubmit, reset, setValue, watch } = useForm<BookFormData>({
    defaultValues: {
      status: 'active',
      sumber_pengadaan: '1',
      jumlah_total: '1',
    }
  })

  const watchJudul       = watch('judul')
  const watchPenulis     = watch('penulis')
  const watchKlasifikasi = watch('klasifikasi')
  const watchJumlahTotal = watch('jumlah_total')
  const liveCallNumber   = computeLiveCallNumber(watchJudul, watchPenulis, watchKlasifikasi)
  const detectedDdc      = useMemo(() => detectDdcFromTitle(watchJudul), [watchJudul])
  const prevDetectedRef  = useRef<string | null>(null)

  useEffect(() => {
    register('klasifikasi')
    register('jumlah_total', { required: true })
  }, [register])

  useEffect(() => {
    if (detectedDdc && detectedDdc.code !== prevDetectedRef.current) {
      const prev = prevDetectedRef.current
      prevDetectedRef.current = detectedDdc.code
      if (!watchKlasifikasi || watchKlasifikasi === prev) {
        setValue('klasifikasi', detectedDdc.code, { shouldValidate: true, shouldDirty: true })
      }
    }
  }, [detectedDdc, watchKlasifikasi, setValue])

  useEffect(() => {
    if (!isEdit && liveCallNumber) {
      setValue('call_number', liveCallNumber)
    }
  }, [liveCallNumber, isEdit, setValue])

  const [displayHarga, setDisplayHarga] = useState<string>('')
  const [rawHarga, setRawHarga]         = useState<string>('')
  const [displayIsbn, setDisplayIsbn]   = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')

  // Master suggestion data dari SLiMS
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

  const { data: placesList } = useQuery({
    queryKey: ['book-places-suggestions'],
    queryFn: () => bookService.places(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: topicsList } = useQuery({
    queryKey: ['book-topics-suggestions'],
    queryFn: () => bookService.topics(),
    staleTime: 5 * 60 * 1000,
  })

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
        judul:            book.judul,
        penulis:          book.penulis,
        edisi:            book.edisi ?? '',
        penerbit:         book.penerbit ?? '',
        kota_terbit:      book.kota_terbit ?? '',
        tahun_terbit:     yr,
        isbn:             formattedIsbn,
        topik:            book.topik ?? '',
        sinopsis:         book.sinopsis ?? '',
        kategori_id:      book.kategori_id?.toString() ?? '',
        klasifikasi:      book.klasifikasi ?? '',
        call_number:      book.call_number ?? liveCallNumber,
        lokasi_rak:       book.lokasi_rak ?? '',
        jumlah_total:     book.jumlah_total ? book.jumlah_total.toString() : '1',
        sumber_pengadaan: book.sumber_pengadaan ? String(book.sumber_pengadaan) : '1',
        harga:            hrg,
        status:           book.status ?? 'active',
      })
      if (book.cover) setCoverPreview(book.cover)
    }
  }, [book, reset])

  const saveMutation = useMutation({
    mutationFn: (data: BookFormData) => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
      if (rawHarga) fd.set('harga', rawHarga)
      if (displayIsbn) fd.set('isbn', displayIsbn)
      const finalKlasifikasi = data.klasifikasi || watchKlasifikasi || ''
      if (finalKlasifikasi) fd.set('klasifikasi', finalKlasifikasi)
      const finalJumlah = data.jumlah_total || watchJumlahTotal || '1'
      fd.set('jumlah_total', finalJumlah)
      const finalCallNumber = liveCallNumber || (isEdit ? (book?.call_number ?? '') : '')
      if (finalCallNumber) fd.set('call_number', finalCallNumber)
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
    <div className="max-w-3xl space-y-5 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft size={16} /></Button>
        <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Buku' : 'Tambah Buku Baru'}</h1>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-6">
        {/* Card 1: Informasi Buku */}
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Informasi Buku</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  {...register('judul', { required: true })}
                  label="Judul Buku"
                  placeholder="Contoh: Pemrograman Web Lanjut, Laskar Pelangi"
                  className="h-10"
                  required
                />
              </div>

              <div>
                <Input
                  {...register('penulis', { required: true })}
                  label="Penulis"
                  list="authors-suggestions"
                  placeholder="Contoh: Andrea Hirata, Tere Liye"
                  className="h-10"
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
                  {...register('edisi')}
                  label="Edisi / Cetakan"
                  placeholder="Contoh: Edisi Revisi, Cetakan ke-2"
                  className="h-10"
                />
              </div>

              <div>
                <Input
                  {...register('penerbit')}
                  label="Penerbit"
                  list="publishers-suggestions"
                  placeholder="Contoh: Erlangga, Gramedia Pustaka Utama"
                  className="h-10"
                />
                <datalist id="publishers-suggestions">
                  {publishersList?.map((publisher) => (
                    <option key={publisher} value={publisher} />
                  ))}
                </datalist>
              </div>

              <div>
                <Input
                  {...register('kota_terbit')}
                  label="Kota Terbit"
                  list="places-suggestions"
                  placeholder="Contoh: Jakarta, Bandung, Cianjur"
                  className="h-10"
                />
                <datalist id="places-suggestions">
                  {placesList?.map((place) => (
                    <option key={place} value={place} />
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
                className="h-10"
              />

              <div className="md:col-span-2">
                <Input
                  {...register('topik')}
                  label="Subjek / Topik Katalog"
                  list="topics-suggestions"
                  placeholder="Contoh: Pemrograman Web, Teknik Kendaraan Ringan, Novel Fiksi"
                  className="h-10"
                />
                <datalist id="topics-suggestions">
                  {topicsList?.map((topic) => (
                    <option key={topic} value={topic} />
                  ))}
                </datalist>
              </div>

              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Sinopsis / Ringkasan</label>
                <textarea
                  {...register('sinopsis')}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none placeholder:text-slate-400"
                  placeholder="Contoh: Buku ini membahas konsep dasar kejuruan, logika terstruktur, serta contoh studi kasus nyata untuk siswa..."
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Card 2: Klasifikasi & Stok Inventaris */}
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Klasifikasi & Inventaris SLiMS</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <SelectField
                label="Kategori Koleksi"
                required
                {...register('kategori_id', { required: true })}
              >
                <option value="">— Pilih Kategori Koleksi —</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama}
                  </option>
                ))}
              </SelectField>

              <DdcInput
                value={watchKlasifikasi ?? ''}
                onChange={(val) => setValue('klasifikasi', val, { shouldValidate: true, shouldDirty: true })}
              />

              <Input
                {...register('lokasi_rak')}
                label="Lokasi Rak Fisik"
                placeholder="Contoh: RAK-A-01, Lemari 2"
                className="h-10"
              />

              <SelectField
                label="Status Buku"
                {...register('status')}
              >
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
                <option value="archived">Diarsipkan</option>
              </SelectField>

              <EksemplarInput
                value={watchJumlahTotal ?? '1'}
                onChange={(val) => setValue('jumlah_total', val, { shouldValidate: true, shouldDirty: true })}
                onKeyDown={allowOnlyNumbers}
                required
              />

              <SelectField
                label="Sumber Pengadaan"
                {...register('sumber_pengadaan')}
              >
                <option value="1">Dana BOS / Pembelian</option>
                <option value="2">Hadiah / Hibah</option>
                <option value="3">Bantuan Pemerintah / Diknas</option>
              </SelectField>

              <div className="md:col-span-2">
                <Input
                  label="Harga Buku (Rp)"
                  placeholder="Contoh: 75.000"
                  value={displayHarga}
                  onChange={handleHargaChange}
                  onKeyDown={allowOnlyNumbers}
                  leftIcon={<span className="text-xs font-bold text-slate-500">Rp</span>}
                  className="h-10"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Card 3: Cover Buku */}
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

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Batal</Button>
          <Button type="submit" loading={saveMutation.isPending}>
            <Save size={16} /> {isEdit ? 'Simpan Perubahan' : 'Tambah Buku'}
          </Button>
        </div>
      </form>
    </div>
  )
}
