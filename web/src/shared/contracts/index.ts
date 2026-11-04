// Wire shapes exactly as the FastAPI backend sends them (snake_case, ISO date strings).
// Features map these to camelCase UI types in their api/mappers.ts; nothing else should use them.
import type { Platform } from '../types'

export interface ApiResponse<T> {
  code: number
  msg: string
  data: T
}

export interface PageDto<T> {
  rows: T[]
  total: number
}

export type RowDto = Record<string, unknown>

export interface ColumnDto {
  name: string
  type: string
  required: boolean
  default: string | null
}

export interface SchemaDto {
  tables: Record<string, { view: boolean; columns: ColumnDto[]; pk: string[] }>
  enums: Record<string, string[]>
}

export interface AccountDto {
  account_id: number
  platform: Platform
  account_type: string
  handle: string
  display_name: string | null
  profile_url: string | null
  external_id: string | null
  is_monetized: boolean
}

export type CreateAccountDto = Omit<AccountDto, 'account_id'>

export interface AccountOverviewDto {
  account_id: number
  platform: Platform
  handle: string
  display_name: string | null
  account_type: string
  followers: number | null
  content_count: number
  total_views: number | null
  total_impressions: number | null
  total_engagements: number | null
  last_import: string | null
}

export interface MetricPointDto {
  period_start: string
  period_end: string
  value: number
  captured_at: string
  batch_id: number | null
}

export interface ExpiringMetricDto {
  account_id: number
  platform: Platform
  handle: string
  metric_key: string
  label: string
  gui_path: string | null
  retention_days: number
  first_day: string | null
  last_day: string | null
  days_saved: number
  saved_as: 'days' | 'totals' | 'nothing'
  days_left: number | null
}

export interface ContentSummaryDto {
  content_id: number
  account_id: number
  platform: Platform
  content_type: string
  title: string | null
  published_at: string | null
  views: number | null
  impressions: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  engagements: number | null
}

export interface ContentItemDto {
  content_id: number
  url: string | null
  caption: string | null
  deleted_observed_at: string | null
}

/** content_briefs row. Its ~40 creative fields are edited generically from the schema, so they stay untyped here. */
export type ContentBriefDto = Record<string, unknown> & {
  brief_id: number
  content_id: number
  label: string | null
  active_from: string
}

/** v_content_performance row: the post's summary numbers + its current brief's fields (null when it has none). */
export type ContentPerformanceDto = ContentSummaryDto &
  Record<string, unknown> & {
    caption_length: number | null
    engagement_rate: number | null
    brief_count: number
    brief_id: number | null
    /** followers gained on publish day + 2 days, split across posts in that window; null without daily data */
    followers_3d: number | null
    followers_3d_posts: number
  }

export interface ContentLatestMetricDto {
  content_id: number
  metric_key: string
  label: string
  period_kind: string
  period_start: string | null
  period_end: string | null
  value: number
  captured_at: string
}

export interface MetricDefinitionDto {
  metric_id: number
  platform: Platform
  scope: string
  metric_key: string
  label: string
  definition: string | null
  unit: string
  semantics: string
  requires: string | null
  retention_days: number | null
  gui_path: string | null
  verification: string
}

export interface ImportBatchDto {
  batch_id: number
  account_id: number | null
  source_kind: string
  source_label: string
  file_name: string | null
  file_sha256: string | null
  row_count: number | null
  imported_at: string
}

export interface ImportResultDto {
  batch_id?: number
  content_upserted?: number
  facts_inserted?: number
  unknown_metrics?: string[]
  range_start?: string | null
  range_end?: string | null
  // LinkedIn .xlsx imports return one result per part
  account_metrics?: ImportResultDto
  content?: ImportResultDto | null
  demographic_rows?: number
}

export interface ImportPreviewDto {
  kind: 'content' | 'account_metrics' | 'linkedin_xlsx'
  already_imported_at: string | null
  result: ImportResultDto
}

export interface BreakdownFactDto {
  account_id: number
  content_id: number | null
  dimension: string
  dimension_value: string
  metric_id: number
  value: number
  captured_at: string
}

export interface InferredUnfollowDto {
  account_id: number
  platform: Platform
  handle: string
  display_name: string | null
  relation: string
  first_observed_at: string
  ended_inferred_at: string
}

export interface RevenueFactDto {
  account_id: number
  revenue_source: string
  currency: string | null
  period_start: string
  period_end: string
  value: number
  is_estimated: boolean
}
