'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import CartNavItem from './CartNavItem'
import UserMenuButton from './UserMenuButton'

function NavLink({ href, active, children }) {
  return (
    <Link
      href={href}
      className={cn(
        'px-3 py-2 rounded-md text-sm font-medium transition-colors',
        active
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, active, onClick, children, indent = false }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center rounded-md text-sm font-medium transition-colors',
        indent ? 'px-5 py-2' : 'px-3 py-2.5',
        active
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
    >
      {children}
    </Link>
  )
}

export default function CatalogueHeader({ profile, categories = [] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isGuest = !profile

  const closeMobile = () => setMobileOpen(false)
  const onProducts = pathname.startsWith('/products')
  const onOrders = pathname.startsWith('/orders') && !pathname.startsWith('/orders/guest')
  const activeCategory = searchParams.get('category')

  return (
    <>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="mx-auto px-4 sm:px-6 max-w-[1400px]">
          <div className="flex h-16 items-center gap-5">

            {/* Logo */}
            <Link
              href={isGuest ? '/' : '/products'}
              className="flex items-center gap-2.5 shrink-0 mr-1"
            >
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">PC</span>
              </div>
              <span className="font-semibold text-sm text-foreground hidden sm:block">
                PCCustomizer
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {/* Products — dropdown if categories available */}
              {categories.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      'flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors outline-none',
                      onProducts
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    Products
                    <ChevronDown className="w-3 h-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuItem asChild>
                      <Link href="/products" className="cursor-pointer">
                        All Products
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {categories.map(cat => (
                      <DropdownMenuItem key={cat.id ?? cat.name} asChild>
                        <Link
                          href={`/products?category=${encodeURIComponent(cat.name)}`}
                          className="cursor-pointer flex items-center justify-between"
                        >
                          {cat.name}
                          {cat.product_count != null && (
                            <span className="ml-3 text-xs text-muted-foreground">
                              {cat.product_count}
                            </span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <NavLink href="/products" active={onProducts}>Products</NavLink>
              )}

              {isGuest ? (
                <NavLink href="/business" active={pathname.startsWith('/business')}>
                  Business Pricing
                </NavLink>
              ) : (
                <NavLink href="/orders" active={onOrders}>My Orders</NavLink>
              )}
            </nav>

            {/* Desktop right */}
            <div className="hidden md:flex ml-auto items-center gap-2">
              <CartNavItem />
              {isGuest ? (
                <Link
                  href="/login"
                  className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
                >
                  Sign in
                </Link>
              ) : (
                <UserMenuButton
                  name={profile.full_name || ''}
                  company={profile.company_name || ''}
                  segment={profile.customer_segment || null}
                />
              )}
            </div>

            {/* Mobile: cart + hamburger */}
            <div className="ml-auto md:hidden flex items-center gap-1">
              <CartNavItem />
              <button
                onClick={() => setMobileOpen(true)}
                className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={closeMobile} aria-hidden="true" />

          {/* Panel */}
          <div className="absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-background border-l shadow-xl flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 h-16 border-b shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-[10px] font-bold">PC</span>
                </div>
                <span className="text-sm font-semibold text-foreground">PCCustomizer</span>
              </div>
              <button
                onClick={closeMobile}
                className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
              {/* Products + category sub-links */}
              <MobileNavLink
                href="/products"
                active={onProducts && !activeCategory}
                onClick={closeMobile}
              >
                All Products
              </MobileNavLink>
              {categories.map(cat => (
                <MobileNavLink
                  key={cat.id ?? cat.name}
                  href={`/products?category=${encodeURIComponent(cat.name)}`}
                  active={onProducts && activeCategory === cat.name}
                  onClick={closeMobile}
                  indent
                >
                  {cat.name}
                </MobileNavLink>
              ))}

              <div className="pt-1 border-t mt-1" />

              {isGuest ? (
                <MobileNavLink href="/business" active={pathname.startsWith('/business')} onClick={closeMobile}>
                  Business Pricing
                </MobileNavLink>
              ) : (
                <>
                  <MobileNavLink href="/orders" active={onOrders} onClick={closeMobile}>
                    My Orders
                  </MobileNavLink>
                  <MobileNavLink href="/account" active={pathname.startsWith('/account')} onClick={closeMobile}>
                    My Account
                  </MobileNavLink>
                </>
              )}
            </nav>

            {/* Auth section */}
            <div className="p-3 border-t space-y-2">
              {isGuest ? (
                <>
                  <Link
                    href="/login"
                    onClick={closeMobile}
                    className="flex items-center justify-center h-9 w-full rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMobile}
                    className="flex items-center justify-center h-9 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Apply for business access
                  </Link>
                </>
              ) : (
                <div className="space-y-1">
                  <div className="px-3 py-2 border-b mb-1">
                    <p className="text-sm font-medium text-foreground truncate">{profile.full_name}</p>
                    {profile.company_name && (
                      <p className="text-xs text-muted-foreground truncate">{profile.company_name}</p>
                    )}
                  </div>
                  <form action="/api/auth/signout" method="POST">
                    <button
                      type="submit"
                      className="flex w-full items-center px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
