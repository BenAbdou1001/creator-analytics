import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { LineChart } from '../components/LineChart'
import { DataTable, ErrorText, PageHeader, PlatformBadge, Select } from '../components/ui'
import { num, overviewQuery, rowsQuery, timeseriesQuery, type Platform } from '../lib/api'

const topContentQuery = rowsQuery('v_content_summary', { order_by: 'views', limit: 10 })

export const Route = createFileRoute('/')({
  loader: ({ context: { queryClient } }) =>
    Promise.all([queryClient.ensureQueryData(overviewQuery), queryClient.ensureQueryData(topContentQuery)]),
  component: Dashboard,
})

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="label">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function Dashboard() {
  const { data: accounts } = useSuspenseQuery(overviewQuery)
  const { data: top } = useSuspenseQuery(topContentQuery)
  const sum = (k: 'followers' | 'total_views' | 'total_engagements' | 'content_count') =>
    accounts.reduce((s, a) => s + Number(a[k] ?? 0), 0)

  if (!accounts.length)
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="card p-10 text-center">
          <p className="text-ink-2">No accounts yet. Add your YouTube, TikTok, Instagram and LinkedIn accounts to start.</p>
          <Link to="/accounts" className="btn mt-4">
            Add an account
          </Link>
        </div>
      </>
    )

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Followers" value={num(sum('followers'))} />
        <Stat label="Content views" value={num(sum('total_views'))} />
        <Stat label="Engagements" value={num(sum('total_engagements'))} />
        <Stat label="Content items" value={num(sum('content_count'))} />
      </div>

      <h2 className="mt-10 mb-3 text-sm font-semibold">Accounts</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {accounts.map((a) => (
          <div key={a.account_id} className="card p-4">
            <PlatformBadge platform={a.platform} />
            <div className="mt-1 truncate font-medium">{a.display_name || `@${a.handle}`}</div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              {(
                [
                  ['Followers', a.followers],
                  ['Views', a.total_views],
                  ['Posts', a.content_count],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-ink-3">{k}</dt>
                  <dd className="font-semibold tabular-nums">{num(v)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 text-xs text-ink-3">
              Last import: {a.last_import ? new Date(a.last_import).toLocaleDateString() : 'never'}
            </div>
          </div>
        ))}
      </div>

      <Trend />

      <h2 className="mt-10 mb-3 text-sm font-semibold">Top content by views</h2>
      <div className="card">
        <DataTable
          rows={top.rows}
          empty="No content yet — import a CSV or sync via MCP."
          columns={[
            { key: 'platform', render: (r) => <PlatformBadge platform={r.platform} /> },
            { key: 'title', render: (r) => r.title ?? <span className="text-ink-3">untitled</span> },
            { key: 'content_type', label: 'type' },
            { key: 'views', align: 'right', render: (r) => num(r.views) },
            { key: 'likes', align: 'right', render: (r) => num(r.likes) },
            { key: 'comments', align: 'right', render: (r) => num(r.comments) },
            { key: 'shares', align: 'right', render: (r) => num(r.shares) },
          ]}
        />
      </div>
    </>
  )
}

function Trend() {
  const { data: accounts } = useSuspenseQuery(overviewQuery)
  const [accountId, setAccountId] = useState(String(accounts[0].account_id))
  const account = accounts.find((a) => String(a.account_id) === accountId)!
  const metrics = useQuery(
    rowsQuery('metric_definitions', { platform: account.platform, scope: 'account', order_by: 'metric_id', desc: false }),
  )
  const [metricKey, setMetricKey] = useState('')
  const metric = metrics.data?.rows.find((m) => m.metric_key === metricKey) ?? metrics.data?.rows[0]
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const series = useQuery({
    ...timeseriesQuery({ account_id: account.account_id, metric_key: metric?.metric_key ?? '', start, end }),
    enabled: !!metric,
  })

  return (
    <>
      <h2 className="mt-10 mb-3 text-sm font-semibold">Daily trend</h2>
      <div className="card p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          <Select
            value={accountId}
            onChange={(v) => {
              setAccountId(v)
              setMetricKey('')
            }}
            options={accounts.map((a) => [String(a.account_id), `${a.platform} · @${a.handle}`])}
          />
          <Select
            value={metric?.metric_key ?? ''}
            onChange={setMetricKey}
            options={(metrics.data?.rows ?? []).map((m) => [m.metric_key, m.label])}
          />
          <input type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} aria-label="From" />
          <input type="date" className="input" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="To" />
        </div>
        <ErrorText error={series.error} />
        {series.data?.length ? (
          <>
            <LineChart points={series.data} label={metric?.label ?? ''} />
            <details className="mt-2 text-sm text-ink-2">
              <summary className="cursor-pointer">Show as table</summary>
              <DataTable
                rows={series.data}
                columns={[
                  { key: 'period_start', label: 'date' },
                  { key: 'value', align: 'right', render: (r) => Number(r.value).toLocaleString('en') },
                ]}
              />
            </details>
          </>
        ) : (
          <p className="py-16 text-center text-sm text-ink-3">
            No daily data for this metric yet. Import an “Export current view” CSV for{' '}
            <PlatformBadge platform={account.platform as Platform} /> on the Import page.
          </p>
        )}
      </div>
    </>
  )
}
