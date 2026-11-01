import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { accountLabel } from '@/features/accounts'
import { postDatesOptions } from '@/features/content'
import { metricDefinitionsOptions } from '@/features/metrics'
import { DataTable } from '@/shared/components/common/DataTable'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { Options } from '@/shared/components/common/Options'
import { Provenance } from '@/shared/components/common/Provenance'
import { Sounding } from '@/shared/components/common/Sounding'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { NativeSelect } from '@/shared/components/ui/native-select'
import { PLATFORM_LABEL, prettyDay } from '@/shared/lib/format'
import { timeseriesOptions } from '../api/queries'
import type { AccountOverview, ExpiringMetric, TodaySearch } from '../types'
import { LineChart } from './LineChart'

const route = getRouteApi('/')

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
    ...timeseriesOptions({ accountId: account.accountId, metricKey: metric?.metricKey ?? '', start: search.from, end: search.to }),
    enabled: !!metric,
  })
  const posts = useQuery(postDatesOptions(account.accountId))
  const points = series.data ?? []

  return (
    <Card>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          <NativeSelect
            aria-label="Account"
            value={String(account.accountId)}
            onChange={(e) => go({ account: Number(e.target.value), metric: undefined })}
          >
            <Options options={accounts.map((a) => [String(a.accountId), accountLabel(a)] as const)} />
          </NativeSelect>
          <NativeSelect aria-label="Metric" value={metric?.metricKey ?? ''} onChange={(e) => go({ metric: e.target.value })}>
            <Options options={rows.map((m) => [m.metricKey, m.label] as const)} />
          </NativeSelect>
          <Input type="date" className="w-auto" value={search.from ?? ''} onChange={(e) => go({ from: e.target.value || undefined })} aria-label="From" />
          <Input type="date" className="w-auto" value={search.to ?? ''} onChange={(e) => go({ to: e.target.value || undefined })} aria-label="To" />
        </div>
        <ErrorText error={series.error} />
        {points.length ? (
          <>
            <LineChart
              points={points}
              label={metric?.label ?? ''}
              color={`var(--${account.platform})`}
              platform={PLATFORM_LABEL[account.platform]}
              retentionDays={metric?.retentionDays}
              posts={posts.data}
            />
            <div className="mt-1">
              <Provenance batchId={points[points.length - 1].batchId} />
            </div>
            <details className="mt-2 text-sm text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">Show as table</summary>
              <DataTable
                rows={points}
                columns={[
                  { key: 'periodStart', label: 'Date', render: (r) => <span className="font-mono">{prettyDay(r.periodStart)}</span> },
                  { key: 'value', label: 'Value', align: 'right', render: (r) => <Sounding value={r.value} full /> },
                ]}
              />
            </details>
          </>
        ) : (
          <p className="py-12 text-sm text-muted-foreground">
            Nothing saved day by day for {metric?.label ?? 'this metric'} yet.
            {metric?.guiPath && ` Export it from ${metric.guiPath}, then `}
            <Link to="/import" className="text-deep hover:underline">
              bring it in
            </Link>
            .
          </p>
        )}
      </CardContent>
    </Card>
  )
}
