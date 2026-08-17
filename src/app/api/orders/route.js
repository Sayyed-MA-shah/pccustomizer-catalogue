import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProduct, sanitizeProduct } from '@/lib/catalogue-api'
import { buildAddressSnapshot } from '@/lib/address-validation'

export async function POST(request) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Verify approved + read segment server-side
  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('status, customer_segment')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'approved') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const segment = profile.customer_segment
  if (!segment) {
    return NextResponse.json({ error: 'No customer type assigned to your account. Contact an administrator.' }, { status: 403 })
  }

  // 3. Parse body — only trust product IDs, quantities, and address IDs from browser
  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { items, notes, billingAddressId, deliveryAddressId } = body

  // 4. Validate address IDs are present
  if (!billingAddressId || typeof billingAddressId !== 'string') {
    return NextResponse.json({
      error: 'Please select a billing address before submitting your order.',
      addressRequired: true,
    }, { status: 422 })
  }
  if (!deliveryAddressId || typeof deliveryAddressId !== 'string') {
    return NextResponse.json({
      error: 'Please select a delivery address before submitting your order.',
      addressRequired: true,
    }, { status: 422 })
  }

  // 5. Fetch addresses using the authenticated client — RLS ensures ownership.
  //    If an address doesn't belong to this user, Supabase returns null.
  const [{ data: billingAddr }, { data: deliveryAddr }] = await Promise.all([
    supabase.from('customer_addresses').select('*').eq('id', billingAddressId).maybeSingle(),
    supabase.from('customer_addresses').select('*').eq('id', deliveryAddressId).maybeSingle(),
  ])

  if (!billingAddr) {
    return NextResponse.json({ error: 'Selected billing address not found or does not belong to your account.' }, { status: 422 })
  }
  if (!deliveryAddr) {
    return NextResponse.json({ error: 'Selected delivery address not found or does not belong to your account.' }, { status: 422 })
  }

  // Build immutable snapshots — these are written to the order and never change again
  const billingSnapshot  = buildAddressSnapshot(billingAddr)
  const deliverySnapshot = buildAddressSnapshot(deliveryAddr)

  // 6. Validate items
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 })
  }

  for (const item of items) {
    if (typeof item.id !== 'string' || !item.id) {
      return NextResponse.json({ error: 'Invalid cart item' }, { status: 400 })
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 9999) {
      return NextResponse.json({ error: `Invalid quantity for item ${item.id}` }, { status: 400 })
    }
  }

  // 7. Server-side: fetch products, resolve prices, validate stock
  const validatedItems = []
  const errors = []

  await Promise.all(items.map(async ({ id, quantity }) => {
    try {
      const raw = await getProduct(id)

      if (!raw) {
        errors.push(`A product in your cart no longer exists. Please review your cart.`)
        return
      }

      const product = sanitizeProduct(raw, segment)

      if (product.price == null) {
        errors.push(`"${raw.title}" does not have a price for your account type. Please contact an administrator.`)
        return
      }

      const stock = raw.stock ?? raw.stock_quantity ?? null
      if (stock !== null && quantity > stock) {
        errors.push(
          stock === 0
            ? `"${raw.title}" is now out of stock.`
            : `Only ${stock} unit${stock !== 1 ? 's' : ''} of "${raw.title}" are currently available.`
        )
        return
      }

      validatedItems.push({
        product_id:    id,
        sku:           raw.sku ?? raw.ean_sku ?? null,
        product_title: raw.title,
        quantity,
        unit_price:    product.price,
        line_total:    +(product.price * quantity).toFixed(2),
      })
    } catch {
      errors.push(`Failed to validate a product in your cart. Please try again.`)
    }
  }))

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(' '), errors }, { status: 422 })
  }

  // 8. Calculate subtotal server-side
  const subtotal = +validatedItems.reduce((sum, i) => sum + i.line_total, 0).toFixed(2)

  // 9. Create order atomically via RPC — snapshots are written here and never mutated again
  const service = createServiceClient()
  const { data, error: rpcError } = await service.rpc('create_order', {
    p_customer_id:               user.id,
    p_customer_segment:          segment,
    p_subtotal:                  subtotal,
    p_customer_notes:            notes ?? null,
    p_items:                     validatedItems,
    p_billing_address_snapshot:  billingSnapshot,
    p_delivery_address_snapshot: deliverySnapshot,
  })

  if (rpcError) {
    console.error('create_order RPC error:', rpcError)
    return NextResponse.json({ error: 'Failed to create order. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id, orderNumber: data.order_number })
}
