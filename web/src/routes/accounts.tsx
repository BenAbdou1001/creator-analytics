import { createFileRoute } from '@tanstack/react-router'
import { AccountsPage, accountsOptions } from '@/features/accounts'
import { schemaOptions } from '@/shared/lib/tables'
import { pageTitle } from '@/shared/lib/brand'

export const Route = createFileRoute('/accounts')({
  head: () => pageTitle('Accounts'),
  loader: ({ context: { queryClient } }) =>
    Promise.all([queryClient.ensureQueryData(accountsOptions), queryClient.ensureQueryData(schemaOptions)]),
  component: AccountsPage,
})
