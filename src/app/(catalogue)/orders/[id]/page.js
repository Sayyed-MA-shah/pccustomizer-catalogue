import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/server'
import OrderStatusBadge from '@/components/shared/OrderStatusBadge'
import CancelOrderButton from '@/components/catalogue/CancelOrderButton'

export const revalidate = 0

function fmt(d, time = false) {
  if (!d) return '—'
  const opts = time
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' }
  return new Date(d).toLocaleString('en-GB', opts)
}

function fmtPrice(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v)
}

export default async function CustomerOrderDetailPage({ params, searchParams }) {
  const { id } = await params
  const { new: isNew } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS + explicit customer_id check: customer cannot access another customer's order
  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, subtotal, customer_segment,
      customer_notes, admin_notes, submitted_at, confirmed_at, rejected_at,
      order_items (id, product_id, sku, product_title, quantity, unit_price, line_total)
    `)
    .eq('id', id)
    .eq('customer_id', user.id)
    .single()

  if (!order) notFound()

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('full_name, company_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to orders
      </Link>

      {/* New order success banner */}
      {isNew && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Order submitted successfully</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              Your order has been sent for review. You will be notified once it has been processed.
            </p>
          </div>
        </div>
      )}

      {/* Status banners */}
      {order.status === 'confirmed' && !isNew && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-800">This order has been confirmed.</p>
        </div>
      )}
      {order.status === 'rejected' && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">This order was not approved.</p>
            {order.admin_notes && (
              <p className="text-sm text-red-700 mt-1">Note from reviewer: {order.admin_notes}</p>
            )}
          </div>
        </div>
      )}
      {order.status === 'cancelled' && (
        <div className="rounded-lg bg-muted border px-4 py-3">
          <p className="text-sm text-muted-foreground">This order has been cancelled.</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-foreground">{order.order_number}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{profile?.company_name || profile?.full_name}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Order details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order details</CardTitle>
        </CardHeader>
        <CardContent className="divide-y pt-0">
          {[
            ['Order number', <span key="on" className="font-mono">{order.order_number}</span>],
            ['Status',       <OrderStatusBadge key="st" status={order.status} />],
            ['Submitted',    fmt(order.submitted_at, true)],
            order.status === 'confirmed' && order.confirmed_at && ['Confirmed', fmt(order.confirmed_at, true)],
            order.customer_notes && ['Notes', order.customer_notes],
          ].filter(Boolean).map(([label, value]) => (
            <div key={label} className="flex gap-3 py-2">
              <span className="text-sm text-muted-foreground w-32 shrink-0">{label}</span>
              <span className="text-sm font-medium text-foreground">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Items</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</th>
                  <th className="pb-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">SKU</th>
                  <th className="pb-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qty</th>
                  <th className="pb-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unit</th>
                  <th className="pb-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.order_items.map(item => (
                  <tr key={item.id}>
                    <td className="py-2.5 pr-3 font-medium text-foreground">{item.product_title}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground font-mono text-xs hidden sm:table-cell">{item.sku || '—'}</td>
                    <td className="py-2.5 text-right text-foreground">{item.quantity}</td>
                    <td className="py-2.5 pl-3 text-right text-foreground">{fmtPrice(item.unit_price)}</td>
                    <td className="py-2.5 pl-3 text-right font-semibold text-foreground">{fmtPrice(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Separator className="my-3" />
          <div className="flex justify-end gap-4">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="text-base font-bold text-foreground">{fmtPrice(order.subtotal)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Cancel (pending only) */}
      {order.status === 'pending' && (
        <CancelOrderButton orderId={order.id} orderNumber={order.order_number} />
      )}
    </div>
  )
}
