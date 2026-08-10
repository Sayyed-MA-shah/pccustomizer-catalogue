import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export const metadata = { title: 'Customers — Admin' }

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default async function CustomersPage({ searchParams }) {
  const { status: statusParam } = await searchParams
  const filter = statusParam === 'revoked' ? 'revoked' : 'approved'

  const supabase = await createServiceClient()

  const { data: customers } = await supabase
    .from('customer_profiles')
    .select('id, email, full_name, company_name, phone, status, created_at')
    .eq('status', filter)
    .order('created_at', { ascending: false })

  const filters = [
    { label: 'Approved', value: 'approved' },
    { label: 'Revoked', value: 'revoked' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Customers</h1>

      <div className="flex gap-2">
        {filters.map(({ label, value }) => (
          <Link
            key={value}
            href={`/admin/customers?status=${value}`}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm border transition-colors',
              filter === value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="py-2 px-4 text-left font-medium text-muted-foreground">Name</th>
              <th className="py-2 px-4 text-left font-medium text-muted-foreground">Email</th>
              <th className="py-2 px-4 text-left font-medium text-muted-foreground">Company</th>
              <th className="py-2 px-4 text-left font-medium text-muted-foreground">Phone</th>
              <th className="py-2 px-4 text-left font-medium text-muted-foreground">Since</th>
              <th className="py-2 px-4 text-left font-medium text-muted-foreground">Status</th>
              <th className="py-2 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {(customers ?? []).map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="py-2 px-4 font-medium">{c.full_name || '—'}</td>
                <td className="py-2 px-4 text-muted-foreground">{c.email}</td>
                <td className="py-2 px-4 text-muted-foreground">{c.company_name || '—'}</td>
                <td className="py-2 px-4 text-muted-foreground">{c.phone || '—'}</td>
                <td className="py-2 px-4 text-muted-foreground whitespace-nowrap">{formatDate(c.created_at)}</td>
                <td className="py-2 px-4">
                  <Badge variant={c.status === 'approved' ? 'default' : 'outline'}>{c.status}</Badge>
                </td>
                <td className="py-2 px-4">
                  <Link href={`/admin/customers/${c.id}`} className="text-sm text-primary hover:underline whitespace-nowrap">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
            {(!customers || customers.length === 0) && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  No {filter} customers
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
