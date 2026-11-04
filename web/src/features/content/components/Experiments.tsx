import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Card, CardContent } from '@/shared/components/ui/card'
import { prettyDay } from '@/shared/lib/format'
import { performanceOptions } from '../api/queries'
import { isDraft, reviewFrom } from '../lib/what-worked'
import type { PerformanceRow } from '../lib/what-worked'

/** The experiment loop at a glance: what's planned, what's ready to judge, what's still settling. */
export function Experiments({ accountId }: { accountId?: number }) {
  const { data } = useQuery(performanceOptions)
  const rows = (data ?? []).filter((r) => accountId === undefined || r.account_id === accountId) as PerformanceRow[]
  const now = new Date()
  const planned = rows.filter(isDraft)
  const pending = rows.flatMap((r) => {
    const from = reviewFrom(r)
    return from ? [{ r, from }] : []
  })
  const due = pending.filter((p) => p.from <= now)
  const settling = pending.filter((p) => p.from > now)
  if (!planned.length && !pending.length) return null

  return (
    <Card className="mb-6">
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <Column title="Planned" empty="Nothing planned. Plan a post to test an idea.">
          {planned.map((r) => <Item key={String(r.content_id)} row={r} note={String(r.hypothesis ?? 'No hypothesis yet')} />)}
        </Column>
        <Column title="Ready to review" empty="Nothing to judge yet.">
          {due.map(({ r }) => <Item key={String(r.content_id)} row={r} note={String(r.hypothesis)} />)}
        </Column>
        <Column title="Settling" empty="No experiment waiting for its numbers.">
          {settling.map(({ r, from }) => <Item key={String(r.content_id)} row={r} note={`Review from ${prettyDay(from)}`} />)}
        </Column>
      </CardContent>
    </Card>
  )
}

function Column({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <div className="min-w-0">
      <h2 className="mb-2 text-sm font-medium">
        {title} <span className="font-normal text-muted-foreground tabular-nums">{children.length}</span>
      </h2>
      {children.length ? <ul className="grid gap-2">{children}</ul> : <p className="text-sm text-muted-foreground">{empty}</p>}
    </div>
  )
}

function Item({ row, note }: { row: PerformanceRow; note: string }) {
  return (
    <li className="min-w-0 text-sm">
      <Link to="/content/$id" params={{ id: String(row.content_id) }} dir="auto" className="block truncate font-medium hover:underline">
        {String(row.title ?? 'Untitled')}
      </Link>
      <span dir="auto" className="block truncate text-xs text-muted-foreground" title={note}>
        {note}
      </span>
    </li>
  )
}
