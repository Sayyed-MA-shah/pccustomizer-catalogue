import { Suspense } from 'react'
import { Search, Package } from 'lucide-react'
import { getProducts } from '@/lib/catalogue-api'
import ProductCard from '@/components/catalogue/ProductCard'
import ProductFilters from '@/components/catalogue/ProductFilters'
import FilterDrawer from '@/components/catalogue/FilterDrawer'
import EmptyState from '@/components/shared/EmptyState'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

export const revalidate = 0

export const metadata = {
  title: 'Products — PCCustomizer Trade Catalogue',
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-20 mt-2" />
            <Skeleton className="h-8 w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

async function ProductResults({ searchParams }) {
  let result = null
  let fetchError = null

  try {
    result = await getProducts({
      search:    searchParams.q,
      category:  searchParams.category,
      condition: searchParams.condition,
      brand:     searchParams.brand,
      in_stock:  searchParams.in_stock,
      sort:      searchParams.sort,
      page:      searchParams.page,
      page_size: '24',
    })
  } catch (err) {
    fetchError = err.message
  }

  if (fetchError) {
    return (
      <EmptyState
        icon={Package}
        title="Unable to load products"
        description="There was a problem connecting to the catalogue. Please try again shortly."
      />
    )
  }

  const products = result?.products ?? result?.data ?? (Array.isArray(result) ? result : [])
  const total = result?.total ?? result?.count ?? products.length

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No products found"
        description="Try adjusting your filters or search term."
      />
    )
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {total} product{total !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  )
}

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams

  return (
    <div className="flex flex-1 flex-col">
      {/* Page header */}
      <div className="border-b bg-background px-4 sm:px-6 py-4">
        <div className="max-w-[1400px] mx-auto space-y-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Product Catalogue</h1>
            <p className="text-sm text-muted-foreground">
              Browse the full range of trade products available to your account.
            </p>
          </div>
          <form method="GET" action="/products" className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              name="q"
              defaultValue={params.q || ''}
              placeholder="Search products, brands, SKUs…"
              className="w-full pl-9 pr-4 h-9 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-6 gap-6">
        {/* Desktop filter sidebar */}
        <ProductFilters className="hidden lg:block w-48 xl:w-56 shrink-0 pt-0.5" />

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <FilterDrawer />
            <div className="ml-auto">
              <Select defaultValue={params.sort || 'newest'}>
                <SelectTrigger className="w-[160px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="title_asc">Name: A–Z</SelectItem>
                  <SelectItem value="title_desc">Name: Z–A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductResults searchParams={params} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
