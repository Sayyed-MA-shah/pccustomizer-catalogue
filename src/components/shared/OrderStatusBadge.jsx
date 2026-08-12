const config = {
  pending:   { label: 'Pending',   classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected:  { label: 'Rejected',  classes: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { label: 'Cancelled', classes: 'bg-gray-100 text-gray-500 border-gray-200' },
}

export default function OrderStatusBadge({ status, className = '' }) {
  const c = config[status]
  if (!c) return null
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${c.classes} ${className}`}>
      {c.label}
    </span>
  )
}
