import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import RevokeButton from '@/components/admin/RevokeButton'
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
    <div className="space-y-6">
      <Link href="/admin/customers" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to customers
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{profile.full_name || profile.email}</h1>
          <p className="text-muted-foreground text-sm mt-1">{profile.email}</p>
        </div>
        <StatusBadge status={profile.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Full name" value={profile.full_name} />
            <DetailRow label="Email" value={profile.email} />
            <DetailRow label="Company" value={profile.company_name} />
            <DetailRow label="VAT number" value={profile.company_vat} />
            <DetailRow label="Phone" value={profile.phone} />
            <DetailRow label="Access status" value={<StatusBadge status={profile.status} />} />
            <DetailRow label="Member since" value={formatDateTime(profile.created_at)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(requests ?? []).map((req) => (
              <div key={req.id} className="flex items-start justify-between gap-4 py-2 border-b last:border-0">
                <div>
                  <p className="text-muted-foreground text-xs">{formatDateTime(req.submitted_at)}</p>
                  {req.notes && (
                    <p className="text-xs text-muted-foreground italic mt-0.5">"{req.notes}"</p>
                  )}
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
            {(!requests || requests.length === 0) && (
              <p className="text-muted-foreground">No requests found</p>
            )}
          </CardContent>
        </Card>
      </div>

      {profile.status === 'approved' && (
        <RevokeButton customerId={id} customerName={profile.full_name || profile.email} />
      )}
    </div>
  )
}
