import React, { useState, useEffect } from 'react'
import {
  Printer,
  FileText,
  Users,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  Eye,
  List,
  SlidersHorizontal,
  Check,
  RotateCcw,
  Calendar,
} from 'lucide-react'
import {
  reportService,
  type Visitor,
  type VisitorStats,
  type TextbookLoanForm,
  type ReportSettings,
} from '@/api/report.service'
import { VisitorSheetPrint } from '@/components/reports/VisitorSheetPrint'
import { TextbookLoanFormPrint } from '@/components/reports/TextbookLoanFormPrint'
import { Card, CardHeader, CardBody, StatCard, EmptyState } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// ── Reusable Select ───────────────────────────────────────────────────────────
function SelectFilter({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  )
}

// ── Constants & Helpers ───────────────────────────────────────────────────────
const MONTHS = [
  { v: 1,  l: 'Januari' },  { v: 2,  l: 'Februari' }, { v: 3,  l: 'Maret' },
  { v: 4,  l: 'April' },    { v: 5,  l: 'Mei' },       { v: 6,  l: 'Juni' },
  { v: 7,  l: 'Juli' },     { v: 8,  l: 'Agustus' },   { v: 9,  l: 'September' },
  { v: 10, l: 'Oktober' },  { v: 11, l: 'November' },  { v: 12, l: 'Desember' },
]

export function getWeekOfMonth(date: Date): number {
  return Math.min(5, Math.ceil(date.getDate() / 7))
}

export function getWeeksForMonth(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const mName = MONTHS[month - 1]?.l || ''
  const romans = ['', 'I', 'II', 'III', 'IV', 'V']
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month
  const currentWeek = isCurrentMonth ? getWeekOfMonth(today) : null

  const list = []
  for (let w = 1; w <= 5; w++) {
    const startDay = (w - 1) * 7 + 1
    if (startDay > daysInMonth) break
    const endDay = Math.min(daysInMonth, w * 7)
    const isThisWeek = w === currentWeek

    list.push({
      value: String(w),
      roman: romans[w],
      label: `Minggu ${romans[w]} (${startDay} - ${endDay} ${mName})${isThisWeek ? ' • Minggu Ini' : ''}`,
      startDay,
      endDay,
      isThisWeek,
    })
  }

  return { list, daysInMonth, mName }
}

export const DEFAULT_SETTINGS: ReportSettings = {
  kepala_nama: 'RUBAETUL ADAWIYAH, S.Pd.',
  kepala_nip: 'NIP. 19800424 201407 2 003',
  koordinator_nama: 'ROSSY RAKHMATU’LAILA, SH.',
  koordinator_nip: 'NIP. 19830121 202521 2 054',
  titimangsa_mode: 'blank',
  titimangsa_custom: 'Cianjur, _________________ 20___',
  school_year: '2026 / 2027',
  print_blank: false,
}

