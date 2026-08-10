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
import { UserX } from 'lucide-react'

export default function RevokeButton({ customerId, customerName }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function openDialog() {
    setNotes('')
    setError(null)
    setOpen(true)
  }

  async function handleRevoke() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', notes }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }
      setOpen(false)
      router.push('/admin/customers')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={openDialog}
        className="flex items-center gap-2"
      >
        <UserX className="w-4 h-4" />
        Revoke access
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke catalogue access</DialogTitle>
            <DialogDescription>
              This will immediately remove <strong>{customerName}</strong>&apos;s access to the catalogue.
              They will be redirected to a restricted page on their next request.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="revoke-notes">Reason <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="revoke-notes"
              placeholder="Internal reason for revocation…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={loading}>
              {loading ? 'Revoking…' : 'Yes, revoke access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
