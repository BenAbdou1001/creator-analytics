import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ContentTable, topContentOptions } from '@/features/content'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { BRAND } from '@/shared/lib/brand'
import { expiringOptions, overviewOptions } from '../api/queries'
import { AccountRows } from './AccountRows'
import { LastSaved } from './LastSaved'
import { StatTiles } from './StatTiles'
import { ExpiryPanel } from './ExpiryPanel'
import { TrendCard } from './TrendCard'

function FirstRun() {
  return (
    <Card className="p-6">
      <h2 className="font-semibold">Start keeping your numbers</h2>
      <ol className="mt-3 grid max-w-prose list-inside list-decimal gap-1 text-sm text-muted-foreground">
        <li>Add the account you want to keep.</li>
        <li>Export your analytics from the platform.</li>
        <li>Import the file. {BRAND} then shows what is saved and what expires next.</li>
      </ol>
      <Button asChild className="mt-4 w-fit">
        <Link to="/accounts">Add an account</Link>
      </Button>
    </Card>
  )
}

export function DashboardPage() {
  const { data: accounts } = useSuspenseQuery(overviewOptions)
  const { data: top } = useSuspenseQuery(topContentOptions)
  const { data: expiring } = useSuspenseQuery(expiringOptions)

  if (!accounts.length)
    return (
      <>
        <PageHeader title="Dashboard" />
        <FirstRun />
      </>
    )

  return (
    <>
      <PageHeader title="Dashboard">
        <LastSaved />
      </PageHeader>
      <div className="grid gap-4">
        <StatTiles accounts={accounts} />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <ExpiryPanel metrics={expiring} />
          <TrendCard accounts={accounts} saved={expiring} />
        </div>
      </div>
      <h2 className="mt-8 mb-3 font-semibold">Accounts</h2>
      <AccountRows accounts={accounts} />
      <h2 className="mt-8 mb-3 font-semibold">Top posts by engagement</h2>
      <Card className="py-0">
        <ContentTable rows={top.rows} compact empty="No posts yet. Import an export or sync through your agent." />
      </Card>
    </>
  )
}
