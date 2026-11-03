import { keepPreviousData, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog'
import { DataTable } from '@/shared/components/common/DataTable'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { Pager } from '@/shared/components/common/Pager'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { FILTER_WIDTH } from '@/shared/components/common/Field'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { schemaOptions } from '@/shared/lib/tables'
import type { Row } from '@/shared/types'
import { useDeleteRow, useSaveRow } from '../api/mutations'
import { EXPLORER_PAGE_SIZE, explorerRowsOptions } from '../api/queries'
import { formValues } from '@/shared/lib/row-form'
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
  const [deleting, setDeleting] = useState<Row | null>(null)
  const save = useSaveRow(search.table, meta, schema.enums)
  const remove = useDeleteRow(search.table)
  const go = (p: Partial<ExplorerSearch>) => navigate({ search: (s) => ({ ...s, offset: 0, ...p }) })
  const keyOf = (r: Row) => Object.fromEntries(meta.pk.map((k) => [k, r[k]]))
  const startDraft = (row: Row | null) => {
    const values = formValues(meta.columns, schema.enums, meta.pk, row)
    save.reset()
    setDraft({ key: row && keyOf(row), values, initial: row && values })
  }

  return (
    <>
      <PageHeader title="Data" description="Everything as stored. Changes here take effect immediately, with no undo.">
        <Select
          aria-label="Table"
          value={search.table}
          onValueChange={(v) => (setDraft(null), go({ table: v, filter_col: undefined, filter_val: undefined }))} options={Object.entries(schema.tables).map(([name, t]) => [name, t.view ? `${name} (view)` : name] as const)} />
        <Select aria-label="Filter column" value={search.filter_col ?? ''} onValueChange={(v) => go({ filter_col: v || undefined })} placeholder="Filter by column" options={meta?.columns.map((c) => c.name) ?? []} />
        {search.filter_col && (
          <Input
            className={FILTER_WIDTH}
            aria-label="Filter value" placeholder="Contains"
            defaultValue={search.filter_val}
            onKeyDown={(e) => e.key === 'Enter' && go({ filter_val: e.currentTarget.value })}
          />
        )}
        {writable && <Button onClick={() => startDraft(null)}>New row</Button>}
      </PageHeader>

      {draft && (
        <RowEditor
          table={search.table}
          meta={meta}
          enums={schema.enums}
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
                      onClick={() => startDraft(r)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setDeleting(r)}
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
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this row?"
        action="Delete row"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) remove.mutate(keyOf(deleting))
          setDeleting(null)
        }}
      >
        Rows that depend on it may be deleted too. This cannot be undone.
      </ConfirmDialog>
    </>
  )
}
