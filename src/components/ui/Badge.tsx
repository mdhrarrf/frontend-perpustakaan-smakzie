import { cn } from '@/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger:  'bg-red-100 text-red-700',
    info:    'bg-blue-100 text-blue-700',
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}

// Status badge berdasarkan string
interface StatusBadgeProps { status: string; label?: string }

export function LoanStatusBadge({ status, label }: StatusBadgeProps) {
  const map: Record<string, { cls: string; text: string }> = {
    active:   { cls: 'bg-blue-100 text-blue-700',   text: 'Aktif' },
    returned: { cls: 'bg-green-100 text-green-700',  text: 'Dikembalikan' },
    overdue:  { cls: 'bg-red-100 text-red-700',     text: 'Terlambat' },
    lost:     { cls: 'bg-slate-100 text-slate-500', text: 'Hilang' },
  }
  const d = map[status] ?? { cls: 'bg-slate-100 text-slate-500', text: status }
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', d.cls)}>{label ?? d.text}</span>
}

export function BookStatusBadge({ status, label }: StatusBadgeProps) {
  const map: Record<string, { cls: string; text: string }> = {
    active:   { cls: 'bg-green-100 text-green-700',  text: 'Aktif' },
    inactive: { cls: 'bg-yellow-100 text-yellow-700', text: 'Tidak Aktif' },
    archived: { cls: 'bg-slate-100 text-slate-500',  text: 'Diarsipkan' },
  }
  const d = map[status] ?? { cls: 'bg-slate-100 text-slate-500', text: status }
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', d.cls)}>{label ?? d.text}</span>
}

export function ViolationStatusBadge({ status, label }: StatusBadgeProps) {
  const map: Record<string, { cls: string; text: string }> = {
    active:   { cls: 'bg-red-100 text-red-700',     text: 'Aktif' },
    expired:  { cls: 'bg-slate-100 text-slate-500', text: 'Kadaluarsa' },
    resolved: { cls: 'bg-green-100 text-green-700', text: 'Diselesaikan' },
  }
  const d = map[status] ?? { cls: 'bg-slate-100 text-slate-500', text: status }
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', d.cls)}>{label ?? d.text}</span>
}
