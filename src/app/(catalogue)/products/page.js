import { Package, Search } from 'lucide-react'
import ProductFilters from '@/components/catalogue/ProductFilters'
import FilterDrawer from '@/components/catalogue/FilterDrawer'
import EmptyState from '@/components/shared/EmptyState'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const revalidate = 0

export const metadata = {
  title: 'Products — PCCustomizer Trade Catalogue',
}

export default async function ProductsPage({ searchParams }) {
  // Phase 3: data will come from catalogue-api.js
  // const { q, category, condition, brand, in_stock, sort, page } = await searchParams

  return (
    <div className="flex flex-1 flex-col">
      {/* Page header bar */}
      <div className="border-b bg-background px-4 sm:px-6 py-4">
        <div className="max-w-[1400px] mx-auto space-y-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Product Catalogue</h1>
            <p className="text-sm text-muted-foreground">
              Browse the full range of trade products available to your account.
            </p>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products, brands, SKUs…"
              className="pl-9"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-6 gap-6">
        {/* Desktop filter sidebar */}
        <ProductFilters className="hidden lg:block w-48 xl:w-56 shrink-0 pt-0.5" />

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <FilterDrawer />
              <p className="text-sm text-muted-foreground">
                {/* Phase 3: show real count */}
                Products will be listed here
              </p>
            </div>
            <Select disabled>
              <SelectTrigger className="w-[160px] h-8 text-sm">
                <SelectValue placeholder="Sort: Relevance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest first</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Product grid — Phase 3 will render real products here */}
          <EmptyState
            icon={Package}
            title="Products coming soon"
            description="The product catalogue will be available once the inventory integration is complete. Check back shortly."
          />
        </div>
      </div>
    </div>
  )
}
