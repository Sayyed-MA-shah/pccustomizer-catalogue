import { createServiceClient } from '@/lib/supabase/server'
import { ClipboardList, Users, XCircle, UserX, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import StatCard from '@/components/shared/StatCard'
import StatusBadge from '@/components/shared/StatusBadge'

export const metadata = { title: 'Dashboard — Admin' }

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminDashboard() {
  const supabase = await createServiceClient()

  const [
    { count: pending },
    { count: approved },
    { count: rejected },
    { count: revoked },
    { data: recent },
  ] = await Promise.all([
    supabase.from('access_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('customer_profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('access_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase.from('customer_profiles').select('*', { count: 'exact', head: true }).eq('status', 'revoked'),
    supabase
      .from('access_requests')
      .select('id, status, submitted_at, business_info')
      .order('submitted_at', { ascending: false })
      .limit(8),
  ])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of access requests and customer accounts."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending requests"
          value={pending ?? 0}
          icon={ClipboardList}
          href="/admin/requests?status=pending"
          highlight={(pending ?? 0) > 0}
          description={(pending ?? 0) > 0 ? 'Needs review' : 'All clear'}
        />
        <StatCard
          label="Approved customers"
          value={approved ?? 0}
          icon={Users}
          href="/admin/customers"
        />
        <StatCard
          label="Rejected requests"
          value={rejected ?? 0}
          icon={XCircle}
          href="/admin/requests?status=rejected"
        />
        <StatCard
          label="Revoked accounts"
          value={revoked ?? 0}
          icon={UserX}
          href="/admin/customers?status=revoked"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Recent requests</h2>
          <Link
            href="/admin/requests"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Submitted</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(recent ?? []).map((req) => (
                  <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">
                      {req.business_info?.full_name || '—'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {req.business_info?.company_name || '—'}
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
                        className="text-xs font-medium text-primary hover:underline underline-offset-4"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!recent || recent.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                      No requests yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
