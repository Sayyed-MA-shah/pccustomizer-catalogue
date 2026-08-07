import 'server-only'

const BASE_URL = process.env.CATALOGUE_API_BASE_URL
const TOKEN = process.env.CATALOGUE_API_TOKEN

const ALLOWED_SORT = ['newest', 'title_asc', 'title_desc', 'price_asc', 'price_desc']
const MAX_PAGE_SIZE = 50

function buildSearchParams(input) {
  const params = new URLSearchParams()

  const page = parseInt(input.page, 10)
  if (page > 0) params.set('page', String(page))

  const pageSize = parseInt(input.page_size, 10)
  if (pageSize > 0) params.set('page_size', String(Math.min(pageSize, MAX_PAGE_SIZE)))

  if (input.search) params.set('search', String(input.search).slice(0, 200))
  if (input.category) params.set('category', String(input.category).slice(0, 100))
  if (input.subcategory) params.set('subcategory', String(input.subcategory).slice(0, 100))
  if (input.brand) params.set('brand', String(input.brand).slice(0, 100))
  if (input.condition) params.set('condition', String(input.condition).slice(0, 50))
  if (input.sku) params.set('sku', String(input.sku).slice(0, 100))
  if (input.in_stock === 'true' || input.in_stock === true) params.set('in_stock', 'true')
  if (input.sort && ALLOWED_SORT.includes(input.sort)) params.set('sort', input.sort)

  return params
}

async function catalogueFetch(path) {
  const res = await fetch(`${BASE_URL}/functions/v1/catalogue-api/v1${path}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Catalogue API error: ${res.status}`)
  }

  return res.json()
}

export async function getProducts(params = {}) {
  const searchParams = buildSearchParams(params)
  return catalogueFetch(`/products?${searchParams}`)
}

export async function getProduct(id) {
  return catalogueFetch(`/products/${encodeURIComponent(id)}`)
}
