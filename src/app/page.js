import Link from 'next/link'
import { Package, ShieldCheck, Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCategories, getProducts, sanitizeProduct } from '@/lib/catalogue-api'
import CatalogueHeader from '@/components/catalogue/CatalogueHeader'
import CategoryCard from '@/components/catalogue/CategoryCard'
import ProductCard from '@/components/catalogue/ProductCard'
import HomepageSearchBar from '@/components/catalogue/HomepageSearchBar'

export const revalidate = 0

export const metadata = {
  title: 'PCCustomizer — Business Technology',
  description: 'Professional IT hardware and technology for businesses. Browse by category or apply for a business account to access exclusive pricing.',
}

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

  const [categories, productsResult] = await Promise.all([
    getCategories(),
    getProducts({ page_size: '8', sort: 'newest' }).catch(() => null),
  ])

  const rawProducts = productsResult?.data ?? productsResult?.products ?? (Array.isArray(productsResult) ? productsResult : [])
  const featured = rawProducts.map(p => sanitizeProduct(p, 'website'))

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CatalogueHeader profile={profile} categories={categories} />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="border-b bg-gradient-to-b from-muted/40 to-background">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center space-y-5">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight">
              Business Technology.<br />
              <span className="text-primary">Shop by Category.</span>
            </h1>
            <p className="max-w-lg mx-auto text-base text-muted-foreground leading-relaxed">
              Professional IT hardware, components, and peripherals. Browse freely at public pricing.
              Apply for a business account to unlock your tier rates.
            </p>

            <HomepageSearchBar />

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <Link
                href="/products"
                className="inline-flex h-10 items-center rounded-md border border-input bg-background px-5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Shop all products
              </Link>
              {!profile && (
                <Link
                  href="/business"
                  className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Business pricing
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ── Shop by Category ── */}
        {categories.length > 0 && (
          <section className="border-b">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Shop by Category</h2>
                <Link href="/products" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categories.map(cat => (
                  <CategoryCard key={cat.id ?? cat.name} category={cat} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── New Arrivals ── */}
        {featured.length > 0 && (
          <section className="border-b bg-muted/20">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">New Arrivals</h2>
                <Link href="/products?sort=newest" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {featured.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Why PCCustomizer ── */}
        <section className="border-b">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="flex gap-4">
                <div className="w-9 h-9 shrink-0 rounded-md bg-muted border flex items-center justify-center">
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
                <div className="w-9 h-9 shrink-0 rounded-md bg-muted border flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Tiered account pricing</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Retail, Wholesale, and Trade rates — applied automatically when you log in.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-9 h-9 shrink-0 rounded-md bg-muted border flex items-center justify-center">
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

        {/* ── Business pricing callout (guests only) ── */}
        {!profile && (
          <section className="border-b">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
              <div className="rounded-xl border bg-muted/30 px-6 py-7 sm:px-10 text-center space-y-3 max-w-2xl mx-auto">
                <h2 className="text-base font-bold text-foreground">Business account pricing</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Retail, Wholesale, and Trade accounts for approved business customers.
                  Apply once — your pricing is applied automatically across the catalogue.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                  <Link
                    href="/business"
                    className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Learn about account types
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Apply for business access
                  </Link>
                </div>
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
            <Link href="/business" className="hover:text-foreground transition-colors">Business Pricing</Link>
            <a href="mailto:trade@pccustomizer.com" className="hover:text-foreground transition-colors">
              trade@pccustomizer.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
