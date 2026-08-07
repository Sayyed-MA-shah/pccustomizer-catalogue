import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import RegisterForm from '@/components/auth/RegisterForm'

export const metadata = {
  title: 'Request Access — PCCustomizer Trade Catalogue',
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Request trade access</CardTitle>
          <CardDescription>
            Complete the form below. Our team will review your application and respond within 1–2 business days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
