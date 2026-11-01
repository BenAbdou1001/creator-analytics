import { Card, CardContent } from '@/shared/components/ui/card'
import { num } from '@/shared/lib/format'
import type { AccountOverview } from '../types'

type Summable = 'followers' | 'totalViews' | 'totalImpressions' | 'totalEngagements' | 'contentCount'

const TILES: [Summable, string][] = [
  ['followers', 'Followers'],
  ['totalViews', 'Content views'],
  ['totalImpressions', 'Impressions'],
  ['totalEngagements', 'Engagements'],
  ['contentCount', 'Content items'],
]

export function StatTiles({ accounts }: { accounts: AccountOverview[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {TILES.map(([key, label]) => (
        <Card key={key} className="py-4">
          <CardContent className="px-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">
              {num(accounts.reduce((s, a) => s + Number(a[key] ?? 0), 0))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
