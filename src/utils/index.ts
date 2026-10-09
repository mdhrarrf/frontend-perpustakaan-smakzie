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

// ── Title Case / Indonesian PUEBI Casing ─────────────────────────────────────
const LOWERCASE_WORDS = new Set([
  'dan', 'atau', 'ke', 'di', 'dari', 'pada', 'untuk', 'tentang', 'dengan',
  'yang', 'terhadap', 'dalam', 'oleh', 'sebagai', 'serta', 'binti', 'bin',
  'dkk', 'dll'
])

const ACRONYMS = new Set([
  'smk', 'sma', 'smp', 'sd', 'mak', 'rpl', 'tkj', 'dkv', 'akl', 'mplb',
  'pplg', 'tbsm', 'tkr', 'titl', 'it', 'php', 'sql', 'html', 'css', 'js',
  'ai', 'bos', 'ddc', 'isbn', 'puebi', 'eyd', 'ipa', 'ips', 'ppkn', 'pjok',
  'pai', 'ski', 'myob', 'kbbi'
])

const ROMAN_NUMERALS = /^(?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$/i

function subWordCase(w: string, isFirst: boolean): string {
  const match = w.match(/^([(\["'“]*)(.*?)([)\]"'”.,:;!?]*)$/)
  if (!match) return w
  const prefix = match[1]
  const clean  = match[2]
  const suffix = match[3]

  if (!clean) return w
  const lower = clean.toLowerCase()

  let formatted = ''
  if (ROMAN_NUMERALS.test(lower) && lower.length > 0) {
    formatted = lower.toUpperCase()
  } else if (ACRONYMS.has(lower)) {
    formatted = lower.toUpperCase()
  } else if (!isFirst && LOWERCASE_WORDS.has(lower)) {
    formatted = lower
  } else {
    formatted = lower.charAt(0).toUpperCase() + lower.slice(1)
  }

  return prefix + formatted + suffix
}

export function toTitleCase(title: string | null | undefined): string {
  if (!title) return ''
  const trimmed = title.trim()
  if (!trimmed) return ''

  const words = trimmed.split(/\s+/)
  return words.map((w, idx) => {
    if (w.includes('/')) {
      return w.split('/').map((sub, subIdx) => subWordCase(sub, idx === 0 && subIdx === 0)).join('/')
    }
    if (w.includes('-')) {
      return w.split('-').map((sub, subIdx) => subWordCase(sub, idx === 0 && subIdx === 0)).join('-')
    }
    return subWordCase(w, idx === 0)
  }).join(' ')
}

// ── Student NIS Formatting ──────────────────────────────────────────────────
/**
 * Format NIS siswa.
 * Jika NIS kosong, diawali TMP (belum ada dari pusat), atau '-', tampilkan '-' / '—'.
 */
export function formatNis(nis?: string | null): string {
  if (!nis || nis.startsWith('TMP') || nis.trim() === '-') {
    return '—'
  }
  return nis.trim()
}

/**
 * Format tampilan nama dan NIS siswa.
 * Contoh: "Adil Jaelani" (jika belum ada NIS) atau "Adil Jaelani (242510109)" (jika ada NIS).
 */
export function formatStudentLabel(student?: { nama?: string; nis?: string | null } | null): string {
  if (!student?.nama) return '—'
  const formattedNis = formatNis(student.nis)
  if (formattedNis === '—') {
    return student.nama
  }
  return `${student.nama} (${formattedNis})`
}

