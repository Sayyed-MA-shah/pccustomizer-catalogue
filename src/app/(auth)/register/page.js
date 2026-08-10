import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import RegisterForm from '@/components/auth/RegisterForm'

export const metadata = {
  title: 'Request Access — PCCustomizer Trade Catalogue',
}

export default function RegisterPage() {
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

      <Card className="w-full max-w-lg shadow-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl">Request trade access</CardTitle>
          <CardDescription>
            Complete the form below. Our team reviews applications within 1–2 business days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
