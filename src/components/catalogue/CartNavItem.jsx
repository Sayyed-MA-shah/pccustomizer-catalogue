'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useCart } from '@/lib/cart-context'

export default function CartNavItem({ currentPath }) {
  const { totalItems } = useCart()
  const isActive = currentPath?.startsWith('/cart')

  return (
    <Link
      href="/cart"
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
        isActive
          ? 'text-foreground font-medium bg-muted'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
    >
      Cart
      {totalItems > 0 && (
        <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  )
}