function computeDateCity(st: ReportSettings): string {
  if (st.titimangsa_mode === 'blank') {
    return 'Cianjur, _________________ 20___'
  }
  if (st.titimangsa_mode === 'today') {
    const d = new Date()
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return `Cianjur, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  }
  return st.titimangsa_custom || 'Cianjur, _________________ 20___'
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function AdminReportsPage() {
  const now = new Date()
  const [activeTab, setActiveTab] = useState<'visitors' | 'textbook'>('visitors')

  // ── Settings State (Signatories & Print format) ───────────────────────────
  const [settings, setSettings] = useState<ReportSettings>(() => {
    try {
      const saved = localStorage.getItem('smakzie_perpustakaan_report_settings')
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    } catch {}
    return DEFAULT_SETTINGS
  })
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [savingSettings,    setSavingSettings]    = useState(false)
  const [settingsForm,      setSettingsForm]      = useState<ReportSettings>(DEFAULT_SETTINGS)
  const [settingsToast,     setSettingsToast]     = useState(false)
  const [isPrintBlank,      setIsPrintBlank]      = useState(false)

  // ── Tab 1 State ──────────────────────────────────────────────────────────
  const initialYear = now.getFullYear()
  const initialMonth = now.getMonth() + 1
  const initialWeek = String(getWeekOfMonth(now)) // Otomatis pilih minggu aktif hari ini
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const [filterMode,  setFilterMode]  = useState<'today' | 'week' | 'month' | 'date'>('today')
  const [year,        setYear]        = useState(initialYear)
  const [month,       setMonth]       = useState(initialMonth)
  const [week,        setWeek]        = useState(initialWeek) // '1'..'5' or 'all'
  const [monthInput,  setMonthInput]  = useState(`${initialYear}-${String(initialMonth).padStart(2, '0')}`)
  const [dateInput,   setDateInput]   = useState(todayDateStr)
  const [keperluan,   setKeperluan]   = useState('')
  const [searchQ,     setSearchQ]     = useState('')
  const [viewMode,    setViewMode]    = useState<'preview' | 'table'>('preview')
  const [visitors,    setVisitors]    = useState<Visitor[]>([])
  const [stats,       setStats]       = useState<VisitorStats>({ total: 0, baca: 0, pinjam: 0, kembali: 0 })
  const [loadingV,    setLoadingV]    = useState(false)

  // Modal
  const [modalOpen,   setModalOpen]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [modalError,  setModalError]  = useState('')
  const [modalForm,   setModalForm]   = useState({
    nama: '', nis: '', kelas: '',
    keperluan: 'baca' as 'baca' | 'pinjam' | 'kembali',
    visited_at: new Date().toISOString().slice(0, 16),
    notes: '',
  })

  // ── Tab 2 State ──────────────────────────────────────────────────────────
  const [loans,         setLoans]         = useState<TextbookLoanForm[]>([])
  const [selectedLoan,  setSelectedLoan]  = useState<TextbookLoanForm | null>(null)
  const [loanQ,         setLoanQ]         = useState('')
  const [loadingL,      setLoadingL]      = useState(false)
  const [copies,        setCopies]        = useState(1)
  const [schoolYear,    setSchoolYear]    = useState(settings.school_year || '2026 / 2027')

  // ── Date & Period Handlers ────────────────────────────────────────────────
  const handleMonthInputChange = (val: string) => {
    setMonthInput(val)
    if (!val) return
    const [y, m] = val.split('-').map(Number)
    if (y && m) {
      setYear(y)
      setMonth(m)
      const today = new Date()
      if (today.getFullYear() === y && (today.getMonth() + 1) === m) {
        setWeek(String(getWeekOfMonth(today)))
      } else {
        setWeek('1')
      }
    }
  }

  const handleDateInputChange = (val: string) => {
    setDateInput(val)
    if (!val) return
    const [y, m, d] = val.split('-').map(Number)
    if (y && m && d) {
      const dt = new Date(y, m - 1, d)
      const w = String(getWeekOfMonth(dt))
      setYear(y)
      setMonth(m)
      setWeek(w)
      setMonthInput(`${y}-${String(m).padStart(2, '0')}`)
    }
  }

  const handleSetToday = () => {
    setFilterMode('today')
    const today = new Date()
    const y = today.getFullYear()
    const m = today.getMonth() + 1
    const w = String(getWeekOfMonth(today))
    setYear(y)
    setMonth(m)
    setWeek(w)
    setMonthInput(`${y}-${String(m).padStart(2, '0')}`)
    setDateInput(todayDateStr)
  }

  // ── Load Server Settings ──────────────────────────────────────────────────
  useEffect(() => {
    reportService.getSettings().then((remote) => {
      if (remote && remote.kepala_nama) {
        setSettings(remote)
        if (remote.school_year) setSchoolYear(remote.school_year)
        localStorage.setItem('smakzie_perpustakaan_report_settings', JSON.stringify(remote))
      }
    }).catch(() => {})
  }, [])

  // ── Settings Handlers ─────────────────────────────────────────────────────
  const openSettingsModal = () => {
    setSettingsForm({ ...settings })
    setSettingsModalOpen(true)
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      await reportService.saveSettings(settingsForm)
      setSettings(settingsForm)
      if (settingsForm.school_year) setSchoolYear(settingsForm.school_year)
      localStorage.setItem('smakzie_perpustakaan_report_settings', JSON.stringify(settingsForm))
      setSettingsModalOpen(false)
      setSettingsToast(true)
      setTimeout(() => setSettingsToast(false), 3000)
    } catch {
      setSettings(settingsForm)
      if (settingsForm.school_year) setSchoolYear(settingsForm.school_year)
      localStorage.setItem('smakzie_perpustakaan_report_settings', JSON.stringify(settingsForm))
      setSettingsModalOpen(false)
      setSettingsToast(true)
      setTimeout(() => setSettingsToast(false), 3000)
    } finally {
      setSavingSettings(false)
    }
  }

  const handleResetSettings = () => {
    setSettingsForm({ ...DEFAULT_SETTINGS })
  }

  // ── Data Fetchers ─────────────────────────────────────────────────────────
  const fetchVisitors = async () => {
    setLoadingV(true)
    try {
      const params: Parameters<typeof reportService.getVisitors>[0] = {
        keperluan: keperluan || undefined,
        q: searchQ || undefined,
        all: true,
      }

      if (filterMode === 'today') {
        params.date = todayDateStr
      } else if (filterMode === 'date') {
        params.date = dateInput || todayDateStr
      } else if (filterMode === 'week') {
        params.year = year
        params.month = month
        if (week && week !== 'all') {
          params.week = Number(week)
        }
      } else if (filterMode === 'month') {
        params.year = year
        params.month = month
      }

      const res = await reportService.getVisitors(params)
      const list = Array.isArray(res.visitors)
        ? res.visitors
        : (res.visitors as any).data ?? []
      setVisitors(list)
      if (res.stats) setStats(res.stats)
    } catch { /* silent */ } finally { setLoadingV(false) }
  }

  const fetchLoans = async (q = '') => {
    setLoadingL(true)
    try {
      const res = await reportService.getTextbookLoans({ q, per_page: 20 })
      const list = res.data ?? []
      setLoans(list)
      if (!selectedLoan && list.length > 0) setSelectedLoan(list[0])
    } catch { /* silent */ } finally { setLoadingL(false) }
  }

  useEffect(() => {
    if (activeTab === 'visitors') fetchVisitors()
    else fetchLoans(loanQ)
  }, [activeTab, filterMode, year, month, week, dateInput, keperluan])

  // ── Modal Submit ──────────────────────────────────────────────────────────
  const handleSaveVisitor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalForm.nama.trim()) { setModalError('Nama pengunjung wajib diisi.'); return }
    setSaving(true); setModalError('')
    try {
      await reportService.addVisitor({
        nama:       modalForm.nama.trim(),
        nis:        modalForm.nis.trim()   || undefined,
        kelas:      modalForm.kelas.trim() || undefined,
        keperluan:  modalForm.keperluan,
        visited_at: modalForm.visited_at,
        notes:      modalForm.notes.trim() || undefined,
      })
      setModalOpen(false)
      setModalForm({ nama: '', nis: '', kelas: '', keperluan: 'baca', visited_at: new Date().toISOString().slice(0, 16), notes: '' })
      fetchVisitors()
    } catch (err: any) {
      setModalError(err?.response?.data?.message ?? 'Gagal menyimpan kunjungan.')
    } finally { setSaving(false) }
  }

  // Weeks for selected month
  const { list: weekList, mName: currentMonthName, daysInMonth } = getWeeksForMonth(year, month)

  // Calculate year, month, and week number to pass to VisitorSheetPrint
  let currentWeekNum: number | null = null
  if (filterMode === 'week') {
    currentWeekNum = week === 'all' || !week ? null : Number(week)
  } else if (filterMode === 'today') {
    currentWeekNum = getWeekOfMonth(now)
  } else if (filterMode === 'date' && dateInput) {
    const [y, m, d] = dateInput.split('-').map(Number)
    if (y && m && d) currentWeekNum = getWeekOfMonth(new Date(y, m - 1, d))
  }

  let displayYear = year
  let displayMonth = month
  if (filterMode === 'today') {
    displayYear = now.getFullYear()
    displayMonth = now.getMonth() + 1
  } else if (filterMode === 'date' && dateInput) {
    const [y, m] = dateInput.split('-').map(Number)
    if (y && m) {
      displayYear = y
      displayMonth = m
    }
  }

  const currentWeekInfo = weekList.find((w) => w.value === week)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── Print CSS: Memastikan Kop Surat Muncul Sempurna & Ukuran Kertas F4 ── */}
      <style>{`
        @media print {
          @page {
            size: 215.9mm 330mm;
            margin: 10mm 14mm 10mm 14mm;
          }
          html, body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hanya sembunyikan navigasi UI web, JANGAN sembunyikan kop surat dokumen */
          .no-print, aside, nav, .app-sidebar, .app-header {
            display: none !important;
          }
          .print-area {
            display: block !important;
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .sheet-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .sheet-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .sheet-kop-header {
            display: block !important;
            visibility: visible !important;
          }
          .sheet-table, .sheet-signatures {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .sheet-page img {
            max-width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="no-print flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan</h1>
          <p className="text-sm text-slate-500">Cetak daftar pengunjung & formulir peminjaman buku teks</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={openSettingsModal}>
            <SlidersHorizontal size={14} />
            Atur Penandatangan
          </Button>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="no-print flex gap-2">
        <Button
          variant={activeTab === 'visitors' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('visitors')}
        >
          <Users size={14} />
          Daftar Pengunjung
        </Button>
        <Button
          variant={activeTab === 'textbook' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('textbook')}
        >
          <BookOpen size={14} />
          Formulir Peminjaman Buku Teks
        </Button>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* TAB 1: DAFTAR PENGUNJUNG                                    */}
      {/* ════════════════════════════════════════════════════════════ */}
      {activeTab === 'visitors' && (
        <>
          {/* Stat Cards */}
          <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Kunjungan"    value={stats.total}   icon={<Users size={20} />}          color="blue"    />
            <StatCard label="Baca di Tempat"     value={stats.baca}    icon={<BookOpen size={20} />}       color="emerald" />
            <StatCard label="Peminjaman Buku"    value={stats.pinjam}  icon={<ArrowUpRight size={20} />}   color="blue"    />
            <StatCard label="Pengembalian Buku"  value={stats.kembali} icon={<ArrowDownLeft size={20} />}  color="green"   />
          </div>

          {/* Filter Bar */}
          <Card className="no-print">
            <CardBody className="space-y-3">
              {/* Row 1: Quick Filter Mode Pills & Active Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Periode:</span>

                  {/* Button: Hari Ini */}
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode('today')
                      setDateInput(todayDateStr)
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filterMode === 'today'
                        ? 'bg-primary-600 text-white shadow-sm ring-2 ring-primary-500/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <Calendar size={13} />
                    Hari Ini ({now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
                  </button>

                  {/* Button: Minggu Ini */}
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode('week')
                      setWeek(String(getWeekOfMonth(now)))
                      setYear(now.getFullYear())
                      setMonth(now.getMonth() + 1)
                      setMonthInput(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filterMode === 'week'
                        ? 'bg-primary-600 text-white shadow-sm ring-2 ring-primary-500/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    Minggu Ini (Minggu {['', 'I', 'II', 'III', 'IV', 'V'][getWeekOfMonth(now)]})
                  </button>

                  {/* Button: Bulan Ini */}
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode('month')
                      setYear(now.getFullYear())
                      setMonth(now.getMonth() + 1)
                      setMonthInput(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filterMode === 'month'
                        ? 'bg-primary-600 text-white shadow-sm ring-2 ring-primary-500/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    Bulan Ini ({MONTHS[now.getMonth()]?.l})
                  </button>

                  {/* Button: Pilih Tanggal / Kustom */}
                  <button
                    type="button"
                    onClick={() => setFilterMode('date')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filterMode === 'date'
                        ? 'bg-primary-600 text-white shadow-sm ring-2 ring-primary-500/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    Pilih Tanggal Lain
                  </button>
                </div>

                {/* Status Ringkas Kunjungan Aktif */}
                <div className="text-xs text-slate-500 hidden md:block">
                  {filterMode === 'today' && (
                    <span>Menampilkan kunjungan hari ini: <strong className="text-slate-800">{now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
                  )}
                  {filterMode === 'week' && (
                    <span>Menampilkan periode: <strong className="text-slate-800">{currentWeekInfo ? currentWeekInfo.label : `Minggu ${week}`}</strong></span>
                  )}
                  {filterMode === 'month' && (
                    <span>Menampilkan seluruh kunjungan bulan: <strong className="text-slate-800">{MONTHS[month - 1]?.l} {year}</strong></span>
                  )}
                  {filterMode === 'date' && (
                    <span>Menampilkan kunjungan tanggal: <strong className="text-slate-800">{dateInput ? new Date(dateInput).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</strong></span>
                  )}
                </div>
              </div>

              {/* Row 2: Dynamic Inputs based on mode & Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* When filterMode === 'date' */}
                {filterMode === 'date' && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <Calendar size={14} className="text-slate-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-600">Pilih Tanggal:</span>
                    <input
                      type="date"
                      value={dateInput}
                      onChange={(e) => handleDateInputChange(e.target.value)}
                      className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                    />
                  </div>
                )}

                {/* When filterMode === 'week' or 'month' */}
                {(filterMode === 'week' || filterMode === 'month') && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <Calendar size={14} className="text-slate-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-600">Bulan:</span>
                    <input
                      type="month"
                      value={monthInput}
                      onChange={(e) => handleMonthInputChange(e.target.value)}
                      className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                    />
                  </div>
                )}

                {/* When filterMode === 'week': week dropdown */}
                {filterMode === 'week' && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <span className="text-xs font-medium text-slate-600">Minggu:</span>
                    <select
                      value={week}
                      onChange={(e) => setWeek(e.target.value)}
                      className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="all">Semua Minggu (1 - {daysInMonth} {currentMonthName} {year})</option>
                      {weekList.map((w) => (
                        <option key={w.value} value={w.value}>
                          {w.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Keperluan Filter */}
                <SelectFilter value={keperluan} onChange={setKeperluan}>
                  <option value="">Semua Keperluan</option>
                  <option value="baca">Baca</option>
                  <option value="pinjam">Pinjam</option>
                  <option value="kembali">Kembali</option>
                </SelectFilter>

                {/* Search */}
                <div className="flex-1 min-w-40">
                  <Input
                    placeholder="Cari nama, kelas, NIS..."
                    leftIcon={<Search size={15} />}
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchVisitors()}
                  />
                </div>

                <button
                  onClick={fetchVisitors}
                  title="Segarkan data"
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <RefreshCw size={15} className={loadingV ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Action Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
                {/* View toggle & Print Data Mode */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                    <button
                      type="button"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        viewMode === 'preview'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      onClick={() => setViewMode('preview')}
                    >
                      <Eye size={13} />
                      Pratinjau F4
                    </button>
                    <button
                      type="button"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        viewMode === 'table'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      onClick={() => setViewMode('table')}
                    >
                      <List size={13} />
                      Tabel Ringkas
                    </button>
                  </div>

                  {/* Mode Cetak Toggle: Data Sistem vs Blanko Kosong */}
                  <div className="flex items-center gap-1 bg-primary-50 border border-primary-100 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setIsPrintBlank(false)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        !isPrintBlank
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-primary-700 hover:bg-primary-100/60'
                      }`}
                      title="Mencetak daftar pengunjung dengan data dari sistem"
                    >
                      Isi Data Sistem ({visitors.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPrintBlank(true)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        isPrintBlank
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-primary-700 hover:bg-primary-100/60'
                      }`}
                      title="Mencetak blanko fisik kosong resmi untuk paraf langsung pengunjung di perpustakaan"
                    >
                      Blanko Kosong Fisik
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={openSettingsModal} title="Ubah Kepala & Koordinator Perpustakaan">
                    <SlidersHorizontal size={14} />
                    Atur Penandatangan
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setModalOpen(true)}>
                    <Plus size={14} />
                    Catat Manual
                  </Button>
                  <Button size="sm" onClick={() => window.print()}>
                    <Printer size={14} />
                    Cetak PDF (F4)
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* ── Table View ── */}
          {viewMode === 'table' && (
            <Card className="no-print">
              {loadingV ? (
                <CardBody>
                  <div className="h-40 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
                  </div>
                </CardBody>
              ) : visitors.length === 0 ? (
                <CardBody>
                  <EmptyState icon={<Users size={48} />} title="Tidak ada data kunjungan" description="Tidak ada catatan kunjungan untuk filter yang dipilih." />
                </CardBody>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 text-center w-12">No</th>
                        <th className="px-6 py-3 text-left">Waktu Kunjungan</th>
                        <th className="px-6 py-3 text-left">Nama Pengunjung</th>
                        <th className="px-6 py-3 text-left">NIS</th>
                        <th className="px-6 py-3 text-left">Kelas / Jurusan</th>
                        <th className="px-6 py-3 text-center">Keperluan</th>
                        <th className="px-6 py-3 text-left">Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitors.map((v, idx) => (
                        <tr key={v.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                          <td className="px-6 py-3 text-center text-slate-400 text-xs">{idx + 1}</td>
                          <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">
                            {new Date(v.visited_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="px-6 py-3 font-medium text-slate-900">{v.nama}</td>
                          <td className="px-6 py-3 font-mono text-xs text-slate-500">{v.nis || '—'}</td>
                          <td className="px-6 py-3 text-slate-700">{v.kelas || '—'}</td>
                          <td className="px-6 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              v.keperluan === 'baca'
                                ? 'bg-emerald-50 text-emerald-700'
                                : v.keperluan === 'pinjam'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {v.keperluan}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-xs text-slate-400">{v.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* ── Print Preview (Visitor Sheet) ── */}
          <div className={`print-area ${viewMode === 'preview' ? 'block' : 'hidden print:block'}`}>
            <div className="no-print mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 px-1">
              <span>
                {isPrintBlank ? (
                  <strong className="text-primary-700">Mode: Cetak Blanko Fisik Kosong (25 baris format resmi F4)</strong>
                ) : (
                  <span>Mode: Cetak Data Kunjungan Sistem ({visitors.length} data pengunjung)</span>
                )}
                {' • '}Ukuran Kertas F4 (Folio 215.9 x 330 mm)
              </span>
              <span className="text-slate-400 hidden sm:inline">
                Penandatangan: {settings.kepala_nama} & {settings.koordinator_nama}
              </span>
            </div>
            <div className="flex justify-center overflow-x-auto pb-8">
              <VisitorSheetPrint
                visitors={visitors}
                year={displayYear}
                month={displayMonth}
                week={currentWeekNum}
                schoolYear={settings.school_year}
                dateCityText={computeDateCity(settings)}
                kepalaPerpusName={settings.kepala_nama}
                kepalaPerpusNip={settings.kepala_nip}
                koordinatorName={settings.koordinator_nama}
                koordinatorNip={settings.koordinator_nip}
                isPrintBlank={isPrintBlank}
              />
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* TAB 2: FORMULIR PEMINJAMAN BUKU TEKS                        */}
      {/* ════════════════════════════════════════════════════════════ */}
      {activeTab === 'textbook' && (
        <>
          {/* Filter & Controls */}
          <Card className="no-print">
            <CardBody>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-48">
                  <Input
                    placeholder="Cari nama siswa, NIS, atau no. transaksi..."
                    leftIcon={<Search size={15} />}
                    value={loanQ}
                    onChange={(e) => { setLoanQ(e.target.value); fetchLoans(e.target.value) }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Tahun Ajaran:</span>
                  <input
                    type="text"
                    value={schoolYear}
                    onChange={(e) => setSchoolYear(e.target.value)}
                    className="w-28 px-3 py-2 text-sm text-center border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <SelectFilter value={String(copies)} onChange={(v) => setCopies(Number(v))}>
                  <option value="1">1 formulir / lembar</option>
                  <option value="2">2 formulir / lembar</option>
                </SelectFilter>

                <Button
                  size="sm"
                  disabled={!selectedLoan}
                  onClick={() => window.print()}
                >
                  <Printer size={14} />
                  Cetak Formulir (F4)
                </Button>
              </div>

              {/* Loan selector chips */}
              {loans.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-2">Pilih data peminjaman:</p>
                  <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                    {loans.map((loan) => (
                      <button
                        key={loan.loan_id}
                        onClick={() => setSelectedLoan(loan)}
                        className={`text-left px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                          selectedLoan?.loan_id === loan.loan_id
                            ? 'bg-primary-50 border-primary-500 text-primary-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-medium">{loan.student.nama}</span>
                        <span className="text-slate-400 ml-1">({loan.student.kelas})</span>
                        <span className="text-slate-400 ml-1 font-mono">({loan.items.length} buku)</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Textbook Form Preview */}
          {selectedLoan ? (
            <>
              <div className="no-print mb-2 text-center text-xs text-slate-400">
                Pratinjau formulir peminjaman buku teks ukuran F4
              </div>
              <div className="print-area flex justify-center overflow-x-auto pb-8">
                <div className="bg-white shadow border border-slate-200 rounded-sm">
                  <TextbookLoanFormPrint
                    form={selectedLoan}
                    schoolYear={settings.school_year || schoolYear}
                    copies={copies}
                    koordinatorName={settings.koordinator_nama}
                    koordinatorNip={settings.koordinator_nip}
                  />
                </div>
              </div>
            </>
          ) : (
            <Card>
              <CardBody>
                <EmptyState
                  icon={<BookOpen size={48} />}
                  title="Pilih data peminjaman"
                  description="Pilih satu riwayat peminjaman siswa di atas untuk melihat pratinjau formulir peminjaman buku teks."
                />
              </CardBody>
            </Card>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL: CATAT PENGUNJUNG MANUAL                               */}
      {/* ════════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-primary-600" />
                <h3 className="font-semibold text-slate-900">Catat Kunjungan Manual</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveVisitor} className="px-6 py-4 space-y-4">
              {modalError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-xs rounded-lg">
                  <AlertCircle size={14} className="shrink-0" />
                  {modalError}
                </div>
              )}

              <Input
                label="Nama Pengunjung"
                required
                placeholder="Nama lengkap"
                value={modalForm.nama}
                onChange={(e) => setModalForm({ ...modalForm, nama: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Kelas / Jurusan"
                  placeholder="Mis: XII PPLG 2"
                  value={modalForm.kelas}
                  onChange={(e) => setModalForm({ ...modalForm, kelas: e.target.value })}
                />
                <Input
                  label="NIS (Opsional)"
                  placeholder="Nomor induk siswa"
                  value={modalForm.nis}
                  onChange={(e) => setModalForm({ ...modalForm, nis: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Keperluan</label>
                <div className="flex gap-2 mt-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={modalForm.keperluan === 'baca' ? 'primary' : 'outline'}
                    className="flex-1"
                    onClick={() => setModalForm({ ...modalForm, keperluan: 'baca' })}
                  >
                    <BookOpen size={13} />
                    Baca
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={modalForm.keperluan === 'pinjam' ? 'primary' : 'outline'}
                    className="flex-1"
                    onClick={() => setModalForm({ ...modalForm, keperluan: 'pinjam' })}
                  >
                    <ArrowUpRight size={13} />
                    Pinjam
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={modalForm.keperluan === 'kembali' ? 'primary' : 'outline'}
                    className="flex-1"
                    onClick={() => setModalForm({ ...modalForm, keperluan: 'kembali' })}
                  >
                    <ArrowDownLeft size={13} />
                    Kembali
                  </Button>
                </div>
              </div>

              <Input
                label="Waktu Kunjungan"
                type="datetime-local"
                value={modalForm.visited_at}
                onChange={(e) => setModalForm({ ...modalForm, visited_at: e.target.value })}
              />

              <Input
                label="Catatan (Opsional)"
                placeholder="Keterangan tambahan"
                value={modalForm.notes}
                onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
              />

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" loading={saving}>
                  Simpan Kunjungan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL: PENGATURAN PENANDATANGAN & FORMAT LAPORAN             */}
      {/* ════════════════════════════════════════════════════════════ */}
      {settingsModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-primary-600" />
                <h3 className="font-semibold text-slate-900">Pengaturan Penandatangan Laporan</h3>
              </div>
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSettings} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <p className="text-xs text-slate-500">
                Nama dan NIP di bawah ini akan otomatis tercantum pada kolom tanda tangan dokumen laporan & cetak fisik resmi perpustakaan.
              </p>

              {/* Section 1: Kepala Perpustakaan */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Kepala Perpustakaan (Kiri)
                  </span>
                  <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Mengetahui
                  </span>
                </div>
                <Input
                  label="Nama & Gelar Kepala Perpustakaan"
                  required
                  placeholder="Contoh: RUBAETUL ADAWIYAH, S.Pd."
                  value={settingsForm.kepala_nama}
                  onChange={(e) => setSettingsForm({ ...settingsForm, kepala_nama: e.target.value })}
                />
                <Input
                  label="NIP Kepala Perpustakaan"
                  required
                  placeholder="Contoh: NIP. 19800424 201407 2 003"
                  value={settingsForm.kepala_nip}
                  onChange={(e) => setSettingsForm({ ...settingsForm, kepala_nip: e.target.value })}
                />
              </div>

              {/* Section 2: Koordinator Pengelola Perpustakaan */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Koordinator Pengelola Perpustakaan (Kanan)
                  </span>
                  <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Kampus 1 dan 2
                  </span>
                </div>
                <Input
                  label="Nama & Gelar Koordinator"
                  required
                  placeholder="Contoh: ROSSY RAKHMATU’LAILA, SH."
                  value={settingsForm.koordinator_nama}
                  onChange={(e) => setSettingsForm({ ...settingsForm, koordinator_nama: e.target.value })}
                />
                <Input
                  label="NIP Koordinator"
                  required
                  placeholder="Contoh: NIP. 19830121 202521 2 054"
                  value={settingsForm.koordinator_nip}
                  onChange={(e) => setSettingsForm({ ...settingsForm, koordinator_nip: e.target.value })}
                />
              </div>

              {/* Section 3: Titimangsa & Tahun Pelajaran */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Format Titimangsa (Tanggal Surat)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, titimangsa_mode: 'blank' })}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                      settingsForm.titimangsa_mode === 'blank'
                        ? 'bg-primary-50 border-primary-500 text-primary-700 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Blanko Titik-Titik
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, titimangsa_mode: 'today' })}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                      settingsForm.titimangsa_mode === 'today'
                        ? 'bg-primary-50 border-primary-500 text-primary-700 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Tanggal Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, titimangsa_mode: 'custom' })}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                      settingsForm.titimangsa_mode === 'custom'
                        ? 'bg-primary-50 border-primary-500 text-primary-700 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Teks Kustom
                  </button>
                </div>

                {settingsForm.titimangsa_mode === 'custom' ? (
                  <Input
                    label="Teks Titimangsa Kustom"
                    placeholder="Mis: Cianjur, 15 September 2026"
                    value={settingsForm.titimangsa_custom}
                    onChange={(e) => setSettingsForm({ ...settingsForm, titimangsa_custom: e.target.value })}
                  />
                ) : (
                  <div className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded border border-slate-200">
                    Teks tercetak:{' '}
                    <span className="font-medium text-slate-800">
                      {computeDateCity(settingsForm)}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Input
                    label="Tahun Pelajaran"
                    placeholder="Contoh: 2026 / 2027"
                    value={settingsForm.school_year}
                    onChange={(e) => setSettingsForm({ ...settingsForm, school_year: e.target.value })}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetSettings}
                  title="Kembalikan ke pejabat default"
                  className="text-slate-500"
                >
                  <RotateCcw size={13} />
                  Reset Default
                </Button>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setSettingsModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" size="sm" loading={savingSettings}>
                    <Check size={14} />
                    Simpan Pengaturan
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {settingsToast && (
        <div className="no-print fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg shadow-lg text-sm animate-in fade-in slide-in-from-bottom-2">
          <Check size={16} />
          Pengaturan penandatangan berhasil disimpan.
        </div>
      )}
    </div>
  )
}
