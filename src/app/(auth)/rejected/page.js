import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <CardTitle className="text-2xl">Access not approved</CardTitle>
          <CardDescription>
            {profile.status === 'revoked'
              ? 'Your access to the trade catalogue has been revoked.'
              : 'Unfortunately your access request was not approved at this time.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you believe this is an error or would like more information, please contact our team.
          </p>
          <a
            href="mailto:trade@pccustomizer.com"
            className="inline-block text-sm underline underline-offset-4 hover:text-foreground text-muted-foreground"
          >
            trade@pccustomizer.com
          </a>
          <form action="/api/auth/signout" method="POST">
            <Button variant="outline" size="sm" type="submit" className="mt-2 block mx-auto">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
