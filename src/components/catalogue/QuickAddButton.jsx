'use client'

import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { useCart } from '@/lib/cart-context'

export default function QuickAddButton({ product }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleClick(e) {
    e.preventDefault()
    e.stopPropagation()
    addItem({ id: product.id, title: product.title, sku: product.sku ?? null, imageUrl: product.imageUrl ?? null }, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={added ? 'Added to cart' : 'Add to cart'}
      className={`flex items-center justify-center gap-1.5 h-8 w-full rounded border text-xs font-medium transition-all duration-150 ${
        added
          ? 'bg-primary border-primary text-primary-foreground'
          : 'border-input bg-background text-foreground hover:bg-muted'
      }`}
    >
      {added ? (
        <><Check className="w-3.5 h-3.5" /> Added</>
      ) : (
        <><Plus className="w-3.5 h-3.5" /> Add to Cart</>
      )}
    </button>
  )
}
