import { createFileRoute } from '@tanstack/react-router'
import { AccountsPage, accountsOptions } from '@/features/accounts'
import { schemaOptions } from '@/shared/lib/tables'

export const Route = createFileRoute('/accounts')({
  loader: ({ context: { queryClient } }) =>
    Promise.all([queryClient.ensureQueryData(accountsOptions), queryClient.ensureQueryData(schemaOptions)]),
  component: AccountsPage,
})
