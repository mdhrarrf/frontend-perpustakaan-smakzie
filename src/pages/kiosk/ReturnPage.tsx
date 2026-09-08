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
import { ArrowLeft, AlertTriangle, CheckCircle2, Loader2, RotateCcw } from 'lucide-react'
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

  const kBtn = 'flex items-center justify-center gap-3 rounded-2xl font-bold text-xl px-8 py-5 min-h-[80px] transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-900'

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
    } catch { setError('Siswa tidak ditemukan. Pastikan kartu pelajar terbaca dengan benar.') }
    finally { setIsLoading(false) }
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
    <div className="min-h-screen bg-slate-900 flex flex-col p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/kiosk')} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={28} />
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <RotateCcw className="text-teal-400" size={28} />
          Pengembalian Buku Mandiri
        </h1>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-900/50 border border-red-700 rounded-2xl p-5 mb-6">
          <AlertTriangle size={24} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-200 text-lg">{error}</p>
            <button onClick={reset} className="text-red-400 hover:text-red-200 text-sm mt-2 underline">Coba lagi</button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="text-teal-400 animate-spin" size={48} />
            <p className="text-slate-300 text-xl">Memuat data...</p>
          </div>
        </div>
      )}

      {/* Step 1: Scan Student */}
      {step === 'scan-student' && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="text-center">
            <RotateCcw size={64} className="text-teal-400 mx-auto mb-4" />
            <p className="text-white text-3xl font-bold mb-2">Scan Kartu Pelajar</p>
            <p className="text-slate-400 text-xl">Tempelkan kartu pelajar ke scanner atau ketik NIS</p>
          </div>
          <div className="w-full max-w-lg">
            <BarcodeScanner
              onScan={handleStudentScan}
              placeholder="Scan kartu / ketik NIS + Enter"
              kioskMode
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Step 2: Select Loan */}
      {step === 'select-loan' && student && !isLoading && (
        <div className="flex-1 flex flex-col gap-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-teal-900/50 border border-teal-700 rounded-full px-6 py-2.5 mb-4">
              <CheckCircle2 size={20} className="text-teal-400" />
              <span className="text-teal-200 text-lg font-medium">{student.nama}</span>
            </div>
            <p className="text-white text-2xl font-bold">Pilih Buku yang Dikembalikan</p>
            <p className="text-slate-400 text-lg mt-1">Ketuk buku yang ingin Anda kembalikan</p>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto w-full">
            {activeLoans.map((loan) => {
              const isLate = loan.status === 'overdue' || new Date(loan.due_at) < new Date()
              const bookTitle = getLoanBookTitle(loan)
              const item = loan.items?.[0] as any
              const bookAuthor = item?.book?.penulis ?? item?.book_author_snapshot ?? null
              return (
                <button
                  key={loan.id}
                  onClick={() => { setSelectedLoan(loan); setStep('photo') }}
                  className={`w-full text-left bg-slate-800 hover:bg-slate-700 active:scale-[0.98] rounded-2xl p-6 transition-all border-2 ${isLate ? 'border-red-700/60' : 'border-slate-700'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-white text-xl font-semibold">{bookTitle}</p>
                      {bookAuthor && <p className="text-slate-400 mt-1">{bookAuthor}</p>}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="text-slate-400">Dipinjam: {formatDate(loan.borrowed_at)}</span>
                        <span className={isLate ? 'text-red-400 font-medium' : 'text-slate-400'}>
                          Jatuh Tempo: {formatDate(loan.due_at)}
                        </span>
                      </div>
                    </div>
                    {isLate && (
                      <div className="flex-shrink-0 bg-red-900/50 text-red-400 rounded-xl px-4 py-2 text-sm font-bold border border-red-700/40">
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

      {/* Step 3: Photo */}
      {step === 'photo' && selectedLoan && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-white text-2xl font-bold mb-2">Dokumentasi Pengembalian</p>
            <div className="inline-block bg-slate-800 rounded-xl px-5 py-2 mt-1">
              <p className="text-white font-medium">{getLoanBookTitle(selectedLoan)}</p>
            </div>
            <p className="text-slate-400 text-lg mt-3">Foto akan diambil otomatis dalam 5 detik</p>
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
            className="text-slate-500 hover:text-slate-300 text-lg transition-colors"
          >
            Lewati foto →
          </button>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 'confirm' && student && selectedLoan && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-xl mx-auto w-full">
          {new Date(selectedLoan.due_at) < new Date() && (
            <div className="w-full bg-red-900/40 border border-red-700 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <AlertTriangle size={28} className="text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-red-300 text-lg font-semibold">Pengembalian Terlambat</p>
                  <p className="text-red-400 text-base mt-0.5">
                    Sanksi keterlambatan akan dicatat untuk buku ini. Pelanggaran hanya berlaku untuk buku yang terlambat ini.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-800 rounded-3xl p-8 w-full space-y-4">
            <h2 className="text-2xl font-bold text-white text-center mb-2">Konfirmasi Pengembalian</h2>
            {[
              { label: 'Nama',   value: student.nama },
              { label: 'NIS',    value: student.nis },
              { label: 'Buku',   value: getLoanBookTitle(selectedLoan) },
              { label: 'Jatuh Tempo', value: formatDate(selectedLoan.due_at) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start gap-4">
                <span className="text-slate-400 text-lg">{label}</span>
                <span className="text-white text-lg font-medium text-right max-w-xs">{value}</span>
              </div>
            ))}
            {photoPath && (
              <div className="flex justify-between">
                <span className="text-slate-400 text-lg">Foto</span>
                <span className="text-teal-400 text-lg">✓ Terlampir</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 w-full">
            <button
              onClick={reset}
              className={`${kBtn} flex-1 bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500`}
            >
              <ArrowLeft size={24} /> Batal
            </button>
            <button
              onClick={() => returnMutation.mutate()}
              disabled={returnMutation.isPending}
              className={`${kBtn} flex-1 bg-teal-600 hover:bg-teal-500 text-white focus:ring-teal-400`}
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
