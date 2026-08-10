import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

export default function StatCard({ label, value, icon: Icon, href, highlight, description }) {
  const inner = (
    <Card className={cn(
      'transition-colors',
      href && 'hover:border-primary cursor-pointer',
      highlight && 'border-primary'
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className={cn('text-3xl font-bold mt-1', highlight && 'text-primary')}>
              {value ?? 0}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {Icon && (
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              highlight ? 'bg-primary/10' : 'bg-muted'
            )}>
              <Icon className={cn('w-5 h-5', highlight ? 'text-primary' : 'text-muted-foreground')} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return href ? <Link href={href}>{inner}</Link> : inner
}
