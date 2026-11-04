import { Sounding } from '@/shared/components/common/Sounding'
import { Card } from '@/shared/components/ui/card'
import type { AccountOverview } from '../types'

function total(accounts: AccountOverview[], value: (a: AccountOverview) => number | null) {
  const present = accounts.map(value).filter((v) => v !== null)
  return present.length ? present.reduce((a, b) => a + b, 0) : null
}

export function StatTiles({ accounts }: { accounts: AccountOverview[] }) {
  const tiles = [
    { label: 'Followers', value: total(accounts, (a) => a.followers) },
    { label: 'Views and impressions', value: total(accounts, (a) => a.totalImpressions ?? a.totalViews) },
    { label: 'Engagement', value: total(accounts, (a) => a.totalEngagements) },
    { label: 'Posts', value: total(accounts, (a) => a.contentCount) },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {tiles.map((t) => (
        <Card key={t.label} className="gap-3 p-5">
          <div className="text-sm text-muted-foreground">{t.label}</div>
          <Sounding value={t.value} className="text-3xl font-medium" />
        </Card>
      ))}
    </div>
  )
}
