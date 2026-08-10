import { getProducts } from '@/lib/catalogue-api'

export async function GET() {
  try {
    const result = await getProducts({ page_size: '3' })
    return Response.json({ ok: true, result }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}
