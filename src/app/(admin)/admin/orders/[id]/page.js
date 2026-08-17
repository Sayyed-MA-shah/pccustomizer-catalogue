import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createServiceClient } from '@/lib/supabase/server'
import OrderStatusBadge from '@/components/shared/OrderStatusBadge'
import AddressDisplay from '@/components/shared/AddressDisplay'
import OrderActionPanel from '@/components/admin/OrderActionPanel'

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

const SEGMENT_LABELS = {
  retail:    'Retail',
  wholesale: 'Wholesale',
  trade:     'Trade',
}

export default async function AdminOrderDetailPage({ params }) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, subtotal, customer_segment,
      customer_id, customer_notes, admin_notes, submitted_at, confirmed_at, rejected_at,
      guest_full_name, guest_email, guest_phone, guest_company_name,
      billing_address_snapshot, delivery_address_snapshot,
      order_items (id, product_id, sku, product_title, quantity, unit_price, line_total),
      customer_profiles!customer_id (id, full_name, company_name, email, phone, company_vat)
    `)
    .eq('id', id)
    .single()

  if (!order) notFound()

  const isGuest   = !order.customer_id
  const customer  = order.customer_profiles
  const isPending = order.status === 'pending'

  const customerTypeLabel = isGuest
    ? 'Guest'
    : (SEGMENT_LABELS[order.customer_segment] ?? order.customer_segment ?? '—')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to orders
        </Link>
        <OrderStatusBadge status={order.status} />
      </div>

      <div>
        <h1 className="text-xl font-bold font-mono text-foreground">{order.order_number}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Submitted {fmt(order.submitted_at, true)}
        </p>
      </div>

      {isPending && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-sm font-semibold text-amber-800">This order is awaiting review</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Review the items and customer details below, then confirm or reject.
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer / Guest info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {isGuest ? 'Guest contact' : 'Customer'}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y pt-0">
            {isGuest ? (
              <>
                {[
                  ['Name',         order.guest_full_name],
                  ['Email',        order.guest_email],
                  ['Phone',        order.guest_phone],
                  ['Company',      order.guest_company_name],
                  ['Customer type','Guest'],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3 py-2">
                    <span className="text-sm text-muted-foreground w-24 shrink-0">{label}</span>
                    <span className="text-sm font-medium text-foreground">{value || '—'}</span>
                  </div>
                ))}
              </>
            ) : (
              <>
                {[
                  ['Name',          customer?.full_name],
                  ['Company',       customer?.company_name],
                  ['Email',         customer?.email],
                  ['Phone',         customer?.phone],
                  ['VAT',           customer?.company_vat],
                  ['Customer type', customerTypeLabel],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3 py-2">
                    <span className="text-sm text-muted-foreground w-24 shrink-0">{label}</span>
                    <span className="text-sm font-medium text-foreground">{value || '—'}</span>
                  </div>
                ))}
                {customer?.id && (
                  <div className="pt-3">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="text-xs font-medium text-primary hover:underline underline-offset-4"
                    >
                      View customer profile →
                    </Link>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Order info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order details</CardTitle>
          </CardHeader>
          <CardContent className="divide-y pt-0">
            {[
              ['Order #',  <span key="on" className="font-mono">{order.order_number}</span>],
              ['Status',   <OrderStatusBadge key="st" status={order.status} />],
              ['Submitted', fmt(order.submitted_at, true)],
              order.status === 'confirmed' && order.confirmed_at && ['Confirmed', fmt(order.confirmed_at, true)],
              order.status === 'rejected'  && order.rejected_at  && ['Rejected',  fmt(order.rejected_at,  true)],
              order.customer_notes && ['Customer note', order.customer_notes],
              order.admin_notes    && ['Admin note',    order.admin_notes],
            ].filter(Boolean).map(([label, value]) => (
              <div key={label} className="flex gap-3 py-2">
                <span className="text-sm text-muted-foreground w-28 shrink-0">{label}</span>
                <span className="text-sm font-medium text-foreground">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Address snapshots */}
      {(order.delivery_address_snapshot || order.billing_address_snapshot) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {order.delivery_address_snapshot && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Delivery address</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <AddressDisplay address={order.delivery_address_snapshot} />
              </CardContent>
            </Card>
          )}
          {order.billing_address_snapshot && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Billing address</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <AddressDisplay address={order.billing_address_snapshot} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Items ({order.order_items?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</th>
                  <th className="pb-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">SKU</th>
                  <th className="pb-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qty</th>
                  <th className="pb-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unit price</th>
                  <th className="pb-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Line total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.order_items?.map(item => (
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
            <span className="text-sm text-muted-foreground">Order total</span>
            <span className="text-base font-bold text-foreground">{fmtPrice(order.subtotal)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions (pending only) */}
      {isPending && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <OrderActionPanel orderId={order.id} orderNumber={order.order_number} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
