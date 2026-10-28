import { keepPreviousData, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { DataTable, ErrorText, PageHeader, Pager, Select } from '../components/ui'
import { createRow, deleteRow, rowsQuery, schemaQuery, updateRow, type Row } from '../lib/api'

const LIMIT = 50
type Search = { table: string; offset: number; filter_col?: string; filter_val?: string }

const tableQuery = (s: Search) =>
  rowsQuery(s.table, { limit: LIMIT, offset: s.offset, ...(s.filter_col ? { [`${s.filter_col}__like`]: s.filter_val } : {}) })

export const Route = createFileRoute('/data')({
  validateSearch: (s: Record<string, unknown>): Search => ({
    table: (s.table as string) || 'accounts',
    offset: Number(s.offset ?? 0),
    filter_col: (s.filter_col as string) || undefined,
    filter_val: (s.filter_val as string) || undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    Promise.all([queryClient.ensureQueryData(schemaQuery), queryClient.ensureQueryData(tableQuery(deps))]),
  component: DataExplorer,
})

function DataExplorer() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const qc = useQueryClient()
  const { data: schema } = useSuspenseQuery(schemaQuery)
  const { data, error } = useQuery({ ...tableQuery(search), placeholderData: keepPreviousData })
  const meta = schema.tables[search.table]
  const writable = meta && !meta.view && meta.pk.length > 0
  const [editor, setEditor] = useState<{ key: Row | null; text: string } | null>(null)
  const go = (p: Partial<Search>) => navigate({ search: (s) => ({ ...s, offset: 0, ...p }) })

  const save = useMutation({
    mutationFn: () => {
      const body = JSON.parse(editor!.text)
      return editor!.key ? updateRow(search.table, editor!.key, body) : createRow(search.table, body)
    },
    onSuccess: () => {
      setEditor(null)
      qc.invalidateQueries()
    },
  })
  const remove = useMutation({
    mutationFn: (key: Row) => deleteRow(search.table, key),
    onSuccess: () => qc.invalidateQueries(),
  })
  const keyOf = (r: Row) => Object.fromEntries(meta.pk.map((k) => [k, r[k]]))

  function newTemplate() {
    const cols = meta.columns.filter((c) => !c.default)
    return JSON.stringify(Object.fromEntries(cols.map((c) => [c.name, null])), null, 2)
  }

  return (
    <>
      <PageHeader title="Data explorer">
        <Select
          value={search.table}
          onChange={(table) => (setEditor(null), go({ table, filter_col: undefined, filter_val: undefined }))}
          options={Object.entries(schema.tables).map(([name, t]) => [name, t.view ? `${name} (view)` : name])}
        />
        <Select
          value={search.filter_col ?? ''}
          onChange={(v) => go({ filter_col: v || undefined })}
          placeholder="Filter column…"
          options={meta?.columns.map((c) => c.name) ?? []}
        />
        {search.filter_col && (
          <input
            className="input"
            placeholder="contains…"
            defaultValue={search.filter_val}
            onKeyDown={(e) => e.key === 'Enter' && go({ filter_val: e.currentTarget.value })}
          />
        )}
        {writable && (
          <button className="btn" onClick={() => setEditor({ key: null, text: newTemplate() })}>
            New row
          </button>
        )}
      </PageHeader>

      {editor && (
        <div className="card mb-6 p-4">
          <div className="label mb-2">
            {editor.key ? `Edit ${search.table} ${JSON.stringify(editor.key)}` : `New ${search.table} row`}
          </div>
          <textarea
            className="input h-64 w-full py-2 font-mono text-xs"
            value={editor.text}
            onChange={(e) => setEditor({ ...editor, text: e.target.value })}
          />
          <p className="mt-1 text-xs text-ink-3">
            Columns:{' '}
            {meta.columns.map((c) => `${c.name}: ${c.type}${c.required && !c.default ? ' *' : ''}`).join(' · ')}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button className="btn" disabled={save.isPending} onClick={() => save.mutate()}>
              Save
            </button>
            <button className="btn-ghost" onClick={() => setEditor(null)}>
              Cancel
            </button>
            <ErrorText error={save.error} />
          </div>
        </div>
      )}

      <ErrorText error={error ?? remove.error} />
      <div className="card">
        <DataTable
          rows={data?.rows ?? []}
          actions={
            writable
              ? (r) => (
                  <>
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        const body = Object.fromEntries(Object.entries(r).filter(([k]) => !meta.pk.includes(k)))
                        setEditor({ key: keyOf(r), text: JSON.stringify(body, null, 2) })
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-ghost !text-danger"
                      onClick={() => window.confirm('Delete this row?') && remove.mutate(keyOf(r))}
                    >
                      Delete
                    </button>
                  </>
                )
              : undefined
          }
        />
        <Pager offset={search.offset} limit={LIMIT} total={data?.total ?? 0} onChange={(offset) => go({ offset })} />
      </div>
    </>
  )
}
