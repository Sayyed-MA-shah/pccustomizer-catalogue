'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, Trash2, Loader2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120)
}

function useDebounce(fn, delay) {
  const timer = useRef(null)
  return (...args) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }
}

// Defensive helpers — internal API field names are not guaranteed
function getStock(p) {
  if (p.stock_quantity != null) return p.stock_quantity
  if (p.qty_available != null) return p.qty_available
  if (p.quantity_available != null) return p.quantity_available
  return null
}
function getImageUrl(p) {
  if (p.image_url) return p.image_url
  if (Array.isArray(p.images) && p.images.length > 0) {
    const first = p.images[0]
    return typeof first === 'string' ? first : (first?.url ?? first?.src ?? null)
  }
  return null
}

function ProductThumbnail({ url, title }) {
  if (!url) {
    return (
      <div className="w-10 h-10 rounded-md bg-muted shrink-0 flex items-center justify-center">
        <Package className="w-4 h-4 text-muted-foreground/40" />
      </div>
    )
  }
  return (
    <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
      <Image src={url} alt={title || ''} fill className="object-cover" sizes="40px" unoptimized />
    </div>
  )
}

function ProductSearchInput({ onAdd, existingProductIds = [] }) {
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

  function handleChange(e) {
    const v = e.target.value
    setQuery(v)
    doSearch(v)
  }

  function select(product) {
    onAdd(product)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search catalogue by title or SKU…"
          autoComplete="off"
          className="w-full h-9 pl-9 pr-10 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-30 top-full mt-1 w-full rounded-md border bg-card shadow-lg max-h-64 overflow-y-auto">
          {results.map(p => {
            const alreadyAdded = existingProductIds.includes(String(p.id))
            const stock = getStock(p)
            const imgUrl = getImageUrl(p)
            return (
              <button
                key={p.id}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => !alreadyAdded && select(p)}
                disabled={alreadyAdded}
                className={`w-full text-left px-3 py-2 border-b last:border-0 flex items-center gap-3 transition-colors ${
                  alreadyAdded
                    ? 'opacity-50 cursor-not-allowed bg-muted/30'
                    : 'hover:bg-muted'
                }`}
              >
                <ProductThumbnail url={imgUrl} title={p.title} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{p.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {[p.brand, p.model, p.sku].filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-xs">
                    {p.condition && (
                      <span className="text-muted-foreground">{p.condition}</span>
                    )}
                    {stock != null && (
                      <span className={`ml-2 font-medium ${stock > 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                      </span>
                    )}
                    {alreadyAdded && (
                      <span className="ml-2 text-muted-foreground italic">Already added</span>
                    )}
                  </p>
                </div>
              </button>
            )
          })}
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
      if (prev.some(it => it.internal_product_id === String(product.id))) return prev
      return [...prev, {
        _key: `${product.id}-${Date.now()}`,
        internal_product_id: String(product.id),
        internal_sku: product.sku || null,
        product_title_snapshot: product.title,
        brand_snapshot: product.brand || null,
        model_snapshot: product.model || null,
        condition_snapshot: product.condition || null,
        quantity: 1,
        // UI helpers (not sent to API)
        _image_url: getImageUrl(product),
        _stock: getStock(product),
      }]
    })
  }

  function updateItemQty(key, qty) {
    const value = Math.max(1, parseInt(qty, 10) || 1)
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
    if (items.length === 0) { setError('Add at least one item before creating the lot'); return }

    const totalQty = quantityTotal !== ''
      ? Math.max(0, parseInt(quantityTotal, 10) || 0)
      : items.reduce((sum, it) => sum + it.quantity, 0)

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
          items: items.map(({ _key, _image_url, _stock, ...rest }) => rest),
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to create lot'); setSubmitting(false); return }
      router.push(`/admin/faulty-lots/${json.data.id}`)
    } catch {
      setError('Network error — please try again')
      setSubmitting(false)
    }
  }

  const existingProductIds = items.map(it => it.internal_product_id)

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">

      {/* ── Basic info ── */}
      <section className="space-y-4">
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
            URL slug <span className="text-destructive">*</span>
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              — auto-generated, editable
            </span>
          </Label>
          <div className="flex items-center rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring">
            <span className="px-2.5 text-xs text-muted-foreground border-r bg-muted shrink-0 h-9 flex items-center">/clearance/</span>
            <input
              id="lot-slug"
              type="text"
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
              placeholder="mixed-faulty-gpu-lot"
              className="flex-1 h-9 px-2 text-sm font-mono bg-transparent focus-visible:outline-none"
            />
          </div>
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
              <span className="ml-1 text-xs font-normal text-muted-foreground">(auto-sums items)</span>
            </Label>
            <input
              id="lot-qty"
              type="number"
              min="0"
              step="1"
              value={quantityTotal}
              onChange={e => setQuantityTotal(e.target.value)}
              placeholder={items.reduce((s, it) => s + it.quantity, 0) || 'Auto'}
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
            placeholder="One-line summary for listing cards"
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
            placeholder="Detailed description visible to buyers — condition notes, what's included, known faults, collection requirements…"
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
            placeholder="Additional info shown to buyers (e.g. collection required, testing data available)"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </section>

      {/* ── Items ── */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Included items <span className="text-destructive">*</span></h3>
          <p className="text-xs text-muted-foreground mt-0.5">Search the internal inventory to add products to this lot.</p>
        </div>

        <ProductSearchInput onAdd={addProduct} existingProductIds={existingProductIds} />

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center border-2 border-dashed rounded-md">
            No items yet — search above to add products from inventory.
          </p>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide" colSpan={2}>Product</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24">Qty</th>
                  <th className="py-2 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map(item => (
                  <tr key={item._key} className="hover:bg-muted/20">
                    <td className="py-2.5 pl-3 pr-1 w-12">
                      <ProductThumbnail url={item._image_url} title={item.product_title_snapshot} />
                    </td>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-foreground line-clamp-1">{item.product_title_snapshot}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {[item.brand_snapshot, item.model_snapshot, item.internal_sku, item.condition_snapshot].filter(Boolean).join(' · ')}
                      </p>
                      {item._stock != null && (
                        <p className={`text-xs mt-0.5 font-medium ${item._stock > 0 ? 'text-green-600' : 'text-destructive'}`}>
                          {item._stock > 0 ? `${item._stock} in stock` : 'Out of stock'}
                        </p>
                      )}
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
                      <button
                        type="button"
                        onClick={() => removeItem(item._key)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-3 py-2 border-t bg-muted/20 text-xs text-muted-foreground">
              {items.length} item{items.length !== 1 ? 's' : ''} · Total qty: {items.reduce((s, it) => s + it.quantity, 0)}
            </div>
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={submitting} size="default">
          {submitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</>
          ) : (
            'Create Lot & Continue →'
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
