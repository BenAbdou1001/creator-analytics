import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { useDeleteAccount, useSaveAccount } from '../api/mutations'
import { toAccountInput } from '../api/mappers'
import { accountsOptions } from '../api/queries'
import type { AccountInput } from '../types'
import { AccountForm, EMPTY_ACCOUNT } from './AccountForm'
import { AccountsTable } from './AccountsTable'

export function AccountsPage() {
  const { data } = useSuspenseQuery(accountsOptions)
  const [form, setForm] = useState<AccountInput>(EMPTY_ACCOUNT)
  const [editing, setEditing] = useState<number | null>(null)
  const save = useSaveAccount()
  const remove = useDeleteAccount()
  const reset = () => (setEditing(null), setForm(EMPTY_ACCOUNT))

  return (
    <>
      <PageHeader title="Accounts" />
      <AccountForm
        value={form}
        onChange={setForm}
        editing={editing !== null}
        pending={save.isPending}
        error={save.error ?? remove.error}
        onSubmit={() => save.mutate({ id: editing, input: form }, { onSuccess: reset })}
        onCancel={reset}
      />
      <AccountsTable
        rows={data.rows}
        onEdit={(a) => {
          setEditing(a.accountId)
          setForm(toAccountInput(a))
        }}
        onDelete={(a) => {
          if (window.confirm(`Delete @${a.handle} and all of its content, metrics and imports?`)) remove.mutate(a.accountId)
        }}
      />
    </>
  )
}
