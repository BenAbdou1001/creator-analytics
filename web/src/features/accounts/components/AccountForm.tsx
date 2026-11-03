import { useSuspenseQuery } from '@tanstack/react-query'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { CheckField, Field, FormActions, FormGrid } from '@/shared/components/common/Field'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { humanOptions, platformOptions } from '@/shared/lib/format'
import { schemaOptions } from '@/shared/lib/tables'
import type { AccountInput } from '../types'

export const EMPTY_ACCOUNT: AccountInput = {
  platform: 'youtube',
  accountType: 'channel',
  handle: '',
  displayName: '',
  profileUrl: '',
  externalId: '',
  isMonetized: false,
}

const TEXT_FIELDS = [
  ['handle', 'Handle *'],
  ['displayName', 'Display name'],
  ['profileUrl', 'Profile URL'],
  ['externalId', 'Channel / member ID'],
] as const

export function AccountForm({ value, onChange, editing, pending, error, onSubmit, onCancel }: {
  value: AccountInput
  onChange: (v: AccountInput) => void
  editing: boolean
  pending: boolean
  error: unknown
  onSubmit: () => void
  onCancel: () => void
}) {
  const { data: schema } = useSuspenseQuery(schemaOptions)
  const set = <K extends keyof AccountInput>(k: K, v: AccountInput[K]) => onChange({ ...value, [k]: v })

  return (
    <Card className="mb-6">
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          <FormGrid>
            <Field label="Platform">
              <Select className="w-full" value={value.platform} onValueChange={(v) => set('platform', v as AccountInput['platform'])} options={platformOptions(schema.enums.platform_t)} />
            </Field>
            <Field label="Account type">
              <Select className="w-full" value={value.accountType} onValueChange={(v) => set('accountType', v)} options={humanOptions(schema.enums.account_type_t)} />
            </Field>
            {TEXT_FIELDS.map(([k, label]) => (
              <Field key={k} label={label}>
                <Input required={k === 'handle'} value={value[k]} onChange={(e) => set(k, e.target.value)} />
              </Field>
            ))}
            <CheckField label="Monetized" checked={value.isMonetized} onChange={(v) => set('isMonetized', v)} />
          </FormGrid>
          <FormActions>
            <Button disabled={pending}>{editing ? 'Save changes' : 'Add account'}</Button>
            {editing && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <ErrorText error={error} />
          </FormActions>
        </form>
      </CardContent>
    </Card>
  )
}
