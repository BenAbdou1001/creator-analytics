import { createFileRoute } from '@tanstack/react-router'
import { MetricsPage, metricDefinitionsOptions, validateMetricSearch } from '@/features/metrics'
import { schemaOptions } from '@/shared/lib/tables'

export const Route = createFileRoute('/metrics')({
  validateSearch: validateMetricSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    Promise.all([
      queryClient.ensureQueryData(metricDefinitionsOptions(deps)),
      queryClient.ensureQueryData(schemaOptions),
    ]),
  component: MetricsPage,
})
