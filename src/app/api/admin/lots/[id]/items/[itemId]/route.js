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

export async function PATCH(request, { params }) {
  if (!isValidOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { user, code } = await verifyAdmin()
  if (!user) return NextResponse.json({ error: code === 401 ? 'Unauthorized' : 'Forbidden' }, { status: code })

  const { id, itemId } = await params
  const updates = {}

  if (body.quantity !== undefined) {
    const qty = Number(body.quantity)
    if (!Number.isInteger(qty) || qty < 1) return NextResponse.json({ error: 'quantity must be an integer >= 1' }, { status: 400 })
    updates.quantity = qty
  }
  if (body.notes !== undefined) updates.notes = body.notes?.trim() || null

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('special_listing_items')
    .update(updates)
    .eq('id', itemId)
    .eq('listing_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function DELETE(request, { params }) {
  if (!isValidOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user, code } = await verifyAdmin()
  if (!user) return NextResponse.json({ error: code === 401 ? 'Unauthorized' : 'Forbidden' }, { status: code })

  const { id, itemId } = await params
  const service = createServiceClient()

  const { error } = await service
    .from('special_listing_items')
    .delete()
    .eq('id', itemId)
    .eq('listing_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
