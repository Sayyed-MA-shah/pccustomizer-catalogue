import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAddress } from '@/lib/address-validation'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Failed to load addresses' }, { status: 500 })
  return NextResponse.json({ addresses: data ?? [] })
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  const result = validateAddress(body)
  if (result.errors) return NextResponse.json({ errors: result.errors }, { status: 422 })

  // customer_id is set to the authenticated user's ID — never trusted from the browser
  const { data, error } = await supabase
    .from('customer_addresses')
    .insert({ customer_id: user.id, ...result.address })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to save address' }, { status: 500 })
  return NextResponse.json({ address: data }, { status: 201 })
}
