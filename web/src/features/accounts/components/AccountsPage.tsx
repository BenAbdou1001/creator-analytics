import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { useDeleteAccount, useSaveAccount } from '../api/mutations'
import { toAccountInput } from '../api/mappers'
import { accountsOptions } from '../api/queries'
import type { Account, AccountInput } from '../types'
import { AccountForm, EMPTY_ACCOUNT } from './AccountForm'
import { AccountsTable } from './AccountsTable'

export function AccountsPage() {
  const { data } = useSuspenseQuery(accountsOptions)
  const [form, setForm] = useState<AccountInput>(EMPTY_ACCOUNT)
  const [editing, setEditing] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<Account | null>(null)
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
        onDelete={setDeleting}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={`Delete @${deleting?.handle}?`}
        action="Delete account"
        typeToConfirm={deleting?.handle}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.accountId)
          setDeleting(null)
        }}
      >
        This permanently deletes the account and every post, value and import saved for it. The platform may no longer have
        this history, so it may not be possible to get it back.
      </ConfirmDialog>
    </>
  )
}
