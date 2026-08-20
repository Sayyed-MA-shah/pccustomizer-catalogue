'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Upload, Trash2, Loader2 } from 'lucide-react'

const BUCKET_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/special-listing-images/`
  : ''

function imageUrl(storagePath) {
  return `${BUCKET_URL}${storagePath}`
}

export default function LotImageManager({ listingId, initialImages = [] }) {
  const router = useRouter()
  const [images, setImages] = useState(initialImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(null)
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

  async function deleteImage(imageId, storagePath) {
    if (!confirm('Delete this image?')) return
    setPending(imageId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/lots/${listingId}/images/${imageId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setImages(prev => prev.filter(img => img.id !== imageId))
        router.refresh()
      } else {
        const json = await res.json()
        setError(json.error ?? 'Delete failed')
      }
    } catch { setError('Delete failed') }
    finally { setPending(null) }
  }

  return (
    <div className="space-y-4">
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
        <p className="text-sm text-muted-foreground py-6 text-center border-2 border-dashed rounded-md">
          No images uploaded yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div key={img.id} className="relative group rounded-md border overflow-hidden aspect-square bg-muted">
              <Image
                src={img.public_url ?? imageUrl(img.storage_path)}
                alt={img.alt_text || `Image ${idx + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  disabled={pending === img.id}
                  onClick={() => deleteImage(img.id, img.storage_path)}
                  className="p-2 rounded-full bg-destructive text-white hover:bg-destructive/90 transition-colors disabled:opacity-50"
                  aria-label="Delete image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {idx === 0 && (
                <span className="absolute top-1 left-1 text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
