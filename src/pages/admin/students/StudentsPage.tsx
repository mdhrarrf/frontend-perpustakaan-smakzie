import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentService, type StudentClass } from '@/api/student.service'
import { Card, CardHeader, CardBody, EmptyState } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { Users, Plus, Search, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { getErrorMessage } from '@/api/client'
import type { Student } from '@/types'

interface StudentFormData {
  nis: string
  nisn: string
  nama: string
  kelas: string
  angkatan: string
  jenis_kelamin: string
  status: string
}

function StudentFormModal({ student, onClose, classList }: { student?: Student; onClose: () => void; classList?: StudentClass[] }) {
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!student

  const { register, handleSubmit } = useForm<StudentFormData>({
    defaultValues: student
      ? { nis: student.nis, nisn: student.nisn ?? '', nama: student.nama, kelas: student.kelas ?? '', angkatan: student.angkatan?.toString() ?? '', jenis_kelamin: student.jenis_kelamin ?? '', status: student.status }
      : { status: 'active' },
  })

  const saveMutation = useMutation({
    mutationFn: (data: StudentFormData) => {
      const payload = {
        ...data,
        angkatan: data.angkatan ? Number(data.angkatan) : undefined,
        nisn: data.nisn || undefined,
        jenis_kelamin: (data.jenis_kelamin as 'L' | 'P') || undefined,
        status: data.status as 'active' | 'inactive' | 'alumni',
      }
      return isEdit
        ? studentService.update(student!.id, payload)
        : studentService.create(payload)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-students'] }); onClose() },
    onError: (err: unknown) => setError(getErrorMessage(err)),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{isEdit ? 'Edit Siswa' : 'Tambah Siswa'}</h2>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" title="Tutup">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="p-6 space-y-4">
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <Input {...register('nis', { required: true })} label="NIS" required />
            <Input {...register('nisn')} label="NISN" />
            <Input {...register('nama', { required: true })} label="Nama Lengkap" required className="col-span-2" />
            <div>
              <label className="text-sm font-medium text-slate-700">Kelas</label>
              <select
                {...register('kelas')}
                className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">— Pilih Kelas —</option>
                {['X', 'XI', 'XII'].map((t) => {
                  const group = (classList ?? []).filter((c) => c.tingkat === t)
                  if (group.length === 0) return null
                  return (
                    <optgroup key={t} label={`Tingkat ${t}`}>
                      {group.map((c) => (
                        <option key={c.id} value={c.nama}>{c.nama}</option>
                      ))}
                    </optgroup>
                  )
                })}
              </select>
            </div>
            <Input {...register('angkatan')} label="Angkatan" type="number" placeholder="2024" />
            <div>
              <label className="text-sm font-medium text-slate-700">Jenis Kelamin</label>
              <select {...register('jenis_kelamin')} className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">— Pilih —</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select {...register('status')} className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
                <option value="alumni">Alumni</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" loading={saveMutation.isPending}>{isEdit ? 'Simpan' : 'Tambah'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AdminStudentsPage() {
  const [q, setQ]             = useState('')
  const [tingkat, setTingkat] = useState('')
  const [kelas, setKelas]     = useState('')
  const [page, setPage]       = useState(1)
  const [showForm, setShowForm]       = useState(false)
  const [editStudent, setEditStudent] = useState<Student | undefined>(undefined)

  const { data: classList } = useQuery({
    queryKey: ['student-classes'],
    queryFn: studentService.classes,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-students', { q, tingkat, kelas, page }],
    queryFn: () => studentService.list({ q, tingkat: tingkat || undefined, kelas: kelas || undefined, page }),
  })

  const availableClasses = (classList ?? []).filter((c) => {
    if (!tingkat) return true
    return c.tingkat === tingkat
  })

  const students: Student[] = (data?.data as any)?.data ?? []
  const meta = (data?.data as any)?.meta ?? data?.data

  return (
    <div className="space-y-5">
      {(showForm || editStudent) && (
        <StudentFormModal
          student={editStudent}
          classList={classList}
          onClose={() => { setShowForm(false); setEditStudent(undefined) }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Siswa</h1>
          <p className="text-sm text-slate-500">Data siswa terdaftar di perpustakaan</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> Tambah Siswa</Button>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Cari nama, NIS, NISN..."
                leftIcon={<Search size={15} />}
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1) }}
              />
            </div>

            {/* Dropdown Tingkat */}
            <select
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              value={tingkat}
              onChange={(e) => {
                const val = e.target.value
                setTingkat(val)
                setKelas('')
                setPage(1)
              }}
            >
              <option value="">Semua Tingkat</option>
              <option value="X">Tingkat X</option>
              <option value="XI">Tingkat XI</option>
              <option value="XII">Tingkat XII</option>
            </select>

            {/* Dropdown Kelas */}
            <select
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white min-w-[160px]"
              value={kelas}
              onChange={(e) => { setKelas(e.target.value); setPage(1) }}
            >
              <option value="">
                {tingkat ? `Semua Kelas ${tingkat}` : 'Semua Kelas'}
              </option>
              {tingkat ? (
                availableClasses.map((c) => (
                  <option key={c.id} value={c.nama}>{c.nama}</option>
                ))
              ) : (
                ['X', 'XI', 'XII'].map((t) => {
                  const group = (classList ?? []).filter((c) => c.tingkat === t)
                  if (group.length === 0) return null
                  return (
                    <optgroup key={t} label={`Tingkat ${t}`}>
                      {group.map((c) => (
                        <option key={c.id} value={c.nama}>{c.nama}</option>
                      ))}
                    </optgroup>
                  )
                })
              )}
            </select>
          </div>
        </CardBody>
      </Card>

      <Card>
        {isLoading ? (
          <CardBody><div className="h-40 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" /></div></CardBody>
        ) : students.length === 0 ? (
          <CardBody>
            <EmptyState icon={<Users size={48} />} title="Belum ada data siswa" description="Tambah siswa atau import dari file Excel." />
          </CardBody>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left">Siswa</th>
                    <th className="px-6 py-3 text-left">NIS / NISN</th>
                    <th className="px-6 py-3 text-left">Kelas</th>
                    <th className="px-6 py-3 text-left">Angkatan</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
                            {s.nama[0]}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{s.nama}</p>
                            <p className="text-xs text-slate-400">{s.jenis_kelamin === 'L' ? 'Laki-laki' : s.jenis_kelamin === 'P' ? 'Perempuan' : '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-mono text-xs">{s.nis}</p>
                        {s.nisn && <p className="font-mono text-xs text-slate-400">{s.nisn}</p>}
                      </td>
                      <td className="px-6 py-3 text-slate-700">{s.kelas ?? '—'}</td>
                      <td className="px-6 py-3 text-slate-700">{s.angkatan ?? '—'}</td>
                      <td className="px-6 py-3">
                        <Badge variant={s.status === 'active' ? 'success' : s.status === 'alumni' ? 'info' : 'warning'}>
                          {s.status_label}
                        </Badge>
                      </td>
                      <td className="px-6 py-3">
                        <Button size="sm" variant="ghost" onClick={() => setEditStudent(s)}>Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && (
              <Pagination
                meta={meta}
                currentPage={page}
                onPageChange={setPage}
                itemLabel="siswa"
              />
            )}
          </>
        )}
      </Card>
    </div>
  )
}
