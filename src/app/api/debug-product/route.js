import { getProduct } from '@/lib/catalogue-api'

export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return Response.json({ error: 'pass ?id=...' }, { status: 400 })
  try {
    const result = await getProduct(id)
    return Response.json({ ok: true, result }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}
