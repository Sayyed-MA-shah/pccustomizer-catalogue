import Link from 'next/link'
import { cn } from '@/lib/utils'
import UserMenuButton from './UserMenuButton'
import SegmentBadge from '@/components/shared/SegmentBadge'
import CartNavItem from './CartNavItem'

export default function CatalogueHeader({ profile, currentPath }) {
  const isGuest = !profile

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      <div className="mx-auto px-4 sm:px-6 max-w-[1400px]">
        <div className="flex h-16 items-center gap-6">
          {/* Logo */}
          <Link href={isGuest ? '/' : '/products'} className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">PC</span>
            </div>
            <span className="font-semibold text-sm text-foreground hidden sm:block">
              PCCustomizer
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <Link
              href="/products"
              className={cn(
                'px-3 py-1.5 rounded-md text-sm transition-colors',
                currentPath?.startsWith('/products')
                  ? 'text-foreground font-medium bg-muted'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              Products
            </Link>
            {!isGuest && (
              <>
                <Link
                  href="/orders"
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm transition-colors',
                    currentPath?.startsWith('/orders')
                      ? 'text-foreground font-medium bg-muted'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  Orders
                </Link>
                <Link
                  href="/account"
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm transition-colors',
                    currentPath?.startsWith('/account')
                      ? 'text-foreground font-medium bg-muted'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  Account
                </Link>
              </>
            )}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            {!isGuest && profile.customer_segment && (
              <span className="hidden sm:block">
                <SegmentBadge segment={profile.customer_segment} />
              </span>
            )}
            <CartNavItem />
            {isGuest ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/register"
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Business Account
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
                >
                  Sign in
                </Link>
              </div>
            ) : (
              <UserMenuButton
                name={profile.full_name || ''}
                company={profile.company_name || ''}
                segment={profile.customer_segment || null}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
