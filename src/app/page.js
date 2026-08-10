import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, ShieldCheck, Package, Users } from 'lucide-react'

const features = [
  { icon: Package, title: 'Full product range', desc: 'Access to our complete inventory of IT hardware, peripherals and networking equipment.' },
  { icon: ShieldCheck, title: 'Trade pricing', desc: 'Exclusive wholesale prices available only to verified trade and business customers.' },
  { icon: Users, title: 'Dedicated support', desc: 'Assigned account management and priority support for trade partners.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto px-6 max-w-5xl h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">PC</span>
            </div>
            <span className="font-semibold text-sm text-foreground">
              PCCustomizer <span className="text-muted-foreground font-normal">Trade</span>
            </span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium text-muted-foreground bg-muted">
              Trade & wholesale accounts only
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
              The PCCustomizer<br />Trade Catalogue
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Exclusive access to our full product range at wholesale prices — for approved business customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild size="lg" className="gap-2">
                <Link href="/register">
                  Request trade access
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Already applied?{' '}
              <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
                Sign in to check your status
              </Link>
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/30 px-6 py-12">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="space-y-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-4">
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} PCCustomizer. Trade accounts only.
          Questions? <a href="mailto:trade@pccustomizer.com" className="underline underline-offset-4">trade@pccustomizer.com</a>
        </p>
      </footer>
    </div>
  )
}
