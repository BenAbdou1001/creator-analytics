import { keepPreviousData, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { DataTable, PageHeader, Pager, PlatformBadge, Select } from '../components/ui'
import { num, overviewQuery, rowsQuery, schemaQuery, type Row } from '../lib/api'

const LIMIT = 25
type Search = { account_id?: number; content_type?: string; q?: string; order_by: string; offset: number }

const contentQuery = (s: Search) =>
  rowsQuery('v_content_summary', {
    account_id: s.account_id,
    content_type: s.content_type,
    title__like: s.q,
    order_by: s.order_by,
    limit: LIMIT,
    offset: s.offset,
  })

export const Route = createFileRoute('/content')({
  validateSearch: (s: Record<string, unknown>): Search => ({
    account_id: s.account_id ? Number(s.account_id) : undefined,
    content_type: (s.content_type as string) || undefined,
    q: (s.q as string) || undefined,
    order_by: (s.order_by as string) || 'published_at',
    offset: Number(s.offset ?? 0),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    Promise.all([
      queryClient.ensureQueryData(contentQuery(deps)),
      queryClient.ensureQueryData(overviewQuery),
      queryClient.ensureQueryData(schemaQuery),
    ]),
  component: Content,
})

function Content() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data } = useQuery({ ...contentQuery(search), placeholderData: keepPreviousData })
  const { data: accounts } = useSuspenseQuery(overviewQuery)
  const { data: schema } = useSuspenseQuery(schemaQuery)
  const [selected, setSelected] = useState<Row | null>(null)
  const go = (patch: Partial<Search>) => navigate({ search: (s) => ({ ...s, offset: 0, ...patch }) })

  return (
    <>
      <PageHeader title="Content">
        <input
          className="input"
          placeholder="Search titles…"
          defaultValue={search.q}
          onKeyDown={(e) => e.key === 'Enter' && go({ q: e.currentTarget.value || undefined })}
        />
        <Select
          value={String(search.account_id ?? '')}
          onChange={(v) => go({ account_id: v ? Number(v) : undefined })}
          placeholder="All accounts"
          options={accounts.map((a) => [String(a.account_id), `${a.platform} · @${a.handle}`])}
        />
        <Select
          value={search.content_type ?? ''}
          onChange={(v) => go({ content_type: v || undefined })}
          placeholder="All types"
          options={schema.enums.content_type_t}
        />
        <Select
          value={search.order_by}
          onChange={(v) => go({ order_by: v })}
          options={[
            ['published_at', 'Newest'],
            ['views', 'Most views'],
            ['likes', 'Most likes'],
            ['comments', 'Most comments'],
            ['shares', 'Most shares'],
          ]}
        />
      </PageHeader>

      <div className="card">
        <DataTable
          rows={data?.rows ?? []}
          onRowClick={setSelected}
          empty="No content matches."
          columns={[
            { key: 'platform', render: (r) => <PlatformBadge platform={r.platform} /> },
            { key: 'title', render: (r) => r.title ?? <span className="text-ink-3">untitled</span> },
            { key: 'content_type', label: 'type' },
            { key: 'published_at', label: 'published', render: (r) => r.published_at?.slice(0, 10) ?? '—' },
            ...['views', 'impressions', 'likes', 'comments', 'shares', 'saves'].map((k) => ({
              key: k,
              align: 'right' as const,
              render: (r: Row) => num(r[k]),
            })),
          ]}
        />
        <Pager offset={search.offset} limit={LIMIT} total={data?.total ?? 0} onChange={(offset) => go({ offset })} />
      </div>

      {selected && <ContentDetail item={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

function ContentDetail({ item, onClose }: { item: Row; onClose: () => void }) {
  const metrics = useQuery(
    rowsQuery('v_content_latest_metrics', { content_id: item.content_id, order_by: 'metric_key', desc: false, limit: 200 }),
  )
  const content = useQuery(rowsQuery('content_items', { content_id: item.content_id }))
  const c = content.data?.rows[0]
  return (
    <div className="card mt-6 p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <PlatformBadge platform={item.platform} />
          <h2 className="mt-1 text-lg font-semibold">{item.title ?? 'untitled'}</h2>
          {c?.url && (
            <a href={c.url} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
              Open on platform ↗
            </a>
          )}
          {c?.deleted_observed_at && <p className="text-sm text-danger">Not seen since {c.deleted_observed_at.slice(0, 10)}</p>}
        </div>
        <button className="btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <DataTable
        rows={metrics.data?.rows ?? []}
        empty="No metrics captured for this item."
        columns={[
          { key: 'label', label: 'metric' },
          { key: 'period_kind', label: 'period' },
          { key: 'value', align: 'right', render: (r) => Number(r.value).toLocaleString('en') },
          { key: 'captured_at', label: 'captured' },
        ]}
      />
    </div>
  )
}
