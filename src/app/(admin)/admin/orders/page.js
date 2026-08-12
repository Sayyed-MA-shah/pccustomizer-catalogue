import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import PageHeader from '@/components/shared/PageHeader'
import OrderStatusBadge from '@/components/shared/OrderStatusBadge'
import EmptyState from '@/components/shared/EmptyState'

export const metadata = { title: 'Orders — Admin' }

const VALID_STATUSES = ['pending', 'confirmed', 'rejected', 'cancelled']

const filters = [
  { label: 'All',       value: null },
  { label: 'Pending',   value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Rejected',  value: 'rejected' },
]

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtPrice(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v)
}

export default async function AdminOrdersPage({ searchParams }) {
  const { status: statusParam } = await searchParams
  const activeFilter = VALID_STATUSES.includes(statusParam) ? statusParam : null

  const supabase = createServiceClient()

  let query = supabase
    .from('orders')
    .select(`
      id, order_number, status, subtotal, submitted_at,
      order_items(id),
      customer_profiles!customer_id(full_name, company_name)
    `)
    .order('submitted_at', { ascending: false })

  if (activeFilter) query = query.eq('status', activeFilter)

  const { data: orders } = await query

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle="Review and manage customer orders." />

      <div className="flex gap-1.5 flex-wrap border-b pb-px">
        {filters.map(({ label, value }) => {
          const href = value ? `/admin/orders?status=${value}` : '/admin/orders'
          const isActive = activeFilter === value
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-t transition-colors border-b-2 -mb-px',
                isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </Link>
          )
        })}
        <span className="ml-auto text-xs text-muted-foreground self-center pr-1">
          {orders?.length ?? 0} result{orders?.length !== 1 ? 's' : ''}
        </span>
      </div>

      {orders && orders.length > 0 ? (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Customer</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Company</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Submitted</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Items</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map(order => {
                  const customer = order.customer_profiles
                  return (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-medium text-foreground">{order.order_number}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{customer?.full_name || '—'}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{customer?.company_name || '—'}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap hidden sm:table-cell">{fmt(order.submitted_at)}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{order.order_items?.length ?? 0}</td>
                      <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">{fmtPrice(order.subtotal)}</td>
                      <td className="py-3 px-4"><OrderStatusBadge status={order.status} /></td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/orders/${order.id}`} className="text-xs font-medium text-primary hover:underline underline-offset-4 whitespace-nowrap">
                          {order.status === 'pending' ? 'Review →' : 'View →'}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          description={activeFilter ? `No ${activeFilter} orders.` : 'No orders have been placed yet.'}
        />
      )}
    </div>
  )
}
