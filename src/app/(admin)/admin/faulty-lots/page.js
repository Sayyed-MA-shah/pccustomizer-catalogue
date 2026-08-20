import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PackageOpen, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import LotStatusBadge from '@/components/admin/LotStatusBadge'
import LotCategoryBadge from '@/components/admin/LotCategoryBadge'

export const metadata = { title: 'Faulty / Parts Lots — Admin' }

const VALID_STATUSES = ['draft', 'published', 'withdrawn', 'sold']

const STATUS_FILTERS = [
  { label: 'All',       value: null },
  { label: 'Draft',     value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Withdrawn', value: 'withdrawn' },
  { label: 'Sold',      value: 'sold' },
]

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtPrice(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v)
}

export default async function FaultyLotsPage({ searchParams }) {
  const { status: statusParam } = await searchParams
  const activeFilter = VALID_STATUSES.includes(statusParam) ? statusParam : null

  const service = createServiceClient()
  let query = service
    .from('special_listings')
    .select('id, listing_number, title, slug, listing_category, status, fixed_price, quantity_total, published_at, created_at')
    .order('created_at', { ascending: false })

  if (activeFilter) query = query.eq('status', activeFilter)

  const { data: lots } = await query

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faulty / Parts Lots"
        subtitle="Manage special listing lots for faulty parts, clearance, and bulk items."
        action={
          <Link
            href="/admin/faulty-lots/new"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New lot
          </Link>
        }
      />

      <div className="flex gap-1.5 flex-wrap border-b pb-px">
        {STATUS_FILTERS.map(({ label, value }) => {
          const href = value ? `/admin/faulty-lots?status=${value}` : '/admin/faulty-lots'
          const isActive = activeFilter === value
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-t transition-colors border-b-2 -mb-px',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </Link>
          )
        })}
        <span className="ml-auto text-xs text-muted-foreground self-center pr-1">
          {lots?.length ?? 0} lot{lots?.length !== 1 ? 's' : ''}
        </span>
      </div>

      {lots && lots.length > 0 ? (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lot</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Category</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Price</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Created</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lots.map(lot => (
                  <tr key={lot.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground line-clamp-1">{lot.title}</p>
                      <p className="text-xs font-mono text-muted-foreground">{lot.listing_number}</p>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <LotCategoryBadge category={lot.listing_category} />
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                      {fmtPrice(lot.fixed_price)}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                      {fmt(lot.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <LotStatusBadge status={lot.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/faulty-lots/${lot.id}`}
                        className="text-xs font-medium text-primary hover:underline underline-offset-4 whitespace-nowrap"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={PackageOpen}
          title="No lots found"
          description={activeFilter ? `No ${activeFilter} lots.` : 'Create your first special listing lot.'}
        />
      )}
    </div>
  )
}
