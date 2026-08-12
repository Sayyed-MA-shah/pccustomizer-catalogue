import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/admin/verify
// Returns {isAdmin: boolean} for the current session.
// Used by AdminLoginForm to confirm admin status after sign-in.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ isAdmin: false }, { status: 401 })
  }

  // Uses authenticated client — RLS returns only the user's own row
  const { data: adminRow } = await supabase
    .from('catalogue_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ isAdmin: !!adminRow })
}
