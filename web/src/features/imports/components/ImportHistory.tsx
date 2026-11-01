import { useQuery } from '@tanstack/react-query'
import { accountLabel } from '@/features/accounts'
import type { Account } from '@/features/accounts'
import { DataTable } from '@/shared/components/common/DataTable'
import { Card } from '@/shared/components/ui/card'
import { importBatchesOptions } from '../api/queries'

export function ImportHistory({ accounts }: { accounts: Account[] }) {
  const batches = useQuery(importBatchesOptions)
  return (
    <Card className="py-0">
      <DataTable
        rows={batches.data?.rows ?? []}
        empty="Nothing imported yet."
        columns={[
          { key: 'batchId', label: '#' },
          {
            key: 'accountId',
            label: 'account',
            render: (r) => {
              const a = accounts.find((x) => x.accountId === r.accountId)
              return a ? accountLabel(a) : r.accountId
            },
          },
          { key: 'sourceKind', label: 'source' },
          { key: 'sourceLabel', label: 'label' },
          { key: 'fileName', label: 'file' },
          { key: 'rowCount', label: 'rows', align: 'right' },
          { key: 'importedAt', label: 'imported' },
        ]}
      />
    </Card>
  )
}
