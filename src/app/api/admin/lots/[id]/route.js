import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VALID_CATEGORIES = ['faulty_parts', 'refurbished_bulk', 'clearance', 'mixed_lot']

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

  const { data: listing, error } = await service
    .from('special_listings')
    .select(`
      *,
      special_listing_items(*),
      special_listing_images(* ORDER BY sort_order ASC, created_at ASC)
    `)
    .eq('id', id)
    .single()

  if (error || !listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: listing })
}

export async function PATCH(request, { params }) {
  if (!isValidOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { user, code } = await verifyAdmin()
  if (!user) return NextResponse.json({ error: code === 401 ? 'Unauthorized' : 'Forbidden' }, { status: code })

  const { id } = await params
  const service = createServiceClient()

  const updates = {}
  if (body.title !== undefined) updates.title = body.title?.trim() || undefined
  if (body.slug !== undefined) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug?.trim())) {
      return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 })
    }
    updates.slug = body.slug.trim()
  }
  if (body.short_description !== undefined) updates.short_description = body.short_description?.trim() || null
  if (body.description !== undefined) updates.description = body.description?.trim() || null
  if (body.listing_category !== undefined) {
    if (!VALID_CATEGORIES.includes(body.listing_category)) {
      return NextResponse.json({ error: 'Invalid listing_category' }, { status: 400 })
    }
    updates.listing_category = body.listing_category
  }
  if (body.fixed_price !== undefined) updates.fixed_price = body.fixed_price != null && body.fixed_price !== '' ? Number(body.fixed_price) : null
  if (body.quantity_total !== undefined) updates.quantity_total = Math.max(0, Number(body.quantity_total))
  if (body.visibility !== undefined) updates.visibility = body.visibility === 'approved_customers_only' ? 'approved_customers_only' : 'public'
  if (body.customer_notes !== undefined) updates.customer_notes = body.customer_notes?.trim() || null

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

  const { data, error } = await service
    .from('special_listings')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data })
}
