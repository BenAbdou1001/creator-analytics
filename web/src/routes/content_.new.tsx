import { createFileRoute } from '@tanstack/react-router'
import { accountsOptions } from '@/features/accounts'
import { PostForm, contentBriefsOptions, contentRowOptions, validateNewPostSearch } from '@/features/content'
import { schemaOptions } from '@/shared/lib/tables'
import { pageTitle } from '@/shared/lib/brand'

export const Route = createFileRoute('/content_/new')({
  head: () => pageTitle('New post'),
  validateSearch: validateNewPostSearch,
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(contentRowOptions(0)),
      queryClient.ensureQueryData(contentBriefsOptions(0)),
      queryClient.ensureQueryData(accountsOptions),
      queryClient.ensureQueryData(schemaOptions),
    ]),
  component: function NewPost() {
    const { plan, date } = Route.useSearch()
    return <PostForm key={`${plan}-${date}`} plan={plan} date={date} />
  },
})
