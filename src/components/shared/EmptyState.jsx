export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
      </div>
      {title && <h3 className="text-sm font-medium text-foreground">{title}</h3>}
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}
