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
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-foreground">Admin decision</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Approve to grant catalogue access, or reject to decline this application.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button
            onClick={() => openDialog('approve')}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === 'approve' ? 'Approve access request' : 'Reject access request'}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === 'approve'
                ? 'The customer will gain immediate access to the trade catalogue.'
                : 'The customer will not be granted catalogue access.'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="review-notes">Internal notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
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
              {loading ? 'Saving…' : `Confirm ${pendingAction}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
