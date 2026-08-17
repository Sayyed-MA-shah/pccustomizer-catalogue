import { redirect } from 'next/navigation'
import { getCustomerProfile } from '@/lib/auth-helpers'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { User, Building2, Mail, Phone, ShieldCheck } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import SegmentBadge from '@/components/shared/SegmentBadge'
import AddressBook from '@/components/catalogue/AddressBook'

export const metadata = {
  title: 'My Account — PCCustomizer Catalogue',
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value || '—'}</p>
      </div>
    </div>
  )
}

export default async function AccountPage() {
  const profile = await getCustomerProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()
  const { data: addresses } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('customer_id', profile.id)
    .order('address_type')
    .order('created_at')

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <PageHeader
        title="My Account"
        subtitle="Your account details and access status."
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            Personal information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailRow icon={User} label="Full name" value={profile.full_name} />
          <Separator />
          <DetailRow icon={Mail} label="Email address" value={profile.email} />
          <Separator />
          <DetailRow icon={Phone} label="Phone" value={profile.phone} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            Business information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailRow icon={Building2} label="Company name" value={profile.company_name} />
          <Separator />
          <DetailRow icon={ShieldCheck} label="VAT number" value={profile.company_vat} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Access status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <StatusBadge status={profile.status} />
            <span className="text-sm text-muted-foreground">
              {profile.status === 'approved'
                ? 'Your account has full access to the catalogue.'
                : 'Your account access is currently restricted.'}
            </span>
          </div>
          {profile.customer_segment && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <SegmentBadge segment={profile.customer_segment} />
                <span className="text-sm text-muted-foreground">Customer type</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AddressBook initialAddresses={addresses ?? []} />

      <p className="text-xs text-muted-foreground text-center pb-4">
        To update your personal details, contact us at{' '}
        <a href="mailto:trade@pccustomizer.com" className="underline underline-offset-4 hover:text-foreground">
          trade@pccustomizer.com
        </a>
      </p>
    </div>
  )
}
