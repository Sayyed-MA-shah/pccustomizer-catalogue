import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProduct, sanitizeProduct } from '@/lib/catalogue-api'

export async function POST(request) {
  try {
    const { ids } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ prices: {} })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Determine pricing segment: guests and unapproved users get website_price
    let segment = 'website'
    if (user) {
      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('status, customer_segment')
        .eq('id', user.id)
        .single()
      if (profile?.status === 'approved' && profile.customer_segment) {
        segment = profile.customer_segment
      }
    }

    const prices = {}

    await Promise.all(
      ids.slice(0, 50).map(async (id) => {
        try {
          const raw = await getProduct(id)
          if (raw) {
            const p = sanitizeProduct(raw, segment)
            prices[id] = p.price
          }
        } catch {}
      })
    )

    return NextResponse.json({ prices })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
