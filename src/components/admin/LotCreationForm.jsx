'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function useDebounce(fn, delay) {
  const timer = useRef(null)
  return (...args) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }
}

function ProductSearchInput({ onAdd }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)

  const doSearch = useDebounce(async (q) => {
    if (!q.trim()) { setResults([]); setOpen(false); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/admin/catalogue-search?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      setResults(json.data ?? [])
      setOpen(true)
    } catch { setResults([]) }
    finally { setSearching(false) }
  }, 400)

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); doSearch(e.target.value) }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search catalogue by title or SKU…"
          autoComplete="off"
          className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-full rounded-md border bg-card shadow-lg max-h-56 overflow-y-auto">
          {results.map(p => (
            <button
              key={p.id}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onAdd(p); setQuery(''); setResults([]); setOpen(false) }}
              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b last:border-0"
            >
              <p className="text-sm font-medium text-foreground line-clamp-1">{p.title}</p>
              <p className="text-xs text-muted-foreground">{[p.brand, p.sku, p.condition].filter(Boolean).join(' · ')}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LotCreationForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [shortDescription, setShortDescription] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('faulty_parts')
  const [fixedPrice, setFixedPrice] = useState('')
  const [quantityTotal, setQuantityTotal] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [customerNotes, setCustomerNotes] = useState('')
  const [items, setItems] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  function handleTitleChange(e) {
    const val = e.target.value
    setTitle(val)
    if (!slugEdited) setSlug(slugify(val))
  }

  function addProduct(product) {
    setItems(prev => {
      if (prev.some(it => it.internal_product_id === product.id)) return prev
      return [...prev, {
        _key: `${product.id}-${Date.now()}`,
        internal_product_id: product.id,
        internal_sku: product.sku || null,
        product_title_snapshot: product.title,
        brand_snapshot: product.brand || null,
        model_snapshot: product.model || null,
        condition_snapshot: product.condition || null,
        quantity: 1,
      }]
    })
  }

  function updateItemQty(key, qty) {
    const value = Math.max(1, Number(qty) || 1)
    setItems(prev => prev.map(it => it._key === key ? { ...it, quantity: value } : it))
  }

  function removeItem(key) {
    setItems(prev => prev.filter(it => it._key !== key))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!title.trim()) { setError('Title is required'); return }
    if (!slug.trim()) { setError('Slug is required'); return }

    const totalQty = Number(quantityTotal) || items.reduce((sum, it) => sum + it.quantity, 0)

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          short_description: shortDescription.trim() || null,
          description: description.trim() || null,
          listing_category: category,
          fixed_price: fixedPrice !== '' ? parseFloat(fixedPrice) : null,
          quantity_total: totalQty,
          visibility,
          customer_notes: customerNotes.trim() || null,
          items: items.map(({ _key, ...rest }) => rest),
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to create lot'); setSubmitting(false); return }
      router.push(`/admin/faulty-lots/${json.data.id}`)
    } catch {
      setError('Network error')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* Basic fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="lot-title">Title <span className="text-destructive">*</span></Label>
          <input
            id="lot-title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="e.g. Mixed faulty GPU lot — 12 units"
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lot-slug">
            Slug <span className="text-destructive">*</span>
            <span className="ml-1 text-xs font-normal text-muted-foreground">(used in URL)</span>
          </Label>
          <input
            id="lot-slug"
            type="text"
            value={slug}
            onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
            placeholder="mixed-faulty-gpu-lot-12-units"
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="lot-category">Category <span className="text-destructive">*</span></Label>
            <select
              id="lot-category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="faulty_parts">Faulty / Parts</option>
              <option value="refurbished_bulk">Refurbished Bulk</option>
              <option value="clearance">Clearance</option>
              <option value="mixed_lot">Mixed Lot</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lot-visibility">Visibility</Label>
            <select
              id="lot-visibility"
              value={visibility}
              onChange={e => setVisibility(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="public">Public</option>
              <option value="approved_customers_only">Approved customers only</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="lot-price">Fixed price (GBP)</Label>
            <input
              id="lot-price"
              type="number"
              min="0"
              step="0.01"
              value={fixedPrice}
              onChange={e => setFixedPrice(e.target.value)}
              placeholder="0.00"
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lot-qty">
              Quantity total
              <span className="ml-1 text-xs font-normal text-muted-foreground">(auto from items if blank)</span>
            </Label>
            <input
              id="lot-qty"
              type="number"
              min="0"
              step="1"
              value={quantityTotal}
              onChange={e => setQuantityTotal(e.target.value)}
              placeholder="Auto"
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lot-short-desc">Short description</Label>
          <input
            id="lot-short-desc"
            type="text"
            value={shortDescription}
            onChange={e => setShortDescription(e.target.value)}
            placeholder="One line summary for listing cards"
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lot-desc">Full description</Label>
          <textarea
            id="lot-desc"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            placeholder="Detailed lot description visible to buyers…"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lot-notes">Customer notes</Label>
          <textarea
            id="lot-notes"
            value={customerNotes}
            onChange={e => setCustomerNotes(e.target.value)}
            rows={2}
            placeholder="Internal notes shown to the customer (e.g. collection required)"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Lot items</h3>
        <ProductSearchInput onAdd={addProduct} />

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border-2 border-dashed rounded-md">
            No items added yet. Search above to include products.
          </p>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24">Qty</th>
                  <th className="py-2 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map(item => (
                  <tr key={item._key} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-foreground line-clamp-1">{item.product_title_snapshot}</p>
                      <p className="text-xs text-muted-foreground">
                        {[item.brand_snapshot, item.internal_sku, item.condition_snapshot].filter(Boolean).join(' · ')}
                      </p>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItemQty(item._key, e.target.value)}
                        className="w-20 h-7 px-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button type="button" onClick={() => removeItem(item._key)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : 'Create lot (draft)'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
