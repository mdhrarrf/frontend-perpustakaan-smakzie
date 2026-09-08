import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/api/auth.service'
import { cn } from '@/utils'
import {
  BookOpen, ClipboardList, AlertTriangle,
  LayoutDashboard, LogOut, RotateCcw,
  ChevronLeft, ChevronRight, Menu,
} from 'lucide-react'

const nav = [
  { to: '/staff/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/staff/borrow',     icon: BookOpen,         label: 'Peminjaman' },
  { to: '/staff/return',     icon: RotateCcw,        label: 'Pengembalian' },
  { to: '/staff/loans',      icon: ClipboardList,    label: 'Riwayat Pinjam' },
  { to: '/staff/violations', icon: AlertTriangle,    label: 'Pelanggaran' },
]

export function StaffLayout() {
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate    = useNavigate()
  const user        = useAuthStore((s) => s.user)
  const logoutStore = useAuthStore((s) => s.logout)

  async function handleLogout() {
    try { await authService.logout() } catch { /* ignore */ }
    logoutStore()
    navigate('/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-200">
        <div className="flex items-center justify-center flex-shrink-0">
          <img src="/logo-smakzie.png" alt="Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
        </div>
        {!collapsed && (
          <div className="ml-3 truncate">
            <p className="text-sm font-semibold text-slate-900 leading-tight">Perpustakaan</p>
            <p className="text-xs text-slate-500">SMK Negeri 1 Cianjur</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              collapsed ? 'justify-center' : '',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className={cn('border-t border-slate-200 p-3', collapsed && 'flex justify-center flex-col items-center')}>
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
              {user?.name?.[0] ?? 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500">Petugas</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm mb-2" title={user?.name ?? 'Petugas'}>
            {user?.name?.[0] ?? 'P'}
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Keluar' : undefined}
        >
          <LogOut size={16} />
          {!collapsed && 'Keluar'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-200 relative',
        collapsed ? 'w-16' : 'w-60'
      )}>
        {sidebarContent}
        {/* Collapse toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-20 -right-3 z-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
          title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-white border-r border-slate-200">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-500 hover:text-slate-700" onClick={() => setMobileOpen(true)}>
              <Menu size={24} />
            </button>
            <span className="font-semibold text-slate-900">Perpustakaan SMK Negeri 1 Cianjur</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-primary-50 text-primary-700 font-medium px-2.5 py-1 rounded-full border border-primary-200">
              Petugas Perpustakaan
            </span>
          </div>
        </div>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
