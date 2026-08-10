import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { XCircle, Mail } from 'lucide-react'

export const metadata = {
  title: 'Access Not Approved — PCCustomizer Trade Catalogue',
}

export default async function RejectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('status')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.status === 'approved') redirect('/products')
  if (profile.status === 'pending') redirect('/pending')

  const isRevoked = profile.status === 'revoked'

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
        <div className="mx-auto w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
          <XCircle className="w-7 h-7 text-red-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">
            {isRevoked ? 'Access revoked' : 'Access not approved'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRevoked
              ? 'Your access to the PCCustomizer trade catalogue has been revoked by our team.'
              : 'Unfortunately your trade access application was not approved at this time.'}
          </p>
        </div>

        <div className="rounded-lg bg-muted/50 border px-4 py-3 text-left">
          <p className="text-xs text-muted-foreground">
            If you believe this is an error, or would like more information about our decision,
            please contact our trade team directly.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-4 h-4 shrink-0" />
          <a href="mailto:trade@pccustomizer.com" className="underline underline-offset-4 hover:text-foreground">
            trade@pccustomizer.com
          </a>
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
