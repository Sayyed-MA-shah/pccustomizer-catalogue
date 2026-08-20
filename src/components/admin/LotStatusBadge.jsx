const STATUS_STYLES = {
  draft:     'bg-muted text-muted-foreground border-muted-foreground/30',
  published: 'bg-green-50 text-green-700 border-green-200',
  withdrawn: 'bg-amber-50 text-amber-700 border-amber-200',
  sold:      'bg-blue-50 text-blue-700 border-blue-200',
}

const STATUS_LABELS = {
  draft:     'Draft',
  published: 'Published',
  withdrawn: 'Withdrawn',
  sold:      'Sold',
}

export default function LotStatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.draft
  const label = STATUS_LABELS[status] ?? status
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${style}`}>
      {label}
    </span>
  )
}
