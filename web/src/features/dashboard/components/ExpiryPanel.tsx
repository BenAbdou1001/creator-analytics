import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { PlatformTile } from '@/shared/components/common/PlatformBadge'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { PLATFORM_LABEL, prettyDay } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import type { ExpiringMetric } from '../types'

const URGENT_DAYS = 30
const SHOWN = 6

const saved = (m: ExpiringMetric) =>
  m.savedAs === 'days' ? `Saved to ${prettyDay(m.lastDay)}` : m.savedAs === 'totals' ? 'Saved as totals only' : 'Never saved'

function status(m: ExpiringMetric) {
  if (m.daysLeft === null) return { text: 'No daily history', tone: 'text-muted-foreground' }
  if (m.daysLeft <= 0) return { text: 'Losing days now', tone: 'text-warning' }
  return {
    text: `${m.daysLeft} ${m.daysLeft === 1 ? 'day' : 'days'} left`,
    tone: m.daysLeft <= URGENT_DAYS ? 'text-warning' : 'text-success',
  }
}

function Row({ metric: m }: { metric: ExpiringMetric }) {
  const { text, tone } = status(m)
  return (
    <li className="flex items-center gap-3 py-2.5">
      <PlatformTile platform={m.platform} large />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold" title={m.guiPath ?? undefined}>
          {m.label}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {PLATFORM_LABEL[m.platform]} · {saved(m)}
        </span>
      </span>
      <span className={cn('shrink-0 text-xs font-medium', tone)}>{text}</span>
    </li>
  )
}

export function ExpiryPanel({ metrics }: { metrics: ExpiringMetric[] }) {
  const daily = metrics.filter((m) => m.savedAs === 'days')
  const gaps = metrics.filter((m) => m.savedAs !== 'days')
  const urgent = (daily[0]?.daysLeft ?? Infinity) <= URGENT_DAYS
  const platforms = [...new Set(metrics.map((m) => m.platform))]
  return (
    <Card className="min-w-0 gap-2 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Expiring soon</h2>
        <Button asChild size="sm" variant={urgent ? 'default' : 'outline'}>
          <Link to="/import">Import data</Link>
        </Button>
      </div>
      {metrics.length ? (
        <>
          <ul className="divide-y">
            {[...daily, ...gaps].slice(0, SHOWN).map((m) => (
              <Row key={`${m.accountId}-${m.metricKey}`} metric={m} />
            ))}
          </ul>
          {daily.length + gaps.length > SHOWN && (
            <Button asChild size="sm" variant="ghost" className="-ml-3 w-fit text-muted-foreground">
              <Link to="/metrics" search={platforms.length === 1 ? { platform: platforms[0] } : {}}>
                See all {daily.length + gaps.length} metrics
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          )}
        </>
      ) : (
        <p className="py-6 text-sm text-muted-foreground">These platforms have no known deletion date.</p>
      )}
    </Card>
  )
}
