import { cn } from '@/shared/lib/utils'

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const exact = new Intl.NumberFormat('en', { maximumFractionDigits: 2 })

/** Every metric value. `—` means no data and is never the same thing as 0. Exact value on hover and for screen readers. */
export function Sounding({ value, full, className }: { value: number | null | undefined; full?: boolean; className?: string }) {
  if (value === null || value === undefined)
    return (
      <span className={cn('font-mono text-muted-foreground', className)} aria-label="no data">
        —
      </span>
    )
  const precise = exact.format(value)
  return (
    <span className={cn('font-mono', className)} title={precise} aria-label={precise}>
      {full ? precise : compact.format(value)}
    </span>
  )
}
