import { useSuspenseQuery } from '@tanstack/react-query'
import { FileUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { accountLabel } from '@/features/accounts'
import type { Account } from '@/features/accounts'
import { BriefQueue } from '@/features/content'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { Disclosure } from '@/shared/components/common/Disclosure'
import { Field, FormActions, FormGrid } from '@/shared/components/common/Field'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Select } from '@/shared/components/ui/select'
import { humanOptions, prettyDay } from '@/shared/lib/format'
import { schemaOptions } from '@/shared/lib/tables'
import { cn } from '@/shared/lib/utils'
import { useImportFile, usePreviewImport } from '../api/mutations'
import type { ImportKind } from '../types'
import { ImportSummary, resultLine } from './ImportSummary'

const SHAPE = { content: 'One row per post', account_metrics: 'One row per date', linkedin_xlsx: 'LinkedIn analytics export' }

export function ImportForm({ accounts, accountId, onAccount }: { accounts: Account[]; accountId: number; onAccount: (id: number) => void }) {
  const { data: schema } = useSuspenseQuery(schemaOptions)
  const [file, setFile] = useState<File | null>(null)
  const [kind, setKind] = useState<ImportKind>('auto')
  const [contentType, setContentType] = useState('video')
  const [periodKind, setPeriodKind] = useState('day')
  const [dragging, setDragging] = useState(false)
  const [done, setDone] = useState('')
  const preview = usePreviewImport()
  const upload = useImportFile()
  const { mutate: runPreview, reset: resetPreview } = preview

  const input = file && { accountId, kind, defaultContentType: contentType, periodKind, file }
  // choosing a file, or changing how to read it, re-runs the dry run
  useEffect(() => {
    if (file) runPreview({ accountId, kind, defaultContentType: contentType, periodKind, file })
    else resetPreview()
  }, [file, accountId, kind, contentType, periodKind, runPreview, resetPreview])

  const unknown = preview.data?.result.unknownMetrics ?? preview.data?.result.accountMetrics?.unknownMetrics ?? []
  const range = preview.data?.result.accountMetrics ?? preview.data?.result

  const choose = (f: File | null | undefined) => {
    upload.reset()
    setDone('')
    setFile(f ?? null)
  }

  return (
    <Card>
      <CardContent className="grid gap-4">
        <FormGrid>
          <Field label="Account">
            <Select className="w-full" value={String(accountId)} onValueChange={(v) => onAccount(Number(v))} options={accounts.map((a) => [String(a.accountId), accountLabel(a)] as const)} />
          </Field>
        </FormGrid>

        <label
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input px-5 py-8 text-sm transition-colors hover:bg-muted has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
            dragging && 'bg-accent',
          )}
          onDragOver={(e) => (e.preventDefault(), setDragging(true))}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            choose(e.dataTransfer.files[0])
          }}
        >
          <FileUp className="size-4 text-muted-foreground" aria-hidden="true" />
          <span>
            <span className="font-medium">{file ? file.name : 'Drop an export here, or choose a file'}</span>
            <span className="block text-muted-foreground">CSV from any platform, or LinkedIn’s .xlsx</span>
          </span>
          <input
            type="file"
            className="sr-only"
            accept=".csv,text/csv,.xlsx"
            onChange={(e) => {
              choose(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>

        <Disclosure label="File options">
          <FormGrid className="mt-3">
            <Field label="Read this file as">
              <Select className="w-full" value={kind} onValueChange={(v) => setKind(v as ImportKind)} options={[['auto', 'Detect it'], ['content', 'One row per post'], ['account_metrics', 'One row per date']]} />
            </Field>
            <Field label="Post type, if the file has none">
              <Select className="w-full" value={contentType} onValueChange={(v) => setContentType(v)} options={humanOptions(schema.enums.content_type_t)} />
            </Field>
            <Field label="Each dated row covers a">
              <Select className="w-full" value={periodKind} onValueChange={(v) => setPeriodKind(v)} options={humanOptions(['day', 'week', 'month', 'year'])} />
            </Field>
          </FormGrid>
        </Disclosure>

        <ErrorText error={preview.error ?? upload.error} />
        {preview.isPending && <p className="text-sm text-muted-foreground">Reading {file?.name}</p>}
        {done && <ImportSummary result={upload.data!} fileName={done} />}
        {done && <BriefQueue accountId={accountId} />}

        {preview.data && file && !done && (
          <div className="grid gap-1 rounded-md bg-muted px-4 py-3 text-sm">
            <p className="font-medium">{resultLine(preview.data.result, 'will be saved')}</p>
            <p className="text-muted-foreground">
              {SHAPE[preview.data.kind]}
              {range?.rangeStart && `, ${prettyDay(range.rangeStart)} to ${prettyDay(range.rangeEnd ?? range.rangeStart)}`}
            </p>
            {unknown.length > 0 && (
              <p className="text-muted-foreground">
                {unknown.length} {unknown.length === 1 ? 'column' : 'columns'} not recognised and skipped: {unknown.join(', ')}
              </p>
            )}
            {preview.data.alreadyImportedAt && (
              <p className="text-muted-foreground">
                You imported this exact file on {prettyDay(preview.data.alreadyImportedAt)}. Importing it again adds a new snapshot.
              </p>
            )}
            <FormActions className="mt-2">
              <Button
                disabled={upload.isPending}
                onClick={() => input && upload.mutate(input, { onSuccess: () => (setDone(file.name), setFile(null)) })}
              >
                {upload.isPending ? 'Importing' : 'Import file'}
              </Button>
              <Button variant="ghost" onClick={() => choose(null)}>
                Cancel
              </Button>
            </FormActions>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
