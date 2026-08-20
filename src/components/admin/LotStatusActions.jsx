'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const TRANSITIONS = {
  draft:     [{ to: 'published', label: 'Publish', variant: 'default' }],
  published: [
    { to: 'sold',      label: 'Mark as Sold', variant: 'default' },
    { to: 'withdrawn', label: 'Withdraw',      variant: 'outline' },
    { to: 'draft',     label: 'Revert to Draft', variant: 'ghost' },
  ],
  withdrawn: [
    { to: 'published', label: 'Re-publish', variant: 'default' },
    { to: 'draft',     label: 'Move to Draft', variant: 'ghost' },
  ],
  sold: [],
}

export default function LotStatusActions({ listingId, currentStatus }) {
  const router = useRouter()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)

  const actions = TRANSITIONS[currentStatus] ?? []
  if (actions.length === 0) return null

  async function transition(newStatus) {
    if (!confirm(`Change status to "${newStatus}"?`)) return
    setLoading(newStatus)
    setError(null)
    try {
      const res = await fetch(`/api/admin/lots/${listingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed'); setLoading(null); return }
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {actions.map(({ to, label, variant }) => (
          <Button
            key={to}
            variant={variant}
            size="sm"
            disabled={loading !== null}
            onClick={() => transition(to)}
          >
            {loading === to ? 'Updating…' : label}
          </Button>
        ))}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
