import { createFileRoute } from '@tanstack/react-router'
import { accountsOptions } from '@/features/accounts'
import { EarningsPage, revenueOptions } from '@/features/earnings'
import { pageTitle } from '@/shared/lib/brand'

export const Route = createFileRoute('/earnings')({
  head: () => pageTitle('Earnings'),
  loader: ({ context: { queryClient } }) =>
    Promise.all([queryClient.ensureQueryData(revenueOptions), queryClient.ensureQueryData(accountsOptions)]),
  component: EarningsPage,
})
