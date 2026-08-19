import 'server-only'

// Maps customer_segment → the field name in the API product object
const SEGMENT_PRICE_FIELD = {
  retail:    'retail_price',
  wholesale: 'wholesale_price',
  trade:     'trade_price',
}

// Resolves the correct tier price and strips all raw pricing fields so
// client components never receive prices they shouldn't see.
// segment = 'website' → public website_price (guests and unapproved users)
// segment = 'retail'|'wholesale'|'trade' → their tier price
// segment = null → no price shown
export function sanitizeProduct(product, segment) {
  let resolvedPrice
  if (segment === 'website') {
    resolvedPrice = product.website_price ?? null
  } else {
    const tierField = segment ? SEGMENT_PRICE_FIELD[segment] : null
    resolvedPrice = tierField != null ? (product[tierField] ?? null) : null
  }

  const {
    retail_price,    // stripped
    wholesale_price, // stripped
    trade_price,     // stripped
    website_price,   // stripped
    price: _legacy,  // replaced by resolvedPrice
    ...rest
  } = product

  return { ...rest, price: resolvedPrice }
}

const BASE_URL = process.env.CATALOGUE_API_BASE_URL
const TOKEN = process.env.CATALOGUE_API_TOKEN

const ALLOWED_SORT = ['newest', 'title_asc', 'title_desc', 'price_asc', 'price_desc']
const ALLOWED_PRICE_CONTEXT = ['website', 'retail', 'wholesale', 'trade']
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
  if (input.price_context && ALLOWED_PRICE_CONTEXT.includes(input.price_context)) {
    params.set('price_context', input.price_context)
  }

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
  const result = await catalogueFetch(`/products/${encodeURIComponent(id)}`)
  return result?.data ?? result
}

export async function getCategories() {
  try {
    const result = await catalogueFetch('/categories')
    return result?.data ?? []
  } catch {
    return []
  }
}

export async function getSubcategories(category) {
  try {
    const params = new URLSearchParams()
    params.set('category', String(category).slice(0, 100))
    const result = await catalogueFetch(`/subcategories?${params}`)
    const data = result?.data ?? result
    if (!Array.isArray(data)) return []
    // Handle both string arrays and object arrays
    return data.map(s => (typeof s === 'string' ? s : (s.name ?? s.slug ?? String(s))))
  } catch {
    return []
  }
}

// Derives brand and condition filter options from an unfiltered product sample.
// NOTE: Reflects values in the first MAX_PAGE_SIZE (50) products only.
// A dedicated /facets API endpoint would provide complete coverage without this limit.
export async function getFilterOptions() {
  try {
    const result = await catalogueFetch(`/products?page_size=${MAX_PAGE_SIZE}`)
    const products = result?.data ?? []
    return {
      brands:     [...new Set(products.map(p => p.brand).filter(Boolean))].sort(),
      conditions: [...new Set(products.map(p => p.condition).filter(Boolean))].sort(),
    }
  } catch {
    return { brands: [], conditions: [] }
  }
}
