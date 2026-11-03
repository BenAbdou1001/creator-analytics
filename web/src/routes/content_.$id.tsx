import { createFileRoute } from '@tanstack/react-router'
import { PostPage, contentBriefsOptions, contentItemOptions, contentSummaryOptions, validatePostSearch } from '@/features/content'
import { schemaOptions } from '@/shared/lib/tables'
import { pageTitle } from '@/shared/lib/brand'

export const Route = createFileRoute('/content_/$id')({
  head: () => pageTitle('Post'),
  validateSearch: validatePostSearch,
  loader: ({ context: { queryClient }, params }) =>
    Promise.all([
      queryClient.ensureQueryData(contentSummaryOptions(Number(params.id))),
      queryClient.ensureQueryData(contentItemOptions(Number(params.id))),
      queryClient.ensureQueryData(contentBriefsOptions(Number(params.id))),
      queryClient.ensureQueryData(schemaOptions),
    ]),
  component: function Post() {
    const { id } = Route.useParams()
    const { brief } = Route.useSearch()
    return <PostPage id={Number(id)} briefId={brief} />
  },
})
