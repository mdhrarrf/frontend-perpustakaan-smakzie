import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { studentService } from '@/api/student.service'
import { loanService } from '@/api/loan.service'
import { uploadService } from '@/api/index'
import { BarcodeScanner } from '@/components/kiosk/BarcodeScanner'
import { WebcamCapture } from '@/components/kiosk/WebcamCapture'
import { useKioskStore } from '@/store/kiosk.store'
import { getErrorMessage } from '@/api/client'
import { formatDateTime, formatDate } from '@/utils'
import { ArrowLeft, AlertTriangle, CheckCircle2, Loader2, RotateCcw, BookOpen, Clock } from 'lucide-react'
import type { Student, Loan } from '@/types'

type Step = 'scan-student' | 'select-loan' | 'photo' | 'confirm'

export function KioskReturnPage() {
  const navigate  = useNavigate()
  const stationId = useKioskStore((s) => s.stationId)

  const [step,         setStep]       = useState<Step>('scan-student')
  const [student,      setStudent]    = useState<Student | null>(null)
  const [activeLoans,  setActiveLoans] = useState<Loan[]>([])
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [photoPath,    setPhotoPath]  = useState<string | null>(null)
  const [error,        setError]      = useState<string | null>(null)
  const [isLoading,    setIsLoading]  = useState(false)

  const kBtn = 'flex items-center justify-center gap-3 rounded-2xl font-bold text-xl px-8 py-5 min-h-[80px] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-4 focus:ring-offset-2'

  async function handleStudentScan(code: string) {
    setIsLoading(true); setError(null)
    try {
      const data = await studentService.search(code, 'barcode')
      const s = Array.isArray(data) ? data[0] : data
      setStudent(s)

      const loanData = await studentService.loans(s.id, { status: 'active,overdue' })
      const rawLoans = loanData.data?.data ?? []
      const loans = rawLoans.filter((l: Loan) => l.status === 'active' || l.status === 'overdue')

      if (loans.length === 0) {
        setError('Tidak ada peminjaman aktif. Anda tidak memiliki tanggungan buku yang sedang dipinjam.')
        return
      }
      setActiveLoans(loans)
      setStep('select-loan')
    } catch {
      setError('Siswa tidak ditemukan. Pastikan kartu pelajar terbaca dengan benar.')
    } finally {
      setIsLoading(false)
    }
  }

  // Helper: ambil judul buku dari loan item (support SLiMS books yang book = null)
  function getLoanBookTitle(loan: Loan | null): string {
    if (!loan) return '—'
    const item = loan.items?.[0] as any
    return item?.book?.judul ?? item?.book_title_snapshot ?? `Buku [${item?.id ?? '?'}]`
  }

  const returnMutation = useMutation({
    mutationFn: () => loanService.processReturn(selectedLoan!.id, {
      return_photo: photoPath ?? undefined,
    }),
    onSuccess: (result) => navigate('/kiosk/success', {
      state: {
        type:        result.is_late ? 'return_late' : 'return',
        late_days:   result.late_days,
        penalty_end: result.violation?.penalty_end_date,
        book_title:  getLoanBookTitle(selectedLoan),
      }
    }),
    onError: (err) => {
      const msg = getErrorMessage(err)
      // Jika buku sudah dikembalikan → reset otomatis ke awal
      if (msg.toLowerCase().includes('dikembalikan') || msg.toLowerCase().includes('returned')) {
        reset()
        setError('Buku ini sudah tercatat dikembalikan. Silakan scan kartu pelajar kembali untuk melihat peminjaman aktif.')
      } else {
        setError(msg)
      }
    },
  })

  function reset() {
    setStep('scan-student'); setStudent(null); setActiveLoans([])
    setSelectedLoan(null); setPhotoPath(null); setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/40 to-emerald-50/40 flex flex-col p-8 text-slate-900">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/kiosk')}
          className="p-3 bg-white hover:bg-slate-100 rounded-2xl border border-slate-200 text-slate-700 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Pengembalian Buku Mandiri
          </h1>
          <p className="text-slate-500 text-sm font-medium">Layanan mandiri pengembalian buku perpustakaan</p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6 text-rose-900 shadow-sm">
          <AlertTriangle size={24} className="text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-base font-semibold">{error}</p>
            <button onClick={reset} className="text-rose-700 hover:text-rose-900 text-sm font-bold mt-2 underline cursor-pointer">
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
            <Loader2 className="text-emerald-600 animate-spin" size={48} />
            <p className="text-slate-800 text-xl font-bold">Memuat data...</p>
          </div>
        </div>
      )}

      {/* ─── Step 1: Scan Student ─── */}
      {step === 'scan-student' && !isLoading && (
        <div key="scan-student" className="animate-kiosk-step flex-1 flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-sm">
              <RotateCcw size={40} />
            </div>
            <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Scan Kartu Pelajar</h2>
            <p className="text-slate-600 text-lg mt-1 font-medium">Tempelkan kartu pelajar ke scanner atau ketik NIS Anda</p>
          </div>
          <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
            <BarcodeScanner
              onScan={handleStudentScan}
              placeholder="Scan kartu / ketik NIS + Enter"
              kioskMode
              autoFocus
            />
          </div>
        </div>
      )}

      {/* ─── Step 2: Select Loan ─── */}
      {step === 'select-loan' && student && !isLoading && (
        <div key="select-loan" className="animate-kiosk-step flex-1 flex flex-col gap-6 max-w-2xl mx-auto w-full">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-6 py-2.5 mb-3 shadow-sm">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <span className="text-slate-800 text-base font-bold">{student.nama} ({student.nis})</span>
            </div>
            <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Pilih Buku yang Dikembalikan</h2>
            <p className="text-slate-600 text-base mt-1 font-medium">Ketuk buku yang sedang Anda bawa untuk dikembalikan</p>
          </div>

          <div className="space-y-4 w-full">
            {activeLoans.map((loan) => {
              const isLate = loan.status === 'overdue' || new Date(loan.due_at) < new Date()
              const bookTitle = getLoanBookTitle(loan)
              const item = loan.items?.[0] as any
              const bookAuthor = item?.book?.penulis ?? item?.book_author_snapshot ?? null
              return (
                <button
                  key={loan.id}
                  onClick={() => { setSelectedLoan(loan); setStep('photo') }}
                  className={`w-full text-left bg-white hover:border-emerald-400 active:scale-[0.98] rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-2 shadow-sm cursor-pointer ${
                    isLate ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-slate-900 text-xl font-bold">{bookTitle}</p>
                      {bookAuthor && <p className="text-slate-500 mt-1 font-medium text-sm">{bookAuthor}</p>}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="text-slate-500 font-medium">Dipinjam: {formatDate(loan.borrowed_at)}</span>
                        <span className={isLate ? 'text-rose-600 font-bold' : 'text-slate-700 font-medium'}>
                          Jatuh Tempo: {formatDate(loan.due_at)}
                        </span>
                      </div>
                    </div>
                    {isLate && (
                      <div className="flex-shrink-0 bg-rose-100 text-rose-700 rounded-xl px-4 py-2 text-xs font-black border border-rose-200">
                        TERLAMBAT
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Step 3: Photo ─── */}
      {step === 'photo' && selectedLoan && (
        <div key="photo" className="animate-kiosk-step flex-1 flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Dokumentasi Pengembalian</h2>
            <div className="inline-block bg-white border border-slate-200 rounded-xl px-5 py-2 mt-2 shadow-sm">
              <p className="text-slate-900 font-bold">{getLoanBookTitle(selectedLoan)}</p>
            </div>
            <p className="text-slate-600 text-base mt-2 font-medium">Foto diambil otomatis dalam 5 detik</p>
          </div>

          <WebcamCapture
            onCapture={async (base64) => {
              try {
                const { path } = await uploadService.photo(base64, 'return')
                setPhotoPath(path)
              } catch { /* optional */ }
              setStep('confirm')
            }}
            autoCapture
            autoCaptureDelay={5}
            kioskMode
          />

          <button
            onClick={() => setStep('confirm')}
            className="text-slate-600 hover:text-slate-900 text-base font-bold bg-white border border-slate-200 px-6 py-2.5 rounded-full shadow-sm transition-all"
          >
            Lewati Foto →
          </button>
        </div>
      )}

      {/* ─── Step 4: Confirm ─── */}
      {step === 'confirm' && student && selectedLoan && (
        <div key="confirm" className="animate-kiosk-step flex-1 flex flex-col items-center justify-center gap-6 max-w-lg mx-auto w-full">
          {new Date(selectedLoan.due_at) < new Date() && (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <AlertTriangle size={28} className="text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-amber-900 text-base font-bold">Pengembalian Melewati Batas Tempo</p>
                  <p className="text-amber-800 text-sm mt-0.5 font-medium">
                    Sanksi keterlambatan akan dicatat untuk buku ini sesuai dengan ketentuan perpustakaan.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-8 w-full space-y-4 border border-slate-200/80 shadow-xl shadow-slate-200/50">
            <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-4 tracking-tight">Konfirmasi Pengembalian</h2>
            {[
              { label: 'Nama',        value: student.nama },
              { label: 'NIS',         value: student.nis },
              { label: 'Buku',        value: getLoanBookTitle(selectedLoan) },
              { label: 'Jatuh Tempo', value: formatDate(selectedLoan.due_at) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start gap-4 py-2 border-b border-slate-100 last:border-0">
                <span className="text-slate-500 text-base font-medium">{label}</span>
                <span className="text-slate-900 text-base font-bold text-right max-w-xs">{value}</span>
              </div>
            ))}
            {photoPath && (
              <div className="flex justify-between py-2">
                <span className="text-slate-500 text-base font-medium">Foto</span>
                <span className="text-emerald-600 text-base font-bold">✓ Terlampir</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 w-full">
            <button
              onClick={reset}
              className={`${kBtn} flex-1 bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-200 shadow-sm`}
            >
              <ArrowLeft size={24} /> Batal
            </button>
            <button
              onClick={() => returnMutation.mutate()}
              disabled={returnMutation.isPending}
              className={`${kBtn} flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30`}
            >
              {returnMutation.isPending
                ? <><Loader2 className="animate-spin" size={24} /> Memproses...</>
                : <><CheckCircle2 size={24} /> Kembalikan Buku</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
