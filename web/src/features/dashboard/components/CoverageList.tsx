import { useQuery } from '@tanstack/react-query'
import { PlatformBadge } from '@/shared/components/common/PlatformBadge'
import { Card } from '@/shared/components/ui/card'
import { prettyDay } from '@/shared/lib/format'
import { expiringOptions } from '../api/queries'
import type { ExpiringMetric } from '../types'

const DAY = 86_400_000
const ms = (d: string) => Date.parse(`${d}T00:00:00Z`)

/** The platform's window as a track, with the saved stretch filled in. */
function CoverageStrip({ metric: m }: { metric: ExpiringMetric }) {
  const end = Date.now()
  const start = end - m.retentionDays * DAY
  const left = Math.max(0, (ms(m.firstDay!) - start) / (end - start))
  const right = Math.min(1, (ms(m.lastDay!) + DAY - start) / (end - start))
  return (
    <span
      className="block h-2 rounded-full bg-muted"
      role="img"
      aria-label={`Saved from ${prettyDay(m.firstDay)} to ${prettyDay(m.lastDay)} of the last ${m.retentionDays} days`}
    >
      <span className="block h-full rounded-full bg-primary" style={{ marginLeft: `${left * 100}%`, width: `${Math.max(0, right - left) * 100}%` }} />
    </span>
  )
}

/** What is saved of each metric, so an import visibly closes a gap. */
export function CoverageList({ accountId }: { accountId?: number }) {
  const { data } = useQuery(expiringOptions)
  const rows = (data ?? []).filter((m) => m.savedAs === 'days' && (!accountId || m.accountId === accountId))
  if (!rows.length) return null
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-semibold">Daily history you hold</h2>
      <Card className="p-5">
        <ul className="grid gap-3">
          {rows.map((m) => {
            const span = Math.round((ms(m.lastDay!) - ms(m.firstDay!)) / DAY) + 1
            return (
              <li key={`${m.accountId}-${m.metricKey}`} className="grid gap-1 text-sm md:grid-cols-[7rem_11rem_minmax(0,1fr)_14rem] md:items-center md:gap-3">
                <PlatformBadge platform={m.platform} />
                <span className="truncate">{m.label}</span>
                <CoverageStrip metric={m} />
                <span className="text-muted-foreground md:text-right">
                  {prettyDay(m.firstDay)} to {prettyDay(m.lastDay)}
                  {span > m.daysSaved && ` · ${span - m.daysSaved} missing`}
                </span>
              </li>
            )
          })}
        </ul>
      </Card>
    </section>
  )
}
