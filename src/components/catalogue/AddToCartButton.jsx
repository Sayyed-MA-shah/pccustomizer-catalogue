'use client'

import { useState } from 'react'
import { Check, Minus, Plus, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart-context'

export default function AddToCartButton({ product, maxStock }) {
  const { addItem, items } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const existingQty = items.find(i => i.id === product.id)?.quantity ?? 0
  const outOfStock = maxStock != null && maxStock <= 0

  function dec() { setQuantity(q => Math.max(1, q - 1)) }
  function inc() { setQuantity(q => maxStock != null ? Math.min(maxStock, q + 1) : q + 1) }

  function handleAdd() {
    addItem({ id: product.id, title: product.title, sku: product.sku ?? null, imageUrl: product.imageUrl ?? null }, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (outOfStock) {
    return <p className="text-sm font-medium text-red-500">Out of stock</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {/* Quantity picker */}
        <div className="flex items-center border rounded-md">
          <button type="button" onClick={dec} className="px-2.5 py-1.5 hover:bg-muted transition-colors rounded-l-md" disabled={quantity <= 1}>
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="px-3 py-1.5 text-sm font-medium min-w-[2.5rem] text-center select-none">{quantity}</span>
          <button type="button" onClick={inc} className="px-2.5 py-1.5 hover:bg-muted transition-colors rounded-r-md" disabled={maxStock != null && quantity >= maxStock}>
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <Button onClick={handleAdd} className="flex-1" disabled={outOfStock}>
          {added ? (
            <><Check className="w-4 h-4 mr-2" /> Added to Cart</>
          ) : (
            <><ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart</>
          )}
        </Button>
      </div>

      {existingQty > 0 && (
        <p className="text-xs text-muted-foreground">{existingQty} already in your cart</p>
      )}
    </div>
  )
}
