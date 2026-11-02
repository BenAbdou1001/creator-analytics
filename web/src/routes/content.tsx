import { createFileRoute } from '@tanstack/react-router'
import { ContentPage, contentListOptions, validateContentSearch } from '@/features/content'
import { accountsOptions } from '@/features/accounts'
import { schemaOptions } from '@/shared/lib/tables'
import { pageTitle } from '@/shared/lib/brand'

export const Route = createFileRoute('/content')({
  head: () => pageTitle('Posts'),
  validateSearch: validateContentSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    Promise.all([
      queryClient.ensureQueryData(contentListOptions(deps)),
      queryClient.ensureQueryData(accountsOptions),
      queryClient.ensureQueryData(schemaOptions),
    ]),
  component: ContentPage,
})
