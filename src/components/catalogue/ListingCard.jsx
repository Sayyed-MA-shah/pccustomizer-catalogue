import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Package } from 'lucide-react'

const CATEGORY_LABELS = {
  faulty_parts:     'Faulty / Parts',
  refurbished_bulk: 'Refurbished Bulk',
  clearance:        'Clearance',
  mixed_lot:        'Mixed Lot',
}

const CATEGORY_STYLES = {
  faulty_parts:     'bg-red-50 text-red-700',
  refurbished_bulk: 'bg-violet-50 text-violet-700',
  clearance:        'bg-orange-50 text-orange-700',
  mixed_lot:        'bg-sky-50 text-sky-700',
}

function fmtPrice(v) {
  if (v == null) return null
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v)
}

export default function ListingCard({ listing }) {
  const { slug, title, short_description, listing_category, fixed_price, quantity_total, cover_url } = listing
  const href = `/clearance/${slug}`
  const categoryLabel = CATEGORY_LABELS[listing_category] ?? listing_category
  const categoryStyle = CATEGORY_STYLES[listing_category] ?? 'bg-muted text-muted-foreground'
  const priceText = fmtPrice(fixed_price)

  return (
    <Link
      href={href}
      aria-label={`${title} — view listing`}
      className="group flex flex-col rounded-xl border bg-card overflow-hidden hover:border-foreground/20 hover:shadow-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
        {cover_url ? (
          <Image
            src={cover_url}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
            <Package className="h-14 w-14" />
          </div>
        )}
        <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full ${categoryStyle}`}>
          {categoryLabel}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-1">
        <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">{title}</h3>
        {short_description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{short_description}</p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div>
            {priceText ? (
              <span className="text-base font-bold text-foreground">{priceText}</span>
            ) : (
              <span className="text-sm text-muted-foreground">Contact for price</span>
            )}
            {quantity_total > 0 && (
              <p className="text-xs text-muted-foreground">{quantity_total} unit{quantity_total !== 1 ? 's' : ''}</p>
            )}
          </div>
          <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-[gap] duration-150">
            View <ArrowRight className="w-3 h-3 shrink-0" />
          </span>
        </div>
      </div>
    </Link>
  )
}
