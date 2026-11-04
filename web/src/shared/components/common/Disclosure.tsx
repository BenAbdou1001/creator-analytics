import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

/** "Show more" for a card: the app's ghost button with a chevron, the extra content below it. */
export function Disclosure({ label, openLabel, children, className }: {
  label: string
  /** text while open; defaults to `label` */
  openLabel?: string
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className={className}>
      <Button type="button" variant="ghost" size="sm" className="-ml-3 text-muted-foreground" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <ChevronDown className={cn('transition-transform', open && 'rotate-180')} aria-hidden="true" />
        {open ? (openLabel ?? label) : label}
      </Button>
      <div id={id} hidden={!open}>
        {children}
      </div>
    </div>
  )
}
