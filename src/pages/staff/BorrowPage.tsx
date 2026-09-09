import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { studentService } from '@/api/student.service'
import { bookService } from '@/api/book.service'
import { loanService } from '@/api/loan.service'
import { violationService } from '@/api/index'
import { uploadService } from '@/api/index'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { WebcamCapture } from '@/components/kiosk/WebcamCapture'
import { BarcodeScanner } from '@/components/kiosk/BarcodeScanner'
import { LoanStatusBadge } from '@/components/ui/Badge'
import { formatDateTime } from '@/utils'
import { getErrorMessage } from '@/api/client'
import { BookOpen, Users, RotateCcw, CheckCircle2, AlertTriangle, Check, ArrowLeft, ArrowRight } from 'lucide-react'
import type { Student, Book } from '@/types'

type Step = 'find-student' | 'find-book' | 'set-due' | 'photo' | 'confirm' | 'done'

export function StaffBorrowPage() {
  const [step,     setStep]     = useState<Step>('find-student')
  const [student,  setStudent]  = useState<Student | null>(null)
  const [book,     setBook]     = useState<Book | null>(null)
  const [dueAt,    setDueAt]    = useState('')
  const [loanType, setLoanType] = useState<'individual' | 'class'>('individual')
  const [classInfo, setClassInfo] = useState({ class_name: '', teacher_name: '', quantity: '1' })
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [violation, setViolation] = useState<any>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [result,   setResult]   = useState<any>(null)

  async function handleStudentScan(code: string) {
    try {
      const data = await studentService.search(code, 'barcode')
      const s = Array.isArray(data) ? data[0] : data
      setStudent(s)
      setStep('find-book')
      setError(null)
    } catch { setError('Siswa tidak ditemukan.') }
  }

  async function handleBookScan(code: string) {
    try {
      const b = await bookService.scan(code)
      setBook(b)
      if (b.jumlah_tersedia < 1) { setError('Stok buku habis.'); return }
      // Cek violation jika individual
      if (loanType === 'individual' && student) {
        const v = await violationService.check(student.id, b.id)
        if (!v.allowed) { setViolation(v.violation); setError(v.message); return }
      }
      setStep('set-due')
      setError(null)
    } catch { setError('Buku tidak ditemukan.') }
  }

  async function handlePhotoCapture(base64: string) {
    try {
      const { path } = await uploadService.photo(base64, 'borrow')
      setPhotoPath(path)
    } catch { /* photo optional */ }
  }

  const borrowMutation = useMutation({
    mutationFn: () => {
      const payload: any = {
        loan_type:    loanType,
        student_id:   student!.id,
        book_id:      book!.id,
        due_at:       dueAt,
        borrow_photo: photoPath,
      }
      if (loanType === 'class') {
        Object.assign(payload, {
          class_name:   classInfo.class_name,
          teacher_name: classInfo.teacher_name,
          quantity:     Number(classInfo.quantity),
        })
      }
      return loanService.create(payload)
    },
    onSuccess: (loan) => { setResult(loan); setStep('done') },
    onError: (err) => setError(getErrorMessage(err)),
  })

  function reset() {
    setStep('find-student'); setStudent(null); setBook(null)
    setDueAt(''); setPhotoPath(null); setViolation(null); setError(null); setResult(null)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Proses Peminjaman</h1>
        <p className="text-sm text-slate-500">Catat peminjaman buku oleh siswa</p>
      </div>

      {/* Tipe */}
      <div className="flex gap-2">
        {(['individual', 'class'] as const).map((t) => (
          <Button key={t} size="sm" variant={loanType === t ? 'primary' : 'outline'} onClick={() => { setLoanType(t); reset() }}>
            {t === 'individual' ? 'Individu' : 'Peminjaman Kelas'}
          </Button>
        ))}
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2"><AlertTriangle size={16}/>{error}</div>}

      {/* Step: Find Student */}
      {step === 'find-student' && (
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800 flex items-center gap-2"><Users size={18}/> Cari Siswa</h2></CardHeader>
          <CardBody className="space-y-4">
            <BarcodeScanner onScan={handleStudentScan} placeholder="Scan kartu / ketik NIS + Enter" />
            <p className="text-xs text-slate-400 text-center">atau ketik NIS siswa dan tekan Enter</p>
          </CardBody>
        </Card>
      )}

      {/* Step: Find Book */}
      {step === 'find-book' && student && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2"><BookOpen size={18}/> Scan Buku</h2>
              <div className="text-sm text-slate-500">Siswa: <strong>{student.nama}</strong></div>
            </div>
          </CardHeader>
          <CardBody><BarcodeScanner onScan={handleBookScan} placeholder="Scan kode buku / QR + Enter" /></CardBody>
        </Card>
      )}

      {/* Step: Set due date */}
      {step === 'set-due' && book && (
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Atur Jatuh Tempo</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="font-medium">{book.judul}</p>
              <p className="text-slate-500">{book.penulis} — Stok tersedia: {book.jumlah_tersedia}</p>
            </div>
            {loanType === 'class' && (
              <div className="grid grid-cols-2 gap-3">
                <Input label="Nama Kelas" required value={classInfo.class_name} onChange={(e) => setClassInfo(p => ({ ...p, class_name: e.target.value }))} placeholder="X-A" />
                <Input label="Nama Guru" required value={classInfo.teacher_name} onChange={(e) => setClassInfo(p => ({ ...p, teacher_name: e.target.value }))} />
                <Input label="Jumlah Buku" type="number" min="1" max={book.jumlah_tersedia} value={classInfo.quantity} onChange={(e) => setClassInfo(p => ({ ...p, quantity: e.target.value }))} />
              </div>
            )}
            <Input label="Batas Pengembalian" type="datetime-local" required value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('find-book')} className="flex items-center gap-1.5">
                <ArrowLeft size={16} /> Kembali
              </Button>
              <Button onClick={() => setStep('photo')} disabled={!dueAt || (loanType === 'class' && (!classInfo.class_name || !classInfo.teacher_name))} className="flex items-center gap-1.5">
                <span>Lanjut ke Foto</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step: Photo */}
      {step === 'photo' && (
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Foto Dokumentasi (Opsional)</h2></CardHeader>
          <CardBody className="space-y-4">
            <WebcamCapture onCapture={handlePhotoCapture} />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('set-due')} className="flex items-center gap-1.5">
                <ArrowLeft size={16} /> Kembali
              </Button>
              <Button onClick={() => setStep('confirm')} className="flex items-center gap-1.5">
                <span>{photoPath ? 'Lanjut ke Konfirmasi' : 'Lewati & Konfirmasi'}</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && student && book && (
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Konfirmasi Peminjaman</h2></CardHeader>
          <CardBody className="space-y-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Siswa</dt><dd className="font-medium">{student.nama} ({student.nis})</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Buku</dt><dd className="font-medium">{book.judul}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Jatuh Tempo</dt><dd className="font-medium">{new Date(dueAt).toLocaleString('id-ID')}</dd></div>
              {loanType === 'class' && <>
                <div className="flex justify-between"><dt className="text-slate-500">Kelas</dt><dd className="font-medium">{classInfo.class_name}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Jumlah</dt><dd className="font-medium">{classInfo.quantity} buku</dd></div>
              </>}
              {photoPath && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Foto</dt>
                  <dd className="text-emerald-600 font-medium flex items-center gap-1">
                    <Check size={14} strokeWidth={2.5} />
                    Terlampir
                  </dd>
                </div>
              )}
            </dl>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('photo')} className="flex items-center gap-1.5">
                <ArrowLeft size={16} /> Kembali
              </Button>
              <Button loading={borrowMutation.isPending} onClick={() => borrowMutation.mutate()} className="flex items-center gap-1.5">
                <CheckCircle2 size={16} />
                <span>Konfirmasi Peminjaman</span>
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Done */}
      {step === 'done' && result && (
        <Card className="border-green-200">
          <CardBody className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 size={48} className="text-green-500" />
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900">Peminjaman Berhasil!</h2>
              <p className="text-slate-500 font-mono text-sm mt-1">{result.loan_number}</p>
            </div>
            <Button onClick={reset}>Transaksi Baru</Button>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
