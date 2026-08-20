const CATEGORY_STYLES = {
  faulty_parts:     'bg-red-50 text-red-700 border-red-200',
  refurbished_bulk: 'bg-violet-50 text-violet-700 border-violet-200',
  clearance:        'bg-orange-50 text-orange-700 border-orange-200',
  mixed_lot:        'bg-sky-50 text-sky-700 border-sky-200',
}

const CATEGORY_LABELS = {
  faulty_parts:     'Faulty / Parts',
  refurbished_bulk: 'Refurbished Bulk',
  clearance:        'Clearance',
  mixed_lot:        'Mixed Lot',
}

export default function LotCategoryBadge({ category }) {
  const style = CATEGORY_STYLES[category] ?? 'bg-muted text-muted-foreground border-muted-foreground/30'
  const label = CATEGORY_LABELS[category] ?? category
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${style}`}>
      {label}
    </span>
  )
}
