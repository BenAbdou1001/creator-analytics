import { Link } from '@tanstack/react-router'
import { DataTable } from '@/shared/components/common/DataTable'
import { PlatformTile } from '@/shared/components/common/PlatformBadge'
import { Sounding } from '@/shared/components/common/Sounding'
import { PLATFORM_LABEL, humanize, prettyDay } from '@/shared/lib/format'
import { CONTENT_SORTS } from '../types'
import type { ContentSearch, ContentSort, ContentSummary } from '../types'

const METRICS = ['views', 'impressions', 'likes', 'comments', 'shares', 'saves', 'engagements'] as const

export function ContentTable({ rows, search = { orderBy: 'publishedAt', offset: 0 }, onSort, compact, empty }: {
  rows: ContentSummary[]
  /** current sort */
  search?: ContentSearch
  onSort?: (key: ContentSort) => void
  /** home screen: no publish date */
  compact?: boolean
  empty: string
}) {
  // a metric no listed post has is noise, and LinkedIn alone has seven candidates
  const shown = METRICS.filter((k) => rows.some((r) => r[k] !== null))
  return (
    <DataTable
      rows={rows}
      empty={empty}
      sortable={onSort ? CONTENT_SORTS : undefined}
      sortedBy={onSort ? search.orderBy : undefined}
      onSort={onSort && ((k) => onSort(k as ContentSort))}
      columns={[
        {
          key: 'title',
          label: 'Post',
          render: (r) => (
            <span className="flex max-w-lg items-center gap-3" title={PLATFORM_LABEL[r.platform]}>
              <PlatformTile platform={r.platform} />
              <span className="sr-only">{PLATFORM_LABEL[r.platform]}:</span>
              <Link to="/content/$id" params={{ id: String(r.contentId) }} className="min-w-0 truncate hover:underline" dir="auto">
                {r.title ?? 'Untitled'}
              </Link>
            </span>
          ),
        },
        { key: 'contentType', label: 'Type', render: (r) => humanize(r.contentType) },
        ...(compact ? [] : [{ key: 'publishedAt', label: 'Published', render: (r: ContentSummary) => <span className="tabular-nums">{prettyDay(r.publishedAt)}</span> }]),
        ...shown.map((k) => ({
          key: k,
          label: humanize(k),
          align: 'right' as const,
          render: (r: ContentSummary) => <Sounding value={r[k]} />,
        })),
      ]}
    />
  )
}
