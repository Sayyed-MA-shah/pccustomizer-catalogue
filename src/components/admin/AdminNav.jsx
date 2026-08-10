'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/requests', label: 'Requests' },
  { href: '/admin/customers', label: 'Customers' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex h-14 items-center gap-6">
          <span className="font-semibold text-sm">PCCustomizer Admin</span>
          <nav className="flex items-center gap-1">
            {navLinks.map(({ href, label, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="ml-auto">
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
