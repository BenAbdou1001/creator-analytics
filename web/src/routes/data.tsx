import { createFileRoute } from '@tanstack/react-router'
import { ExplorerPage, explorerRowsOptions, validateExplorerSearch } from '@/features/explorer'
import { schemaOptions } from '@/shared/lib/tables'

export const Route = createFileRoute('/data')({
  validateSearch: validateExplorerSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    Promise.all([queryClient.ensureQueryData(schemaOptions), queryClient.ensureQueryData(explorerRowsOptions(deps))]),
  component: ExplorerPage,
})
