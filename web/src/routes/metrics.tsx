import { keepPreviousData, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { DataTable, PageHeader, PlatformBadge, Select } from '../components/ui'
import { rowsQuery, schemaQuery } from '../lib/api'

type Search = { platform?: string; scope?: string }
const metricsQuery = (s: Search) =>
  rowsQuery('metric_definitions', { ...s, order_by: 'metric_id', desc: false, limit: 500 })

export const Route = createFileRoute('/metrics')({
  validateSearch: (s: Record<string, unknown>): Search => ({
    platform: (s.platform as string) || undefined,
    scope: (s.scope as string) || undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    Promise.all([queryClient.ensureQueryData(metricsQuery(deps)), queryClient.ensureQueryData(schemaQuery)]),
  component: Metrics,
})

function Metrics() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data } = useQuery({ ...metricsQuery(search), placeholderData: keepPreviousData })
  const { data: schema } = useSuspenseQuery(schemaQuery)
  const go = (p: Search) => navigate({ search: (s) => ({ ...s, ...p }) })

  return (
    <>
      <PageHeader title="Metric catalogue">
        <Select value={search.platform ?? ''} onChange={(v) => go({ platform: v || undefined })} placeholder="All platforms" options={schema.enums.platform_t} />
        <Select value={search.scope ?? ''} onChange={(v) => go({ scope: v || undefined })} placeholder="All scopes" options={schema.enums.metric_scope_t} />
      </PageHeader>
      <p className="mb-4 max-w-3xl text-sm text-ink-2">
        Every metric the platform dashboards show. “Kept for” is how long the platform retains it — import before then,
        or the history is gone.
      </p>
      <div className="card">
        <DataTable
          rows={data?.rows ?? []}
          columns={[
            { key: 'platform', render: (r) => <PlatformBadge platform={r.platform} /> },
            { key: 'scope' },
            { key: 'label' },
            { key: 'metric_key', label: 'key', render: (r) => <code className="text-xs">{r.metric_key}</code> },
            { key: 'unit' },
            { key: 'semantics' },
            {
              key: 'retention_days',
              label: 'kept for',
              align: 'right',
              render: (r) =>
                r.retention_days ? (
                  <span className={r.retention_days <= 90 ? 'font-medium text-danger' : ''}>{r.retention_days} days</span>
                ) : (
                  '—'
                ),
            },
            { key: 'requires' },
            { key: 'gui_path', label: 'where in the app' },
          ]}
        />
      </div>
    </>
  )
}
