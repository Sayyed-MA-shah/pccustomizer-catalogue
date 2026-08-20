import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VALID_CATEGORIES = ['faulty_parts', 'refurbished_bulk', 'clearance', 'mixed_lot']
const VALID_STATUSES = ['draft', 'published', 'sold', 'withdrawn']

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

export async function GET(request) {
  const { user, code } = await verifyAdmin()
  if (!user) return NextResponse.json({ error: code === 401 ? 'Unauthorized' : 'Forbidden' }, { status: code })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const category = searchParams.get('category')

  const service = createServiceClient()
  let query = service
    .from('special_listings')
    .select('id, listing_number, title, slug, listing_category, sale_method, status, fixed_price, quantity_total, visibility, published_at, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (status && VALID_STATUSES.includes(status)) query = query.eq('status', status)
  if (category && VALID_CATEGORIES.includes(category)) query = query.eq('listing_category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request) {
  if (!isValidOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { user, code } = await verifyAdmin()
  if (!user) return NextResponse.json({ error: code === 401 ? 'Unauthorized' : 'Forbidden' }, { status: code })

  const { title, slug, short_description, description, listing_category, sale_method, fixed_price, quantity_total, visibility, customer_notes, items = [] } = body

  if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })
  if (!slug?.trim()) return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
    return NextResponse.json({ error: 'slug must be lowercase letters, numbers, and hyphens only' }, { status: 400 })
  }
  if (!VALID_CATEGORIES.includes(listing_category)) {
    return NextResponse.json({ error: 'Invalid listing_category' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: listing, error: insertError } = await service
    .from('special_listings')
    .insert({
      title: title.trim(),
      slug: slug.trim(),
      short_description: short_description?.trim() || null,
      description: description?.trim() || null,
      listing_category,
      sale_method: sale_method === 'auction' ? 'auction' : 'fixed_price',
      fixed_price: fixed_price != null && fixed_price !== '' ? Number(fixed_price) : null,
      quantity_total: quantity_total != null ? Math.max(0, Number(quantity_total)) : 0,
      visibility: visibility === 'approved_customers_only' ? 'approved_customers_only' : 'public',
      customer_notes: customer_notes?.trim() || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'A listing with that slug already exists' }, { status: 409 })
    }
    console.error('[lots POST] insert:', insertError.message)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  if (items.length > 0) {
    const validItems = items.filter(it =>
      it.internal_product_id && it.product_title_snapshot && Number(it.quantity) >= 1
    )
    if (validItems.length > 0) {
      const { error: itemsError } = await service.from('special_listing_items').insert(
        validItems.map(it => ({
          listing_id: listing.id,
          internal_product_id: String(it.internal_product_id),
          internal_sku: it.internal_sku || null,
          product_title_snapshot: String(it.product_title_snapshot),
          brand_snapshot: it.brand_snapshot || null,
          model_snapshot: it.model_snapshot || null,
          condition_snapshot: it.condition_snapshot || null,
          quantity: Number(it.quantity),
          notes: it.notes?.trim() || null,
        }))
      )
      if (itemsError) console.error('[lots POST] items insert:', itemsError.message)
    }
  }

  return NextResponse.json({ data: listing }, { status: 201 })
}
