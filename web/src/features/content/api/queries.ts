import { queryOptions } from '@tanstack/react-query'
import type { ContentBriefDto, ContentItemDto, ContentLatestMetricDto, ContentPerformanceDto, ContentSummaryDto } from '@/shared/contracts'
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

/** The raw content_items row, for editing it. */
export const contentRowOptions = (id: number) =>
  queryOptions({
    ...rowsOptions<Record<string, unknown>>('content_items', { content_id: id }),
    select: (page) => page.rows[0] ?? null,
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

/** Every brief (version) of a post, newest first. */
export const contentBriefsOptions = (id: number) =>
  queryOptions({
    ...rowsOptions<ContentBriefDto>('content_briefs', { content_id: id, order_by: 'brief_id', limit: 100 }),
    select: (page) => page.rows,
  })

/** One row per post with its current brief: feeds the "what worked" breakdown and the brief form's suggestions. */
export const performanceOptions = queryOptions({
  ...rowsOptions<ContentPerformanceDto>('v_content_performance', { limit: 1000 }),
  select: (page) => page.rows,
})

/** content_items fields the calendar draws. */
export interface CalendarItemDto {
  content_id: number
  account_id: number
  platform: import('@/shared/types').Platform
  content_type: string
  title: string | null
  published_at: string | null
  scheduled_for: string | null
  visibility: string
}

const calendarRows = (params: Record<string, string | number | boolean>) =>
  queryOptions({
    ...rowsOptions<CalendarItemDto>('content_items', { limit: 1000, desc: false, ...params }),
    select: (page) => page.rows,
  })

/** Posts published between two instants (ISO). */
export const publishedBetweenOptions = (from: string, to: string, accountId?: number) =>
  calendarRows({ published_at__gte: from, published_at__lte: to, order_by: 'published_at', ...(accountId ? { account_id: accountId } : {}) })

/** Planned posts scheduled between two instants (ISO). */
export const plannedBetweenOptions = (from: string, to: string, accountId?: number) =>
  calendarRows({ visibility: 'draft', scheduled_for__gte: from, scheduled_for__lte: to, order_by: 'scheduled_for', ...(accountId ? { account_id: accountId } : {}) })

/** Planned posts with no date yet. */
export const unscheduledOptions = (accountId?: number) =>
  calendarRows({ visibility: 'draft', scheduled_for__isnull: true, order_by: 'content_id', ...(accountId ? { account_id: accountId } : {}) })
