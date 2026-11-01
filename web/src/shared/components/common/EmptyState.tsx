import type { ReactNode } from 'react'

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="px-6 py-10">
      <h2 className="font-medium">{title}</h2>
      {children && <div className="mt-1 max-w-prose text-sm text-muted-foreground">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
