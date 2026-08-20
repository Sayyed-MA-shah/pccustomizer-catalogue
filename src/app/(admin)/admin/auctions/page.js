import { Gavel } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'

export const metadata = { title: 'Auctions — Admin' }

export default function AuctionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Auctions"
        subtitle="Live auction management — coming soon."
      />
      <EmptyState
        icon={Gavel}
        title="Auctions not yet available"
        description="The auction bidding system is planned for a future release. For now, special lots use fixed-price sales."
      />
    </div>
  )
}
