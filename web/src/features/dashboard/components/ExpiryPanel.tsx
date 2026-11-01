import { Link } from '@tanstack/react-router'
import { PlatformBadge } from '@/shared/components/common/PlatformBadge'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { PLATFORM_LABEL, prettyDay } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import type { ExpiringMetric } from '../types'

const URGENT_DAYS = 30

const when = (m: ExpiringMetric) => {
  if (m.daysLeft === null) return '—'
  if (m.daysLeft <= 0) return 'Now'
  return `${m.daysLeft} ${m.daysLeft === 1 ? 'day' : 'days'}`
}

const saved = (m: ExpiringMetric) =>
  m.savedAs === 'days' ? `Saved to ${prettyDay(m.lastDay)}` : m.savedAs === 'totals' ? 'Saved as totals only' : 'Never saved'

function Row({ metric: m }: { metric: ExpiringMetric }) {
  return (
    <li className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 py-2 sm:grid-cols-[4.5rem_7rem_minmax(0,1fr)_auto]">
      <span className="font-mono text-sm">{when(m)}</span>
      <span className="row-start-2 sm:row-start-auto">
        <PlatformBadge platform={m.platform} />
      </span>
      <span className="truncate text-sm" title={m.guiPath ?? undefined}>
        {m.label}
      </span>
      <span className="col-start-2 text-sm text-muted-foreground sm:col-start-auto">{saved(m)}</span>
    </li>
  )
}

/** The lead of the home screen: when does the platform start taking something you have not saved? */
function Lead({ next, unsaved }: { next: ExpiringMetric | undefined; unsaved: number }) {
  if (!next)
    return (
      <>
        <p className="font-display text-3xl">{unsaved}</p>
        <p className="mt-1 text-sm text-ink-2">{unsaved === 1 ? 'metric has' : 'metrics have'} no daily history saved yet.</p>
      </>
    )
  const left = next.daysLeft ?? 0
  const platform = PLATFORM_LABEL[next.platform]
  const urgent = left <= URGENT_DAYS
  const months = Math.floor(left / 30.44)
  return (
    <>
      <p className={cn('font-display text-3xl', urgent && 'text-overprint')}>
        {left <= 0 ? 'Losing days' : `${left} ${left === 1 ? 'day' : 'days'}`}
      </p>
      <p className="mt-1 max-w-64 text-sm text-ink-2">
        {left <= 0
          ? `${platform} is deleting ${next.label} days you have not saved.`
          : urgent
            ? `until ${platform} starts deleting ${next.label} days you have not saved.`
            : `Nothing at risk for ${months === 1 ? 'a month' : `${months} months`}. Then ${platform} starts deleting days you have not saved.`}
      </p>
    </>
  )
}

export function ExpiryPanel({ metrics }: { metrics: ExpiringMetric[] }) {
  if (!metrics.length)
    return (
      <Card className="px-6 py-5">
        <p className="text-sm text-ink-2">Nothing here has a known deletion date. These platforms keep their history.</p>
      </Card>
    )
  const daily = metrics.filter((m) => m.savedAs === 'days')
  const gaps = metrics.filter((m) => m.savedAs !== 'days')
  const urgent = (daily[0]?.daysLeft ?? Infinity) <= URGENT_DAYS
  return (
    <Card className="grid gap-6 px-6 py-5 md:grid-cols-[18rem_minmax(0,1fr)]">
      <div>
        <Lead next={daily[0]} unsaved={gaps.length} />
        <Button asChild className="mt-4" variant={urgent ? 'default' : 'outline'} size="sm">
          <Link to="/import">Bring in data</Link>
        </Button>
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-medium">Expires next</h2>
        <ul className="divide-y">
          {(daily.length ? daily : gaps).slice(0, 4).map((m) => (
            <Row key={`${m.accountId}-${m.metricKey}`} metric={m} />
          ))}
        </ul>
        {daily.length > 0 && gaps.length > 0 && (
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              {gaps.length} {gaps.length === 1 ? 'metric has' : 'metrics have'} no daily history
            </summary>
            <ul className="divide-y">
              {gaps.map((m) => (
                <Row key={`${m.accountId}-${m.metricKey}`} metric={m} />
              ))}
            </ul>
          </details>
        )}
      </div>
    </Card>
  )
}
