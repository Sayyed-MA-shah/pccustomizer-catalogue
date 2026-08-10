import { getProducts } from '@/lib/catalogue-api'

export async function GET() {
  try {
    const result = await getProducts({ page_size: '2' })
    return Response.json({ ok: true, result })
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}
