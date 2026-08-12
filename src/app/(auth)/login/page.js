import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import LoginForm from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Sign in — PCCustomizer Trade Catalogue',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo mark */}
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-bold">PC</span>
        </div>
        <span className="font-semibold text-foreground">
          PCCustomizer <span className="text-muted-foreground font-normal">Trade</span>
        </span>
      </Link>

      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to access the trade catalogue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-0">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="underline underline-offset-4 hover:text-foreground">
              Request trade access
            </Link>
          </p>
          <p className="text-xs text-muted-foreground/50">
            <Link href="/admin/login" className="hover:text-muted-foreground transition-colors">
              Admin login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
