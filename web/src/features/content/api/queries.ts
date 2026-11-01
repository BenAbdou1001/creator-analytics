import { queryOptions } from '@tanstack/react-query'
import type { ContentItemDto, ContentLatestMetricDto, ContentSummaryDto } from '@/shared/contracts'
import { mapPage, rowsOptions } from '@/shared/lib/tables'
import type { ContentSearch } from '../types'
import { toContentItem, toContentListParams, toContentMetric, toContentSummary } from './mappers'

export const CONTENT_PAGE_SIZE = 25

export const contentListOptions = (s: ContentSearch) =>
  queryOptions({
    ...rowsOptions<ContentSummaryDto>('v_content_summary', toContentListParams(s, CONTENT_PAGE_SIZE)),
    select: mapPage(toContentSummary),
  })

export const topContentOptions = queryOptions({
  ...rowsOptions<ContentSummaryDto>('v_content_summary', { order_by: 'engagements', limit: 10 }),
  select: mapPage(toContentSummary),
})

/** Publish dates of one account, for the markers on its trend chart. */
export const postDatesOptions = (accountId: number) =>
  queryOptions({
    ...rowsOptions<ContentSummaryDto>('v_content_summary', { account_id: accountId, order_by: 'published_at', limit: 1000 }),
    select: (page) =>
      page.rows.flatMap((r) => (r.published_at ? [{ date: r.published_at.slice(0, 10), title: r.title }] : [])),
  })

export const contentSummaryOptions = (id: number) =>
  queryOptions({
    ...rowsOptions<ContentSummaryDto>('v_content_summary', { content_id: id }),
    select: (page) => (page.rows[0] ? toContentSummary(page.rows[0]) : null),
  })

/** The import that last touched a post's numbers. */
export const contentBatchOptions = (id: number) =>
  queryOptions({
    ...rowsOptions<{ batch_id: number | null }>('content_metric_facts', { content_id: id, order_by: 'captured_at', limit: 1 }),
    select: (page) => page.rows[0]?.batch_id ?? null,
  })

export const contentItemOptions = (id: number) =>
  queryOptions({
    ...rowsOptions<ContentItemDto>('content_items', { content_id: id }),
    select: (page) => (page.rows[0] ? toContentItem(page.rows[0]) : null),
  })

export const contentMetricsOptions = (id: number) =>
  queryOptions({
    ...rowsOptions<ContentLatestMetricDto>('v_content_latest_metrics', {
      content_id: id,
      order_by: 'metric_key',
      desc: false,
      limit: 200,
    }),
    select: mapPage(toContentMetric),
  })
