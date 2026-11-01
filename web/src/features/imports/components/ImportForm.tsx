import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { accountLabel } from '@/features/accounts'
import type { Account } from '@/features/accounts'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { Field } from '@/shared/components/common/Field'
import { Options } from '@/shared/components/common/Options'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { NativeSelect } from '@/shared/components/ui/native-select'
import { schemaOptions } from '@/shared/lib/tables'
import { useImportFile } from '../api/mutations'
import type { ImportKind } from '../types'
import { ImportSummary } from './ImportSummary'

export function ImportForm({ accounts }: { accounts: Account[] }) {
  const { data: schema } = useSuspenseQuery(schemaOptions)
  const [kind, setKind] = useState<ImportKind>('content')
  const upload = useImportFile()

  return (
    <Card>
      <CardContent>
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault()
            const form = new FormData(e.currentTarget)
            upload.mutate({
              accountId: Number(form.get('accountId')),
              kind,
              defaultContentType: (form.get('defaultContentType') as string | null) ?? undefined,
              periodKind: (form.get('periodKind') as string | null) ?? undefined,
              file: form.get('file') as File,
            })
          }}
        >
          <Field label="Account">
            <NativeSelect name="accountId" className="w-full">
              <Options options={accounts.map((a) => [String(a.accountId), accountLabel(a)] as const)} />
            </NativeSelect>
          </Field>
          <Field label="File contains">
            <NativeSelect className="w-full" value={kind} onChange={(e) => setKind(e.target.value as ImportKind)}>
              <Options
                options={[
                  ['content', 'One row per post / video'],
                  ['account_metrics', 'One row per date (chart export)'],
                ]}
              />
            </NativeSelect>
          </Field>
          {kind === 'content' ? (
            <Field label="Content type (if no type column)">
              <NativeSelect name="defaultContentType" className="w-full" defaultValue="video">
                <Options options={schema.enums.content_type_t} />
              </NativeSelect>
            </Field>
          ) : (
            <Field label="Each row is a">
              <NativeSelect name="periodKind" className="w-full" defaultValue="day">
                <Options options={['day', 'week', 'month', 'year']} />
              </NativeSelect>
            </Field>
          )}
          <Field label="CSV or LinkedIn .xlsx export" className="sm:col-span-2">
            <Input type="file" name="file" accept=".csv,text/csv,.xlsx" required />
          </Field>
          <div className="flex items-end">
            <Button disabled={upload.isPending}>{upload.isPending ? 'Importing…' : 'Import'}</Button>
          </div>
          <div className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            <ErrorText error={upload.error} />
            {upload.data && <ImportSummary result={upload.data} />}
            <p className="mt-2">
              Column headers are matched to the metric catalogue by key or by the label shown in the platform’s dashboard
              (e.g. “Views”, “Watch time (hours)”). Post files need an id column (Content, Video ID, Post ID…); chart
              files need a Date column. “Total” rows are skipped. LinkedIn’s Analytics → Export .xlsx is detected
              automatically.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
