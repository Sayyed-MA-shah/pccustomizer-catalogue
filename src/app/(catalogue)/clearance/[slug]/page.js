import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Package, Mail } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import LotCategoryBadge from '@/components/admin/LotCategoryBadge'

export const revalidate = 0

const BUCKET = 'special-listing-images'

function fmtPrice(v) {
  if (v == null) return null
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v)
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const service = createServiceClient()
  const { data } = await service
    .from('special_listings')
    .select('title, short_description, listing_number')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  if (!data) return {}
  return {
    title: `${data.title} (${data.listing_number}) — PCCustomizer`,
    description: data.short_description || undefined,
  }
}

export default async function ClearanceDetailPage({ params }) {
  const { slug } = await params
  const service = createServiceClient()

  // Fetch lot
  const { data: lot, error } = await service
    .from('special_listings')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !lot) notFound()

  // Fetch items and images separately for correct ordering
  const [itemsResult, imagesResult] = await Promise.all([
    service.from('special_listing_items').select('*').eq('listing_id', lot.id).order('created_at', { ascending: true }),
    service.from('special_listing_images').select('*').eq('listing_id', lot.id)
      .order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
  ])

  const items = itemsResult.data ?? []
  const rawImages = imagesResult.data ?? []

  // Generate signed URLs for public display (1h — page revalidate=0 so always fresh)
  const images = await Promise.all(
    rawImages.map(async (img) => {
      const { data: su } = await service.storage.from(BUCKET).createSignedUrl(img.storage_path, 3600)
      return { ...img, signed_url: su?.signedUrl ?? null }
    })
  )

  const priceText = fmtPrice(lot.fixed_price)

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/clearance" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronLeft className="w-3 h-3" />
          Clearance &amp; Special Lots
        </Link>
        <span>/</span>
        <span className="text-foreground">{lot.listing_number}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* Left: images + description */}
        <div className="space-y-6">
          {/* Image gallery */}
          {images.length > 0 ? (
            <div className="space-y-3">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-muted">
                {images[0].signed_url ? (
                  <Image
                    src={images[0].signed_url}
                    alt={images[0].alt_text || lot.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 800px"
                    priority
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="w-16 h-16 text-muted-foreground/20" />
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.slice(1).map((img, i) => (
                    <div key={img.id} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                      {img.signed_url ? (
                        <Image
                          src={img.signed_url}
                          alt={img.alt_text || `Image ${i + 2}`}
                          fill
                          className="object-cover"
                          sizes="120px"
                          unoptimized
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-muted">
              <Package className="w-20 h-20 text-muted-foreground/20" />
            </div>
          )}

          {/* Description */}
          {lot.description && (
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">Description</h2>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{lot.description}</p>
            </div>
          )}

          {/* Items table */}
          {items.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">
                Included items ({items.length})
              </h2>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Condition</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map(item => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3">
                          <p className="font-medium text-foreground">{item.product_title_snapshot}</p>
                          <p className="text-xs text-muted-foreground">
                            {[item.brand_snapshot, item.model_snapshot].filter(Boolean).join(' · ')}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">{item.notes}</p>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground hidden sm:table-cell">
                          {item.condition_snapshot || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-sm text-foreground">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: price + CTA */}
        <div className="lg:sticky lg:top-24 space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div>
              <LotCategoryBadge category={lot.listing_category} />
              <h1 className="text-xl font-bold text-foreground mt-2 leading-snug">{lot.title}</h1>
              <p className="text-xs font-mono text-muted-foreground mt-1">{lot.listing_number}</p>
            </div>

            {lot.short_description && (
              <p className="text-sm text-muted-foreground">{lot.short_description}</p>
            )}

            <div className="border-t pt-4 space-y-1">
              {priceText ? (
                <p className="text-2xl font-bold text-foreground">{priceText}</p>
              ) : (
                <p className="text-base text-muted-foreground">Price on application</p>
              )}
              {lot.quantity_total > 0 && (
                <p className="text-sm text-muted-foreground">
                  {lot.quantity_total} unit{lot.quantity_total !== 1 ? 's' : ''} in this lot
                </p>
              )}
            </div>

            {lot.customer_notes && (
              <div className="rounded-md bg-muted/50 border px-3 py-2.5">
                <p className="text-xs text-muted-foreground leading-relaxed">{lot.customer_notes}</p>
              </div>
            )}

            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium text-foreground">Interested in this lot?</p>
              <p className="text-xs text-muted-foreground">Contact our trade team to arrange purchase or collection.</p>
              <a
                href="mailto:trade@pccustomizer.com"
                className="flex items-center justify-center gap-2 h-10 w-full rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Email us about this lot
              </a>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            All special lots sold as described. No returns on faulty/for-parts items.
          </p>
        </div>
      </div>
    </div>
  )
}
