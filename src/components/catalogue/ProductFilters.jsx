'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = ['Laptops', 'Desktops', 'Monitors', 'Peripherals', 'Networking', 'Storage', 'Memory']
const CONDITIONS = ['New', 'Grade A', 'Grade B', 'Grade C']
const BRANDS = ['Dell', 'HP', 'Lenovo', 'Apple', 'Microsoft', 'Cisco', 'Samsung']

function FilterSection({ title, options, paramKey }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const current = searchParams.get(paramKey) || ''

  const toggle = useCallback((value) => {
    const params = new URLSearchParams(searchParams.toString())
    if (current === value) {
      params.delete(paramKey)
    } else {
      params.set(paramKey, value)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }, [current, paramKey, pathname, router, searchParams])

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </Label>
      <div className="space-y-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={cn(
              'w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors',
              current === opt
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ProductFilters({ className }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const hasFilters = ['category', 'condition', 'brand', 'in_stock'].some(k => searchParams.has(k))

  function clearAll() {
    const params = new URLSearchParams()
    const q = searchParams.get('q')
    if (q) params.set('q', q)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <aside className={cn('space-y-5', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Filters</h2>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      <Separator />

      <FilterSection title="Category" options={CATEGORIES} paramKey="category" />
      <Separator />
      <FilterSection title="Condition" options={CONDITIONS} paramKey="condition" />
      <Separator />
      <FilterSection title="Brand" options={BRANDS} paramKey="brand" />
      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Availability
        </Label>
        <InStockToggle />
      </div>
    </aside>
  )
}

function InStockToggle() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const active = searchParams.get('in_stock') === '1'

  function toggle() {
    const params = new URLSearchParams(searchParams.toString())
    if (active) {
      params.delete('in_stock')
    } else {
      params.set('in_stock', '1')
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        'w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
    >
      In stock only
    </button>
  )
}
