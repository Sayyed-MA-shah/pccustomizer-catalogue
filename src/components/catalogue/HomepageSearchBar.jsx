'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export default function HomepageSearchBar() {
  const [value, setValue] = useState('')
  const router = useRouter()
  const timer = useRef(null)

  function navigate(term) {
    const trimmed = term.trim()
    if (trimmed) {
      router.push(`/products?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push('/products')
    }
  }

  function handleChange(e) {
    const next = e.target.value
    setValue(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => navigate(next), 500)
  }

  function handleSubmit(e) {
    e.preventDefault()
    clearTimeout(timer.current)
    navigate(value)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="Search products, brands, SKUs…"
          autoComplete="off"
          className="w-full h-11 pl-9 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <button
        type="submit"
        className="h-11 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
      >
        Search
      </button>
    </form>
  )
}
