import { DataTable } from '@/shared/components/common/DataTable'
import { PlatformBadge } from '@/shared/components/common/PlatformBadge'
import { Sounding } from '@/shared/components/common/Sounding'
import { Card } from '@/shared/components/ui/card'
import { ago } from '@/shared/lib/format'
import type { AccountOverview } from '../types'

/** One row per account. Numbers stay per platform: summing them would count the same person twice. */
export function AccountRows({ accounts }: { accounts: AccountOverview[] }) {
  const has = (k: 'totalViews' | 'totalImpressions') => accounts.some((a) => a[k] !== null)
  return (
    <Card className="py-0">
      <DataTable
        rows={accounts}
        columns={[
          { key: 'platform', label: 'Platform', render: (a) => <PlatformBadge platform={a.platform} /> },
          { key: 'name', label: 'Account', render: (a) => <span dir="auto">{a.displayName || `@${a.handle}`}</span> },
          { key: 'followers', label: 'Followers', align: 'right', render: (a) => <Sounding value={a.followers} /> },
          ...(has('totalViews') ? [{ key: 'views', label: 'Post views', align: 'right' as const, render: (a: AccountOverview) => <Sounding value={a.totalViews} /> }] : []),
          ...(has('totalImpressions') ? [{ key: 'impressions', label: 'Impressions', align: 'right' as const, render: (a: AccountOverview) => <Sounding value={a.totalImpressions} /> }] : []),
          { key: 'engagements', label: 'Engagements', align: 'right', render: (a) => <Sounding value={a.totalEngagements} /> },
          { key: 'posts', label: 'Posts', align: 'right', render: (a) => <Sounding value={a.contentCount} /> },
          { key: 'saved', label: 'Last saved', render: (a) => (a.lastImport ? ago(a.lastImport) : 'Never') },
        ]}
      />
    </Card>
  )
}
