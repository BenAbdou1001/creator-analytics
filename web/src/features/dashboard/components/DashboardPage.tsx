import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ContentTable, topContentOptions } from '@/features/content'
import { overviewOptions } from '../api/queries'
import { AccountCards } from './AccountCards'
import { StatTiles } from './StatTiles'
import { TrendCard } from './TrendCard'

export function DashboardPage() {
  const { data: accounts } = useSuspenseQuery(overviewOptions)
  const { data: top } = useSuspenseQuery(topContentOptions)

  if (!accounts.length)
    return (
      <>
        <PageHeader title="Dashboard" />
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">
              No accounts yet. Add your YouTube, TikTok, Instagram and LinkedIn accounts to start.
            </p>
            <Button asChild className="mt-4">
              <Link to="/accounts">Add an account</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    )

  return (
    <>
      <PageHeader title="Dashboard" />
      <StatTiles accounts={accounts} />
      <h2 className="mt-10 mb-3 text-sm font-semibold">Accounts</h2>
      <AccountCards accounts={accounts} />
      <h2 className="mt-10 mb-3 text-sm font-semibold">Daily trend</h2>
      <TrendCard accounts={accounts} />
      <h2 className="mt-10 mb-3 text-sm font-semibold">Top content by engagement</h2>
      <Card className="py-0">
        <ContentTable rows={top.rows} compact empty="No content yet — import a file or sync via MCP." />
      </Card>
    </>
  )
}
