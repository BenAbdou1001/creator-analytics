import { ErrorText } from '@/shared/components/common/ErrorText'
import { CheckField, Field, FormActions, FormGrid } from '@/shared/components/common/Field'
import { FieldControl, WIDE } from '@/shared/components/common/FieldControl'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import type { TableMeta } from '@/shared/types'
import { fieldKind } from '@/shared/lib/row-form'
import type { FieldValue } from '@/shared/lib/row-form'
import type { RowDraft } from '../types'

export function RowEditor({ table, meta, enums, draft, onChange, onSave, onCancel, pending, error }: {
  table: string
  meta: TableMeta
  enums: Record<string, string[]>
  draft: RowDraft
  onChange: (d: RowDraft) => void
  onSave: () => void
  onCancel: () => void
  pending: boolean
  error: unknown
}) {
  const columns = meta.columns.filter((c) => c.name in draft.values)
  const keyLabel = draft.key && Object.entries(draft.key).map(([k, v]) => `${k} ${v}`).join(', ')

  return (
    <Card className="mb-6">
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSave()
          }}
        >
          <div className="text-sm font-semibold">{keyLabel ? `Edit ${table} · ${keyLabel}` : `New ${table} row`}</div>
          <FormGrid>
            {columns.map((col) => {
              const kind = fieldKind(col, enums)
              const set = (v: FieldValue) => onChange({ ...draft, values: { ...draft.values, [col.name]: v } })
              if (kind === 'flag') return <CheckField key={col.name} label={col.name} checked={draft.values[col.name] as boolean} onChange={set} />
              return (
                <Field
                  key={col.name}
                  label={`${col.name}${col.required && !col.default ? ' *' : ''}`}
                  className={WIDE.includes(kind) ? 'sm:col-span-2 lg:col-span-3' : undefined}
                >
                  <FieldControl col={col} kind={kind} options={enums[col.type.replace('[]', '')] ?? []} value={draft.values[col.name]} onChange={set} />
                </Field>
              )
            })}
          </FormGrid>
          <FormActions>
            <Button disabled={pending}>{draft.key ? 'Save changes' : 'Add row'}</Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <ErrorText error={error} />
          </FormActions>
        </form>
      </CardContent>
    </Card>
  )
}
