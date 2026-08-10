import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

  const { action, notes } = body
  if (action !== 'revoke') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
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

  const { id } = await params  // id is the customer's user_id (customer_profiles.id)

  // Escalate to service role only after admin identity confirmed
  const serviceClient = await createServiceClient()

  const { error } = await serviceClient.rpc('revoke_customer_access', {
    p_user_id: id,
    p_reviewer_id: user.id,
    p_notes: notes?.trim() || null,
  })

  if (error) {
    console.error(`[admin/customers/${id}] revoke_customer_access:`, error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
