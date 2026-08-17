'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { AlertTriangle, Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useCart } from '@/lib/cart-context'
import AddressDisplay from '@/components/shared/AddressDisplay'
import GuestCheckoutForm from './GuestCheckoutForm'

function fmt(v) {
  if (v == null) return null
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v)
}

const EMPTY_ADDR = {
  label: '', address_line_1: '', address_line_2: '',
  city: '', county: '', postcode: '', country: 'United Kingdom',
  company_name: '', contact_name: '', phone: '',
}

export default function CartContents({ isAuthenticated = false }) {
  const { items, removeItem, updateQuantity, clearCart, hydrated } = useCart()
  const router = useRouter()

  const [prices, setPrices]             = useState({})
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [notes, setNotes]               = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [submitError, setSubmitError]   = useState(null)

  // Address state (authenticated flow only)
  const [addresses,      setAddresses]      = useState(null)
  const [billingId,      setBillingId]      = useState(null)
  const [deliveryId,     setDeliveryId]     = useState(null)
  const [showNewDelivery, setShowNewDelivery] = useState(false)
  const [newAddr,        setNewAddr]        = useState(EMPTY_ADDR)
  const [savingAddr,     setSavingAddr]     = useState(false)
  const [addrFormError,  setAddrFormError]  = useState(null)

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

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return
    fetch('/api/addresses')
      .then(r => r.json())
      .then(d => {
        const list = d.addresses ?? []
        setAddresses(list)
        const bill = list.filter(a => a.address_type === 'billing')
        const del  = list.filter(a => a.address_type === 'delivery')
        setBillingId( (bill.find(a => a.is_default) ?? bill[0])?.id ?? null)
        setDeliveryId((del.find(a => a.is_default)  ?? del[0])?.id  ?? null)
      })
      .catch(() => setAddresses([]))
  }, [hydrated, isAuthenticated])

  const billing  = (addresses ?? []).filter(a => a.address_type === 'billing')
  const delivery = (addresses ?? []).filter(a => a.address_type === 'delivery')

  const subtotal = items.reduce((sum, item) => {
    const p = prices[item.id]
    return p != null ? sum + p * item.quantity : sum
  }, 0)

  const allPricesLoaded   = hydrated && !loadingPrices && items.every(i => prices[i.id] != null)
  const hasRequiredAddresses = billingId && deliveryId

  async function saveNewDelivery() {
    setSavingAddr(true)
    setAddrFormError(null)
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAddr,
          address_type: 'delivery',
          is_default:   delivery.length === 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAddrFormError(data.errors ? Object.values(data.errors)[0] : (data.error ?? 'Failed to save'))
        return
      }
      setAddresses(prev => [...(prev ?? []), data.address])
      setDeliveryId(data.address.id)
      setShowNewDelivery(false)
      setNewAddr(EMPTY_ADDR)
    } catch {
      setAddrFormError('Network error. Please try again.')
    } finally {
      setSavingAddr(false)
    }
  }

  async function handleAuthSubmit() {
    if (!billingId || !deliveryId) {
      setSubmitError('Please select billing and delivery addresses before submitting.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items:             items.map(i => ({ id: i.id, quantity: i.quantity })),
          notes:             notes.trim() || null,
          billingAddressId:  billingId,
          deliveryAddressId: deliveryId,
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

  function handleGuestSuccess({ guestToken }) {
    clearCart()
    router.push(`/orders/guest/${guestToken}?new=1`)
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
          Browse products
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
          const price     = prices[item.id]
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

      {/* ── Checkout section ── */}
      {isAuthenticated ? (
        /* Authenticated customer flow */
        <div className="space-y-5">
          <p className="text-sm font-semibold text-foreground">Delivery &amp; billing</p>

          {addresses === null && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          )}

          {addresses !== null && billing.length === 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Please{' '}
                <Link href="/account" className="underline underline-offset-4 font-medium">
                  add your billing and delivery addresses
                </Link>{' '}
                to your account before placing an order.
              </AlertDescription>
            </Alert>
          )}

          {addresses !== null && billing.length > 0 && (
            <div className="space-y-5">
              {/* Delivery address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Delivery address *</label>

                {delivery.length === 0 && !showNewDelivery && (
                  <p className="text-sm text-muted-foreground">No delivery address on file.</p>
                )}

                {delivery.length > 0 && (
                  <select
                    value={deliveryId ?? ''}
                    onChange={e => setDeliveryId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {delivery.map(a => (
                      <option key={a.id} value={a.id}>
                        {[a.label, a.address_line_1, a.city, a.postcode].filter(Boolean).join(' · ')}
                      </option>
                    ))}
                  </select>
                )}

                {!showNewDelivery ? (
                  <button
                    type="button"
                    onClick={() => { setShowNewDelivery(true); setAddrFormError(null) }}
                    className="text-xs text-primary hover:underline underline-offset-4"
                  >
                    + Add new delivery address
                  </button>
                ) : (
                  <div className="rounded-lg border bg-muted/20 p-4 space-y-3 mt-2">
                    <p className="text-sm font-medium">New delivery address</p>
                    {addrFormError && (
                      <p className="text-xs text-destructive">{addrFormError}</p>
                    )}
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-xs">Label <span className="text-muted-foreground">(optional)</span></Label>
                        <Input className="h-8 text-sm" placeholder="e.g. Warehouse, Bolton Office"
                          value={newAddr.label}
                          onChange={e => setNewAddr(p => ({ ...p, label: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-xs">Address line 1 *</Label>
                        <Input className="h-8 text-sm" placeholder="123 High Street" required
                          value={newAddr.address_line_1}
                          onChange={e => setNewAddr(p => ({ ...p, address_line_1: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-xs">Address line 2 <span className="text-muted-foreground">(optional)</span></Label>
                        <Input className="h-8 text-sm" placeholder="Unit 4"
                          value={newAddr.address_line_2}
                          onChange={e => setNewAddr(p => ({ ...p, address_line_2: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">City / Town *</Label>
                        <Input className="h-8 text-sm" placeholder="Manchester" required
                          value={newAddr.city}
                          onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Postcode *</Label>
                        <Input className="h-8 text-sm" placeholder="M1 1AA" required
                          value={newAddr.postcode}
                          onChange={e => setNewAddr(p => ({ ...p, postcode: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Country *</Label>
                        <Input className="h-8 text-sm" placeholder="United Kingdom" required
                          value={newAddr.country}
                          onChange={e => setNewAddr(p => ({ ...p, country: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={saveNewDelivery} disabled={savingAddr}>
                        {savingAddr ? 'Saving…' : 'Save address'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setShowNewDelivery(false); setNewAddr(EMPTY_ADDR); setAddrFormError(null) }}
                        disabled={savingAddr}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Billing address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Billing address</label>

                {billing.length === 1 ? (
                  <div className="rounded-md border bg-muted/20 px-3 py-2.5">
                    <AddressDisplay address={billing[0]} />
                  </div>
                ) : (
                  <select
                    value={billingId ?? ''}
                    onChange={e => setBillingId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {billing.map(a => (
                      <option key={a.id} value={a.id}>
                        {[a.label, a.address_line_1, a.city, a.postcode].filter(Boolean).join(' · ')}
                      </option>
                    ))}
                  </select>
                )}

                <p className="text-xs text-muted-foreground">
                  To change billing address,{' '}
                  <Link href="/account" className="underline underline-offset-4 hover:text-foreground">
                    manage your addresses
                  </Link>
                  .
                </p>
              </div>
            </div>
          )}

          <Separator />

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
              onClick={handleAuthSubmit}
              disabled={submitting || !allPricesLoaded || items.length === 0 || !hasRequiredAddresses}
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
      ) : (
        /* Guest checkout flow */
        <div className="space-y-4">
          <p className="text-sm font-semibold text-foreground">Checkout</p>
          <GuestCheckoutForm items={items} onSuccess={handleGuestSuccess} />
        </div>
      )}
    </div>
  )
}
