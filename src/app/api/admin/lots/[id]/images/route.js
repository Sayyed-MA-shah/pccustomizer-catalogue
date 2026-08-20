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
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function GET(request, { params }) {
  const { user, code } = await verifyAdmin()
  if (!user) return NextResponse.json({ error: code === 401 ? 'Unauthorized' : 'Forbidden' }, { status: code })

  const { id } = await params
  const service = createServiceClient()

  const { data: rows, error } = await service
    .from('special_listing_images')
    .select('*')
    .eq('listing_id', id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows || rows.length === 0) return NextResponse.json({ data: [] })

  const data = await Promise.all(
    rows.map(async (img) => {
      const { data: su } = await service.storage.from(BUCKET).createSignedUrl(img.storage_path, 86400)
      return { ...img, signed_url: su?.signedUrl ?? null }
    })
  )
  return NextResponse.json({ data })
}

export async function POST(request, { params }) {
  if (!isValidOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user, code } = await verifyAdmin()
  if (!user) return NextResponse.json({ error: code === 401 ? 'Unauthorized' : 'Forbidden' }, { status: code })

  const { id } = await params
  const service = createServiceClient()

  // Verify listing exists
  const { data: listing } = await service.from('special_listings').select('id').eq('id', id).single()
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  let formData
  try { formData = await request.formData() } catch { return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 }) }

  const file = formData.get('file')
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'file is required' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Image exceeds 10 MB limit' }, { status: 400 })

  const altText = formData.get('alt_text') || null
  const sortOrder = Number(formData.get('sort_order') ?? 0)

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const storagePath = `${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await service.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('[lots images POST] upload:', uploadError.message)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: imageRow, error: dbError } = await service
    .from('special_listing_images')
    .insert({
      listing_id: id,
      storage_path: storagePath,
      sort_order: isNaN(sortOrder) ? 0 : sortOrder,
      alt_text: altText || null,
    })
    .select()
    .single()

  if (dbError) {
    // Clean up orphaned upload
    await service.storage.from(BUCKET).remove([storagePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const { data: signedUrlData } = await service.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 86400) // 24h for admin session

  return NextResponse.json({
    data: { ...imageRow, signed_url: signedUrlData?.signedUrl ?? null },
  }, { status: 201 })
}
