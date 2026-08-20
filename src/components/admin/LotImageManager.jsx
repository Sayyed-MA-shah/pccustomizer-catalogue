'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Upload, Trash2, Loader2, ChevronUp, ChevronDown, Pencil, Check, Package } from 'lucide-react'

export default function LotImageManager({ listingId, initialImages = [] }) {
  const router = useRouter()
  // Sort by sort_order ascending on init
  const [images, setImages] = useState(
    [...initialImages].sort((a, b) => a.sort_order - b.sort_order)
  )
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(null)
  const [editingAlt, setEditingAlt] = useState(null)
  const [altValue, setAltValue] = useState('')
  const inputRef = useRef(null)

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('sort_order', String(images.length))

    try {
      const res = await fetch(`/api/admin/lots/${listingId}/images`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Upload failed'); return }
      setImages(prev => [...prev, json.data])
      router.refresh()
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function moveImage(imageId, direction) {
    const idx = images.findIndex(img => img.id === imageId)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === images.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1

    // Swap positions and reassign sequential sort_orders
    const reordered = [...images]
    const temp = reordered[idx]
    reordered[idx] = reordered[swapIdx]
    reordered[swapIdx] = temp

    // Normalise sort_order to match array position
    const normalised = reordered.map((img, i) => ({ ...img, sort_order: i }))
    setImages(normalised) // optimistic

    setPending(imageId)
    setError(null)
    try {
      await Promise.all([
        fetch(`/api/admin/lots/${listingId}/images/${normalised[idx].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: idx }),
        }),
        fetch(`/api/admin/lots/${listingId}/images/${normalised[swapIdx].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: swapIdx }),
        }),
      ])
    } catch {
      setError('Reorder failed — refresh to restore order')
      setImages(images) // revert
    }
    setPending(null)
  }

  async function deleteImage(imageId) {
    if (!confirm('Delete this image? This cannot be undone.')) return
    setPending(imageId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/lots/${listingId}/images/${imageId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        const remaining = images
          .filter(img => img.id !== imageId)
          .map((img, i) => ({ ...img, sort_order: i }))
        setImages(remaining)
        router.refresh()
      } else {
        const json = await res.json()
        setError(json.error ?? 'Delete failed')
      }
    } catch { setError('Delete failed') }
    finally { setPending(null) }
  }

  async function saveAlt(imageId) {
    const trimmed = altValue.trim() || null
    setEditingAlt(null)
    try {
      const res = await fetch(`/api/admin/lots/${listingId}/images/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt_text: trimmed }),
      })
      if (res.ok) {
        setImages(prev => prev.map(img =>
          img.id === imageId ? { ...img, alt_text: trimmed } : img
        ))
      }
    } catch {}
  }

  return (
    <div className="space-y-4">
      {/* Upload control */}
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleUpload}
          disabled={uploading}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading…' : 'Upload image'}
        </button>
        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP — max 10 MB</p>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-md text-center gap-2">
          <Package className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No images yet — upload one above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={`flex gap-3 items-start rounded-lg border bg-card p-3 ${pending === img.id ? 'opacity-60' : ''}`}
            >
              {/* Thumbnail */}
              <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                {img.signed_url ? (
                  <Image
                    src={img.signed_url}
                    alt={img.alt_text || `Image ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {idx === 0 && (
                    <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded uppercase tracking-wide">
                      Primary / Cover
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">Image {idx + 1} of {images.length}</span>
                </div>

                {/* Alt text */}
                {editingAlt === img.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={altValue}
                      onChange={e => setAltValue(e.target.value)}
                      placeholder="Describe the image…"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') saveAlt(img.id); if (e.key === 'Escape') setEditingAlt(null) }}
                      className="flex-1 h-7 px-2 text-xs rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => saveAlt(img.id)}
                      className="h-7 px-2 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingAlt(null)}
                      className="h-7 px-2 text-xs rounded-md border border-input hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setEditingAlt(img.id); setAltValue(img.alt_text || '') }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    {img.alt_text || <span className="italic">Add alt text</span>}
                  </button>
                )}
              </div>

              {/* Reorder + Delete */}
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0 || pending !== null}
                  onClick={() => moveImage(img.id, 'up')}
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-input hover:bg-muted transition-colors disabled:opacity-30"
                  aria-label="Move image up"
                  title="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === images.length - 1 || pending !== null}
                  onClick={() => moveImage(img.id, 'down')}
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-input hover:bg-muted transition-colors disabled:opacity-30"
                  aria-label="Move image down"
                  title="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={pending !== null}
                  onClick={() => deleteImage(img.id)}
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-input text-muted-foreground hover:text-destructive hover:border-destructive transition-colors disabled:opacity-30 mt-1"
                  aria-label="Delete image"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
