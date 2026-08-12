import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import AdminLoginForm from '@/components/admin/AdminLoginForm'

export const metadata = {
  title: 'Admin Sign In — PCCustomizer',
}

export default async function AdminLoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: adminRow } = await supabase
      .from('catalogue_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (adminRow) redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center px-4 py-12">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <Shield className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground">
          PCCustomizer <span className="text-muted-foreground font-normal">Admin</span>
        </span>
      </div>

      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl">Admin sign in</CardTitle>
          <CardDescription>
            Sign in with your administrator credentials to manage the catalogue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminLoginForm />
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground/70 text-center">
        Not an admin?{' '}
        <Link href="/login" className="underline underline-offset-4 hover:text-muted-foreground transition-colors">
          Customer login
        </Link>
      </p>
    </div>
  )
}
