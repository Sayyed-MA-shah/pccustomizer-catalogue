import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import LotStatusBadge from '@/components/admin/LotStatusBadge'
import LotCategoryBadge from '@/components/admin/LotCategoryBadge'
import LotStatusActions from '@/components/admin/LotStatusActions'
import LotItemsEditor from '@/components/admin/LotItemsEditor'
import LotImageManager from '@/components/admin/LotImageManager'

export const revalidate = 0

export async function generateMetadata({ params }) {
  const { id } = await params
  const service = createServiceClient()
  const { data } = await service.from('special_listings').select('title, listing_number').eq('id', id).single()
  return { title: data ? `${data.listing_number} — Admin` : 'Lot — Admin' }
}

const BUCKET = 'special-listing-images'

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtPrice(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v)
}

function Field({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm text-foreground mt-0.5">{value}</p>
    </div>
  )
}

export default async function LotDetailPage({ params }) {
  const { id } = await params
  const service = createServiceClient()

  // Fetch lot with items and images separately (avoids PostgREST embedded sort issues)
  const [lotResult, itemsResult, imagesResult] = await Promise.all([
    service.from('special_listings').select('*').eq('id', id).single(),
    service.from('special_listing_items').select('*').eq('listing_id', id).order('created_at', { ascending: true }),
    service.from('special_listing_images').select('*').eq('listing_id', id)
      .order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
  ])

  if (lotResult.error || !lotResult.data) notFound()

  const lot = lotResult.data
  const items = itemsResult.data ?? []
  const rawImages = imagesResult.data ?? []

  // Generate signed URLs server-side (24h expiry for admin session)
  const images = await Promise.all(
    rawImages.map(async (img) => {
      const { data: su } = await service.storage.from(BUCKET).createSignedUrl(img.storage_path, 86400)
      return { ...img, signed_url: su?.signedUrl ?? null }
    })
  )

  return (
    <div className="space-y-8">
      {/* Back nav */}
      <div>
        <Link
          href="/admin/faulty-lots"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to lots
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{lot.title}</h1>
              <LotStatusBadge status={lot.status} />
              <LotCategoryBadge category={lot.listing_category} />
            </div>
            <p className="text-sm font-mono text-muted-foreground mt-1">{lot.listing_number}</p>
          </div>
          {lot.status === 'published' && (
            <Link
              href={`/clearance/${lot.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-4"
            >
              View public page <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Status actions */}
      <section className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Status</h2>
        <LotStatusActions listingId={lot.id} currentStatus={lot.status} />
        {lot.status === 'sold' && (
          <p className="text-xs text-muted-foreground">This lot is marked as sold.</p>
        )}
        {lot.status === 'draft' && (
          <p className="text-xs text-muted-foreground">
            To publish: add a description, set a price, add at least one item and one image.
          </p>
        )}
      </section>

      {/* Details */}
      <section className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Lot details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Fixed price" value={fmtPrice(lot.fixed_price)} />
          <Field label="Quantity" value={lot.quantity_total} />
          <Field label="Sale method" value={lot.sale_method === 'fixed_price' ? 'Fixed price' : 'Auction'} />
          <Field label="Visibility" value={lot.visibility === 'public' ? 'Public' : 'Approved customers only'} />
          <Field label="Published" value={fmt(lot.published_at)} />
          <Field label="Created" value={fmt(lot.created_at)} />
        </div>
        <Field label="URL slug" value={lot.slug} />
        {lot.short_description && <Field label="Short description" value={lot.short_description} />}
        {lot.description && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-foreground whitespace-pre-line">{lot.description}</p>
          </div>
        )}
        {lot.customer_notes && <Field label="Customer notes" value={lot.customer_notes} />}
      </section>

      {/* Items */}
      <section className="rounded-lg border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Included items</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
        <LotItemsEditor listingId={lot.id} initialItems={items} />
      </section>

      {/* Images */}
      <section className="rounded-lg border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Images</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {images.length} image{images.length !== 1 ? 's' : ''} — first image is the cover / primary.
          </p>
        </div>
        <LotImageManager listingId={lot.id} initialImages={images} />
      </section>
    </div>
  )
}
