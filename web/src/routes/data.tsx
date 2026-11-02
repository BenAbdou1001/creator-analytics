import { createFileRoute } from '@tanstack/react-router'
import { ExplorerPage, explorerRowsOptions, validateExplorerSearch } from '@/features/explorer'
import { schemaOptions } from '@/shared/lib/tables'
import { pageTitle } from '@/shared/lib/brand'

export const Route = createFileRoute('/data')({
  head: () => pageTitle('Data'),
  validateSearch: validateExplorerSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    Promise.all([queryClient.ensureQueryData(schemaOptions), queryClient.ensureQueryData(explorerRowsOptions(deps))]),
  component: ExplorerPage,
})
