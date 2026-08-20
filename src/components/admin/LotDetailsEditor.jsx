'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const CATEGORIES = [
  { value: 'faulty_parts',      label: 'Faulty / Parts' },
  { value: 'refurbished_bulk',  label: 'Refurbished Bulk' },
  { value: 'clearance',         label: 'Clearance' },
  { value: 'mixed_lot',         label: 'Mixed Lot' },
]

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120)
}

export default function LotDetailsEditor({ lot }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [title, setTitle] = useState(lot.title ?? '')
  const [slug, setSlug] = useState(lot.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(true)
  const [shortDescription, setShortDescription] = useState(lot.short_description ?? '')
  const [description, setDescription] = useState(lot.description ?? '')
  const [category, setCategory] = useState(lot.listing_category ?? 'faulty_parts')
  const [visibility, setVisibility] = useState(lot.visibility ?? 'public')
  const [fixedPrice, setFixedPrice] = useState(lot.fixed_price != null ? String(lot.fixed_price) : '')
  const [quantityTotal, setQuantityTotal] = useState(lot.quantity_total != null ? String(lot.quantity_total) : '')
  const [customerNotes, setCustomerNotes] = useState(lot.customer_notes ?? '')

  function handleTitleChange(e) {
    const val = e.target.value
    setTitle(val)
    if (!slugEdited) setSlug(slugify(val))
  }

  function cancel() {
    setTitle(lot.title ?? '')
    setSlug(lot.slug ?? '')
    setSlugEdited(true)
    setShortDescription(lot.short_description ?? '')
    setDescription(lot.description ?? '')
    setCategory(lot.listing_category ?? 'faulty_parts')
    setVisibility(lot.visibility ?? 'public')
    setFixedPrice(lot.fixed_price != null ? String(lot.fixed_price) : '')
    setQuantityTotal(lot.quantity_total != null ? String(lot.quantity_total) : '')
    setCustomerNotes(lot.customer_notes ?? '')
    setError(null)
    setEditing(false)
  }

  async function save() {
    if (!title.trim()) { setError('Title is required'); return }
    if (!slug.trim()) { setError('Slug is required'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/lots/${lot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          short_description: shortDescription.trim() || null,
          description: description.trim() || null,
          listing_category: category,
          visibility,
          fixed_price: fixedPrice !== '' ? parseFloat(fixedPrice) : null,
          quantity_total: quantityTotal !== '' ? parseInt(quantityTotal, 10) : 0,
          customer_notes: customerNotes.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to save'); setSaving(false); return }
      setEditing(false)
      router.refresh()
    } catch {
      setError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  const selectCls = inputCls

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <ReadField label="Fixed price" value={lot.fixed_price != null ? fmtPrice(lot.fixed_price) : '—'} />
          <ReadField label="Quantity" value={lot.quantity_total ?? '—'} />
          <ReadField label="Sale method" value={lot.sale_method === 'fixed_price' ? 'Fixed price' : 'Auction'} />
          <ReadField label="Visibility" value={lot.visibility === 'public' ? 'Public' : 'Approved customers only'} />
          <ReadField label="Category" value={CATEGORIES.find(c => c.value === lot.listing_category)?.label ?? lot.listing_category} />
          <ReadField label="URL slug" value={lot.slug} />
        </div>
        {lot.short_description && <ReadField label="Short description" value={lot.short_description} />}
        {lot.description && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-foreground whitespace-pre-line">{lot.description}</p>
          </div>
        )}
        {lot.customer_notes && <ReadField label="Customer notes" value={lot.customer_notes} />}
        <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5">
          <Pencil className="w-3.5 h-3.5" /> Edit details
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="edit-title">Title <span className="text-destructive">*</span></Label>
        <input id="edit-title" type="text" value={title} onChange={handleTitleChange} className={inputCls} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-slug">
          URL slug <span className="text-destructive">*</span>
          <span className="ml-1 text-xs font-normal text-muted-foreground">— editable</span>
        </Label>
        <div className="flex items-center rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring">
          <span className="px-2.5 text-xs text-muted-foreground border-r bg-muted shrink-0 h-9 flex items-center">/clearance/</span>
          <input
            id="edit-slug"
            type="text"
            value={slug}
            onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
            className="flex-1 h-9 px-2 text-sm font-mono bg-transparent focus-visible:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-category">Category</Label>
          <select id="edit-category" value={category} onChange={e => setCategory(e.target.value)} className={selectCls}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-visibility">Visibility</Label>
          <select id="edit-visibility" value={visibility} onChange={e => setVisibility(e.target.value)} className={selectCls}>
            <option value="public">Public</option>
            <option value="approved_customers_only">Approved customers only</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-price">Fixed price (GBP)</Label>
          <input
            id="edit-price"
            type="number"
            min="0"
            step="0.01"
            value={fixedPrice}
            onChange={e => setFixedPrice(e.target.value)}
            placeholder="0.00"
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-qty">Quantity total</Label>
          <input
            id="edit-qty"
            type="number"
            min="0"
            step="1"
            value={quantityTotal}
            onChange={e => setQuantityTotal(e.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-short-desc">Short description</Label>
        <input
          id="edit-short-desc"
          type="text"
          value={shortDescription}
          onChange={e => setShortDescription(e.target.value)}
          placeholder="One-line summary for listing cards"
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-desc">Full description</Label>
        <textarea
          id="edit-desc"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={6}
          placeholder="Detailed description visible to buyers…"
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-notes">Customer notes</Label>
        <textarea
          id="edit-notes"
          value={customerNotes}
          onChange={e => setCustomerNotes(e.target.value)}
          rows={2}
          placeholder="Additional info shown to buyers"
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
        <Button size="sm" variant="ghost" onClick={cancel} disabled={saving} className="gap-1.5">
          <X className="w-3.5 h-3.5" /> Cancel
        </Button>
      </div>
    </div>
  )
}

function ReadField({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm text-foreground mt-0.5">{value}</p>
    </div>
  )
}

function fmtPrice(v) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v)
}
