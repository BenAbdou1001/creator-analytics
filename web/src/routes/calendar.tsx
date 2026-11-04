import { createFileRoute } from '@tanstack/react-router'
import { accountsOptions } from '@/features/accounts'
import { CalendarPage, validateCalendarSearch } from '@/features/content'
import { pageTitle } from '@/shared/lib/brand'

export const Route = createFileRoute('/calendar')({
  head: () => pageTitle('Calendar'),
  validateSearch: validateCalendarSearch,
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(accountsOptions),
  component: CalendarPage,
})
