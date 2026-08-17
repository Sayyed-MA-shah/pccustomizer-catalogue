import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAddress } from '@/lib/address-validation'

export async function PUT(request, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  const result = validateAddress(body)
  if (result.errors) return NextResponse.json({ errors: result.errors }, { status: 422 })

  // Belt-and-suspenders alongside RLS: double-filter on customer_id = user.id
  const { data, error } = await supabase
    .from('customer_addresses')
    .update(result.address)
    .eq('id', id)
    .eq('customer_id', user.id)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Address not found or update failed' }, { status: 404 })
  return NextResponse.json({ address: data })
}

// PATCH: partial update — used for "set as default"
export async function PATCH(request, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only allow setting is_default via PATCH
  const { data, error } = await supabase
    .from('customer_addresses')
    .update({ is_default: true })
    .eq('id', id)
    .eq('customer_id', user.id)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Address not found' }, { status: 404 })
  return NextResponse.json({ address: data })
}

export async function DELETE(_, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('customer_addresses')
    .delete()
    .eq('id', id)
    .eq('customer_id', user.id)

  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
