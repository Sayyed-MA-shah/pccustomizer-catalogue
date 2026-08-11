'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const SEGMENTS = [
  { value: 'retail',    label: 'Retail' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'trade',     label: 'Trade' },
]

export default function ReviewPanel({ requestId }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [segment, setSegment] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function openDialog(action) {
    if (action === 'approve' && !segment) return // guard — button already disabled
    setPendingAction(action)
    setNotes('')
    setError(null)
    setOpen(true)
  }

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const body = { action: pendingAction, notes }
      if (pendingAction === 'approve') body.segment = segment

      const res = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }
      setOpen(false)
      router.push('/admin/requests')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const segmentLabel = SEGMENTS.find(s => s.value === segment)?.label

  return (
    <>
      <div className="rounded-lg border bg-card p-4 space-y-5">
        {/* Segment selection — required for approval */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Customer type
            <span className="text-muted-foreground font-normal ml-1">(required to approve)</span>
          </Label>
          <div className="flex gap-2">
            {SEGMENTS.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSegment(s.value)}
                className={cn(
                  'flex-1 px-3 py-2 rounded-md border text-sm font-medium transition-colors',
                  segment === s.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Admin decision</p>
          <p className="text-xs text-muted-foreground mb-3">
            Approve to grant catalogue access, or reject to decline this application.
          </p>
          <div className="flex gap-2.5">
            <Button
              onClick={() => openDialog('approve')}
              disabled={!segment}
              title={!segment ? 'Select a customer type before approving' : undefined}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </Button>
            <Button
              variant="outline"
              onClick={() => openDialog('reject')}
              className="flex items-center gap-2 text-destructive hover:text-destructive border-destructive/40 hover:bg-destructive/5"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === 'approve' ? 'Approve access request' : 'Reject access request'}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === 'approve'
                ? `The customer will be granted ${segmentLabel} catalogue access immediately.`
                : 'The customer will not be granted catalogue access.'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="review-notes">
              Internal notes
              <span className="text-muted-foreground font-normal ml-1">(optional)</span>
            </Label>
            <Textarea
              id="review-notes"
              placeholder="Reason for decision, internal reference…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant={pendingAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading
                ? 'Saving…'
                : pendingAction === 'approve'
                  ? `Confirm — ${segmentLabel}`
                  : 'Confirm reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
