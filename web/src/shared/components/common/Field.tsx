import type { ReactNode } from 'react'
import { Label } from '@/shared/components/ui/label'
import { cn } from '@/shared/lib/utils'

/** Width of every control in a filter bar, so a row of filters lines up. Dropdowns use it as their minimum. */
export const FILTER_WIDTH = 'w-48'

/** Label + control stacked; wraps the control so the label is associated without ids. */
export function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <Label className={cn('grid content-start gap-1.5 text-xs font-medium text-muted-foreground', className)}>
      {label}
      {children}
    </Label>
  )
}

/** A checkbox sized like a text field, sitting on the same baseline as the fields beside it. */
export function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex h-10 items-center gap-2 self-end text-sm">
      <input type="checkbox" className="size-4 accent-(--primary)" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

/** The one grid every form uses: same columns and spacing everywhere. */
export function FormGrid({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>{children}</div>
}

/** Submit and cancel row under a form. */
export function FormActions({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>
}
