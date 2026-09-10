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
  SlidersHorizontal,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Eye
} from 'lucide-react'
import {
  reportService,
  type Visitor,
  type VisitorStats,
  type TextbookLoanForm,
} from '@/api/report.service'
import { VisitorSheetPrint } from '@/components/reports/VisitorSheetPrint'
import { TextbookLoanFormPrint } from '@/components/reports/TextbookLoanFormPrint'

const MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
]

export function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<'visitors' | 'textbook'>('visitors')

  // ── Tab 1: Visitor State ──
  const now = new Date()
  const [year, setYear] = useState<number>(now.getFullYear())
  const [month, setMonth] = useState<number>(now.getMonth() + 1)
  const [week, setWeek] = useState<number | null>(null)
  const [keperluan, setKeperluan] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [stats, setStats] = useState<VisitorStats>({ total: 0, baca: 0, pinjam: 0, kembali: 0 })
  const [loadingVisitors, setLoadingVisitors] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'preview' | 'table'>('preview')

  // Visitor Manual Entry Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [modalForm, setModalForm] = useState({
    nama: '',
    nis: '',
    kelas: '',
    keperluan: 'baca' as 'baca' | 'pinjam' | 'kembali',
    visited_at: new Date().toISOString().slice(0, 16),
    notes: '',
  })
  const [savingVisitor, setSavingVisitor] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // ── Tab 2: Textbook Loan State ──
  const [textbookLoans, setTextbookLoans] = useState<TextbookLoanForm[]>([])
  const [selectedLoan, setSelectedLoan] = useState<TextbookLoanForm | null>(null)
  const [loadingLoans, setLoadingLoans] = useState<boolean>(false)
  const [loanSearch, setLoanSearch] = useState<string>('')
  const [copies, setCopies] = useState<number>(1)
  const [schoolYear, setSchoolYear] = useState<string>('2026 / 2027')

  // Fetch Visitors
  const fetchVisitors = async () => {
    setLoadingVisitors(true)
    try {
      const res = await reportService.getVisitors({
        year,
        month,
        week: week || undefined,
        keperluan: keperluan || undefined,
        q: searchQuery || undefined,
        all: true,
      })
      const list = Array.isArray(res.visitors) ? res.visitors : (res.visitors as any).data || []
      setVisitors(list)
      if (res.stats) setStats(res.stats)
    } catch (err) {
      console.error('Error fetching visitors:', err)
    } finally {
      setLoadingVisitors(false)
    }
  }

  // Fetch Textbook Loans
  const fetchTextbookLoans = async (q = '') => {
    setLoadingLoans(true)
    try {
      const res = await reportService.getTextbookLoans({ q, per_page: 20 })
      const list = res.data || []
      setTextbookLoans(list)
      if (list.length > 0 && !selectedLoan) {
        setSelectedLoan(list[0])
      }
    } catch (err) {
      console.error('Error fetching textbook loans:', err)
    } finally {
      setLoadingLoans(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'visitors') {
      fetchVisitors()
    } else {
      fetchTextbookLoans(loanSearch)
    }
  }, [activeTab, year, month, week, keperluan])

  // Handle Save Manual Visitor
  const handleSaveVisitor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalForm.nama.trim()) {
      setErrorMessage('Nama pengunjung wajib diisi.')
      return
    }
    setSavingVisitor(true)
    setErrorMessage(null)
    try {
      await reportService.addVisitor({
        nama: modalForm.nama.trim(),
        nis: modalForm.nis.trim() || undefined,
        kelas: modalForm.kelas.trim() || undefined,
        keperluan: modalForm.keperluan,
        visited_at: modalForm.visited_at,
        notes: modalForm.notes.trim() || undefined,
      })
      setSuccessMessage('Kunjungan berhasil dicatat!')
      setIsModalOpen(false)
      setModalForm({
        nama: '',
        nis: '',
        kelas: '',
        keperluan: 'baca',
        visited_at: new Date().toISOString().slice(0, 16),
        notes: '',
      })
      fetchVisitors()
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Gagal mencatat kunjungan.')
    } finally {
      setSavingVisitor(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* ── CSS PRINT STYLES ── */}
      <style>{`
        @media print {
          @page {
            size: 215.9mm 355.6mm; /* Folio / F4 / Legal */
            margin: 0;
          }
          body {
            background-color: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print,
          aside,
          header,
          nav,
          button,
          .app-sidebar,
          .app-header {
            display: none !important;
          }
          .print-area-wrapper {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .sheet-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
          }
        }
      `}</style>

      {/* ── HEADER HALAMAN ── */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Laporan & Formulir Cetak
              </h1>
              <p className="text-sm text-slate-500">
                Dokumen fisik resmi perpustakaan format F4/Legal 100% identik dengan formulir asli.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('visitors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'visitors'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Daftar Pengunjung
          </button>
          <button
            onClick={() => setActiveTab('textbook')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'textbook'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Formulir Peminjaman Buku
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="no-print flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ── TAB 1: DAFTAR PENGUNJUNG PERPUSTAKAAN ── */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'visitors' && (
        <div className="space-y-6">
          {/* Quick Stats Banner */}
          <div className="no-print grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Kunjungan</p>
                <p className="text-xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Baca di Tempat</p>
                <p className="text-xl font-bold text-slate-900">{stats.baca}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Peminjaman Buku</p>
                <p className="text-xl font-bold text-slate-900">{stats.pinjam}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Pengembalian Buku</p>
                <p className="text-xl font-bold text-slate-900">{stats.kembali}</p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Month */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Bulan:</span>
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Tahun:</span>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Week */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Minggu Ke:</span>
                  <select
                    value={week || ''}
                    onChange={(e) => setWeek(e.target.value ? Number(e.target.value) : null)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Semua Minggu</option>
                    <option value="1">Minggu I</option>
                    <option value="2">Minggu II</option>
                    <option value="3">Minggu III</option>
                    <option value="4">Minggu IV</option>
                    <option value="5">Minggu V</option>
                  </select>
                </div>

                {/* Keperluan */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Keperluan:</span>
                  <select
                    value={keperluan}
                    onChange={(e) => setKeperluan(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Semua Keperluan</option>
                    <option value="baca">Baca di Tempat</option>
                    <option value="pinjam">Peminjaman</option>
                    <option value="kembali">Pengembalian</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Catat Kunjungan Manual
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Cetak / Simpan PDF (F4)
                </button>
              </div>
            </div>

            {/* Search & Mode Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama, kelas, atau NIS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchVisitors()}
                  className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setViewMode('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    viewMode === 'preview'
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Pratinjau Lembar Fisik (F4)
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    viewMode === 'table'
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Tabel Ringkas
                </button>
                <button
                  onClick={fetchVisitors}
                  disabled={loadingVisitors}
                  title="Segarkan data"
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingVisitors ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* View Mode: Interactive Table */}
          {viewMode === 'table' && (
            <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">
                  Daftar Kunjungan ({visitors.length} data ditemukan)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4">Tanggal & Waktu</th>
                      <th className="py-3 px-4">Nama Pengunjung</th>
                      <th className="py-3 px-4">NIS</th>
                      <th className="py-3 px-4">Kelas / Jurusan</th>
                      <th className="py-3 px-4 text-center">Keperluan</th>
                      <th className="py-3 px-4">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visitors.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Tidak ada catatan kunjungan pada filter ini.
                        </td>
                      </tr>
                    ) : (
                      visitors.map((v, idx) => (
                        <tr key={v.id} className="hover:bg-slate-50/75 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap">
                            {new Date(v.visited_at).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{v.nama}</td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-xs">{v.nis || '-'}</td>
                          <td className="py-3 px-4 text-slate-700">{v.kelas || '-'}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                                v.keperluan === 'baca'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : v.keperluan === 'pinjam'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              {v.keperluan}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-xs">{v.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* View Mode: Document Preview (Always visible in print) */}
          <div
            className={`print-area-wrapper transition-opacity ${
              viewMode === 'preview' ? 'block' : 'hidden print:block'
            }`}
          >
            <div className="no-print mb-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <span>📄 Lembar Formulir Asli Ukuran F4 (215.9mm × 355.6mm)</span>
              <span>•</span>
              <span>Siap dicetak langsung atau disimpan sebagai PDF</span>
            </div>

            <div className="flex justify-center overflow-x-auto pb-8">
              <div className="bg-white shadow-2xl rounded-sm border border-slate-300">
                <VisitorSheetPrint
                  visitors={visitors}
                  year={year}
                  month={month}
                  week={week}
                  schoolYear={schoolYear}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ── TAB 2: FORMULIR PEMINJAMAN BUKU TEKS ── */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'textbook' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search Peminjaman */}
              <div className="flex-1 max-w-md relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama siswa, NIS, atau no pinjam..."
                  value={loanSearch}
                  onChange={(e) => {
                    setLoanSearch(e.target.value)
                    fetchTextbookLoans(e.target.value)
                  }}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Options & Print */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Tahun Ajaran:</span>
                  <input
                    type="text"
                    value={schoolYear}
                    onChange={(e) => setSchoolYear(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-medium w-28 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Salinan / Halaman:</span>
                  <select
                    value={copies}
                    onChange={(e) => setCopies(Number(e.target.value))}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value={1}>1 Formulir per Lembar</option>
                    <option value={2}>2 Formulir per Lembar (Hemat)</option>
                  </select>
                </div>

                <button
                  onClick={handlePrint}
                  disabled={!selectedLoan}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Formulir (F4)
                </button>
              </div>
            </div>

            {/* List of Recent Textbook Loans */}
            {textbookLoans.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  Pilih Data Peminjaman Siswa:
                </p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                  {textbookLoans.map((loan) => {
                    const isSelected = selectedLoan?.loan_id === loan.loan_id
                    return (
                      <button
                        key={loan.loan_id}
                        onClick={() => setSelectedLoan(loan)}
                        className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-semibold">{loan.student.nama}</span>
                        <span className="text-slate-400 ml-1.5">({loan.student.kelas})</span>
                        <span className="text-slate-500 ml-1.5 font-mono text-[11px]">• {loan.items.length} buku</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Form Slip Document Preview */}
          {selectedLoan ? (
            <div className="print-area-wrapper">
              <div className="no-print mb-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <span>📄 Formulir Peminjaman Buku Teks Asli Ukuran F4</span>
                <span>•</span>
                <span>Data otomatis terisi dari peminjaman sistem</span>
              </div>

              <div className="flex justify-center overflow-x-auto pb-8">
                <div className="bg-white shadow-2xl rounded-sm border border-slate-300">
                  <TextbookLoanFormPrint
                    form={selectedLoan}
                    schoolYear={schoolYear}
                    copies={copies}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">Belum Ada Data Peminjaman Dipilih</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Pilih salah satu riwayat peminjaman siswa di atas untuk melihat pratinjau formulir peminjaman buku teks fisik.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ── MODAL: CATAT PENGUNJUNG MANUAL ── */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Catat Kunjungan Baru</h3>
                  <p className="text-xs text-slate-500">Mencatat pengunjung perpustakaan fisik manual</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveVisitor} className="p-6 space-y-4">
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs font-medium rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Pengunjung <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Fauzan"
                  value={modalForm.nama}
                  onChange={(e) => setModalForm({ ...modalForm, nama: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas / Jurusan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: XII PPLG 2"
                    value={modalForm.kelas}
                    onChange={(e) => setModalForm({ ...modalForm, kelas: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIS (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="NIS Siswa"
                    value={modalForm.nis}
                    onChange={(e) => setModalForm({ ...modalForm, nis: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keperluan Kunjungan <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalForm({ ...modalForm, keperluan: 'baca' })}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                      modalForm.keperluan === 'baca'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    📖 Baca di Tempat
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalForm({ ...modalForm, keperluan: 'pinjam' })}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                      modalForm.keperluan === 'pinjam'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    📤 Pinjam Buku
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalForm({ ...modalForm, keperluan: 'kembali' })}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                      modalForm.keperluan === 'kembali'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    📥 Kembali Buku
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Waktu Kunjungan
                </label>
                <input
                  type="datetime-local"
                  value={modalForm.visited_at}
                  onChange={(e) => setModalForm({ ...modalForm, visited_at: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Misal: Membaca referensi RPL"
                  value={modalForm.notes}
                  onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingVisitor}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  {savingVisitor ? 'Menyimpan...' : 'Simpan Kunjungan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default AdminReportsPage
