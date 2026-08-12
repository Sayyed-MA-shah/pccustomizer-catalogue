import { createServiceClient } from '@/lib/supabase/server'
import { ClipboardList, Users, XCircle, UserX, ShoppingBag, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import StatCard from '@/components/shared/StatCard'
import StatusBadge from '@/components/shared/StatusBadge'
import OrderStatusBadge from '@/components/shared/OrderStatusBadge'

export const metadata = { title: 'Dashboard — Admin' }

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtPrice(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v)
}

export default async function AdminDashboard() {
  const supabase = createServiceClient()


  const [
    { count: pending },
    { count: approved },
    { count: rejected },
    { count: revoked },
    { data: recent },
    { count: ordersPending },
    { count: ordersConfirmed },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('access_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('customer_profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('access_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase.from('customer_profiles').select('*', { count: 'exact', head: true }).eq('status', 'revoked'),
    supabase
      .from('access_requests')
      .select('id, status, submitted_at, business_info')
      .order('submitted_at', { ascending: false })
      .limit(6),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase
      .from('orders')
      .select('id, order_number, status, subtotal, submitted_at, customer_profiles!customer_id(full_name, company_name)')
      .order('submitted_at', { ascending: false })
      .limit(5),
  ])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of access requests and customer accounts."
      />

      {/* Access request stats */}
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

      {/* Order stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Pending orders"
          value={ordersPending ?? 0}
          icon={ShoppingBag}
          href="/admin/orders?status=pending"
          highlight={(ordersPending ?? 0) > 0}
          description={(ordersPending ?? 0) > 0 ? 'Awaiting review' : 'None pending'}
        />
        <StatCard
          label="Confirmed orders"
          value={ordersConfirmed ?? 0}
          icon={CheckCircle2}
          href="/admin/orders?status=confirmed"
        />
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Recent orders</h2>
          <Link
            href="/admin/orders"
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
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Customer</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Date</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(recentOrders ?? []).map((order) => (
                  <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-medium text-foreground">{order.order_number}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                      {order.customer_profiles?.full_name || '—'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                      {formatDate(order.submitted_at)}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">{fmtPrice(order.subtotal)}</td>
                    <td className="py-3 px-4"><OrderStatusBadge status={order.status} /></td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs font-medium text-primary hover:underline underline-offset-4 whitespace-nowrap"
                      >
                        {order.status === 'pending' ? 'Review →' : 'View →'}
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!recentOrders || recentOrders.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent access requests */}
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
