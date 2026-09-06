import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { BookOpen, Users, ArrowLeft } from 'lucide-react'

export function KioskBorrowPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <img src="/logo-smakzie.png" alt="Logo" className="w-24 h-24 object-contain mx-auto mb-4 drop-shadow-md" />
        <h1 className="text-3xl font-bold text-white">Peminjaman Buku</h1>
        <p className="text-slate-400 text-lg mt-2">Pilih tipe peminjaman</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl">
        <button
          onClick={() => navigate('/kiosk/borrow/individual')}
          className="flex flex-col items-center gap-4 bg-primary-700 hover:bg-primary-600 active:scale-95 text-white rounded-3xl p-8 transition-all shadow-xl cursor-pointer min-h-[160px] focus:outline-none focus:ring-4 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          <Users size={48} />
          <div className="text-center">
            <span className="text-xl font-bold block">Individu</span>
            <span className="text-sm text-primary-200">1 siswa, 1 buku</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/kiosk/borrow/class')}
          className="flex flex-col items-center gap-4 bg-violet-700 hover:bg-violet-600 active:scale-95 text-white rounded-3xl p-8 transition-all shadow-xl cursor-pointer min-h-[160px] focus:outline-none focus:ring-4 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
          <div className="text-center">
            <span className="text-xl font-bold block">Kelas</span>
            <span className="text-sm text-violet-200">Untuk kegiatan belajar</span>
          </div>
        </button>
      </div>

      <button onClick={() => navigate('/kiosk')} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-lg mt-4">
        <ArrowLeft size={20} /> Kembali
      </button>
    </div>
  )
}
