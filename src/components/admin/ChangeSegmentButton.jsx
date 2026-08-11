'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const SEGMENTS = [
  { value: 'retail',    label: 'Retail' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'trade',     label: 'Trade' },
]

const label = (seg) => SEGMENTS.find(s => s.value === seg)?.label ?? seg

export default function ChangeSegmentButton({ customerId, currentSegment }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(currentSegment)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function openDialog() {
    setSelected(currentSegment)
    setError(null)
    setOpen(true)
  }

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_segment', segment: selected }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const unchanged = selected === currentSegment

  return (
    <>
      <Button variant="outline" size="sm" onClick={openDialog}>
        Change customer type
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change customer type</DialogTitle>
            <DialogDescription>
              Select the new customer type for this account.
              {currentSegment && (
                <> Currently set to <strong>{label(currentSegment)}</strong>.</>
              )}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {SEGMENTS.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSelected(s.value)}
                className={cn(
                  'flex-1 px-3 py-2 rounded-md border text-sm font-medium transition-colors',
                  selected === s.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {!unchanged && (
            <p className="text-sm text-muted-foreground">
              Change from <strong>{label(currentSegment) || 'Unassigned'}</strong> to{' '}
              <strong>{label(selected)}</strong>?
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={loading || unchanged}>
              {loading ? 'Saving…' : 'Confirm change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
