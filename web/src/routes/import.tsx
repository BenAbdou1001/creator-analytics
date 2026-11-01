import { createFileRoute } from '@tanstack/react-router'
import { accountsOptions } from '@/features/accounts'
import { ImportsPage } from '@/features/imports'
import { schemaOptions } from '@/shared/lib/tables'
import { pageTitle } from '@/shared/lib/brand'

export const Route = createFileRoute('/import')({
  head: () => pageTitle('Bring in data'),
  loader: ({ context: { queryClient } }) =>
    Promise.all([queryClient.ensureQueryData(accountsOptions), queryClient.ensureQueryData(schemaOptions)]),
  component: ImportsPage,
})
