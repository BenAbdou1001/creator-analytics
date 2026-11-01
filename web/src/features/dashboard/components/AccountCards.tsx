import { PlatformBadge } from '@/shared/components/common/PlatformBadge'
import { Card, CardContent } from '@/shared/components/ui/card'
import { day, num } from '@/shared/lib/format'
import type { AccountOverview } from '../types'

export function AccountCards({ accounts }: { accounts: AccountOverview[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {accounts.map((a) => (
        <Card key={a.accountId} className="py-4">
          <CardContent className="px-4">
            <PlatformBadge platform={a.platform} />
            <div className="mt-1 truncate font-medium">{a.displayName || `@${a.handle}`}</div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              {(
                [
                  ['Followers', a.followers],
                  a.totalViews === null ? ['Impressions', a.totalImpressions] : ['Views', a.totalViews],
                  ['Posts', a.contentCount],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-semibold tabular-nums">{num(v)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 text-xs text-muted-foreground">
              Last import: {a.lastImport ? day(a.lastImport) : 'never'}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
