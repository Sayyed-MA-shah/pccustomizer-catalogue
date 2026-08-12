import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProduct, sanitizeProduct } from '@/lib/catalogue-api'

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

  // 3. Parse body — only trust product IDs and quantities from browser
  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { items, notes } = body

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

  // 4–6. Server-side: fetch products, resolve prices, validate stock
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

  // 7. Calculate subtotal server-side
  const subtotal = +validatedItems.reduce((sum, i) => sum + i.line_total, 0).toFixed(2)

  // 8. Create order atomically via RPC
  const service = createServiceClient()
  const { data, error: rpcError } = await service.rpc('create_order', {
    p_customer_id:      user.id,
    p_customer_segment: segment,
    p_subtotal:         subtotal,
    p_customer_notes:   notes ?? null,
    p_items:            validatedItems,
  })

  if (rpcError) {
    console.error('create_order RPC error:', rpcError)
    return NextResponse.json({ error: 'Failed to create order. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id, orderNumber: data.order_number })
}
