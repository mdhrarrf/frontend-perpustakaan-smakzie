import React from 'react'
import { cn } from '@/utils'

export interface FooterProps {
  variant?: 'default' | 'kiosk' | 'auth'
  className?: string
}

export function Footer({ variant = 'default', className }: FooterProps) {
  const currentYear = 2026

  if (variant === 'auth') {
    return (
      <footer className={cn('text-center text-xs text-slate-400 py-4 select-none', className)}>
        <p className="font-medium text-slate-500">
          &copy; {currentYear} <span className="font-bold text-slate-700">Muhammad Haidar Almer Rafif</span>. All rights reserved.
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Perpustakaan SMK Negeri 1 Cianjur
        </p>
      </footer>
    )
  }

  if (variant === 'kiosk') {
    return (
      <footer className={cn('py-3 px-6 text-center text-xs text-slate-500/90 tracking-wide select-none bg-white/40 backdrop-blur-sm border-t border-slate-200/50', className)}>
        <p>
          &copy; {currentYear} <span className="font-bold text-slate-700">Muhammad Haidar Almer Rafif</span> &middot; Perpustakaan SMK Negeri 1 Cianjur
        </p>
      </footer>
    )
  }

  // Default variant for AdminLayout and StaffLayout
  return (
    <footer className={cn('mt-auto pt-6 pb-2 text-xs text-slate-500 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 select-none', className)}>
      <p className="flex items-center gap-1.5">
        <span>&copy; {currentYear}</span>
        <span className="font-bold text-slate-700">Muhammad Haidar Almer Rafif</span>
        <span className="text-slate-400 hidden sm:inline">&middot;</span>
        <span className="text-slate-500 hidden sm:inline">All rights reserved.</span>
      </p>
      <p className="text-slate-400 text-[11px]">
        Sistem Informasi Perpustakaan SMK Negeri 1 Cianjur
      </p>
    </footer>
  )
}
