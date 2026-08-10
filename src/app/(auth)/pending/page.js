import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Clock, Mail } from 'lucide-react'

export const metadata = {
  title: 'Application Under Review — PCCustomizer Trade Catalogue',
}

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('status, full_name, company_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.status === 'approved') redirect('/products')
  if (profile.status === 'rejected' || profile.status === 'revoked') redirect('/rejected')

  const firstName = profile.full_name ? profile.full_name.split(' ')[0] : null

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">PC</span>
        </div>
        <span className="font-semibold text-sm text-foreground">
          PCCustomizer <span className="text-muted-foreground font-normal">Trade</span>
        </span>
      </Link>

      <div className="w-full max-w-md bg-card border rounded-xl shadow-sm p-8 text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
          <Clock className="w-7 h-7 text-amber-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">
            {firstName ? `Hi ${firstName}, your application is under review` : 'Application under review'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {profile.company_name
              ? `We've received the trade access request for ${profile.company_name}.`
              : "We've received your trade access request."}
            {' '}Our team typically reviews applications within 1–2 business days.
          </p>
        </div>

        <div className="rounded-lg bg-muted/50 border px-4 py-3 text-left space-y-1">
          <p className="text-xs font-medium text-foreground">What happens next?</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            <li>• Our team verifies your business details</li>
            <li>• You'll receive an email once a decision is made</li>
            <li>• Approved accounts get immediate catalogue access</li>
          </ul>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-4 h-4 shrink-0" />
          <span>
            Questions?{' '}
            <a href="mailto:trade@pccustomizer.com" className="underline underline-offset-4 hover:text-foreground">
              trade@pccustomizer.com
            </a>
          </span>
        </div>

        <form action="/api/auth/signout" method="POST">
          <Button variant="outline" size="sm" type="submit" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  )
}
