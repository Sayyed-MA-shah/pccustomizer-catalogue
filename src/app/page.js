import Link from 'next/link'
import { Package, Search, ShieldCheck, Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getProducts, sanitizeProduct } from '@/lib/catalogue-api'
import CatalogueHeader from '@/components/catalogue/CatalogueHeader'
import ProductCard from '@/components/catalogue/ProductCard'

export const revalidate = 60

export const metadata = {
  title: 'PCCustomizer — Business Technology',
  description: 'Professional IT hardware and technology for businesses. Apply for a trade account to access exclusive pricing.',
}

const tiers = [
  {
    name: 'Retail',
    color: 'border-blue-200 bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    description: 'For established businesses purchasing regularly. Competitive rates with a straightforward account structure.',
  },
  {
    name: 'Wholesale',
    color: 'border-violet-200 bg-violet-50',
    badge: 'bg-violet-100 text-violet-700',
    description: 'For distributors and high-volume buyers. Deeper discounts that reflect the scale of your operation.',
  },
  {
    name: 'Trade',
    color: 'border-amber-200 bg-amber-50',
    badge: 'bg-amber-100 text-amber-700',
    description: 'For resellers and trade professionals. Our best rates for those integrating our products into their service.',
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data?.status === 'approved') profile = data
  }

  // Fetch featured products (public website_price view)
  let featured = []
  try {
    const result = await getProducts({ page_size: '6', sort: 'newest' })
    const raw = result?.data ?? result?.products ?? (Array.isArray(result) ? result : [])
    featured = raw.map(p => sanitizeProduct(p, 'website'))
  } catch {}

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CatalogueHeader profile={profile} currentPath="/" />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="border-b bg-gradient-to-b from-muted/40 to-background">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight">
              Business Technology.<br />
              <span className="text-primary">Better Pricing.</span>
            </h1>
            <p className="max-w-xl mx-auto text-lg text-muted-foreground leading-relaxed">
              Professional IT hardware, components, and peripherals — priced for the trade.
              Browse our catalogue freely. Apply for a business account to unlock your tier pricing.
            </p>

            {/* Search bar */}
            <form
              method="GET"
              action="/products"
              className="max-w-md mx-auto flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  name="q"
                  type="search"
                  placeholder="Search products…"
                  className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/products"
                className="inline-flex h-10 items-center rounded-md border border-input bg-background px-5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Browse catalogue
              </Link>
              {!profile && (
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Apply for business access
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ── Featured products ── */}
        {featured.length > 0 && (
          <section className="border-b">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Latest products</h2>
                <Link href="/products" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Why PCCustomizer ── */}
        <section className="border-b bg-muted/20">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-foreground">Built for business</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Everything you need to source technology at scale, with the trust and pricing structure your business demands.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="flex gap-4">
                <div className="w-9 h-9 shrink-0 rounded-md bg-background border flex items-center justify-center">
                  <Package className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Full product range</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Hardware, components, peripherals, and networking — all in one place.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-9 h-9 shrink-0 rounded-md bg-background border flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Tiered account pricing</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Approved accounts access Retail, Wholesale, or Trade rates — automatically applied.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-9 h-9 shrink-0 rounded-md bg-background border flex items-center justify-center">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Dedicated support</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    A direct line to our trade team, not a ticket queue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Business account tiers ── */}
        {!profile && (
          <section className="border-b">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-lg font-bold text-foreground">Business account pricing</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Apply once. Once approved, your account pricing is applied automatically across the entire catalogue.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {tiers.map(tier => (
                  <div key={tier.name} className={`rounded-lg border p-5 space-y-3 ${tier.color}`}>
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${tier.badge}`}>
                      {tier.name}
                    </span>
                    <p className="text-sm text-foreground leading-relaxed">{tier.description}</p>
                  </div>
                ))}
              </div>
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Pricing details are shared during the account review. We don't publish tier rates publicly.
                </p>
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Apply for business access
                </Link>
                <p className="text-xs text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">PC</span>
            </div>
            <span className="text-sm font-semibold text-foreground">PCCustomizer</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Business Account</Link>
            <a href="mailto:trade@pccustomizer.com" className="hover:text-foreground transition-colors">
              trade@pccustomizer.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
