import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VALID_SEGMENTS = ['retail', 'wholesale', 'trade']

function isValidOrigin(request) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function POST(request, { params }) {
  if (!isValidOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { action, notes, segment } = body

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Segment is required for approval
  if (action === 'approve' && !VALID_SEGMENTS.includes(segment)) {
    return NextResponse.json(
      { error: 'customer_segment is required to approve (retail, wholesale, or trade)' },
      { status: 400 }
    )
  }

  // Verify authenticated session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin identity using authenticated client — RLS returns only own row
  const { data: adminRow } = await supabase
    .from('catalogue_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!adminRow) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Escalate to service role only after admin identity confirmed
  const serviceClient = await createServiceClient()

  if (action === 'approve') {
    const { error } = await serviceClient.rpc('approve_access_request', {
      p_request_id:  id,
      p_reviewer_id: user.id,
      p_notes:       notes?.trim() || null,
      p_segment:     segment,
    })

    if (error) {
      console.error(`[admin/requests/${id}] approve_access_request:`, error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    const { error } = await serviceClient.rpc('reject_access_request', {
      p_request_id:  id,
      p_reviewer_id: user.id,
      p_notes:       notes?.trim() || null,
    })

    if (error) {
      console.error(`[admin/requests/${id}] reject_access_request:`, error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
