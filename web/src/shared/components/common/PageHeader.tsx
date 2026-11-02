import type { ReactNode } from 'react'

/** The title bar across the top of the content panel. */
export function PageHeader({ title, description, children }: { title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <header className="-mx-4 mb-6 flex min-h-20 flex-wrap items-center justify-between gap-3 border-b px-4 py-4 md:-mx-8 md:px-8">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-0.5 max-w-prose text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </header>
  )
}
