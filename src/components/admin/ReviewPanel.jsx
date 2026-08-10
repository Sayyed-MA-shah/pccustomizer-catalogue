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

export default function ReviewPanel({ requestId }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function openDialog(action) {
    setPendingAction(action)
    setNotes('')
    setError(null)
    setOpen(true)
  }

  async function handleConfirm() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: pendingAction, notes }),
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
      setError('Network error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-3">
        <Button onClick={() => openDialog('approve')}>Approve</Button>
        <Button variant="destructive" onClick={() => openDialog('reject')}>Reject</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === 'approve' ? 'Approve access request' : 'Reject access request'}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === 'approve'
                ? 'The customer will gain immediate access to the catalogue.'
                : 'The customer will not be granted access to the catalogue.'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="review-notes">Notes (optional)</Label>
            <Textarea
              id="review-notes"
              placeholder="Internal notes about this decision..."
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
              {loading ? 'Saving…' : `Confirm ${pendingAction}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
