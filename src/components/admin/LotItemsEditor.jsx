'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

function useDebounce(fn, delay) {
  const timer = useRef(null)
  return (...args) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }
}

function ProductSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const doSearch = useDebounce(async (q) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/admin/catalogue-search?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      setResults(json.data ?? [])
    } catch { setResults([]) }
    finally { setSearching(false) }
  }, 400)

  function handleChange(e) {
    const v = e.target.value
    setQuery(v)
    doSearch(v)
  }

  function handleSelect(product) {
    onSelect(product)
    setQuery('')
    setResults([])
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search catalogue by title or SKU…"
          autoComplete="off"
          className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      {results.length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-full rounded-md border bg-card shadow-lg max-h-60 overflow-y-auto">
          {results.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b last:border-0"
            >
              <p className="text-sm font-medium text-foreground line-clamp-1">{p.title}</p>
              <p className="text-xs text-muted-foreground">
                {[p.brand, p.sku, p.condition].filter(Boolean).join(' · ')}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LotItemsEditor({ listingId, initialItems = [] }) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [pending, setPending] = useState(null)
  const [error, setError] = useState(null)

  async function addItem(product) {
    setError(null)
    const payload = {
      internal_product_id: product.id,
      internal_sku: product.sku || null,
      product_title_snapshot: product.title,
      brand_snapshot: product.brand || null,
      model_snapshot: product.model || null,
      condition_snapshot: product.condition || null,
      quantity: 1,
    }
    const res = await fetch(`/api/admin/lots/${listingId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Failed to add item'); return }
    setItems(prev => [...prev, json.data])
    router.refresh()
  }

  async function updateQty(itemId, qty) {
    const value = Number(qty)
    if (!Number.isInteger(value) || value < 1) return
    setPending(itemId)
    const res = await fetch(`/api/admin/lots/${listingId}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: value }),
    })
    const json = await res.json()
    if (res.ok) {
      setItems(prev => prev.map(it => it.id === itemId ? { ...it, quantity: value } : it))
    } else {
      setError(json.error ?? 'Failed to update quantity')
    }
    setPending(null)
  }

  async function removeItem(itemId) {
    if (!confirm('Remove this item from the lot?')) return
    setPending(itemId)
    setError(null)
    const res = await fetch(`/api/admin/lots/${listingId}/items/${itemId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setItems(prev => prev.filter(it => it.id !== itemId))
      router.refresh()
    } else {
      const json = await res.json()
      setError(json.error ?? 'Failed to remove item')
    }
    setPending(null)
  }

  return (
    <div className="space-y-4">
      <ProductSearch onSelect={addItem} />
      {error && <p className="text-xs text-destructive">{error}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border-2 border-dashed rounded-md">
          No items added yet. Search above to add products.
        </p>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Condition</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24">Qty</th>
                <th className="py-2 px-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-muted/20">
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-foreground line-clamp-1">{item.product_title_snapshot}</p>
                    <p className="text-xs text-muted-foreground">{[item.brand_snapshot, item.internal_sku].filter(Boolean).join(' · ')}</p>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground text-xs hidden sm:table-cell">
                    {item.condition_snapshot || '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="1"
                      defaultValue={item.quantity}
                      disabled={pending === item.id}
                      onBlur={e => updateQty(item.id, e.target.value)}
                      className="w-20 h-7 px-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      disabled={pending === item.id}
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                      aria-label="Remove item"
                    >
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
  )
}
