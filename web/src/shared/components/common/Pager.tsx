import { Button } from '@/shared/components/ui/button'

export function Pager({ offset, limit, total, onChange }: { offset: number; limit: number; total: number; onChange: (offset: number) => void }) {
  return (
    <div className="flex items-center justify-between border-t px-3 py-2 text-sm text-muted-foreground">
      <span>
        {total ? offset + 1 : 0}–{Math.min(offset + limit, total)} of {total}
      </span>
      <span>
        <Button variant="ghost" size="sm" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))}>
          Previous
        </Button>
        <Button variant="ghost" size="sm" disabled={offset + limit >= total} onClick={() => onChange(offset + limit)}>
          Next
        </Button>
      </span>
    </div>
  )
}
