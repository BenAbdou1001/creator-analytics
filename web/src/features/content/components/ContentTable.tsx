import { Link } from '@tanstack/react-router'
import { DataTable } from '@/shared/components/common/DataTable'
import { PlatformBadge } from '@/shared/components/common/PlatformBadge'
import { Sounding } from '@/shared/components/common/Sounding'
import { humanize, prettyDay } from '@/shared/lib/format'
import { CONTENT_SORTS } from '../types'
import type { ContentSearch, ContentSort, ContentSummary } from '../types'

const METRICS = ['views', 'impressions', 'likes', 'comments', 'shares', 'saves', 'engagements'] as const

export function ContentTable({ rows, search = { orderBy: 'publishedAt', offset: 0 }, onSort, compact, empty }: {
  rows: ContentSummary[]
  /** where a title link goes: the current list, plus the open post */
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
        { key: 'platform', label: 'Platform', render: (r) => <PlatformBadge platform={r.platform} /> },
        {
          key: 'title',
          label: 'Post',
          render: (r) => (
            <Link to="/content" search={{ ...search, post: r.contentId }} className="block max-w-[24rem] truncate hover:underline" dir="auto">
              {r.title ?? 'Untitled'}
            </Link>
          ),
        },
        { key: 'contentType', label: 'Type', render: (r) => humanize(r.contentType) },
        ...(compact ? [] : [{ key: 'publishedAt', label: 'Published', render: (r: ContentSummary) => <span className="font-mono">{prettyDay(r.publishedAt)}</span> }]),
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
