import type { ReactNode } from 'react'
import { cell, PLATFORM_LABEL, type Platform, type Row } from '../lib/api'

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink-2">
      <span className="size-2 rounded-full" style={{ background: `var(--${platform})` }} />
      {PLATFORM_LABEL[platform] ?? platform}
    </span>
  )
}

export function ErrorText({ error }: { error: unknown }) {
  if (!error) return null
  return <p className="text-sm text-danger">{error instanceof Error ? error.message : String(error)}</p>
}

type Col = { key: string; label?: string; render?: (row: Row) => ReactNode; align?: 'right' }

/** Plain table; when `columns` is omitted every key of the first row is shown. */
export function DataTable({ rows, columns, actions, onRowClick, empty = 'No rows yet.' }: {
  rows: Row[]
  columns?: Col[]
  actions?: (row: Row) => ReactNode
  onRowClick?: (row: Row) => void
  empty?: string
}) {
  const cols: Col[] = columns ?? Object.keys(rows[0] ?? {}).map((key) => ({ key }))
  if (!rows.length) return <p className="px-4 py-10 text-center text-sm text-ink-3">{empty}</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {cols.map((c) => (
              <th key={c.key} className={`label px-3 py-2 whitespace-nowrap ${c.align === 'right' ? 'text-right' : ''}`}>
                {c.label ?? c.key}
              </th>
            ))}
            {actions && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={onRowClick && (() => onRowClick(row))}
              className={`border-b border-line/70 last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-line/40' : ''}`}
            >
              {cols.map((c) => (
                <td
                  key={c.key}
                  className={`max-w-[28rem] truncate px-3 py-2 ${c.align === 'right' ? 'text-right tabular-nums' : ''}`}
                >
                  {c.render ? c.render(row) : cell(row[c.key])}
                </td>
              ))}
              {actions && <td className="px-2 py-1 text-right whitespace-nowrap">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pager({ offset, limit, total, onChange }: {
  offset: number
  limit: number
  total: number
  onChange: (offset: number) => void
}) {
  return (
    <div className="flex items-center justify-between border-t border-line px-3 py-2 text-sm text-ink-3">
      <span>
        {total ? offset + 1 : 0}–{Math.min(offset + limit, total)} of {total}
      </span>
      <span>
        <button className="btn-ghost" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))}>
          Previous
        </button>
        <button className="btn-ghost" disabled={offset + limit >= total} onClick={() => onChange(offset + limit)}>
          Next
        </button>
      </span>
    </div>
  )
}

export function Select({ value, onChange, options, placeholder }: {
  value: string
  onChange: (v: string) => void
  options: (string | [string, string])[]
  placeholder?: string
}) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => {
        const [v, l] = Array.isArray(o) ? o : [o, o]
        return (
          <option key={v} value={v}>
            {l}
          </option>
        )
      })}
    </select>
  )
}
