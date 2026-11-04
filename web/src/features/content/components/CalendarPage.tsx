import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { accountLabel, accountsOptions } from '@/features/accounts'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { PlatformMark } from '@/shared/components/common/PlatformBadge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Select } from '@/shared/components/ui/select'
import { PLATFORM_LABEL } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { plannedBetweenOptions, publishedBetweenOptions, unscheduledOptions } from '../api/queries'
import type { CalendarItemDto } from '../api/queries'
import { hasTime, postDay, shiftMonth, weeksOf } from '../lib/what-worked'
import type { CalendarSearch } from '../types'

const route = getRouteApi('/calendar')
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const thisMonth = () => ymd(new Date()).slice(0, 7)

interface Entry {
  item: CalendarItemDto
  planned: boolean
  time: string | null // local HH:mm, null when only the date is saved
}

function entry(item: CalendarItemDto): [string, Entry] | null {
  const planned = item.visibility === 'draft'
  const iso = planned ? item.scheduled_for : item.published_at
  if (!iso) return null
  const timed = hasTime(iso) || planned
  const d = new Date(iso)
  return [postDay(iso), { item, planned, time: timed ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : null }]
}

/** Every platform's posts on one month grid: published ones at their real time, planned ones on their date. */
export function CalendarPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const month = search.month ?? thisMonth()
  const go = (p: Partial<CalendarSearch>) => navigate({ search: (s) => ({ ...s, ...p }), replace: true })
  const { data: accounts } = useSuspenseQuery(accountsOptions)

  const weeks = weeksOf(month)
  // a day either side, so posts near midnight in other time zones still land on screen
  const from = new Date(weeks[0][0].getTime() - 864e5).toISOString()
  const to = new Date(weeks[weeks.length - 1][6].getTime() + 2 * 864e5).toISOString()
  const published = useQuery(publishedBetweenOptions(from, to, search.account))
  const planned = useQuery(plannedBetweenOptions(from, to, search.account))
  const unscheduled = useQuery(unscheduledOptions(search.account))

  const byDay = new Map<string, Entry[]>()
  for (const item of [...(published.data ?? []), ...(planned.data ?? [])]) {
    const e = entry(item)
    if (e) byDay.set(e[0], [...(byDay.get(e[0]) ?? []), e[1]])
  }
  for (const list of byDay.values()) list.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  const inMonth = [...byDay].filter(([day]) => day.startsWith(month)).flatMap(([, l]) => l)
  const untimed = inMonth.filter((e) => !e.planned && !e.time).length
  const today = ymd(new Date())
  const label = new Date(`${month}-01T12:00:00`).toLocaleDateString('en', { month: 'long', year: 'numeric' })

  return (
    <>
      <PageHeader title="Calendar" description="Posted and planned posts on every platform, at the time they went out">
        <Select
          aria-label="Account"
          value={String(search.account ?? '')}
          onValueChange={(v) => go({ account: v ? Number(v) : undefined })}
          placeholder="All accounts"
          options={accounts.rows.map((a) => [String(a.accountId), accountLabel(a)] as const)}
        />
        <Button asChild>
          <Link to="/content/new" search={{ plan: true }}>
            Plan a post
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-lg font-medium">{label}</h2>
        <Button size="sm" variant="outline" onClick={() => go({ month: undefined })} disabled={month === thisMonth()}>
          Today
        </Button>
        <Button size="icon-sm" variant="outline" aria-label="Previous month" onClick={() => go({ month: shiftMonth(month, -1) })}>
          <ChevronLeft />
        </Button>
        <Button size="icon-sm" variant="outline" aria-label="Next month" onClick={() => go({ month: shiftMonth(month, 1) })}>
          <ChevronRight />
        </Button>
      </div>
      <ErrorText error={published.error ?? planned.error} />
      {untimed > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          {untimed} {untimed === 1 ? 'post this month has' : 'posts this month have'} a date but no time (the export only gives days). Open one and set
          its publish time to learn which hours work.
        </p>
      )}

      <Card className="gap-0 overflow-hidden py-0">
        {/* month grid from md up; an agenda list below that, where 7 columns don't fit */}
        <div className="hidden grid-cols-7 border-b text-xs font-medium text-muted-foreground md:grid">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="hidden md:block">
          {weeks.map((week) => (
            <div key={ymd(week[0])} className="grid grid-cols-7 border-b last:border-b-0">
              {week.map((d) => {
                const day = ymd(d)
                const outside = !day.startsWith(month)
                return (
                  <div key={day} className={cn('group min-h-28 min-w-0 border-r p-1.5 last:border-r-0', outside && 'bg-muted/40')}>
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={cn(
                          'grid size-6 place-items-center rounded-full text-xs tabular-nums',
                          day === today ? 'bg-primary font-medium text-primary-foreground' : outside ? 'text-muted-foreground' : '',
                        )}
                      >
                        {d.getDate()}
                      </span>
                      <PlanButton day={day} />
                    </div>
                    <ul className="grid gap-1">
                      {(byDay.get(day) ?? []).map((e) => (
                        <EntryChip key={e.item.content_id} entry={e} />
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <CardContent className="grid gap-4 py-4 md:hidden">
          {[...byDay]
            .filter(([day]) => day.startsWith(month))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, list]) => (
              <div key={day}>
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  {new Date(`${day}T12:00:00`).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
                <ul className="grid gap-1">
                  {list.map((e) => (
                    <EntryChip key={e.item.content_id} entry={e} />
                  ))}
                </ul>
              </div>
            ))}
          {!inMonth.length && <p className="text-sm text-muted-foreground">Nothing posted or planned this month.</p>}
        </CardContent>
      </Card>

      {(unscheduled.data?.length ?? 0) > 0 && (
        <Card className="mt-6">
          <CardContent>
            <h2 className="mb-2 text-sm font-medium">Planned, no date yet</h2>
            <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {unscheduled.data!.map((item) => (
                <EntryChip key={item.content_id} entry={{ item, planned: true, time: null }} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  )
}

function PlanButton({ day }: { day: string }) {
  return (
    <Button
      asChild
      size="icon-xs"
      variant="ghost"
      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      aria-label={`Plan a post on ${new Date(`${day}T12:00:00`).toLocaleDateString('en', { day: 'numeric', month: 'long' })}`}
    >
      <Link to="/content/new" search={{ plan: true, date: day }}>
        <Plus />
      </Link>
    </Button>
  )
}

function EntryChip({ entry: { item, planned, time } }: { entry: Entry }) {
  const title = item.title ?? 'Untitled'
  return (
    <li className="min-w-0">
      <Link
        to="/content/$id"
        params={{ id: String(item.content_id) }}
        title={`${PLATFORM_LABEL[item.platform]} · ${planned ? 'Planned' : 'Posted'}${time ? ` at ${time}` : ', time not saved'} · ${title}`}
        className={cn(
          'flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-xs hover:bg-accent',
          planned ? 'border border-dashed border-primary/50 text-primary' : 'bg-muted',
        )}
      >
        <PlatformMark platform={item.platform} className="size-3 shrink-0" />
        <span className={cn('shrink-0 tabular-nums', !time && 'text-muted-foreground')}>{time ?? '--:--'}</span>
        <span dir="auto" className="truncate">
          {title}
        </span>
      </Link>
    </li>
  )
}
