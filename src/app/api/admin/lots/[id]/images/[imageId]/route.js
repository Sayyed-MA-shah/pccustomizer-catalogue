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

const BUCKET = 'special-listing-images'

export async function PATCH(request, { params }) {
  if (!isValidOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { user, code } = await verifyAdmin()
  if (!user) return NextResponse.json({ error: code === 401 ? 'Unauthorized' : 'Forbidden' }, { status: code })

  const { id, imageId } = await params
  const updates = {}
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order)
  if (body.alt_text !== undefined) updates.alt_text = body.alt_text?.trim() || null

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('special_listing_images')
    .update(updates)
    .eq('id', imageId)
    .eq('listing_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function DELETE(request, { params }) {
  if (!isValidOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user, code } = await verifyAdmin()
  if (!user) return NextResponse.json({ error: code === 401 ? 'Unauthorized' : 'Forbidden' }, { status: code })

  const { id, imageId } = await params
  const service = createServiceClient()

  const { data: imageRow } = await service
    .from('special_listing_images')
    .select('storage_path')
    .eq('id', imageId)
    .eq('listing_id', id)
    .single()

  if (!imageRow) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

  const { error: dbError } = await service
    .from('special_listing_images')
    .delete()
    .eq('id', imageId)
    .eq('listing_id', id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  // Best-effort storage cleanup
  await service.storage.from(BUCKET).remove([imageRow.storage_path]).catch(() => {})

  return NextResponse.json({ success: true })
}
