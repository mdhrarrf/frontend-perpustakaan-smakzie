import { cn } from '@/utils'
import { Loader2 } from 'lucide-react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-100', className)}>
      {children}
    </div>
  )
}

export function CardBody({ children, className }: CardProps) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  )
}

// Stat card for dashboard
interface StatCardProps {
  label: string
  value: number | string
  icon?: React.ReactNode
  trend?: { value: string; up?: boolean }
  color?: 'default' | 'blue' | 'green' | 'red' | 'yellow' | 'purple'
}

export function StatCard({ label, value, icon, trend, color = 'default' }: StatCardProps) {
  const colors = {
    default: 'bg-slate-50  text-slate-600',
    blue:    'bg-blue-50   text-blue-600',
    green:   'bg-green-50  text-green-600',
    red:     'bg-red-50    text-red-600',
    yellow:  'bg-yellow-50 text-yellow-600',
    purple:  'bg-purple-50 text-purple-600',
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
          {trend && (
            <p className={cn('mt-1 text-xs', trend.up ? 'text-green-600' : 'text-red-600')}>
              {trend.up ? '▲' : '▼'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('p-2.5 rounded-xl', colors[color])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

// Loading state
export function LoadingCard() {
  return (
    <Card className="flex items-center justify-center p-12">
      <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
    </Card>
  )
}

// Empty state
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4 text-slate-300">{icon}</div>}
      <h3 className="text-sm font-medium text-slate-700">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
