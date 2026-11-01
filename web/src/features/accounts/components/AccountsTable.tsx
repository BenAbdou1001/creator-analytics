import { DataTable } from '@/shared/components/common/DataTable'
import { PlatformBadge } from '@/shared/components/common/PlatformBadge'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import type { Account } from '../types'

export function AccountsTable({ rows, onEdit, onDelete }: { rows: Account[]; onEdit: (a: Account) => void; onDelete: (a: Account) => void }) {
  return (
    <Card className="py-0">
      <DataTable
        rows={rows}
        columns={[
          { key: 'platform', render: (r) => <PlatformBadge platform={r.platform} /> },
          { key: 'handle', render: (r) => `@${r.handle}` },
          { key: 'displayName', label: 'name' },
          { key: 'accountType', label: 'type' },
          { key: 'isMonetized', label: 'monetized', render: (r) => (r.isMonetized ? 'Yes' : 'No') },
          { key: 'accountId', label: 'id' },
        ]}
        actions={(r) => (
          <>
            <Button variant="ghost" size="sm" onClick={() => onEdit(r)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(r)}>
              Delete
            </Button>
          </>
        )}
      />
    </Card>
  )
}
