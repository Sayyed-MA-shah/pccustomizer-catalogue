import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export const metadata = {
  title: 'Business Account Pricing — PCCustomizer',
  description: 'PCCustomizer offers Retail, Wholesale, and Trade accounts for approved business customers. Apply once and your pricing is applied automatically.',
}

const tiers = [
  {
    name: 'Retail Account',
    colorBg: 'bg-blue-50/60 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    description:
      'For businesses purchasing technology products regularly. Competitive pricing that reflects a consistent buying relationship with a straightforward account structure.',
    perks: [
      'Dedicated pricing across the full catalogue',
      'Order history and account management',
      'Support from our trade team',
    ],
  },
  {
    name: 'Wholesale Account',
    colorBg: 'bg-violet-50/60 border-violet-200',
    badge: 'bg-violet-100 text-violet-700',
    description:
      'For distributors and high-volume buyers. Deeper discounts that reflect the scale of purchasing activity and the depth of the commercial relationship.',
    perks: [
      'Volume-reflective pricing across all categories',
      'Bulk order support',
      'Dedicated account contact',
    ],
  },
  {
    name: 'Trade Account',
    colorBg: 'bg-amber-50/60 border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    description:
      'For resellers and systems integrators incorporating our products into their service delivery. Our best rates for trade professionals.',
    perks: [
      'Best-available pricing across the catalogue',
      'Reseller and integration support',
      'Direct line to our trade team',
    ],
  },
]

const steps = [
  {
    n: '1',
    title: 'Submit your application',
    body: 'Fill in your business details and contact information. Takes under two minutes.',
  },
  {
    n: '2',
    title: 'We review and assign a tier',
    body: 'Our trade team assesses your business and assigns the appropriate account tier.',
  },
  {
    n: '3',
    title: 'Browse with your pricing',
    body: 'Log in and browse the full catalogue. Your tier pricing is applied automatically on every product.',
  },
]

export default function BusinessPage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center space-y-5">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Business Account Pricing
          </h1>
          <p className="max-w-lg mx-auto text-base text-muted-foreground leading-relaxed">
            PCCustomizer offers three account tiers for business customers — Retail, Wholesale, and Trade.
            Apply once. Once approved, your pricing is applied automatically across the entire catalogue.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <Link
              href="/register"
              className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Request Business Access
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-md border border-input bg-background px-5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Account types */}
      <section className="border-b">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-14 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-bold text-foreground">Account types</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Each tier is assessed during the application review.
              Tier rates are confirmed during account approval — we don't publish pricing publicly.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {tiers.map(tier => (
              <div key={tier.name} className={`rounded-xl border p-6 space-y-4 ${tier.colorBg}`}>
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${tier.badge}`}>
                  {tier.name}
                </span>
                <p className="text-sm text-foreground leading-relaxed">{tier.description}</p>
                <ul className="space-y-2">
                  {tier.perks.map(perk => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b bg-muted/20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 space-y-8">
          <h2 className="text-lg font-bold text-foreground text-center">How it works</h2>
          <div className="grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            {steps.map(({ n, title, body }) => (
              <div key={n} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  {n}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-14 text-center space-y-4">
          <h2 className="text-xl font-bold text-foreground">Ready to apply?</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Applications are reviewed by our trade team. We aim to respond within one business day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <Link
              href="/register"
              className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Request Business Access
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
