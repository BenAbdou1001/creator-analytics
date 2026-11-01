import { createFileRoute } from '@tanstack/react-router'
import { topContentOptions } from '@/features/content'
import { DashboardPage, overviewOptions } from '@/features/dashboard'

export const Route = createFileRoute('/')({
  loader: ({ context: { queryClient } }) =>
    Promise.all([queryClient.ensureQueryData(overviewOptions), queryClient.ensureQueryData(topContentOptions)]),
  component: DashboardPage,
})
