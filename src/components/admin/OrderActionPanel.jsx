'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle2, XCircle } from 'lucide-react'

export default function OrderActionPanel({ orderId, orderNumber }) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState(null) // 'confirm' | 'reject'
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function openDialog(action) {
    setNotes('')
    setError(null)
    setPendingAction(action)
  }

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: pendingAction, notes: notes.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Action failed.'); setLoading(false); return }
      setPendingAction(null)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={() => openDialog('confirm')}
          className="flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Confirm Order
        </Button>
        <Button
          variant="destructive"
          onClick={() => openDialog('reject')}
          className="flex items-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          Reject Order
        </Button>
      </div>

      <Dialog open={!!pendingAction} onOpenChange={open => { if (!open) setPendingAction(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === 'confirm' ? 'Confirm order' : 'Reject order'} {orderNumber}?
            </DialogTitle>
            <DialogDescription>
              {pendingAction === 'confirm'
                ? 'The customer will see this order as confirmed.'
                : 'The customer will see this order as rejected. This cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Admin notes <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={pendingAction === 'reject' ? 'Reason for rejection…' : 'Any notes for this order…'}
              rows={3}
              className="resize-none"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAction(null)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant={pendingAction === 'reject' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? 'Saving…' : pendingAction === 'confirm' ? 'Confirm order' : 'Reject order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
