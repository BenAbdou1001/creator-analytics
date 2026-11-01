import { useSuspenseQuery } from '@tanstack/react-query'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { Field } from '@/shared/components/common/Field'
import { Options } from '@/shared/components/common/Options'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { NativeSelect } from '@/shared/components/ui/native-select'
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
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          <Field label="Platform">
            <NativeSelect className="w-full" value={value.platform} onChange={(e) => set('platform', e.target.value as AccountInput['platform'])}>
              <Options options={platformOptions(schema.enums.platform_t)} />
            </NativeSelect>
          </Field>
          <Field label="Account type">
            <NativeSelect className="w-full" value={value.accountType} onChange={(e) => set('accountType', e.target.value)}>
              <Options options={humanOptions(schema.enums.account_type_t)} />
            </NativeSelect>
          </Field>
          {TEXT_FIELDS.map(([k, label]) => (
            <Field key={k} label={label}>
              <Input required={k === 'handle'} value={value[k]} onChange={(e) => set(k, e.target.value)} />
            </Field>
          ))}
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" className="size-4 accent-(--deep)" checked={value.isMonetized} onChange={(e) => set('isMonetized', e.target.checked)} />
            Monetized
          </label>
          <div className="flex items-end gap-2">
            <Button disabled={pending}>{editing ? 'Save changes' : 'Add account'}</Button>
            {editing && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <ErrorText error={error} />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
