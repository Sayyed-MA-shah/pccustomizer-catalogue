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

// Valid transitions: draft→published, published→withdrawn, published→sold, any→draft
const VALID_TRANSITIONS = {
  draft:     ['published'],
  published: ['draft', 'withdrawn', 'sold'],
  withdrawn: ['draft', 'published'],
  sold:      [],
}

export async function POST(request, { params }) {
  if (!isValidOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { user, code } = await verifyAdmin()
  if (!user) return NextResponse.json({ error: code === 401 ? 'Unauthorized' : 'Forbidden' }, { status: code })

  const { id } = await params
  const { status: newStatus } = body

  const VALID_STATUSES = ['draft', 'published', 'withdrawn', 'sold']
  if (!VALID_STATUSES.includes(newStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: current, error: fetchError } = await service
    .from('special_listings')
    .select('id, status')
    .eq('id', id)
    .single()

  if (fetchError || !current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const allowed = VALID_TRANSITIONS[current.status] ?? []
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from '${current.status}' to '${newStatus}'` },
      { status: 409 }
    )
  }

  const timestampFields = {}
  if (newStatus === 'published' && current.status !== 'published') {
    timestampFields.published_at = new Date().toISOString()
  }
  if (newStatus === 'sold') {
    timestampFields.sold_at = new Date().toISOString()
  }

  const { data, error } = await service
    .from('special_listings')
    .update({ status: newStatus, ...timestampFields })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
