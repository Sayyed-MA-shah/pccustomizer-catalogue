import { Suspense } from 'react'
import { AlertTriangle, Package, X } from 'lucide-react'
import { getProducts, getFilterOptions, sanitizeProduct } from '@/lib/catalogue-api'
import { getCustomerProfile } from '@/lib/auth-helpers'
import ProductCard from '@/components/catalogue/ProductCard'
import CatalogueSearchBar from '@/components/catalogue/CatalogueSearchBar'
import CatalogueFilterBar from '@/components/catalogue/CatalogueFilterBar'
import { Skeleton } from '@/components/ui/skeleton'

export const revalidate = 0

export const metadata = {
  title: 'Products — PCCustomizer',
}

const PRICE_SORTS = new Set(['price_asc', 'price_desc'])

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProductGridSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-28" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col rounded-md border bg-card overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-4 space-y-2.5">
              <Skeleton className="h-2.5 w-12" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="pt-2 border-t mt-2 space-y-1.5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-full mt-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Product results ────────────────────────────────────────────────────────────

async function ProductResults({ searchParams, segment }) {
  let result = null
  let fetchError = null

  const sort = searchParams.sort ?? 'newest'
  const priceContext = PRICE_SORTS.has(sort) ? segment : undefined

  try {
    result = await getProducts({
      search:        searchParams.q,
      category:      searchParams.category,
      condition:     searchParams.condition,
      brand:         searchParams.brand,
      in_stock:      searchParams.in_stock,
      sort,
      page:          searchParams.page,
      page_size:     '24',
      price_context: priceContext,
    })
  } catch (err) {
    fetchError = err.message
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-sm font-medium text-foreground">Unable to load products</h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          There was a problem connecting to the catalogue. Please try refreshing the page.
        </p>
      </div>
    )
  }

  const rawProducts = result?.data ?? result?.products ?? (Array.isArray(result) ? result : [])
  const products = rawProducts.map(p => sanitizeProduct(p, segment))
  const total = result?.pagination?.total ?? result?.total ?? rawProducts.length
  const hasFilters = ['category', 'brand', 'condition', 'in_stock', 'q'].some(k => searchParams[k])

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium text-foreground">No products found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasFilters
            ? 'No products match your current filters. Try adjusting your search or filters.'
            : 'No products are available in the catalogue yet.'}
        </p>
        {hasFilters && (
          <a
            href="/products"
            className="mt-4 flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors"
          >
            <X className="h-3 w-3" />
            Clear all filters
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {total} product{total !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProductsPage({ searchParams }) {
  const [params, profile, filterOptions] = await Promise.all([
    searchParams,
    getCustomerProfile(),
    getFilterOptions(),
  ])

  // Guests and unapproved users see website_price; approved customers see their tier price
  const isApproved = profile?.status === 'approved'
  const segment = isApproved ? (profile.customer_segment ?? 'website') : 'website'
  const isAccountCustomer = isApproved && profile?.customer_segment

  const paramsKey = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null)
    )
  ).toString()

  return (
    <div className="flex flex-1 flex-col">
      {/* ── Page header ── */}
      <div className="border-b bg-background">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-5 space-y-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Products</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAccountCustomer
                ? 'Browse with your account pricing applied.'
                : 'Browse our full product range. Prices shown are public rates.'}
            </p>
          </div>
          <CatalogueSearchBar />
          <CatalogueFilterBar options={filterOptions} canPriceSort={true} />
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 sm:px-6 py-6">
        <Suspense key={paramsKey} fallback={<ProductGridSkeleton />}>
          <ProductResults searchParams={params} segment={segment} />
        </Suspense>
      </div>
    </div>
  )
}
