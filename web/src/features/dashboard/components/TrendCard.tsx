import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { DataTable } from '@/shared/components/common/DataTable'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { Options } from '@/shared/components/common/Options'
import { PlatformBadge } from '@/shared/components/common/PlatformBadge'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { NativeSelect } from '@/shared/components/ui/native-select'
import { accountLabel } from '@/features/accounts'
import { metricDefinitionsOptions } from '@/features/metrics'
import { timeseriesOptions } from '../api/queries'
import type { AccountOverview } from '../types'
import { LineChart } from './LineChart'

export function TrendCard({ accounts }: { accounts: AccountOverview[] }) {
  const [accountId, setAccountId] = useState(String(accounts[0].accountId))
  const account = accounts.find((a) => String(a.accountId) === accountId)!
  const metrics = useQuery(metricDefinitionsOptions({ platform: account.platform, scope: 'account' }))
  const [metricKey, setMetricKey] = useState('')
  const metric = metrics.data?.rows.find((m) => m.metricKey === metricKey) ?? metrics.data?.rows[0]
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const series = useQuery({
    ...timeseriesOptions({ accountId: account.accountId, metricKey: metric?.metricKey ?? '', start, end }),
    enabled: !!metric,
  })

  return (
    <Card>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          <NativeSelect
            aria-label="Account"
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value)
              setMetricKey('')
            }}
          >
            <Options options={accounts.map((a) => [String(a.accountId), accountLabel(a)] as const)} />
          </NativeSelect>
          <NativeSelect aria-label="Metric" value={metric?.metricKey ?? ''} onChange={(e) => setMetricKey(e.target.value)}>
            <Options options={(metrics.data?.rows ?? []).map((m) => [m.metricKey, m.label] as const)} />
          </NativeSelect>
          <Input type="date" className="w-auto" value={start} onChange={(e) => setStart(e.target.value)} aria-label="From" />
          <Input type="date" className="w-auto" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="To" />
        </div>
        <ErrorText error={series.error} />
        {series.data?.length ? (
          <>
            <LineChart points={series.data} label={metric?.label ?? ''} />
            <details className="mt-2 text-sm text-muted-foreground">
              <summary className="cursor-pointer">Show as table</summary>
              <DataTable
                rows={series.data}
                columns={[
                  { key: 'periodStart', label: 'date' },
                  { key: 'value', align: 'right', render: (r) => r.value.toLocaleString('en') },
                ]}
              />
            </details>
          </>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No daily data for this metric yet. Import a chart export for <PlatformBadge platform={account.platform} /> on
            the Import page.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
