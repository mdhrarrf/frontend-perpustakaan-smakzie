import React, { useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { cn } from '@/utils'

export interface PaginationProps {
  currentPage: number
  lastPage: number
  total?: number
  perPage?: number
  from?: number | null
  to?: number | null
  onPageChange: (page: number) => void
  itemLabel?: string
  className?: string
  showQuickJump?: boolean
}

export function Pagination({
  currentPage,
  lastPage,
  total,
  perPage,
  from,
  to,
  onPageChange,
  itemLabel = 'data',
  className,
  showQuickJump = true,
}: PaginationProps) {
  const [jumpPage, setJumpPage] = useState('')

  useEffect(() => {
    setJumpPage('')
  }, [currentPage])

  if (!lastPage || lastPage <= 0) return null

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault()
    const target = parseInt(jumpPage, 10)
    if (!isNaN(target) && target >= 1 && target <= lastPage && target !== currentPage) {
      onPageChange(target)
      setJumpPage('')
    }
  }

  // Calculate from & to if not provided but total and perPage exist
  const displayFrom = from ?? (total && perPage ? Math.min((currentPage - 1) * perPage + 1, total) : null)
  const displayTo = to ?? (total && perPage ? Math.min(currentPage * perPage, total) : null)

  const getPageNumbers = (): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
    if (lastPage <= 7) {
      return Array.from({ length: lastPage }, (_, i) => i + 1)
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis-end', lastPage]
    }

    if (currentPage >= lastPage - 3) {
      return [1, 'ellipsis-start', lastPage - 4, lastPage - 3, lastPage - 2, lastPage - 1, lastPage]
    }

    return [1, 'ellipsis-start', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-end', lastPage]
  }

  const pages = getPageNumbers()

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-white/50 select-none',
        className
      )}
    >
      {/* Info data */}
      <div className="text-xs sm:text-sm text-slate-500 font-normal">
        {total !== undefined && total > 0 ? (
          <>
            Menampilkan{' '}
            <span className="font-semibold text-slate-700">
              {displayFrom !== null ? displayFrom.toLocaleString('id-ID') : '1'}
            </span>
            {' '}-{' '}
            <span className="font-semibold text-slate-700">
              {displayTo !== null ? displayTo.toLocaleString('id-ID') : total.toLocaleString('id-ID')}
            </span>
            {' '}dari{' '}
            <span className="font-semibold text-slate-800">
              {total.toLocaleString('id-ID')}
            </span>{' '}
            {itemLabel}
          </>
        ) : (
          <span>Halaman <span className="font-semibold text-slate-700">{currentPage}</span> dari <span className="font-semibold text-slate-700">{lastPage}</span></span>
        )}
      </div>

      {/* Navigation & Controls */}
      {lastPage > 1 && (
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          {/* First Page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            title="Halaman Pertama"
            className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronsLeft size={16} />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            title="Halaman Sebelumnya"
            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm font-medium transition"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          {/* Page Numbers */}
          <div className="hidden sm:flex items-center gap-1">
            {pages.map((p, idx) => {
              if (p === 'ellipsis-start' || p === 'ellipsis-end') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-8 text-center text-slate-400 font-bold select-none text-xs"
                  >
                    ...
                  </span>
                )
              }

              const isActive = p === currentPage
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-semibold transition flex items-center justify-center',
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                  )}
                >
                  {p}
                </button>
              )
            })}
          </div>

          {/* Mobile Current Page Indicator */}
          <span className="sm:hidden px-2 text-xs font-semibold text-slate-700">
            {currentPage} / {lastPage}
          </span>

          {/* Next Page */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= lastPage}
            title="Halaman Berikutnya"
            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm font-medium transition"
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight size={16} />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => onPageChange(lastPage)}
            disabled={currentPage >= lastPage}
            title="Halaman Terakhir"
            className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronsRight size={16} />
          </button>

          {/* Quick Jump (for many pages) */}
          {showQuickJump && lastPage > 5 && (
            <form onSubmit={handleJump} className="hidden md:flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200">
              <span className="text-xs text-slate-400">Ke:</span>
              <input
                type="number"
                min={1}
                max={lastPage}
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                placeholder={currentPage.toString()}
                className="w-12 px-1.5 py-1 border border-slate-200 rounded-lg text-center text-xs text-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
              >
                Go
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
