import { keepPreviousData, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { DataTable } from '@/shared/components/common/DataTable'
import { Options } from '@/shared/components/common/Options'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { PlatformBadge } from '@/shared/components/common/PlatformBadge'
import { Card } from '@/shared/components/ui/card'
import { NativeSelect } from '@/shared/components/ui/native-select'
import { humanOptions, humanize, platformOptions } from '@/shared/lib/format'
import { schemaOptions } from '@/shared/lib/tables'
import { metricDefinitionsOptions } from '../api/queries'
import type { MetricSearch } from '../types'

const route = getRouteApi('/metrics')
const SHORT_WINDOW = 90

export function MetricsPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data } = useQuery({ ...metricDefinitionsOptions(search), placeholderData: keepPreviousData })
  const { data: schema } = useSuspenseQuery(schemaOptions)
  const go = (p: MetricSearch) => navigate({ search: (s) => ({ ...s, ...p }) })

  return (
    <>
      <PageHeader
        title="Metrics"
        description="Every number the platform dashboards show, how long each platform keeps it, and where to export it."
      >
        <NativeSelect aria-label="Platform" value={search.platform ?? ''} onChange={(e) => go({ platform: e.target.value || undefined })}>
          <Options placeholder="All platforms" options={platformOptions(schema.enums.platform_t)} />
        </NativeSelect>
        <NativeSelect aria-label="Applies to" value={search.scope ?? ''} onChange={(e) => go({ scope: e.target.value || undefined })}>
          <Options placeholder="Everything" options={humanOptions(schema.enums.metric_scope_t)} />
        </NativeSelect>
      </PageHeader>
      <Card className="py-0">
        <DataTable
          rows={data?.rows ?? []}
          columns={[
            { key: 'platform', label: 'Platform', render: (r) => <PlatformBadge platform={r.platform} /> },
            {
              key: 'label',
              label: 'Metric',
              wrap: true,
              render: (r) => (
                <>
                  <span title={r.definition ?? undefined}>{r.label}</span>
                  <code className="block font-mono text-xs text-muted-foreground">{r.metricKey}</code>
                </>
              ),
            },
            { key: 'scope', label: 'Applies to', render: (r) => humanize(r.scope) },
            {
              key: 'retentionDays',
              label: 'Platform keeps it',
              align: 'right',
              render: (r) =>
                r.retentionDays ? (
                  <span className={r.retentionDays <= SHORT_WINDOW ? 'tabular-nums font-medium' : 'tabular-nums text-muted-foreground'}>{r.retentionDays} days</span>
                ) : (
                  <span className="text-muted-foreground">No known limit</span>
                ),
            },
            { key: 'guiPath', label: 'Where to export it', wrap: true, render: (r) => r.guiPath ?? '—' },
            { key: 'requires', label: 'Needs', wrap: true, render: (r) => r.requires ?? '—' },
            { key: 'verification', label: 'Source', render: (r) => (r.verification === 'verified_official' ? 'Official docs' : humanize(r.verification)) },
          ]}
        />
      </Card>
    </>
  )
}
