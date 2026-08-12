'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { AlertTriangle, Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useCart } from '@/lib/cart-context'

function fmt(v) {
  if (v == null) return null
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v)
}

export default function CartContents() {
  const { items, removeItem, updateQuantity, clearCart, hydrated } = useCart()
  const router = useRouter()

  const [prices, setPrices] = useState({})
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    if (!hydrated || items.length === 0) { setPrices({}); return }
    setLoadingPrices(true)
    fetch('/api/cart/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: items.map(i => i.id) }),
    })
      .then(r => r.json())
      .then(d => setPrices(d.prices ?? {}))
      .catch(() => {})
      .finally(() => setLoadingPrices(false))
  }, [items, hydrated])

  const subtotal = items.reduce((sum, item) => {
    const p = prices[item.id]
    return p != null ? sum + p * item.quantity : sum
  }, 0)

  const allPricesLoaded = hydrated && !loadingPrices && items.every(i => prices[i.id] != null)

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ id: i.id, quantity: i.quantity })),
          notes: notes.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.error ?? 'Failed to submit order.'); return }
      clearCart()
      router.push(`/orders/${data.id}?new=1`)
    } catch {
      setSubmitError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!hydrated) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
          <ShoppingCart className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="text-base font-semibold text-foreground">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground mt-1">Browse the catalogue to add products.</p>
        <Link href="/products" className="mt-5 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
          Browse catalogue
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Your Cart</h1>
        <button onClick={clearCart} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
          Clear cart
        </button>
      </div>

      {/* Items */}
      <div className="rounded-lg border bg-card divide-y overflow-hidden">
        {items.map(item => {
          const price = prices[item.id]
          const lineTotal = price != null ? price * item.quantity : null

          return (
            <div key={item.id} className="flex gap-4 p-4">
              <div className="w-16 h-16 shrink-0 rounded border bg-muted overflow-hidden">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.title} width={64} height={64} className="object-contain w-full h-full p-1" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <Package className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">{item.title}</p>
                {item.sku && <p className="text-xs text-muted-foreground mt-0.5">SKU: {item.sku}</p>}
                <div className="mt-1.5">
                  {loadingPrices ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <span className="text-sm font-medium text-foreground">
                      {price != null ? fmt(price) : <span className="italic text-muted-foreground text-xs">Price unavailable</span>}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-0.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center border rounded-md">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 hover:bg-muted transition-colors">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-2.5 text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 hover:bg-muted transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                {loadingPrices ? (
                  <Skeleton className="h-4 w-14" />
                ) : lineTotal != null ? (
                  <span className="text-sm font-semibold text-foreground">{fmt(lineTotal)}</span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* Subtotal */}
      <div className="flex justify-end">
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Subtotal</p>
          {loadingPrices ? (
            <Skeleton className="h-7 w-24 mt-0.5" />
          ) : (
            <p className="text-2xl font-bold text-foreground mt-0.5">{fmt(subtotal)}</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Notes + Submit */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Order notes <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any special requirements or notes for this order…"
            rows={3}
            className="resize-none"
            maxLength={1000}
          />
        </div>

        {submitError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSubmit}
          disabled={submitting || !allPricesLoaded || items.length === 0}
          size="lg"
          className="w-full"
        >
          {submitting ? 'Submitting order…' : 'Submit Order'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Your order will be sent for review. Prices are confirmed at the time of submission.
        </p>
      </div>
    </div>
  )
}
