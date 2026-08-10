import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ReviewPanel from '@/components/admin/ReviewPanel'
import Link from 'next/link'

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function StatusBadge({ status }) {
  const variantMap = {
    pending: 'secondary',
    approved: 'default',
    rejected: 'destructive',
    revoked: 'outline',
  }
  return <Badge variant={variantMap[status] ?? 'secondary'}>{status}</Badge>
}

function DetailRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-28 shrink-0">{label}</span>
      <span className="font-medium break-all">{value || '—'}</span>
    </div>
  )
}

export default async function ReviewRequestPage({ params }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const [{ data: request }, ] = await Promise.all([
    supabase.from('access_requests').select('*').eq('id', id).single(),
  ])

  if (!request) notFound()

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('status')
    .eq('id', request.user_id)
    .single()

  return (
    <div className="space-y-6">
      <Link href="/admin/requests" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to requests
      </Link>

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">
          {request.business_info?.full_name || 'Access Request'}
        </h1>
        <StatusBadge status={request.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Full name" value={request.business_info?.full_name} />
            <DetailRow label="Email" value={request.business_info?.email} />
            <DetailRow label="Company" value={request.business_info?.company_name} />
            <DetailRow label="VAT number" value={request.business_info?.company_vat} />
            <DetailRow label="Phone" value={request.business_info?.phone} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Submitted" value={formatDateTime(request.submitted_at)} />
            <DetailRow label="Request status" value={<StatusBadge status={request.status} />} />
            {profile && <DetailRow label="Current access" value={<StatusBadge status={profile.status} />} />}
            {request.reviewed_at && <DetailRow label="Reviewed" value={formatDateTime(request.reviewed_at)} />}
            {request.notes && <DetailRow label="Notes" value={request.notes} />}
          </CardContent>
        </Card>
      </div>

      {request.status === 'pending' ? (
        <ReviewPanel requestId={request.id} />
      ) : (
        <p className="text-sm text-muted-foreground">
          This request has already been {request.status}.
        </p>
      )}
    </div>
  )
}
