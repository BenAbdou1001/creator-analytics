import { DataTable } from '@/shared/components/common/DataTable'
import { PlatformBadge } from '@/shared/components/common/PlatformBadge'
import { day, num } from '@/shared/lib/format'
import type { ContentSummary } from '../types'

const METRICS = ['views', 'impressions', 'likes', 'comments', 'shares', 'saves', 'engagements'] as const

export function ContentTable({ rows, onSelect, compact, empty }: {
  rows: ContentSummary[]
  onSelect?: (row: ContentSummary) => void
  /** dashboard view: no saves / published columns, "likes" labelled for LinkedIn reactions too */
  compact?: boolean
  empty: string
}) {
  return (
    <DataTable
      rows={rows}
      onRowClick={onSelect}
      empty={empty}
      columns={[
        { key: 'platform', render: (r) => <PlatformBadge platform={r.platform} /> },
        { key: 'title', render: (r) => r.title ?? <span className="text-muted-foreground">untitled</span> },
        { key: 'contentType', label: 'type' },
        ...(compact ? [] : [{ key: 'publishedAt', label: 'published', render: (r: ContentSummary) => day(r.publishedAt) }]),
        ...METRICS.filter((k) => !(compact && k === 'saves')).map((k) => ({
          key: k,
          label: compact && k === 'likes' ? 'likes / reactions' : k,
          align: 'right' as const,
          render: (r: ContentSummary) => num(r[k]),
        })),
      ]}
    />
  )
}
