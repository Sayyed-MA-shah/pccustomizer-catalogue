import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Layers } from 'lucide-react'

export default function CategoryCard({ category }) {
  const { name, slug, description, image_url, product_count } = category
  const href = `/products?category=${encodeURIComponent(name)}`

  return (
    <Link
      href={href}
      aria-label={`Browse ${name} — ${product_count ?? 0} products`}
      className="group flex flex-col rounded-xl border bg-card overflow-hidden hover:border-foreground/20 hover:shadow-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
        {image_url ? (
          <Image
            src={image_url}
            alt={`${name} products`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
            <Layers className="h-14 w-14" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-1">
        <h3 className="text-base font-bold text-foreground leading-snug">{name}</h3>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between">
          {product_count != null ? (
            <span className="text-xs text-muted-foreground">
              {product_count} product{product_count !== 1 ? 's' : ''}
            </span>
          ) : (
            <span />
          )}
          <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-[gap] duration-150">
            Shop {name}
            <ArrowRight className="w-3 h-3 shrink-0" />
          </span>
        </div>
      </div>
    </Link>
  )
}
