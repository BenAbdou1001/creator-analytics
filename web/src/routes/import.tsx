import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { DataTable, ErrorText, PageHeader, Select } from '../components/ui'
import { importCsv, overviewQuery, rowsQuery, schemaQuery } from '../lib/api'

const batchesQuery = rowsQuery('import_batches', { order_by: 'imported_at', limit: 20 })

export const Route = createFileRoute('/import')({
  loader: ({ context: { queryClient } }) =>
    Promise.all([queryClient.ensureQueryData(overviewQuery), queryClient.ensureQueryData(schemaQuery)]),
  component: Import,
})

function Import() {
  const qc = useQueryClient()
  const { data: accounts } = useSuspenseQuery(overviewQuery)
  const { data: schema } = useSuspenseQuery(schemaQuery)
  const batches = useQuery(batchesQuery)
  const [kind, setKind] = useState('content')
  const upload = useMutation({
    mutationFn: (form: FormData) => importCsv(form),
    onSuccess: () => qc.invalidateQueries(),
  })

  if (!accounts.length)
    return (
      <>
        <PageHeader title="Import" />
        <p className="text-ink-2">
          <Link to="/accounts" className="text-accent hover:underline">
            Add an account
          </Link>{' '}
          before importing data.
        </p>
      </>
    )

  return (
    <>
      <PageHeader title="Import" />
      <form
        className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault()
          upload.mutate(new FormData(e.currentTarget))
        }}
      >
        <label className="grid gap-1">
          <span className="label">Account</span>
          <select name="account_id" className="input">
            {accounts.map((a) => (
              <option key={a.account_id} value={a.account_id}>
                {a.platform} · @{a.handle}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="label">File contains</span>
          <input type="hidden" name="kind" value={kind} />
          <Select
            value={kind}
            onChange={setKind}
            options={[
              ['content', 'One row per post / video'],
              ['account_metrics', 'One row per date (chart export)'],
            ]}
          />
        </label>
        {kind === 'content' ? (
          <label className="grid gap-1">
            <span className="label">Content type (if no type column)</span>
            <select name="default_content_type" className="input" defaultValue="video">
              {schema.enums.content_type_t.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        ) : (
          <label className="grid gap-1">
            <span className="label">Each row is a</span>
            <select name="period_kind" className="input" defaultValue="day">
              {['day', 'week', 'month', 'year'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        )}
        <label className="grid gap-1 sm:col-span-2">
          <span className="label">CSV file</span>
          <input type="file" name="file" accept=".csv,text/csv" required className="input py-1.5" />
        </label>
        <div className="flex items-end">
          <button className="btn" disabled={upload.isPending}>
            {upload.isPending ? 'Importing…' : 'Import'}
          </button>
        </div>
        <div className="text-sm text-ink-2 sm:col-span-2 lg:col-span-3">
          <ErrorText error={upload.error} />
          {upload.data && (
            <p>
              Batch #{upload.data.batch_id}:{' '}
              {upload.data.content_upserted !== undefined && `${upload.data.content_upserted} items upserted, `}
              {upload.data.facts_inserted} metric values stored.
              {upload.data.unknown_metrics?.length > 0 && (
                <span className="text-ink-3"> Ignored columns: {upload.data.unknown_metrics.join(', ')}.</span>
              )}
            </p>
          )}
          <p className="mt-2 text-ink-3">
            Column headers are matched to the metric catalogue by key or by the label shown in the platform’s dashboard
            (e.g. “Views”, “Watch time (hours)”). Post files need an id column (Content, Video ID, Post ID…); chart files
            need a Date column. “Total” rows are skipped.
          </p>
        </div>
      </form>

      <h2 className="mt-10 mb-3 text-sm font-semibold">Recent imports</h2>
      <div className="card">
        <DataTable
          rows={batches.data?.rows ?? []}
          empty="Nothing imported yet."
          columns={[
            { key: 'batch_id', label: '#' },
            {
              key: 'account_id',
              label: 'account',
              render: (r) => {
                const a = accounts.find((x) => x.account_id === r.account_id)
                return a ? `${a.platform} · @${a.handle}` : r.account_id
              },
            },
            { key: 'source_kind', label: 'source' },
            { key: 'source_label', label: 'label' },
            { key: 'file_name', label: 'file' },
            { key: 'row_count', label: 'rows', align: 'right' },
            { key: 'imported_at', label: 'imported' },
          ]}
        />
      </div>
    </>
  )
}
