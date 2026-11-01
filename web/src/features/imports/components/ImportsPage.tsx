import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { accountsOptions } from '@/features/accounts'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { ImportForm } from './ImportForm'
import { ImportHistory } from './ImportHistory'

export function ImportsPage() {
  const {
    data: { rows: accounts },
  } = useSuspenseQuery(accountsOptions)
  if (!accounts.length)
    return (
      <>
        <PageHeader title="Import" />
        <p className="text-muted-foreground">
          <Link to="/accounts" className="text-chart-1 hover:underline">
            Add an account
          </Link>{' '}
          before importing data.
        </p>
      </>
    )
  return (
    <>
      <PageHeader title="Import" />
      <ImportForm accounts={accounts} />
      <h2 className="mt-10 mb-3 text-sm font-semibold">Recent imports</h2>
      <ImportHistory accounts={accounts} />
    </>
  )
}
