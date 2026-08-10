import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/shared/StatusBadge'
import { Package } from 'lucide-react'

function conditionStatus(condition) {
  if (!condition) return null
  const map = { 'Grade A': 'approved', 'Grade B': 'pending', 'Grade C': 'revoked', 'New': 'approved' }
  return map[condition] ?? null
}

export default function ProductCard({ product }) {
  const {
    id,
    title,
    brand,
    model,
    sku,
    condition,
    price,
    stock,
    image_url,
  } = product

  const formattedPrice = price != null
    ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(price)
    : null

  return (
    <div className="group rounded-lg border bg-card flex flex-col overflow-hidden hover:border-primary/50 hover:shadow-md transition-all">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {image_url ? (
          <Image
            src={image_url}
            alt={title || 'Product image'}
            fill
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Package className="w-10 h-10 text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground/60">No image</span>
          </div>
        )}
        {condition && (
          <div className="absolute top-2 left-2">
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-background/90 border text-foreground">
              {condition}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex-1 space-y-1">
          {brand && (
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{brand}</p>
          )}
          <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
            {title || 'Untitled Product'}
          </h3>
          {sku && (
            <p className="text-xs text-muted-foreground">SKU: {sku}</p>
          )}
        </div>

        <div className="space-y-2">
          {formattedPrice && (
            <p className="text-lg font-bold text-foreground">{formattedPrice}</p>
          )}
          {stock != null && (
            <p className={`text-xs font-medium ${stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {stock > 0 ? `${stock} in stock` : 'Out of stock'}
            </p>
          )}
          <Button asChild size="sm" variant="outline" className="w-full">
            <Link href={`/products/${id}`}>View details</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
