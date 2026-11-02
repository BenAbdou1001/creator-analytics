import { createFileRoute } from '@tanstack/react-router'
import { topContentOptions } from '@/features/content'
import { DashboardPage, expiringOptions, overviewOptions, validateTodaySearch } from '@/features/dashboard'
import { pageTitle } from '@/shared/lib/brand'

export const Route = createFileRoute('/')({
  head: () => pageTitle('Dashboard'),
  validateSearch: validateTodaySearch,
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(overviewOptions),
      queryClient.ensureQueryData(topContentOptions),
      queryClient.ensureQueryData(expiringOptions),
    ]),
  component: DashboardPage,
})
