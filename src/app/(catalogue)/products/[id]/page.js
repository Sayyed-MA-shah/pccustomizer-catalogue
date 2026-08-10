import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

export const revalidate = 0

export default async function ProductDetailPage({ params }) {
  // Phase 3: will call catalogue-api.js
  // const { id } = await params
  // const product = await getProduct(id)
  // if (!product) notFound()

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to catalogue
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image area */}
        <div className="space-y-3">
          <div className="aspect-[4/3] rounded-lg border bg-muted flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Package className="w-12 h-12 opacity-40" />
              <span className="text-sm">Product image</span>
            </div>
          </div>
          {/* Thumbnail strip */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-16 h-16 rounded border bg-muted shrink-0" />
            ))}
          </div>
        </div>

        {/* Product info */}
        <div className="space-y-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Brand / Category
            </p>
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              Product Title
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
              Grade A
            </span>
            <span className="text-sm text-muted-foreground">SKU: —</span>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-3xl font-bold text-foreground">—</p>
            <p className="text-sm text-emerald-600 font-medium">— in stock</p>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex gap-3">
              <span className="text-muted-foreground w-24 shrink-0">EAN</span>
              <span>—</span>
            </div>
            <div className="flex gap-3">
              <span className="text-muted-foreground w-24 shrink-0">Condition</span>
              <span>—</span>
            </div>
            <div className="flex gap-3">
              <span className="text-muted-foreground w-24 shrink-0">Category</span>
              <span>—</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            Full product details will be available once the catalogue integration is complete.
          </p>
        </div>
      </div>

      {/* Description & specs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground">Description</h2>
          <Separator />
          <p className="text-sm text-muted-foreground">Coming in Phase 3.</p>
        </div>
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground">Specifications</h2>
          <Separator />
          <p className="text-sm text-muted-foreground">Coming in Phase 3.</p>
        </div>
      </div>
    </div>
  )
}
