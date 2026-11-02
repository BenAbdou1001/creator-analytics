import type { ContentItemDto, ContentLatestMetricDto, ContentSummaryDto } from '@/shared/contracts'
import type { Params } from '@/shared/lib/api-client'
import { toDate } from '@/shared/lib/tables'
import type { ContentItem, ContentMetric, ContentSearch, ContentSort, ContentSummary } from '../types'

export function toContentSummary(dto: ContentSummaryDto): ContentSummary {
  return {
    contentId: dto.content_id,
    accountId: dto.account_id,
    platform: dto.platform,
    contentType: dto.content_type,
    title: dto.title,
    publishedAt: toDate(dto.published_at),
    views: dto.views,
    impressions: dto.impressions,
    likes: dto.likes,
    comments: dto.comments,
    shares: dto.shares,
    saves: dto.saves,
    engagements: dto.engagements,
  }
}

export function toContentItem(dto: ContentItemDto): ContentItem {
  return {
    contentId: dto.content_id,
    url: dto.url,
    caption: dto.caption,
    deletedObservedAt: toDate(dto.deleted_observed_at),
  }
}

export function toContentMetric(dto: ContentLatestMetricDto): ContentMetric {
  return {
    metricKey: dto.metric_key,
    label: dto.label,
    periodKind: dto.period_kind,
    periodStart: dto.period_start,
    periodEnd: dto.period_end,
    value: dto.value,
    capturedAt: new Date(dto.captured_at),
  }
}

const SORT_COLUMN: Record<ContentSort, keyof ContentSummaryDto> = {
  publishedAt: 'published_at',
  engagements: 'engagements',
  views: 'views',
  impressions: 'impressions',
  likes: 'likes',
  comments: 'comments',
  shares: 'shares',
}

/** URL search (camelCase) -> generic table filters (column names). */
export function toContentListParams(s: ContentSearch, limit: number): Params {
  return {
    account_id: s.accountId,
    content_type: s.contentType,
    title__like: s.q,
    order_by: SORT_COLUMN[s.orderBy],
    limit,
    offset: s.offset,
  }
}
