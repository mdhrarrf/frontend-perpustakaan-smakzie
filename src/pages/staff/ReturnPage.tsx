import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { studentService } from '@/api/student.service'
import { loanService } from '@/api/loan.service'
import { uploadService } from '@/api/index'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { WebcamCapture } from '@/components/kiosk/WebcamCapture'
import { BarcodeScanner } from '@/components/kiosk/BarcodeScanner'
import { LoanStatusBadge } from '@/components/ui/Badge'
import { formatDateTime } from '@/utils'
import { getErrorMessage } from '@/api/client'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import type { Student, Loan } from '@/types'

type Step = 'find-student' | 'select-loan' | 'photo' | 'done'

export function StaffReturnPage() {
  const [step,      setStep]    = useState<Step>('find-student')
  const [student,   setStudent] = useState<Student | null>(null)
  const [activeLoans, setActiveLoans] = useState<Loan[]>([])
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [photoPath,  setPhotoPath] = useState<string | null>(null)
  const [error,     setError]   = useState<string | null>(null)
  const [result,    setResult]  = useState<any>(null)

  async function handleStudentScan(code: string) {
    try {
      const data = await studentService.search(code, 'barcode')
      const s = Array.isArray(data) ? data[0] : data
      setStudent(s)
      // Ambil active loans
      const loanData = await studentService.loans(s.id, { status: 'active' })
      const loans = loanData.data?.data ?? []
      if (loans.length === 0) { setError('Siswa tidak memiliki peminjaman aktif.'); return }
      setActiveLoans(loans)
      setStep('select-loan')
      setError(null)
    } catch { setError('Siswa tidak ditemukan.') }
  }

  async function handlePhotoCapture(base64: string) {
    try {
      const { path } = await uploadService.photo(base64, 'return')
      setPhotoPath(path)
    } catch { /* optional */ }
  }

  const returnMutation = useMutation({
    mutationFn: () => loanService.processReturn(selectedLoan!.id, { return_photo: photoPath ?? undefined }),
    onSuccess: (res) => { setResult(res); setStep('done') },
    onError:   (err) => setError(getErrorMessage(err)),
  })

  function reset() {
    setStep('find-student'); setStudent(null); setActiveLoans([])
    setSelectedLoan(null); setPhotoPath(null); setError(null); setResult(null)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Proses Pengembalian</h1>
        <p className="text-sm text-slate-500">Catat pengembalian buku oleh siswa</p>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2"><AlertTriangle size={16}/>{error}</div>}

      {step === 'find-student' && (
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Cari Siswa</h2></CardHeader>
          <CardBody><BarcodeScanner onScan={handleStudentScan} placeholder="Scan kartu / ketik NIS + Enter" /></CardBody>
        </Card>
      )}

      {step === 'select-loan' && student && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Pilih Buku yang Dikembalikan</h2>
              <span className="text-sm text-slate-500">{student.nama}</span>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {activeLoans.map((loan) => (
              <button
                key={loan.id}
                onClick={() => { setSelectedLoan(loan); setStep('photo') }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${selectedLoan?.id === loan.id ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-primary-300'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{loan.items?.[0]?.book?.judul}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Jatuh Tempo: {formatDateTime(loan.due_at)}</p>
                    <p className="text-xs font-mono text-slate-400">{loan.loan_number}</p>
                  </div>
                  <LoanStatusBadge status={loan.status} label={loan.status_label} />
                </div>
              </button>
            ))}
          </CardBody>
        </Card>
      )}

      {step === 'photo' && selectedLoan && (
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Foto Dokumentasi Pengembalian (Opsional)</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="font-medium">{selectedLoan.items?.[0]?.book?.judul}</p>
              <p className="text-slate-500">{formatDateTime(selectedLoan.due_at)}</p>
            </div>
            <WebcamCapture onCapture={handlePhotoCapture} />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('select-loan')}>← Kembali</Button>
              <Button loading={returnMutation.isPending} onClick={() => returnMutation.mutate()}>
                ✓ Konfirmasi Pengembalian
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {step === 'done' && result && (
        <Card className={result.is_late ? 'border-red-200' : 'border-green-200'}>
          <CardBody className="flex flex-col items-center gap-4 py-8">
            {result.is_late ? (
              <>
                <AlertTriangle size={48} className="text-red-500" />
                <div className="text-center">
                  <h2 className="text-xl font-bold text-red-700">Terlambat {result.late_days} Hari!</h2>
                  <p className="text-slate-500 mt-1">Pelanggaran telah dicatat. Sanksi untuk buku ini selama {result.late_days} hari.</p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 size={48} className="text-green-500" />
                <div className="text-center">
                  <h2 className="text-xl font-bold text-slate-900">Pengembalian Berhasil!</h2>
                  <p className="text-slate-500 mt-1">Buku telah dikembalikan tepat waktu.</p>
                </div>
              </>
            )}
            <Button onClick={reset}>Transaksi Baru</Button>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
