import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'
import { Users } from 'lucide-react'

export const metadata = { title: 'Customers — Admin' }

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const filters = [
  { label: 'Approved', value: 'approved' },
  { label: 'Revoked', value: 'revoked' },
]

export default async function CustomersPage({ searchParams }) {
  const { status: statusParam } = await searchParams
  const filter = statusParam === 'revoked' ? 'revoked' : 'approved'

  const supabase = await createServiceClient()

  const { data: customers } = await supabase
    .from('customer_profiles')
    .select('id, email, full_name, company_name, phone, status, created_at')
    .eq('status', filter)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Manage approved trade customer accounts."
      />

      <div className="flex gap-1.5 flex-wrap border-b pb-px">
        {filters.map(({ label, value }) => (
          <Link
            key={value}
            href={`/admin/customers?status=${value}`}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-t transition-colors border-b-2 -mb-px',
              filter === value
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </Link>
        ))}
        <span className="ml-auto text-xs text-muted-foreground self-center pr-1">
          {customers?.length ?? 0} result{customers?.length !== 1 ? 's' : ''}
        </span>
      </div>

      {customers && customers.length > 0 ? (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Email</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Phone</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Since</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground">{c.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{c.email}</p>
                      <p className="text-xs text-muted-foreground">{c.company_name}</p>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{c.email}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{c.phone || '—'}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/customers/${c.id}`}
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
          icon={Users}
          title={`No ${filter} customers`}
          description={filter === 'approved' ? 'No customers have been approved yet.' : 'No customer accounts have been revoked.'}
        />
      )}
    </div>
  )
}
