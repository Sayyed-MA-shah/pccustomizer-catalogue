import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export const metadata = { title: 'Access Requests — Admin' }

const VALID_STATUSES = ['pending', 'approved', 'rejected']

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function StatusBadge({ status }) {
  const variantMap = { pending: 'secondary', approved: 'default', rejected: 'destructive' }
  return <Badge variant={variantMap[status] ?? 'secondary'}>{status}</Badge>
}

export default async function RequestsPage({ searchParams }) {
  const { status: statusFilter } = await searchParams
  const activeFilter = VALID_STATUSES.includes(statusFilter) ? statusFilter : null

  const supabase = await createServiceClient()

  let query = supabase
    .from('access_requests')
    .select('id, user_id, status, business_info, submitted_at, reviewed_at')
    .order('submitted_at', { ascending: false })

  if (activeFilter) {
    query = query.eq('status', activeFilter)
  }

  const { data: requests } = await query

  const filters = [
    { label: 'All', value: null },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Access Requests</h1>

      <div className="flex gap-2 flex-wrap">
        {filters.map(({ label, value }) => {
          const href = value ? `/admin/requests?status=${value}` : '/admin/requests'
          const isActive = activeFilter === value
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm border transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {label}
            </Link>
          )
        })}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="py-2 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">Name</th>
              <th className="py-2 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">Email</th>
              <th className="py-2 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">Company</th>
              <th className="py-2 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">Phone</th>
              <th className="py-2 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">Submitted</th>
              <th className="py-2 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">Status</th>
              <th className="py-2 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {(requests ?? []).map((req) => (
              <tr key={req.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="py-2 px-4 font-medium">{req.business_info?.full_name || '—'}</td>
                <td className="py-2 px-4 text-muted-foreground">{req.business_info?.email || '—'}</td>
                <td className="py-2 px-4 text-muted-foreground">{req.business_info?.company_name || '—'}</td>
                <td className="py-2 px-4 text-muted-foreground">{req.business_info?.phone || '—'}</td>
                <td className="py-2 px-4 text-muted-foreground whitespace-nowrap">{formatDate(req.submitted_at)}</td>
                <td className="py-2 px-4"><StatusBadge status={req.status} /></td>
                <td className="py-2 px-4">
                  <Link href={`/admin/requests/${req.id}`} className="text-sm text-primary hover:underline whitespace-nowrap">
                    Review →
                  </Link>
                </td>
              </tr>
            ))}
            {(!requests || requests.length === 0) && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">No requests found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
