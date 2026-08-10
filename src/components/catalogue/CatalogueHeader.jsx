import Link from 'next/link'
import { cn } from '@/lib/utils'
import UserMenuButton from './UserMenuButton'

const navLinks = [
  { href: '/products', label: 'Products' },
  { href: '/account', label: 'Account' },
]

export default function CatalogueHeader({ profile, currentPath }) {
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      <div className="mx-auto px-4 sm:px-6 max-w-[1400px]">
        <div className="flex h-16 items-center gap-6">
          {/* Logo */}
          <Link href="/products" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">PC</span>
            </div>
            <span className="font-semibold text-sm text-foreground hidden sm:block">
              PCCustomizer <span className="text-muted-foreground font-normal">Trade</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  currentPath?.startsWith(href)
                    ? 'text-foreground font-medium bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            <UserMenuButton
              name={profile?.full_name || ''}
              company={profile?.company_name || ''}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
