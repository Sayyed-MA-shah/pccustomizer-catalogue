import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BASE_URL = process.env.CATALOGUE_API_BASE_URL
const TOKEN = process.env.CATALOGUE_API_TOKEN

// Allowlist — never expose cost/supplier fields to the browser
const SAFE_FIELDS = new Set([
  'id', 'title', 'brand', 'model', 'sku', 'barcode',
  'condition', 'category', 'subcategory', 'description',
  'in_stock', 'stock_quantity', 'qty_available', 'quantity_available',
  'image_url', 'images',
  'weight', 'dimensions',
])

function sanitizeProduct(product) {
  const safe = {}
  for (const [k, v] of Object.entries(product)) {
    if (SAFE_FIELDS.has(k)) safe[k] = v
  }
  return safe
}

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: adminRow } = await supabase
    .from('catalogue_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  return adminRow ? user : null
}

export async function GET(request) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ data: [] })

  const params = new URLSearchParams()
  params.set('search', q.slice(0, 200))
  params.set('page_size', '20')

  const sku = searchParams.get('sku')
  if (sku) params.set('sku', String(sku).slice(0, 100))

  try {
    const res = await fetch(`${BASE_URL}/functions/v1/catalogue-api/v1/products?${params}`, {
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json({ error: 'Catalogue API error' }, { status: 502 })
    const json = await res.json()
    const rawProducts = json?.data ?? json?.products ?? (Array.isArray(json) ? json : [])
    const products = rawProducts.map(sanitizeProduct)
    return NextResponse.json({ data: products })
  } catch (err) {
    console.error('[catalogue-search]', err.message)
    return NextResponse.json({ error: 'Catalogue lookup failed' }, { status: 502 })
  }
}
