import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { accountsOptions } from '@/features/accounts'
import { CoverageList } from '@/features/dashboard'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { ImportForm } from './ImportForm'
import { ImportHistory } from './ImportHistory'

const DESCRIPTION = 'Export from the platform, drop the file here, and check what will be saved before anything changes.'

export function ImportsPage() {
  const {
    data: { rows: accounts },
  } = useSuspenseQuery(accountsOptions)
  const [picked, setPicked] = useState<number | null>(null)
  if (!accounts.length)
    return (
      <>
        <PageHeader title="Bring in data" description={DESCRIPTION} />
        <Card className="py-0">
          <EmptyState
            title="Add an account first"
            action={
              <Button asChild>
                <Link to="/accounts">Add an account</Link>
              </Button>
            }
          >
            Every import belongs to one account.
          </EmptyState>
        </Card>
      </>
    )
  const accountId = picked ?? accounts[0].accountId
  return (
    <>
      <PageHeader title="Bring in data" description={DESCRIPTION} />
      <ImportForm accounts={accounts} accountId={accountId} onAccount={setPicked} />
      <CoverageList accountId={accountId} />
      <h2 className="mt-10 mb-3 text-sm font-medium">Recent imports</h2>
      <ImportHistory accounts={accounts} />
    </>
  )
}
