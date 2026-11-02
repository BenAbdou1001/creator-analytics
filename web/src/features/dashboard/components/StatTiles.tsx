import { Eye, FileText, Heart, Users } from 'lucide-react'
import { Sounding } from '@/shared/components/common/Sounding'
import { Card } from '@/shared/components/ui/card'
import type { AccountOverview } from '../types'

function total(accounts: AccountOverview[], value: (a: AccountOverview) => number | null) {
  const present = accounts.map(value).filter((v) => v !== null)
  return present.length ? present.reduce((a, b) => a + b, 0) : null
}

export function StatTiles({ accounts }: { accounts: AccountOverview[] }) {
  const tiles = [
    { label: 'Followers', icon: Users, value: total(accounts, (a) => a.followers) },
    { label: 'Views and impressions', icon: Eye, value: total(accounts, (a) => a.totalImpressions ?? a.totalViews) },
    { label: 'Engagement', icon: Heart, value: total(accounts, (a) => a.totalEngagements) },
    { label: 'Posts', icon: FileText, value: total(accounts, (a) => a.contentCount) },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {tiles.map((t) => (
        <Card key={t.label} className="gap-3 p-5">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <span className="flex size-8 items-center justify-center rounded-sm bg-accent text-link">
              <t.icon className="size-4" aria-hidden="true" />
            </span>
            {t.label}
          </div>
          <Sounding value={t.value} className="text-3xl font-semibold" />
        </Card>
      ))}
    </div>
  )
}
