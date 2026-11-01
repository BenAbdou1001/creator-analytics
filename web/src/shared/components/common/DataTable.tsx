import type { ReactNode } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { cell } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

export type DataColumn<T extends object> = { key: string; label?: string; render?: (row: T) => ReactNode; align?: 'right' }

/** Plain table; when `columns` is omitted every key of the first row is shown. */
export function DataTable<T extends object>({
  rows,
  columns,
  actions,
  onRowClick,
  empty = 'No rows yet.',
}: {
  rows: T[]
  columns?: DataColumn<T>[]
  actions?: (row: T) => ReactNode
  onRowClick?: (row: T) => void
  empty?: string
}) {
  const cols: DataColumn<T>[] = columns ?? Object.keys(rows[0] ?? {}).map((key) => ({ key }))
  if (!rows.length) return <p className="px-4 py-10 text-center text-sm text-muted-foreground">{empty}</p>
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {cols.map((c) => (
            <TableHead key={c.key} className={cn('text-xs uppercase', c.align === 'right' && 'text-right')}>
              {c.label ?? c.key}
            </TableHead>
          ))}
          {actions && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i} onClick={onRowClick && (() => onRowClick(row))} className={cn(onRowClick && 'cursor-pointer')}>
            {cols.map((c) => (
              <TableCell key={c.key} className={cn('max-w-[28rem] truncate', c.align === 'right' && 'text-right tabular-nums')}>
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
