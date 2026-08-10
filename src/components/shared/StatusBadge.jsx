import { cn } from '@/lib/utils'

const config = {
  pending:  { label: 'Pending',  classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', classes: 'bg-red-50 text-red-700 border-red-200' },
  revoked:  { label: 'Revoked',  classes: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
}

export default function StatusBadge({ status, className }) {
  const c = config[status] ?? { label: status, classes: 'bg-zinc-100 text-zinc-600 border-zinc-200' }
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
      c.classes,
      className
    )}>
      {c.label}
    </span>
  )
}
