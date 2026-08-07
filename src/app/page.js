import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-lg w-full text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          PCCustomizer Trade Catalogue
        </h1>
        <p className="text-muted-foreground text-lg">
          Exclusive access to our full product range — for approved trade and business customers only.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="lg">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">Request access</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Already requested access?{' '}
          <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
            Sign in to check your status
          </Link>
        </p>
      </div>
    </main>
  )
}
