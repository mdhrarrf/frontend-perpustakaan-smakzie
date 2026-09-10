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
} from 'lucide-react'
import {
  reportService,
  type Visitor,
  type VisitorStats,
  type TextbookLoanForm,
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

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTHS = [
  { v: 1,  l: 'Januari' },  { v: 2,  l: 'Februari' }, { v: 3,  l: 'Maret' },
  { v: 4,  l: 'April' },    { v: 5,  l: 'Mei' },       { v: 6,  l: 'Juni' },
  { v: 7,  l: 'Juli' },     { v: 8,  l: 'Agustus' },   { v: 9,  l: 'September' },
  { v: 10, l: 'Oktober' },  { v: 11, l: 'November' },  { v: 12, l: 'Desember' },
]

// ── Main Page ─────────────────────────────────────────────────────────────────
export function AdminReportsPage() {
  const now = new Date()
  const [activeTab, setActiveTab] = useState<'visitors' | 'textbook'>('visitors')

  // ── Tab 1 State ──────────────────────────────────────────────────────────
  const [year,        setYear]        = useState(now.getFullYear())
  const [month,       setMonth]       = useState(now.getMonth() + 1)
  const [week,        setWeek]        = useState('')
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
  const [schoolYear,    setSchoolYear]    = useState('2026 / 2027')

  // ── Data Fetchers ─────────────────────────────────────────────────────────
  const fetchVisitors = async () => {
    setLoadingV(true)
    try {
      const res = await reportService.getVisitors({
        year, month,
        week:      week ? Number(week) : undefined,
        keperluan: keperluan || undefined,
        q:         searchQ   || undefined,
        all:       true,
      })
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
  }, [activeTab, year, month, week, keperluan])

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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── Print CSS ── */}
      <style>{`
        @media print {
          @page { size: 215.9mm 355.6mm; margin: 0; }
          body { background: #fff !important; margin: 0 !important; }
          .no-print, aside, header, nav, .app-sidebar, .app-header { display: none !important; }
          .print-area { display: block !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .sheet-page { box-shadow: none !important; border: none !important; margin: 0 auto !important; }
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="no-print flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan</h1>
          <p className="text-sm text-slate-500">Cetak daftar pengunjung & formulir peminjaman buku teks</p>
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
            <CardBody>
              <div className="flex flex-wrap items-center gap-3">
                {/* Filters */}
                <SelectFilter value={String(month)} onChange={(v) => setMonth(Number(v))}>
                  {MONTHS.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
                </SelectFilter>

                <SelectFilter value={String(year)} onChange={(v) => setYear(Number(v))}>
                  {[2024,2025,2026,2027,2028].map((y) => <option key={y} value={y}>{y}</option>)}
                </SelectFilter>

                <SelectFilter value={week} onChange={setWeek}>
                  <option value="">Semua Minggu</option>
                  <option value="1">Minggu I</option>
                  <option value="2">Minggu II</option>
                  <option value="3">Minggu III</option>
                  <option value="4">Minggu IV</option>
                  <option value="5">Minggu V</option>
                </SelectFilter>

                <SelectFilter value={keperluan} onChange={setKeperluan}>
                  <option value="">Semua Keperluan</option>
                  <option value="baca">Baca</option>
                  <option value="pinjam">Pinjam</option>
                  <option value="kembali">Kembali</option>
                </SelectFilter>

                <div className="flex-1 min-w-48">
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
                  title="Segarkan"
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <RefreshCw size={15} className={loadingV ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Action Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
                {/* View toggle */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                    onClick={() => setViewMode('preview')}
                  >
                    <Eye size={13} />
                    Pratinjau F4
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    onClick={() => setViewMode('table')}
                  >
                    <List size={13} />
                    Tabel Ringkas
                  </Button>
                </div>

                <div className="flex gap-2">
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
            <div className="no-print mb-2 text-center text-xs text-slate-400">
              Pratinjau lembar fisik ukuran F4 — tekan "Cetak PDF (F4)" untuk mencetak
            </div>
            <div className="flex justify-center overflow-x-auto pb-8">
              <div className="bg-white shadow border border-slate-200 rounded-sm">
                <VisitorSheetPrint visitors={visitors} year={year} month={month} week={week ? Number(week) : null} schoolYear={schoolYear} />
              </div>
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
                        <span className="text-slate-400 ml-1 font-mono">· {loan.items.length} buku</span>
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
                  <TextbookLoanFormPrint form={selectedLoan} schoolYear={schoolYear} copies={copies} />
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
                  {(['baca','pinjam','kembali'] as const).map((k) => (
                    <Button
                      key={k}
                      type="button"
                      size="sm"
                      variant={modalForm.keperluan === k ? 'primary' : 'outline'}
                      className="flex-1"
                      onClick={() => setModalForm({ ...modalForm, keperluan: k })}
                    >
                      {k.charAt(0).toUpperCase() + k.slice(1)}
                    </Button>
                  ))}
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
    </div>
  )
}
