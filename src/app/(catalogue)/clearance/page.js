import { createServiceClient } from '@/lib/supabase/server'
import { Package } from 'lucide-react'
import ListingCard from '@/components/catalogue/ListingCard'

export const revalidate = 0

export const metadata = {
  title: 'Clearance & Special Lots — PCCustomizer',
  description: 'Clearance items, faulty/for-parts lots, and refurbished bulk stock available at special prices.',
}

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/special-listing-images/`
  : ''

const CATEGORY_FILTERS = [
  { label: 'All',              value: null },
  { label: 'Faulty / Parts',   value: 'faulty_parts' },
  { label: 'Refurbished Bulk', value: 'refurbished_bulk' },
  { label: 'Clearance',        value: 'clearance' },
  { label: 'Mixed Lot',        value: 'mixed_lot' },
]

export default async function ClearancePage({ searchParams }) {
  const params = await searchParams
  const activeCategory = params.category ?? null

  const service = createServiceClient()
  let query = service
    .from('special_listings')
    .select(`
      id, slug, listing_number, title, short_description, listing_category, fixed_price, quantity_total,
      special_listing_images(storage_path ORDER BY sort_order ASC, created_at ASC)
    `)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('published_at', { ascending: false })

  if (activeCategory) query = query.eq('listing_category', activeCategory)

  const { data: listings } = await query

  const lots = (listings ?? []).map(lot => {
    const cover = lot.special_listing_images?.[0]
    return {
      ...lot,
      cover_url: cover ? `${BUCKET}${cover.storage_path}` : null,
    }
  })

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8 space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Clearance &amp; Special Lots</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Faulty/for-parts lots, refurbished bulk stock, and clearance items. All lots sold as described — no returns on faulty parts.
          </p>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 pt-1">
            {CATEGORY_FILTERS.map(({ label, value }) => {
              const isActive = activeCategory === value
              const href = value ? `/clearance?category=${value}` : '/clearance'
              return (
                <a
                  key={label}
                  href={href}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </a>
              )
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 sm:px-6 py-8">
        {lots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-foreground">No lots available</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeCategory ? 'No published lots in this category.' : 'No special lots are currently published.'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {lots.length} lot{lots.length !== 1 ? 's' : ''} available
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {lots.map(lot => (
                <ListingCard key={lot.id} listing={lot} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
