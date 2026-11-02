import { DataTable } from '@/shared/components/common/DataTable'
import { PlatformBadge } from '@/shared/components/common/PlatformBadge'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { humanize } from '@/shared/lib/format'
import type { Account } from '../types'

export function AccountsTable({ rows, onEdit, onDelete }: { rows: Account[]; onEdit: (a: Account) => void; onDelete: (a: Account) => void }) {
  return (
    <Card className="py-0">
      <DataTable
        rows={rows}
        empty="No accounts yet. Add the first one above."
        columns={[
          { key: 'platform', label: 'Platform', render: (r) => <PlatformBadge platform={r.platform} /> },
          { key: 'handle', label: 'Handle', render: (r) => `@${r.handle}` },
          { key: 'displayName', label: 'Name', render: (r) => <span dir="auto">{r.displayName ?? '—'}</span> },
          { key: 'accountType', label: 'Type', render: (r) => humanize(r.accountType) },
          { key: 'isMonetized', label: 'Monetized', render: (r) => (r.isMonetized ? 'Yes' : 'No') },
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
