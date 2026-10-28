import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { DataTable, ErrorText, PageHeader, PlatformBadge, Select } from '../components/ui'
import { createRow, deleteRow, rowsQuery, schemaQuery, updateRow, type Row } from '../lib/api'

const accountsQuery = rowsQuery('accounts', { order_by: 'platform', desc: false })
const EMPTY = { platform: 'youtube', account_type: 'channel', handle: '', display_name: '', profile_url: '', external_id: '', is_monetized: false }

export const Route = createFileRoute('/accounts')({
  loader: ({ context: { queryClient } }) =>
    Promise.all([queryClient.ensureQueryData(accountsQuery), queryClient.ensureQueryData(schemaQuery)]),
  component: Accounts,
})

function Accounts() {
  const qc = useQueryClient()
  const { data } = useSuspenseQuery(accountsQuery)
  const { data: schema } = useSuspenseQuery(schemaQuery)
  const [form, setForm] = useState<Row>(EMPTY)
  const [editing, setEditing] = useState<number | null>(null)

  const save = useMutation({
    mutationFn: () => {
      const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]))
      return editing ? updateRow('accounts', { account_id: editing }, body) : createRow('accounts', body)
    },
    onSuccess: () => {
      setForm(EMPTY)
      setEditing(null)
      qc.invalidateQueries()
    },
  })
  const remove = useMutation({
    mutationFn: (id: number) => deleteRow('accounts', { account_id: id }),
    onSuccess: () => qc.invalidateQueries(),
  })
  const set = (k: string) => (v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <>
      <PageHeader title="Accounts" />
      <form
        className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
      >
        <label className="grid gap-1">
          <span className="label">Platform</span>
          <Select value={form.platform} onChange={set('platform')} options={schema.enums.platform_t} />
        </label>
        <label className="grid gap-1">
          <span className="label">Account type</span>
          <Select value={form.account_type} onChange={set('account_type')} options={schema.enums.account_type_t} />
        </label>
        {(
          [
            ['handle', 'Handle *'],
            ['display_name', 'Display name'],
            ['profile_url', 'Profile URL'],
            ['external_id', 'Channel / member ID'],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="grid gap-1">
            <span className="label">{label}</span>
            <input className="input" required={k === 'handle'} value={form[k] ?? ''} onChange={(e) => set(k)(e.target.value)} />
          </label>
        ))}
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" checked={!!form.is_monetized} onChange={(e) => set('is_monetized')(e.target.checked)} />
          Monetized
        </label>
        <div className="flex items-end gap-2">
          <button className="btn" disabled={save.isPending}>
            {editing ? 'Save changes' : 'Add account'}
          </button>
          {editing && (
            <button type="button" className="btn-ghost" onClick={() => (setEditing(null), setForm(EMPTY))}>
              Cancel
            </button>
          )}
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <ErrorText error={save.error ?? remove.error} />
        </div>
      </form>

      <div className="card">
        <DataTable
          rows={data.rows}
          columns={[
            { key: 'platform', render: (r) => <PlatformBadge platform={r.platform} /> },
            { key: 'handle', render: (r) => `@${r.handle}` },
            { key: 'display_name', label: 'name' },
            { key: 'account_type', label: 'type' },
            { key: 'is_monetized', label: 'monetized', render: (r) => (r.is_monetized ? 'Yes' : 'No') },
            { key: 'account_id', label: 'id' },
          ]}
          actions={(r) => (
            <>
              <button
                className="btn-ghost"
                onClick={() => {
                  setEditing(r.account_id)
                  setForm(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, r[k] ?? ''])))
                }}
              >
                Edit
              </button>
              <button
                className="btn-ghost !text-danger"
                onClick={() => {
                  if (window.confirm(`Delete @${r.handle} and all of its content, metrics and imports?`)) remove.mutate(r.account_id)
                }}
              >
                Delete
              </button>
            </>
          )}
        />
      </div>
    </>
  )
}
