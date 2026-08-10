import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function Logo({ href = '/', size = 'default', className }) {
  const sizes = {
    sm: { box: 'w-6 h-6 text-xs', text: 'text-sm' },
    default: { box: 'w-8 h-8 text-xs', text: 'text-base' },
    lg: { box: 'w-10 h-10 text-sm', text: 'text-lg' },
  }
  const s = sizes[size] ?? sizes.default

  return (
    <Link href={href} className={cn('flex items-center gap-2.5 shrink-0', className)}>
      <div className={cn('rounded-md bg-primary flex items-center justify-center shrink-0', s.box)}>
        <span className="text-primary-foreground font-bold leading-none">PC</span>
      </div>
      <span className={cn('font-semibold text-foreground', s.text)}>
        PCCustomizer
        <span className="text-muted-foreground font-normal"> Trade</span>
      </span>
    </Link>
  )
}
