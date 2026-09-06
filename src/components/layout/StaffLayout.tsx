import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/api/auth.service'
import { cn } from '@/utils'
import {
  BookOpen, ClipboardList, AlertTriangle,
  LayoutDashboard, LogOut, RotateCcw,
} from 'lucide-react'

const nav = [
  { to: '/staff/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/staff/borrow',     icon: BookOpen,         label: 'Peminjaman' },
  { to: '/staff/return',     icon: RotateCcw,        label: 'Pengembalian' },
  { to: '/staff/loans',      icon: ClipboardList,    label: 'Riwayat Pinjam' },
  { to: '/staff/violations', icon: AlertTriangle,    label: 'Pelanggaran' },
]

export function StaffLayout() {
  const navigate    = useNavigate()
  const user        = useAuthStore((s) => s.user)
  const logoutStore = useAuthStore((s) => s.logout)

  async function handleLogout() {
    try { await authService.logout() } catch { /* ignore */ }
    logoutStore()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-200">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">Perpustakaan</p>
            <p className="text-xs text-slate-500">Petugas</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
              {user?.name?.[0] ?? 'P'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500">Petugas</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
