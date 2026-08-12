import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

function isValidOrigin(request) {
  const origin = request.headers.get('origin') || ''
  const host   = request.headers.get('host')   || ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  return origin === appUrl || origin.includes(host) || process.env.NODE_ENV === 'development'
}

export async function POST(request, { params }) {
  if (!isValidOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (body.action !== 'cancel') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('status')
    .eq('id', user.id)
    .single()
  if (!profile || profile.status !== 'approved') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const service = createServiceClient()
  const { error: rpcError } = await service.rpc('cancel_order', {
    p_order_id:    id,
    p_customer_id: user.id,
  })

  if (rpcError) {
    return NextResponse.json(
      { error: rpcError.message || 'Cannot cancel this order.' },
      { status: 422 }
    )
  }

  return NextResponse.json({ success: true })
}
