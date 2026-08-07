import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Access Pending — PCCustomizer Trade Catalogue',
}

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('status, full_name')
    .eq('id', user.id)
    .single()

  // If somehow the user is approved or has no profile, redirect appropriately
  if (!profile) redirect('/login')
  if (profile.status === 'approved') redirect('/products')
  if (profile.status === 'rejected' || profile.status === 'revoked') redirect('/rejected')

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <CardTitle className="text-2xl">Application under review</CardTitle>
          <CardDescription>
            {profile.full_name ? `Hi ${profile.full_name.split(' ')[0]}, your` : 'Your'} access request has been received and is awaiting approval from our team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We typically review applications within 1–2 business days. You&apos;ll be able to sign in and access the catalogue once approved.
          </p>
          <p className="text-sm text-muted-foreground">
            Questions? Contact us at{' '}
            <a href="mailto:trade@pccustomizer.com" className="underline underline-offset-4 hover:text-foreground">
              trade@pccustomizer.com
            </a>
          </p>
          <form action="/api/auth/signout" method="POST">
            <Button variant="outline" size="sm" type="submit" className="mt-2">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
