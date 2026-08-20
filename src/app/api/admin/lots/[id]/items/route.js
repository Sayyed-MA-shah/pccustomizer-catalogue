import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function isValidOrigin(request) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!origin || !host) return false
  try { return new URL(origin).host === host } catch { return false }
}

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, code: 401 }
  const { data: adminRow } = await supabase
    .from('catalogue_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  return adminRow ? { user, code: null } : { user: null, code: 403 }
}

export async function GET(request, { params }) {
  const { user, code } = await verifyAdmin()
  if (!user) return NextResponse.json({ error: code === 401 ? 'Unauthorized' : 'Forbidden' }, { status: code })

  const { id } = await params
  const service = createServiceClient()

  const { data, error } = await service
    .from('special_listing_items')
    .select('*')
    .eq('listing_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request, { params }) {
  if (!isValidOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { user, code } = await verifyAdmin()
  if (!user) return NextResponse.json({ error: code === 401 ? 'Unauthorized' : 'Forbidden' }, { status: code })

  const { id } = await params
  const { internal_product_id, internal_sku, product_title_snapshot, brand_snapshot, model_snapshot, condition_snapshot, quantity, notes } = body

  if (!internal_product_id) return NextResponse.json({ error: 'internal_product_id is required' }, { status: 400 })
  if (!product_title_snapshot?.trim()) return NextResponse.json({ error: 'product_title_snapshot is required' }, { status: 400 })
  const qty = Number(quantity)
  if (!Number.isInteger(qty) || qty < 1) return NextResponse.json({ error: 'quantity must be an integer >= 1' }, { status: 400 })

  const service = createServiceClient()

  // Verify listing exists
  const { data: listing } = await service
    .from('special_listings')
    .select('id')
    .eq('id', id)
    .single()
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  const { data, error } = await service
    .from('special_listing_items')
    .insert({
      listing_id: id,
      internal_product_id: String(internal_product_id),
      internal_sku: internal_sku || null,
      product_title_snapshot: product_title_snapshot.trim(),
      brand_snapshot: brand_snapshot || null,
      model_snapshot: model_snapshot || null,
      condition_snapshot: condition_snapshot || null,
      quantity: qty,
      notes: notes?.trim() || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
