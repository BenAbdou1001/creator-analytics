import { useQuery } from '@tanstack/react-query'
import { DataTable } from '@/shared/components/common/DataTable'
import { PlatformBadge } from '@/shared/components/common/PlatformBadge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { day } from '@/shared/lib/format'
import { contentItemOptions, contentMetricsOptions } from '../api/queries'
import type { ContentSummary } from '../types'

export function ContentDetail({ item, onClose }: { item: ContentSummary; onClose: () => void }) {
  const metrics = useQuery(contentMetricsOptions(item.contentId))
  const { data: c } = useQuery(contentItemOptions(item.contentId))
  return (
    <Card className="mt-6">
      <CardContent>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <PlatformBadge platform={item.platform} />
            <h2 className="mt-1 text-lg font-semibold">{item.title ?? 'untitled'}</h2>
            {c?.url && (
              <a href={c.url} target="_blank" rel="noreferrer" className="text-sm text-chart-1 hover:underline">
                Open on platform ↗
              </a>
            )}
            {c?.deletedObservedAt && <p className="text-sm text-destructive">Not seen since {day(c.deletedObservedAt)}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <DataTable
          rows={metrics.data?.rows ?? []}
          empty="No metrics captured for this item."
          columns={[
            { key: 'label', label: 'metric' },
            { key: 'periodKind', label: 'period' },
            { key: 'value', align: 'right', render: (r) => r.value.toLocaleString('en') },
            { key: 'capturedAt', label: 'captured' },
          ]}
        />
      </CardContent>
    </Card>
  )
}
