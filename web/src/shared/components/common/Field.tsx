import type { ReactNode } from 'react'
import { Label } from '@/shared/components/ui/label'
import { cn } from '@/shared/lib/utils'

/** Label + control stacked; wraps the control so the label is associated without ids. */
export function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <Label className={cn('grid gap-1.5 text-xs font-medium text-muted-foreground', className)}>
      {label}
      {children}
    </Label>
  )
}
