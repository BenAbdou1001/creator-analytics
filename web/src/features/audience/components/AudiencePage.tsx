import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { accountLabel, accountsOptions } from '@/features/accounts'
import { metricDefinitionsOptions } from '@/features/metrics'
import { BarList } from '@/shared/components/common/BarList'
import { DataTable } from '@/shared/components/common/DataTable'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { Options } from '@/shared/components/common/Options'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { NativeSelect } from '@/shared/components/ui/native-select'
import { humanize, prettyDay } from '@/shared/lib/format'
import { breakdownsOptions, unfollowsOptions } from '../api/queries'

const route = getRouteApi('/audience')

export function AudiencePage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data: accounts } = useSuspenseQuery(accountsOptions)
  const account = accounts.rows.find((a) => a.accountId === search.account) ?? accounts.rows[0]
  const id = account?.accountId ?? 0
  const breakdowns = useQuery({ ...breakdownsOptions(id), enabled: !!account })
  const unfollows = useQuery({ ...unfollowsOptions(id), enabled: !!account })
  const definitions = useQuery(metricDefinitionsOptions({ scope: 'audience' }))

  if (!account)
    return (
      <>
        <PageHeader title="Audience" />
        <Card className="py-0">
          <EmptyState title="Add an account first" action={<Button asChild><Link to="/accounts">Add an account</Link></Button>} />
        </Card>
      </>
    )

  const sets = [...new Set((breakdowns.data ?? []).map((b) => b.metricId))]
  const metricId = sets.includes(search.metric ?? -1) ? search.metric : sets[0]
  const shown = (breakdowns.data ?? []).filter((b) => b.metricId === metricId)
  const metric = (m: number) => definitions.data?.rows.find((d) => d.metricId === m)
  const percent = metric(metricId ?? -1)?.unit === 'percent'

  return (
    <>
      <PageHeader title="Audience" description="Who follows you and who sees your posts, as of your latest import.">
        <NativeSelect aria-label="Account" value={String(id)} onChange={(e) => navigate({ search: { account: Number(e.target.value) } })}>
          <Options options={accounts.rows.map((a) => [String(a.accountId), accountLabel(a)] as const)} />
        </NativeSelect>
        {sets.length > 1 && (
          <NativeSelect aria-label="Group" value={String(metricId)} onChange={(e) => navigate({ search: (s) => ({ ...s, metric: Number(e.target.value) }) })}>
            <Options options={sets.map((m) => [String(m), metric(m)?.label ?? `Metric ${m}`] as const)} />
          </NativeSelect>
        )}
      </PageHeader>

      {shown.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((b) => (
            <Card key={b.dimension} className="gap-3 p-5">
              <h2 className="text-sm font-semibold">{humanize(b.dimension)}</h2>
              <BarList items={b.items} suffix={percent ? '%' : undefined} />
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-0">
          <EmptyState title="No audience breakdown saved for this account">
            LinkedIn’s analytics export includes one. Other platforms can add theirs through your agent.
          </EmptyState>
        </Card>
      )}

      <h2 className="mt-10 mb-3 text-sm font-semibold">People who left</h2>
      <Card className="py-0">
        <DataTable
          rows={unfollows.data ?? []}
          empty="Nobody yet. This fills in once two follower lists have been synced and someone is missing from the newer one."
          columns={[
            { key: 'handle', label: 'Person', render: (r) => <span dir="auto">{r.display_name ?? `@${r.handle}`}</span> },
            { key: 'relation', label: 'Was', render: (r) => humanize(r.relation) },
            { key: 'first_observed_at', label: 'First seen', render: (r) => <span className="tabular-nums">{prettyDay(r.first_observed_at)}</span> },
            { key: 'ended_inferred_at', label: 'Gone by', render: (r) => <span className="tabular-nums">{prettyDay(r.ended_inferred_at)}</span> },
          ]}
        />
      </Card>
    </>
  )
}
