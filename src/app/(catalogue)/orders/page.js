import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import OrderStatusBadge from '@/components/shared/OrderStatusBadge'

export const revalidate = 0
export const metadata = { title: 'My Orders — PCCustomizer Catalogue' }

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtPrice(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v)
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS ensures only the customer's own orders are returned
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, subtotal, submitted_at, order_items(id)')
    .eq('customer_id', user.id)
    .order('submitted_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your order history and current status.</p>
      </div>

      {orders && orders.length > 0 ? (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Date</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Items</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-medium text-foreground">{order.order_number}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell whitespace-nowrap">{fmt(order.submitted_at)}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                      {order.order_items?.length ?? 0} item{(order.order_items?.length ?? 0) !== 1 ? 's' : ''}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">{fmtPrice(order.subtotal)}</td>
                    <td className="py-3 px-4"><OrderStatusBadge status={order.status} /></td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/orders/${order.id}`} className="text-xs font-medium text-primary hover:underline underline-offset-4 whitespace-nowrap">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-foreground">No orders yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Orders you place will appear here.</p>
          <Link href="/products" className="mt-4 text-sm font-medium text-primary hover:underline underline-offset-4">
            Browse catalogue
          </Link>
        </div>
      )}
    </div>
  )
}
