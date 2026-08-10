import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'
import { ClipboardList } from 'lucide-react'

export const metadata = { title: 'Access Requests — Admin' }

const VALID_STATUSES = ['pending', 'approved', 'rejected']

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const filters = [
  { label: 'All', value: null },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

export default async function RequestsPage({ searchParams }) {
  const { status: statusFilter } = await searchParams
  const activeFilter = VALID_STATUSES.includes(statusFilter) ? statusFilter : null

  const supabase = await createServiceClient()

  let query = supabase
    .from('access_requests')
    .select('id, status, business_info, submitted_at, reviewed_at')
    .order('submitted_at', { ascending: false })

  if (activeFilter) query = query.eq('status', activeFilter)

  const { data: requests } = await query

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Requests"
        subtitle="Review and manage incoming trade account applications."
      />

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap border-b pb-px">
        {filters.map(({ label, value }) => {
          const href = value ? `/admin/requests?status=${value}` : '/admin/requests'
          const isActive = activeFilter === value
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-t transition-colors border-b-2 -mb-px',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </Link>
          )
        })}
        <span className="ml-auto text-xs text-muted-foreground self-center pr-1">
          {requests?.length ?? 0} result{requests?.length !== 1 ? 's' : ''}
        </span>
      </div>

      {requests && requests.length > 0 ? (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Company</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Email</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Submitted</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground">{req.business_info?.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{req.business_info?.company_name}</p>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                      {req.business_info?.company_name || '—'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                      {req.business_info?.email || '—'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                      {formatDate(req.submitted_at)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/requests/${req.id}`}
                        className="text-xs font-medium text-primary hover:underline underline-offset-4 whitespace-nowrap"
                      >
                        {req.status === 'pending' ? 'Review →' : 'View →'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No requests found"
          description={activeFilter ? `No ${activeFilter} requests at this time.` : 'No access requests have been submitted yet.'}
        />
      )}
    </div>
  )
}
