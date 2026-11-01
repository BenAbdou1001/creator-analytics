import { createFileRoute } from '@tanstack/react-router'
import { accountsOptions } from '@/features/accounts'
import { AudiencePage, validateAudienceSearch } from '@/features/audience'
import { pageTitle } from '@/shared/lib/brand'

export const Route = createFileRoute('/audience')({
  head: () => pageTitle('Audience'),
  validateSearch: validateAudienceSearch,
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(accountsOptions),
  component: AudiencePage,
})
