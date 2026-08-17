import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, Building2, Package } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { getProduct, sanitizeProduct } from '@/lib/catalogue-api'
import { getCustomerProfile } from '@/lib/auth-helpers'
import AddToCartButton from '@/components/catalogue/AddToCartButton'

export const revalidate = 0

function formatPrice(price) {
  if (price == null) return null
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(price)
}

function SpecRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground w-36 shrink-0">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  )
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params

  let rawProduct = null
  try {
    rawProduct = await getProduct(id)
  } catch {
    notFound()
  }

  if (!rawProduct) notFound()

  const profile = await getCustomerProfile()
  const isApproved = profile?.status === 'approved'
  const segment = isApproved ? (profile.customer_segment ?? 'website') : 'website'
  const isAccountCustomer = isApproved && profile?.customer_segment

  const product = sanitizeProduct(rawProduct, segment)

  const {
    title,
    brand,
    model,
    sku,
    ean,
    ean_sku,
    condition,
    price,
    description,
    category,
    subcategory,
    images = [],
    specifications,
  } = product

  const stock = product.stock ?? product.stock_quantity ?? null
  const specs = specifications ?? {}
  const primaryImage = images[0]?.url ?? null
  const primaryAlt = images[0]?.alt_text || title || 'Product image'
  const thumbs = images.slice(1, 5)
  const formattedPrice = formatPrice(price)

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-8">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="aspect-[4/3] rounded-lg border bg-muted overflow-hidden flex items-center justify-center">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={primaryAlt}
                width={600}
                height={450}
                className="object-contain w-full h-full p-4"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Package className="w-12 h-12 opacity-30" />
                <span className="text-sm">No image available</span>
              </div>
            )}
          </div>
          {thumbs.length > 0 && (
            <div className="flex gap-2">
              {thumbs.map((img, i) => (
                <div key={i} className="w-16 h-16 rounded border bg-muted overflow-hidden shrink-0">
                  <Image src={img.url} alt={img.alt_text || ''} width={64} height={64} className="object-contain w-full h-full p-1" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-5">
          <div className="space-y-1">
            {brand && (
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {brand}{model ? ` • ${model}` : ''}
              </p>
            )}
            <h1 className="text-2xl font-bold text-foreground leading-tight">{title}</h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {condition && (
              <span className="text-xs font-medium px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                {condition}
              </span>
            )}
            {sku && <span className="text-sm text-muted-foreground">SKU: {sku}</span>}
          </div>

          <Separator />

          <div className="space-y-1">
            {formattedPrice ? (
              <div>
                <p className="text-3xl font-bold text-foreground">{formattedPrice}</p>
                {isAccountCustomer && (
                  <p className="text-xs text-muted-foreground mt-0.5">Your price</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Price unavailable</p>
            )}
            {stock != null && (
              <p className={`text-sm font-medium ${stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {stock > 0 ? `${stock} units available` : 'Out of stock'}
              </p>
            )}
          </div>

          <AddToCartButton
            product={{ id, title, sku, imageUrl: primaryImage }}
            maxStock={stock ?? undefined}
          />

          {/* Account pricing callout for guests */}
          {!isAccountCustomer && (
            <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-start gap-3">
              <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Have a business account?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isApproved
                    ? 'Sign in to view your account pricing.'
                    : 'Sign in to view your account price, or '}
                  {!isApproved && (
                    <Link href="/register" className="underline underline-offset-4 hover:text-foreground">
                      apply for trade access
                    </Link>
                  )}
                  {!isApproved && ' to unlock tier pricing.'}
                </p>
                {!isApproved && (
                  <Link
                    href="/login"
                    className="mt-1.5 inline-block text-xs font-medium text-primary hover:underline underline-offset-4"
                  >
                    Sign in →
                  </Link>
                )}
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-0">
            <SpecRow label="EAN" value={ean ?? ean_sku} />
            <SpecRow label="Condition" value={condition} />
            <SpecRow label="Category" value={subcategory ? `${category} › ${subcategory}` : category} />
            <SpecRow label="Brand" value={brand} />
          </div>
        </div>
      </div>

      {/* Description & specs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {description && (
          <div className="space-y-3">
            <h2 className="font-semibold text-foreground">Description</h2>
            <Separator />
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{description}</p>
          </div>
        )}

        {specs && (typeof specs === 'string' ? specs.trim().length > 0 : Object.keys(specs).length > 0) && (
          <div className="space-y-3">
            <h2 className="font-semibold text-foreground">Specifications</h2>
            <Separator />
            {typeof specs === 'string' ? (
              <ul className="space-y-1">
                {specs.trim().split(/\n+/).map((line, i) => line.trim() && (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary mt-1 shrink-0">·</span>
                    <span>{line.trim()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div>
                {Object.entries(specs).map(([key, val]) => (
                  <SpecRow key={key} label={key} value={String(val)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
