import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { accountLabel } from '@/features/accounts'
import { postDatesOptions } from '@/features/content'
import { metricDefinitionsOptions } from '@/features/metrics'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { Provenance } from '@/shared/components/common/Provenance'
import { Card } from '@/shared/components/ui/card'
import { Select } from '@/shared/components/ui/select'
import { PLATFORM_LABEL } from '@/shared/lib/format'
import { timeseriesOptions } from '../api/queries'
import { TREND_RANGES } from '../types'
import type { AccountOverview, ExpiringMetric, TodaySearch, TrendRange } from '../types'
import { LineChart } from './LineChart'

const route = getRouteApi('/')

/** First day of a period, as YYYY-MM-DD in local time. */
function rangeStart(range: TrendRange | undefined) {
  if (!range) return undefined
  const d = new Date()
  d.setDate(d.getDate() - TREND_RANGES[range][1])
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function TrendCard({ accounts, saved }: { accounts: AccountOverview[]; saved: ExpiringMetric[] }) {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const go = (p: TodaySearch) => navigate({ search: (s) => ({ ...s, ...p }), replace: true, resetScroll: false })
  const account = accounts.find((a) => a.accountId === search.account) ?? accounts[0]
  const metrics = useQuery(metricDefinitionsOptions({ platform: account.platform, scope: 'account' }))
  const rows = metrics.data?.rows ?? []
  const withHistory = saved.find((m) => m.accountId === account.accountId && m.savedAs === 'days')?.metricKey
  const metric = rows.find((m) => m.metricKey === (search.metric ?? withHistory)) ?? rows[0]
  const series = useQuery({
    ...timeseriesOptions({ accountId: account.accountId, metricKey: metric?.metricKey ?? '', start: rangeStart(search.range) }),
    enabled: !!metric,
  })
  const posts = useQuery(postDatesOptions(account.accountId))
  const points = series.data ?? []

  return (
    <Card className="min-w-0 gap-2 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Performance</h2>
        <Select
          size="sm"
          className="min-w-36"
          aria-label="Period"
          value={search.range ?? 'all'}
          onValueChange={(v) => go({ range: v === 'all' ? undefined : (v as TrendRange) })}
          options={[...Object.entries(TREND_RANGES).map(([k, [label]]) => [k, label] as const), ['all', 'All time']]}
        />
      </div>
      <div className="mb-2 grid gap-2 sm:grid-cols-2">
        <Select
          size="sm"
          className="w-full min-w-0"
          aria-label="Account"
          value={String(account.accountId)}
          onValueChange={(v) => go({ account: Number(v), metric: undefined })}
          options={accounts.map((a) => [String(a.accountId), accountLabel(a)] as const)}
        />
        <Select size="sm" className="w-full min-w-0" aria-label="Metric" value={metric?.metricKey ?? ''} onValueChange={(v) => go({ metric: v })} options={rows.map((m) => [m.metricKey, m.label] as const)} />
      </div>
      <div>
        <ErrorText error={series.error} />
        {points.length ? (
          <>
            <LineChart
              points={points}
              label={metric?.label ?? ''}
              color="var(--chart)"
              platform={PLATFORM_LABEL[account.platform]}
              retentionDays={metric?.retentionDays}
              posts={posts.data}
            />
            <div className="mt-1">
              <Provenance batchId={points[points.length - 1].batchId} />
            </div>
          </>
        ) : (
          <p className="py-12 text-sm text-muted-foreground">
            Nothing saved day by day for {metric?.label ?? 'this metric'} yet.
            {metric?.guiPath && ` Export it from ${metric.guiPath}, then `}
            <Link to="/import" className="text-link hover:underline">
              import it
            </Link>
            .
          </p>
        )}
      </div>
    </Card>
  )
}
