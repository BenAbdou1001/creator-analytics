import { ErrorText } from '@/shared/components/common/ErrorText'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Textarea } from '@/shared/components/ui/textarea'
import type { TableMeta } from '@/shared/types'
import type { RowDraft } from '../types'

export function RowEditor({ table, meta, draft, onChange, onSave, onCancel, pending, error }: {
  table: string
  meta: TableMeta
  draft: RowDraft
  onChange: (d: RowDraft) => void
  onSave: () => void
  onCancel: () => void
  pending: boolean
  error: unknown
}) {
  return (
    <Card className="mb-6">
      <CardContent>
        <div className="mb-2 text-sm font-medium">
          {draft.key ? `Edit ${table} ${JSON.stringify(draft.key)}` : `New ${table} row`}
        </div>
        <Textarea
          aria-label="Row JSON"
          className="h-64 font-mono text-xs"
          value={draft.text}
          onChange={(e) => onChange({ ...draft, text: e.target.value })}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Columns: {meta.columns.map((c) => `${c.name}: ${c.type}${c.required && !c.default ? ' *' : ''}`).join(' · ')}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Button disabled={pending} onClick={onSave}>
            Save
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <ErrorText error={error} />
        </div>
      </CardContent>
    </Card>
  )
}
