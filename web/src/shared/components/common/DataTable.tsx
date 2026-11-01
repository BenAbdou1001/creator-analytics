import { ArrowDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { cell } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

export type DataColumn<T extends object> = {
  key: string
  label?: string
  render?: (row: T) => ReactNode
  align?: 'right'
  /** long text wraps instead of truncating */
  wrap?: boolean
}

/** Plain table; when `columns` is omitted every key of the first row is shown. Sorting is descending, one column at a time. */
export function DataTable<T extends object>({
  rows,
  columns,
  actions,
  empty = 'No rows yet.',
  sortable,
  sortedBy,
  onSort,
}: {
  rows: T[]
  columns?: DataColumn<T>[]
  actions?: (row: T) => ReactNode
  empty?: ReactNode
  sortable?: readonly string[]
  sortedBy?: string
  onSort?: (key: string) => void
}) {
  const cols: DataColumn<T>[] = columns ?? Object.keys(rows[0] ?? {}).map((key) => ({ key }))
  if (!rows.length) return typeof empty === 'string' ? <p className="px-4 py-10 text-sm text-muted-foreground">{empty}</p> : empty
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {cols.map((c) => {
            const label = c.label ?? c.key
            const sorted = sortedBy === c.key
            return (
              <TableHead
                key={c.key}
                className={cn(c.align === 'right' && 'text-right')}
                aria-sort={sortable?.includes(c.key) ? (sorted ? 'descending' : 'none') : undefined}
              >
                {sortable?.includes(c.key) ? (
                  <button
                    type="button"
                    onClick={() => onSort?.(c.key)}
                    className={cn('inline-flex items-center gap-1 hover:text-foreground', sorted && 'text-foreground')}
                  >
                    {label}
                    {sorted && <ArrowDown className="size-3" aria-hidden="true" />}
                  </button>
                ) : (
                  label
                )}
              </TableHead>
            )
          })}
          {actions && (
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i}>
            {cols.map((c) => (
              <TableCell
                key={c.key}
                className={cn(
                  c.wrap ? 'max-w-[24rem] min-w-[14rem] whitespace-normal' : 'max-w-[28rem] truncate',
                  c.align === 'right' && 'text-right',
                )}
              >
                {c.render ? c.render(row) : cell((row as Record<string, unknown>)[c.key])}
              </TableCell>
            ))}
            {actions && <TableCell className="text-right">{actions(row)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
