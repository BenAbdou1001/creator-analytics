import { createFileRoute } from '@tanstack/react-router'
import { accountsOptions } from '@/features/accounts'
import { PostForm, contentBriefsOptions, contentRowOptions, validatePostEditSearch } from '@/features/content'
import { schemaOptions } from '@/shared/lib/tables'
import { pageTitle } from '@/shared/lib/brand'

export const Route = createFileRoute('/content_/$id_/edit')({
  head: () => pageTitle('Edit post'),
  validateSearch: validatePostEditSearch,
  loader: ({ context: { queryClient }, params }) =>
    Promise.all([
      queryClient.ensureQueryData(contentRowOptions(Number(params.id))),
      queryClient.ensureQueryData(contentBriefsOptions(Number(params.id))),
      queryClient.ensureQueryData(accountsOptions),
      queryClient.ensureQueryData(schemaOptions),
    ]),
  component: function EditPost() {
    const { id } = Route.useParams()
    const { version } = Route.useSearch()
    // keyed so switching the brief version starts the form from that version
    return <PostForm key={`${id}-${version}`} id={Number(id)} version={version} />
  },
})
