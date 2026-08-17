import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createServiceClient } from '@/lib/supabase/server'
import OrderStatusBadge from '@/components/shared/OrderStatusBadge'
import AddressDisplay from '@/components/shared/AddressDisplay'

export const revalidate = 0

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtPrice(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v)
}

export default async function GuestOrderPage({ params, searchParams }) {
  const { token } = await params
  const { new: isNew } = await searchParams

  if (!token || typeof token !== 'string') notFound()

  const supabase = createServiceClient()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, subtotal, submitted_at,
      guest_full_name, guest_email, guest_phone, guest_company_name,
      billing_address_snapshot, delivery_address_snapshot,
      order_items (id, product_id, sku, product_title, quantity, unit_price, line_total)
    `)
    .eq('guest_token', token)
    .is('customer_id', null)
    .single()

  if (!order) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Success banner */}
      {isNew && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Order placed successfully</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              Thank you, {order.guest_full_name}. Your order has been received and is awaiting review.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-foreground">{order.order_number}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {order.guest_company_name || order.guest_full_name} · {fmt(order.submitted_at)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Order details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</CardTitle>
        </CardHeader>
        <CardContent className="divide-y pt-0">
          {[
            ['Name',    order.guest_full_name],
            ['Email',   order.guest_email],
            ['Phone',   order.guest_phone],
            ['Company', order.guest_company_name],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} className="flex gap-3 py-2">
              <span className="text-sm text-muted-foreground w-20 shrink-0">{label}</span>
              <span className="text-sm font-medium text-foreground">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

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
                  <th className="pb-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unit</th>
                  <th className="pb-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
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

      {/* Business account CTA */}
      <div className="rounded-lg border bg-muted/20 px-5 py-5 flex items-start gap-4">
        <Building2 className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">
            Order regularly or buy in volume?
          </p>
          <p className="text-sm text-muted-foreground">
            Apply for a business account to access account-specific pricing across Retail, Wholesale, and Trade tiers.
          </p>
          <Link
            href="/register"
            className="inline-block mt-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Apply for Business Access →
          </Link>
        </div>
      </div>

      <div className="text-center pt-2">
        <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors">
          Continue browsing products
        </Link>
      </div>
    </div>
  )
}
