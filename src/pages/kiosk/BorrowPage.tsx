import { useNavigate } from 'react-router-dom'
import { BookOpen, Users, ArrowLeft } from 'lucide-react'

export function KioskBorrowPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/50 flex flex-col items-center justify-center gap-8 p-8 relative">
      {/* Decorative ambient background */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center z-10">
        <img src="/logo-smakzie.png" alt="Logo" className="w-24 h-24 object-contain mx-auto mb-4 drop-shadow-md" />
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Peminjaman Buku</h1>
        <p className="text-slate-600 text-lg mt-2 font-medium">Pilih jenis peminjaman yang Anda perlukan</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl z-10">
        <button
          onClick={() => navigate('/kiosk/borrow/individual')}
          className="group flex flex-col items-center gap-4 bg-gradient-to-br from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:scale-95 text-white rounded-3xl p-8 transition-all shadow-xl shadow-indigo-500/20 cursor-pointer min-h-[180px] focus:outline-none focus:ring-4 focus:ring-indigo-300 border border-indigo-400/20"
        >
          <div className="p-4 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform">
            <Users size={48} />
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold block">Individu</span>
            <span className="text-sm text-indigo-100 font-medium">1 siswa, 1 buku mandiri</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/kiosk/borrow/class')}
          className="group flex flex-col items-center gap-4 bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 active:scale-95 text-white rounded-3xl p-8 transition-all shadow-xl shadow-purple-500/20 cursor-pointer min-h-[180px] focus:outline-none focus:ring-4 focus:ring-purple-300 border border-purple-400/20"
        >
          <div className="p-4 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold block">Kelas</span>
            <span className="text-sm text-purple-100 font-medium">Buku rombel untuk kegiatan belajar</span>
          </div>
        </button>
      </div>

      <button
        onClick={() => navigate('/kiosk')}
        className="flex items-center gap-2 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/90 px-6 py-3 rounded-full text-base font-bold shadow-sm transition-all z-10"
      >
        <ArrowLeft size={20} /> Kembali ke Layar Utama
      </button>
    </div>
  )
}
