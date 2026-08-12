import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

function isValidOrigin(request) {
  const origin = request.headers.get('origin') || ''
  const host   = request.headers.get('host')   || ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  return origin === appUrl || origin.includes(host) || process.env.NODE_ENV === 'development'
}

const VALID_ACTIONS = ['confirm', 'reject']

export async function POST(request, { params }) {
  if (!isValidOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { action, notes } = body
  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Verify session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify admin via RLS (own row only)
  const { data: adminRow } = await supabase
    .from('catalogue_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!adminRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  // Escalate to service client after admin verified
  const service = createServiceClient()
  const rpcName = action === 'confirm' ? 'confirm_order' : 'reject_order'
  const { error: rpcError } = await service.rpc(rpcName, {
    p_order_id: id,
    p_admin_id: user.id,
    p_notes:    notes ?? null,
  })

  if (rpcError) {
    return NextResponse.json(
      { error: rpcError.message || 'Action failed. The order may no longer be pending.' },
      { status: 422 }
    )
  }

  return NextResponse.json({ success: true })
}
