import { useQuery } from '@tanstack/react-query'
import { auditService } from '@/api/index'
import { Card, CardBody } from '@/components/ui/Card'
import { formatDateTime } from '@/utils'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function AdminAuditLogsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => auditService.list({ page }),
  })

  const logs = data?.data?.data ?? []
  const meta = data?.data

  const actionColors: Record<string, string> = {
    create: 'text-green-600', update: 'text-blue-600',
    delete: 'text-red-600',  borrow: 'text-purple-600',
    return: 'text-teal-600', mark_lost: 'text-orange-600',
    resolve: 'text-green-600',
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
      <Card>
        {isLoading ? (
          <CardBody><div className="h-40 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" /></div></CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left">Waktu</th>
                  <th className="px-6 py-3 text-left">User ID</th>
                  <th className="px-6 py-3 text-left">Role</th>
                  <th className="px-6 py-3 text-left">Modul</th>
                  <th className="px-6 py-3 text-left">Aksi</th>
                  <th className="px-6 py-3 text-left">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-3 text-xs text-slate-500">{formatDateTime(log.created_at)}</td>
                    <td className="px-6 py-3 text-xs font-mono">{log.user_id ?? 'kiosk'}</td>
                    <td className="px-6 py-3 text-xs">{log.role ?? '—'}</td>
                    <td className="px-6 py-3 text-xs">{log.module}</td>
                    <td className={`px-6 py-3 text-xs font-semibold ${actionColors[log.action] ?? 'text-slate-600'}`}>{log.action}</td>
                    <td className="px-6 py-3 text-xs text-slate-600 max-w-xs truncate">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">Total: {meta.total} log</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
                  <Button size="sm" variant="outline" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Berikutnya</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
