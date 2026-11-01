import { keepPreviousData, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { DataTable } from '@/shared/components/common/DataTable'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { Options } from '@/shared/components/common/Options'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { Pager } from '@/shared/components/common/Pager'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { NativeSelect } from '@/shared/components/ui/native-select'
import { schemaOptions } from '@/shared/lib/tables'
import type { Row } from '@/shared/types'
import { useDeleteRow, useSaveRow } from '../api/mutations'
import { EXPLORER_PAGE_SIZE, explorerRowsOptions } from '../api/queries'
import type { ExplorerSearch, RowDraft } from '../types'
import { RowEditor } from './RowEditor'

const route = getRouteApi('/data')

export function ExplorerPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data: schema } = useSuspenseQuery(schemaOptions)
  const { data, error } = useQuery({ ...explorerRowsOptions(search), placeholderData: keepPreviousData })
  const meta = schema.tables[search.table]
  const writable = meta && !meta.view && meta.pk.length > 0
  const [draft, setDraft] = useState<RowDraft | null>(null)
  const save = useSaveRow(search.table)
  const remove = useDeleteRow(search.table)
  const go = (p: Partial<ExplorerSearch>) => navigate({ search: (s) => ({ ...s, offset: 0, ...p }) })
  const keyOf = (r: Row) => Object.fromEntries(meta.pk.map((k) => [k, r[k]]))
  const newTemplate = () =>
    JSON.stringify(Object.fromEntries(meta.columns.filter((c) => !c.default).map((c) => [c.name, null])), null, 2)

  return (
    <>
      <PageHeader title="Data explorer">
        <NativeSelect
          aria-label="Table"
          value={search.table}
          onChange={(e) => (setDraft(null), go({ table: e.target.value, filter_col: undefined, filter_val: undefined }))}
        >
          <Options options={Object.entries(schema.tables).map(([name, t]) => [name, t.view ? `${name} (view)` : name] as const)} />
        </NativeSelect>
        <NativeSelect aria-label="Filter column" value={search.filter_col ?? ''} onChange={(e) => go({ filter_col: e.target.value || undefined })}>
          <Options placeholder="Filter column…" options={meta?.columns.map((c) => c.name) ?? []} />
        </NativeSelect>
        {search.filter_col && (
          <Input
            className="w-40"
            placeholder="contains…"
            defaultValue={search.filter_val}
            onKeyDown={(e) => e.key === 'Enter' && go({ filter_val: e.currentTarget.value })}
          />
        )}
        {writable && <Button onClick={() => setDraft({ key: null, text: newTemplate() })}>New row</Button>}
      </PageHeader>

      {draft && (
        <RowEditor
          table={search.table}
          meta={meta}
          draft={draft}
          onChange={setDraft}
          onSave={() => save.mutate(draft, { onSuccess: () => setDraft(null) })}
          onCancel={() => setDraft(null)}
          pending={save.isPending}
          error={save.error}
        />
      )}

      <ErrorText error={error ?? remove.error} />
      <Card className="gap-0 py-0">
        <DataTable
          rows={(data?.rows ?? []) as Row[]}
          actions={
            writable
              ? (r) => (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const body = Object.fromEntries(Object.entries(r).filter(([k]) => !meta.pk.includes(k)))
                        setDraft({ key: keyOf(r), text: JSON.stringify(body, null, 2) })
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => window.confirm('Delete this row?') && remove.mutate(keyOf(r))}
                    >
                      Delete
                    </Button>
                  </>
                )
              : undefined
          }
        />
        <Pager offset={search.offset} limit={EXPLORER_PAGE_SIZE} total={data?.total ?? 0} onChange={(offset) => go({ offset })} />
      </Card>
    </>
  )
}
