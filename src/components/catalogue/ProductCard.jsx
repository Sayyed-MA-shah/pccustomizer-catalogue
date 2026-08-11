import Link from 'next/link'
import Image from 'next/image'
import { Package } from 'lucide-react'

export default function ProductCard({ product }) {
  const {
    id,
    title,
    brand,
    sku,
    condition,
    price,
    images,
  } = product

  const stock = product.stock ?? product.stock_quantity ?? null
  const inStock = product.in_stock ?? (stock != null ? stock > 0 : null)
  const primaryImage = images?.[0]?.url ?? null
  const primaryAlt = images?.[0]?.alt_text || title || 'Product image'

  const formattedPrice = price != null
    ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(price)
    : null

  const stockLabel = stock != null
    ? stock > 0 ? `${stock} in stock` : 'Out of stock'
    : inStock != null
      ? inStock ? 'In stock' : 'Out of stock'
      : null

  const stockColor = (stock != null ? stock > 0 : inStock)
    ? 'text-emerald-600'
    : 'text-red-500'

  return (
    <Link
      href={`/products/${id}`}
      aria-label={`View details for ${title || 'product'}`}
      className="group flex flex-col rounded-md border bg-card overflow-hidden hover:border-foreground/20 hover:shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted shrink-0 overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={primaryAlt}
            fill
            className="object-contain p-3 transition-transform duration-200 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground/30">
            <Package className="h-10 w-10" />
            <span className="text-xs">No image</span>
          </div>
        )}
        {condition && (
          <span className="absolute top-2 left-2 rounded bg-background/90 border px-1.5 py-0.5 text-[11px] font-medium text-foreground">
            {condition}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 gap-1.5">
        {/* Brand */}
        {brand && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {brand}
          </p>
        )}

        {/* Title — two-line clamp for consistent card height */}
        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.5rem]">
          {title || 'Untitled Product'}
        </h3>

        {/* SKU */}
        {sku && (
          <p className="text-[11px] text-muted-foreground">SKU: {sku}</p>
        )}

        {/* Spacer — pushes price+stock+button to bottom */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="pt-3 border-t mt-1 space-y-1">
          {formattedPrice && (
            <p className="text-base font-bold text-foreground">{formattedPrice}</p>
          )}
          {stockLabel && (
            <p className={`text-xs font-medium ${stockColor}`}>{stockLabel}</p>
          )}
          <div className="pt-1">
            <span className="flex h-8 w-full items-center justify-center rounded border border-input bg-background text-xs font-medium text-foreground transition-colors group-hover:bg-muted">
              View details
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
