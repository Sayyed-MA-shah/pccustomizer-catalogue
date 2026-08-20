import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import LotCreationForm from '@/components/admin/LotCreationForm'

export const metadata = { title: 'New Lot — Admin' }

export default function NewLotPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/faulty-lots"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to lots
        </Link>
        <PageHeader
          title="New lot"
          subtitle="Create a draft special listing lot. You can add images and publish after saving."
        />
      </div>
      <LotCreationForm />
    </div>
  )
}
