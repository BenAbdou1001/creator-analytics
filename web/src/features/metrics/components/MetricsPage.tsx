import { keepPreviousData, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { DataTable } from '@/shared/components/common/DataTable'
import { Options } from '@/shared/components/common/Options'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { PlatformBadge } from '@/shared/components/common/PlatformBadge'
import { Card } from '@/shared/components/ui/card'
import { NativeSelect } from '@/shared/components/ui/native-select'
import { schemaOptions } from '@/shared/lib/tables'
import { metricDefinitionsOptions } from '../api/queries'
import type { MetricSearch } from '../types'

const route = getRouteApi('/metrics')

export function MetricsPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data } = useQuery({ ...metricDefinitionsOptions(search), placeholderData: keepPreviousData })
  const { data: schema } = useSuspenseQuery(schemaOptions)
  const go = (p: MetricSearch) => navigate({ search: (s) => ({ ...s, ...p }) })

  return (
    <>
      <PageHeader
        title="Metric catalogue"
        description="Every metric the platform dashboards show. “Kept for” is how long the platform retains it — import before then, or the history is gone."
      >
        <NativeSelect aria-label="Platform" value={search.platform ?? ''} onChange={(e) => go({ platform: e.target.value || undefined })}>
          <Options placeholder="All platforms" options={schema.enums.platform_t} />
        </NativeSelect>
        <NativeSelect aria-label="Scope" value={search.scope ?? ''} onChange={(e) => go({ scope: e.target.value || undefined })}>
          <Options placeholder="All scopes" options={schema.enums.metric_scope_t} />
        </NativeSelect>
      </PageHeader>
      <Card className="py-0">
        <DataTable
          rows={data?.rows ?? []}
          columns={[
            { key: 'platform', render: (r) => <PlatformBadge platform={r.platform} /> },
            { key: 'scope' },
            { key: 'label' },
            { key: 'metricKey', label: 'key', render: (r) => <code className="text-xs">{r.metricKey}</code> },
            { key: 'unit' },
            { key: 'semantics' },
            {
              key: 'retentionDays',
              label: 'kept for',
              align: 'right',
              render: (r) =>
                r.retentionDays ? (
                  <span className={r.retentionDays <= 90 ? 'font-medium text-destructive' : ''}>{r.retentionDays} days</span>
                ) : (
                  '—'
                ),
            },
            { key: 'requires' },
            { key: 'guiPath', label: 'where in the app' },
          ]}
        />
      </Card>
    </>
  )
}
