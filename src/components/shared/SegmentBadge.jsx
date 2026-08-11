const config = {
  retail:    { label: 'Retail',    classes: 'bg-sky-50 text-sky-700 border-sky-200' },
  wholesale: { label: 'Wholesale', classes: 'bg-violet-50 text-violet-700 border-violet-200' },
  trade:     { label: 'Trade',     classes: 'bg-amber-50 text-amber-700 border-amber-200' },
}

export default function SegmentBadge({ segment, className = '' }) {
  if (!segment) return <span className={`text-xs text-muted-foreground ${className}`}>—</span>
  const c = config[segment]
  if (!c) return null
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${c.classes} ${className}`}>
      {c.label}
    </span>
  )
}
