import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StatusBadge from '@/components/shared/StatusBadge'
import SegmentBadge from '@/components/shared/SegmentBadge'
import RevokeButton from '@/components/admin/RevokeButton'
import ChangeSegmentButton from '@/components/admin/ChangeSegmentButton'

function fmt(d, time = false) {
  if (!d) return '—'
  const opts = time
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' }
  return new Date(d).toLocaleString('en-GB', opts)
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3 py-2">
      <span className="text-sm text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground break-all">{value || '—'}</span>
    </div>
  )
}

export default async function CustomerDetailPage({ params }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const [{ data: profile }, { data: requests }] = await Promise.all([
    supabase.from('customer_profiles').select('*').eq('id', id).single(),
    supabase
      .from('access_requests')
      .select('id, status, submitted_at, reviewed_at, notes')
      .eq('user_id', id)
      .order('submitted_at', { ascending: false }),
  ])

  if (!profile) notFound()

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to customers
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {profile.full_name || profile.email}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{profile.email}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {profile.customer_segment && <SegmentBadge segment={profile.customer_segment} />}
          <StatusBadge status={profile.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y pt-0">
            <Row label="Full name" value={profile.full_name} />
            <Row label="Email" value={profile.email} />
            <Row label="Phone" value={profile.phone} />
            <Row label="Member since" value={fmt(profile.created_at)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Business
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y pt-0">
            <Row label="Company" value={profile.company_name} />
            <Row label="VAT number" value={profile.company_vat} />
            <Row label="Access status" value={<StatusBadge status={profile.status} />} />
            <Row
              label="Customer type"
              value={<SegmentBadge segment={profile.customer_segment} />}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Request history
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {requests && requests.length > 0 ? (
            <div className="divide-y">
              {requests.map((req) => (
                <div key={req.id} className="flex items-start justify-between gap-4 py-2.5">
                  <div>
                    <p className="text-xs text-muted-foreground">{fmt(req.submitted_at, true)}</p>
                    {req.notes && (
                      <p className="text-xs text-muted-foreground italic mt-0.5">"{req.notes}"</p>
                    )}
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">No requests found.</p>
          )}
        </CardContent>
      </Card>

      {/* Admin actions */}
      {profile.status === 'approved' && (
        <div className="space-y-3">
          {/* Change segment */}
          <div className="rounded-lg border px-4 py-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">Customer type</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Changing the customer type takes effect immediately and affects the prices this
                customer sees in the catalogue.
              </p>
            </div>
            <ChangeSegmentButton
              customerId={id}
              currentSegment={profile.customer_segment}
            />
          </div>

          {/* Revoke access */}
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">Revoke catalogue access</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This will immediately remove the customer's access to the catalogue.
              </p>
            </div>
            <RevokeButton customerId={id} customerName={profile.full_name || profile.email} />
          </div>
        </div>
      )}
    </div>
  )
}
