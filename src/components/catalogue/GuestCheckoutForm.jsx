'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle } from 'lucide-react'

const EMPTY_ADDRESS = {
  address_line_1: '', address_line_2: '',
  city: '', county: '', postcode: '', country: 'United Kingdom',
}

function AddressFields({ prefix, data, onChange }) {
  function f(key, label, required = false, placeholder = '') {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-${key}`} className="text-xs font-medium">
          {label}{required ? ' *' : <span className="text-muted-foreground"> (optional)</span>}
        </Label>
        <Input
          id={`${prefix}-${key}`}
          value={data[key] ?? ''}
          onChange={e => onChange({ ...data, [key]: e.target.value })}
          placeholder={placeholder}
          className="h-8 text-sm"
          required={required}
        />
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">{f('address_line_1', 'Address line 1', true,  '123 High Street')}</div>
      <div className="sm:col-span-2">{f('address_line_2', 'Address line 2', false, 'Unit 4, Floor 2')}</div>
      <div>{f('city',     'City / Town', true,  'Manchester')}</div>
      <div>{f('postcode', 'Postcode',    true,  'M1 1AA')}</div>
      <div>{f('county',   'County',      false, 'Greater Manchester')}</div>
      <div>{f('country',  'Country',     true,  'United Kingdom')}</div>
    </div>
  )
}

export default function GuestCheckoutForm({ items, onSuccess }) {
  const [contact, setContact] = useState({ full_name: '', email: '', phone: '', company_name: '' })
  const [billing, setBilling] = useState(EMPTY_ADDRESS)
  const [delivery, setDelivery] = useState(EMPTY_ADDRESS)
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!contact.full_name.trim()) { setError('Full name is required.'); return }
    if (!contact.email.trim())     { setError('Email address is required.'); return }
    if (!billing.address_line_1.trim() || !billing.city.trim() || !billing.postcode.trim()) {
      setError('Please complete the billing address.'); return
    }
    const deliveryAddr = sameAsBilling ? billing : delivery
    if (!sameAsBilling && (!deliveryAddr.address_line_1.trim() || !deliveryAddr.city.trim() || !deliveryAddr.postcode.trim())) {
      setError('Please complete the delivery address.'); return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/orders/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items:           items.map(i => ({ id: i.id, quantity: i.quantity })),
          notes:           notes.trim() || null,
          contact,
          billingAddress:  billing,
          deliveryAddress: deliveryAddr,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to place order.'); return }
      onSuccess({ guestToken: data.guestToken, orderNumber: data.orderNumber })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact */}
      <div className="space-y-4">
        <p className="text-sm font-semibold text-foreground">Contact information</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="g-full_name" className="text-xs font-medium">Full name *</Label>
            <Input id="g-full_name" className="h-8 text-sm" placeholder="Jane Smith" required
              value={contact.full_name} onChange={e => setContact(p => ({ ...p, full_name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-email" className="text-xs font-medium">Email address *</Label>
            <Input id="g-email" type="email" className="h-8 text-sm" placeholder="jane@company.com" required
              value={contact.email} onChange={e => setContact(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-phone" className="text-xs font-medium">Phone <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="g-phone" type="tel" className="h-8 text-sm" placeholder="+44 7700 900000"
              value={contact.phone} onChange={e => setContact(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-company" className="text-xs font-medium">Company name <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="g-company" className="h-8 text-sm" placeholder="Acme Ltd"
              value={contact.company_name} onChange={e => setContact(p => ({ ...p, company_name: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Billing address */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Billing address</p>
        <AddressFields prefix="bill" data={billing} onChange={setBilling} />
      </div>

      {/* Delivery address */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Delivery address</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sameAsBilling}
              onChange={e => setSameAsBilling(e.target.checked)}
              className="w-4 h-4 rounded border-input"
            />
            <span className="text-xs text-muted-foreground">Same as billing</span>
          </label>
        </div>
        {!sameAsBilling && (
          <AddressFields prefix="del" data={delivery} onChange={setDelivery} />
        )}
        {sameAsBilling && (
          <div className="rounded-md border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
            Using billing address for delivery.
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          Order notes <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any special requirements or notes for this order…"
          rows={3}
          className="resize-none"
          maxLength={1000}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? 'Placing order…' : 'Place Order'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Prices are confirmed server-side at the time of submission.
      </p>

      <div className="rounded-lg border bg-muted/20 px-4 py-3 text-center space-y-1.5">
        <p className="text-xs text-muted-foreground">
          Already have a business account?{' '}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
            Sign in
          </Link>
          {' '}to place an order with your account pricing.
        </p>
      </div>
    </form>
  )
}
