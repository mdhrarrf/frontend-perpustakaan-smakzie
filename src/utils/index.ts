import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistance, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Date Formatting ──────────────────────────────────────────────────────────
export function formatDate(date: string | Date | null | undefined, fmt = 'd MMM yyyy'): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt, { locale: idLocale })
  } catch {
    return '—'
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'd MMM yyyy, HH:mm')
}

export function formatTimeAgo(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistance(d, new Date(), { addSuffix: true, locale: idLocale })
  } catch {
    return '—'
  }
}

// ── Number Formatting ────────────────────────────────────────────────────────
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

// ── Loan Status Badge ────────────────────────────────────────────────────────
export function getLoanStatusColor(status: string): string {
  return {
    active:   'bg-blue-100 text-blue-700 border-blue-200',
    returned: 'bg-green-100 text-green-700 border-green-200',
    overdue:  'bg-red-100 text-red-700 border-red-200',
    lost:     'bg-slate-100 text-slate-600 border-slate-200',
  }[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
}

export function getViolationStatusColor(status: string): string {
  return {
    active:   'bg-red-100 text-red-700 border-red-200',
    expired:  'bg-slate-100 text-slate-600 border-slate-200',
    resolved: 'bg-green-100 text-green-700 border-green-200',
  }[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
}

export function getBookStatusColor(status: string): string {
  return {
    active:   'bg-green-100 text-green-700 border-green-200',
    inactive: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    archived: 'bg-slate-100 text-slate-600 border-slate-200',
  }[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
}

// ── Truncate ─────────────────────────────────────────────────────────────────
export function truncate(str: string | null | undefined, maxLength: number): string {
  if (!str) return '—'
  return str.length > maxLength ? str.substring(0, maxLength) + '…' : str
}
