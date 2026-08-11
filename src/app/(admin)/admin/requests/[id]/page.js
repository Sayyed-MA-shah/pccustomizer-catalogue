import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import StatusBadge from '@/components/shared/StatusBadge'
import SegmentBadge from '@/components/shared/SegmentBadge'
import ReviewPanel from '@/components/admin/ReviewPanel'

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

export default async function ReviewRequestPage({ params }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: request } = await supabase
    .from('access_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (!request) notFound()

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('status, customer_segment')
    .eq('id', request.user_id)
    .single()

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/admin/requests"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to requests
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {request.business_info?.full_name || 'Access Request'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {request.business_info?.company_name}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {profile?.customer_segment && <SegmentBadge segment={profile.customer_segment} />}
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Customer information
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y pt-0">
            <Row label="Full name" value={request.business_info?.full_name} />
            <Row label="Email" value={request.business_info?.email} />
            <Row label="Phone" value={request.business_info?.phone} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Business information
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y pt-0">
            <Row label="Company" value={request.business_info?.company_name} />
            <Row label="VAT number" value={request.business_info?.company_vat} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Request information
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y pt-0">
          <Row label="Submitted" value={fmt(request.submitted_at, true)} />
          <Row label="Request status" value={<StatusBadge status={request.status} />} />
          {profile && <Row label="Current access" value={<StatusBadge status={profile.status} />} />}
          {profile?.customer_segment && (
            <Row label="Customer type" value={<SegmentBadge segment={profile.customer_segment} />} />
          )}
          {request.reviewed_at && <Row label="Reviewed" value={fmt(request.reviewed_at, true)} />}
          {request.notes && <Row label="Notes" value={request.notes} />}
        </CardContent>
      </Card>

      {request.status === 'pending' ? (
        <ReviewPanel requestId={request.id} />
      ) : (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          This request has already been {request.status}.
        </div>
      )}
    </div>
  )
}
