import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getProduct, sanitizeProduct } from '@/lib/catalogue-api'

function buildSnapshot(addr) {
  if (!addr) return null
  return {
    address_line_1: addr.address_line_1  ?? null,
    address_line_2: addr.address_line_2  ?? null,
    city:           addr.city            ?? null,
    county:         addr.county          ?? null,
    postcode:       addr.postcode        ?? null,
    country:        addr.country         ?? 'United Kingdom',
    company_name:   addr.company_name    ?? null,
    contact_name:   addr.contact_name    ?? null,
    phone:          addr.phone           ?? null,
    label:          addr.label           ?? null,
  }
}

function validateAddress(addr, label) {
  if (!addr?.address_line_1?.trim()) return `${label}: address line 1 is required.`
  if (!addr?.city?.trim())           return `${label}: city is required.`
  if (!addr?.postcode?.trim())       return `${label}: postcode is required.`
  if (!addr?.country?.trim())        return `${label}: country is required.`
  return null
}

export async function POST(request) {
  try {
    const body = await request.json()

    const { contact, billingAddress, deliveryAddress, items: rawItems, notes } = body

    // ── Validate contact ───────────────────────────────────────────────────────
    const fullName = contact?.full_name?.trim()
    const email    = contact?.email?.trim()?.toLowerCase()

    if (!fullName) return NextResponse.json({ error: 'Full name is required.' }, { status: 400 })
    if (!email)    return NextResponse.json({ error: 'Email address is required.' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email address is not valid.' }, { status: 400 })
    }

    // ── Validate addresses ─────────────────────────────────────────────────────
    const billingErr  = validateAddress(billingAddress,  'Billing address')
    if (billingErr) return NextResponse.json({ error: billingErr }, { status: 400 })
    const deliveryErr = validateAddress(deliveryAddress, 'Delivery address')
    if (deliveryErr) return NextResponse.json({ error: deliveryErr }, { status: 400 })

    // ── Validate items ─────────────────────────────────────────────────────────
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 })
    }

    // ── Resolve prices server-side (website_price) ─────────────────────────────
    const resolvedItems = []
    let subtotal = 0

    await Promise.all(
      rawItems.slice(0, 50).map(async (entry) => {
        const qty = parseInt(entry.quantity, 10)
        if (!entry.id || qty < 1) return

        const raw = await getProduct(entry.id).catch(() => null)
        if (!raw) return

        const product = sanitizeProduct(raw, 'website')
        if (product.price == null) return

        const stock = raw.stock ?? raw.stock_quantity ?? null
        if (stock !== null && stock < qty) return

        resolvedItems.push({
          product_id:    String(entry.id),
          sku:           raw.sku           ?? null,
          product_title: raw.title         ?? 'Unknown product',
          quantity:      qty,
          unit_price:    product.price,
          line_total:    Math.round(product.price * qty * 100) / 100,
        })
        subtotal += product.price * qty
      })
    )

    if (resolvedItems.length === 0) {
      return NextResponse.json({ error: 'No items with available pricing could be processed.' }, { status: 422 })
    }

    subtotal = Math.round(subtotal * 100) / 100

    // ── Create guest order via SECURITY DEFINER RPC ────────────────────────────
    const supabase = createServiceClient()

    const { data: result, error: rpcError } = await supabase.rpc('create_guest_order', {
      p_guest_full_name:           fullName,
      p_guest_email:               email,
      p_guest_phone:               contact?.phone?.trim()        || null,
      p_guest_company_name:        contact?.company_name?.trim() || null,
      p_subtotal:                  subtotal,
      p_customer_notes:            notes ?? null,
      p_items:                     resolvedItems,
      p_billing_address_snapshot:  buildSnapshot(billingAddress),
      p_delivery_address_snapshot: buildSnapshot(deliveryAddress),
    })

    if (rpcError) {
      console.error('[guest order] RPC error:', rpcError)
      return NextResponse.json({ error: 'Failed to create order. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      orderId:     result.id,
      orderNumber: result.order_number,
      guestToken:  result.guest_token,
    })
  } catch (err) {
    console.error('[guest order] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
