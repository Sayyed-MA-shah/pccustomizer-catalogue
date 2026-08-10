import { createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export const metadata = { title: 'Dashboard — Admin' }

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function StatusBadge({ status }) {
  const variantMap = {
    pending: 'secondary',
    approved: 'default',
    rejected: 'destructive',
    revoked: 'outline',
  }
  return <Badge variant={variantMap[status] ?? 'secondary'}>{status}</Badge>
}

export default async function AdminDashboard() {
  const supabase = await createServiceClient()

  const [
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
    { data: recentRequests },
  ] = await Promise.all([
    supabase.from('access_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('customer_profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('access_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase
      .from('access_requests')
      .select('id, status, submitted_at, business_info')
      .order('submitted_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'Pending requests', value: pendingCount ?? 0, href: '/admin/requests?status=pending', urgent: (pendingCount ?? 0) > 0 },
    { label: 'Approved customers', value: approvedCount ?? 0, href: '/admin/customers' },
    { label: 'Rejected requests', value: rejectedCount ?? 0, href: '/admin/requests?status=rejected' },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, href, urgent }) => (
          <Link key={label} href={href} className="block">
            <Card className={cn('hover:border-primary transition-colors cursor-pointer', urgent && 'border-primary')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn('text-3xl font-bold', urgent && 'text-primary')}>{value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent requests</h2>
          <Link href="/admin/requests" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
            View all
          </Link>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-2 px-4 text-left font-medium text-muted-foreground">Name</th>
                <th className="py-2 px-4 text-left font-medium text-muted-foreground">Company</th>
                <th className="py-2 px-4 text-left font-medium text-muted-foreground">Submitted</th>
                <th className="py-2 px-4 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {(recentRequests ?? []).map((req) => (
                <tr key={req.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-2 px-4">
                    <Link href={`/admin/requests/${req.id}`} className="hover:underline font-medium">
                      {req.business_info?.full_name || '—'}
                    </Link>
                  </td>
                  <td className="py-2 px-4 text-muted-foreground">{req.business_info?.company_name || '—'}</td>
                  <td className="py-2 px-4 text-muted-foreground whitespace-nowrap">{formatDate(req.submitted_at)}</td>
                  <td className="py-2 px-4"><StatusBadge status={req.status} /></td>
                </tr>
              ))}
              {(!recentRequests || recentRequests.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">No requests yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
