import { useSuspenseQuery } from '@tanstack/react-query'
import { accountLabel, accountsOptions } from '@/features/accounts'
import { BarList } from '@/shared/components/common/BarList'
import { DataTable } from '@/shared/components/common/DataTable'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { Sounding } from '@/shared/components/common/Sounding'
import { Card } from '@/shared/components/ui/card'
import { prettyDay } from '@/shared/lib/format'
import { revenueOptions, totalsByCurrency } from '../api/queries'

export function EarningsPage() {
  const { data: rows } = useSuspenseQuery(revenueOptions)
  const { data: accounts } = useSuspenseQuery(accountsOptions)
  if (!rows.length)
    return (
      <>
        <PageHeader title="Earnings" />
        <Card className="py-0">
          <EmptyState title="No earnings saved yet">
            File import does not cover earnings yet. Ask your agent to record them with the <code className="font-mono">sync_revenue</code> tool.
          </EmptyState>
        </Card>
      </>
    )
  return (
    <>
      <PageHeader title="Earnings" description="What each source paid. Currencies stay separate, and estimates are marked." />
      <div className="grid gap-4 md:grid-cols-2">
        {totalsByCurrency(rows).map((t) => (
          <Card key={t.currency} className="gap-3 px-5 py-4">
            <h2 className="text-sm font-medium">By source, {t.currency}</h2>
            <BarList items={t.items} />
          </Card>
        ))}
      </div>
      <h2 className="mt-10 mb-3 text-sm font-medium">Every period</h2>
      <Card className="py-0">
        <DataTable
          rows={rows}
          columns={[
            { key: 'period_start', label: 'From', render: (r) => <span className="font-mono">{prettyDay(r.period_start)}</span> },
            { key: 'period_end', label: 'To', render: (r) => <span className="font-mono">{prettyDay(r.period_end)}</span> },
            {
              key: 'account_id',
              label: 'Account',
              render: (r) => {
                const a = accounts.rows.find((x) => x.accountId === r.account_id)
                return a ? accountLabel(a) : '—'
              },
            },
            { key: 'revenue_source', label: 'Source' },
            { key: 'value', label: 'Amount', align: 'right', render: (r) => <Sounding value={r.value} full /> },
            { key: 'currency', label: 'Currency', render: (r) => r.currency ?? '—' },
            { key: 'is_estimated', label: 'Status', render: (r) => (r.is_estimated ? 'Estimated' : 'Final') },
          ]}
        />
      </Card>
    </>
  )
}
