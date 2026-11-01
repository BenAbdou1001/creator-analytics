import { useQuery } from '@tanstack/react-query'
import { accountLabel } from '@/features/accounts'
import type { Account } from '@/features/accounts'
import { DataTable } from '@/shared/components/common/DataTable'
import { Sounding } from '@/shared/components/common/Sounding'
import { Card } from '@/shared/components/ui/card'
import { prettyDay, sourceLabel } from '@/shared/lib/format'
import { importBatchesOptions } from '../api/queries'

export function ImportHistory({ accounts }: { accounts: Account[] }) {
  const batches = useQuery(importBatchesOptions)
  return (
    <Card className="py-0">
      <DataTable
        rows={batches.data?.rows ?? []}
        empty="Nothing imported yet."
        columns={[
          { key: 'fileName', label: 'File', render: (r) => r.fileName ?? r.sourceLabel },
          {
            key: 'accountId',
            label: 'Account',
            render: (r) => {
              const a = accounts.find((x) => x.accountId === r.accountId)
              return a ? accountLabel(a) : '—'
            },
          },
          { key: 'sourceKind', label: 'Source', render: (r) => sourceLabel(r.sourceKind) },
          { key: 'rowCount', label: 'Rows', align: 'right', render: (r) => <Sounding value={r.rowCount} /> },
          { key: 'importedAt', label: 'Imported', render: (r) => <span className="font-mono">{prettyDay(r.importedAt)}</span> },
        ]}
      />
    </Card>
  )
}
