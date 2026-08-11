'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'

export default function CatalogueSearchBar() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [value, setValue] = useState(searchParams.get('q') || '')
  const timer = useRef(null)
  // Track the last value we pushed to the URL so that the URL-sync effect
  // doesn't overwrite the input while the user is actively typing.
  const lastPushed = useRef(searchParams.get('q') || '')

  useEffect(() => {
    const urlQ = searchParams.get('q') || ''
    if (urlQ !== lastPushed.current) {
      setValue(urlQ)
      lastPushed.current = urlQ
    }
  }, [searchParams])

  function handleChange(e) {
    const next = e.target.value
    setValue(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const trimmed = next.trim()
      lastPushed.current = trimmed
      const params = new URLSearchParams(searchParams.toString())
      trimmed ? params.set('q', trimmed) : params.delete('q')
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    }, 350)
  }

  function handleClear() {
    setValue('')
    clearTimeout(timer.current)
    lastPushed.current = ''
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search products, brands, SKUs…"
        className="w-full pl-9 pr-9 h-10 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {value && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
