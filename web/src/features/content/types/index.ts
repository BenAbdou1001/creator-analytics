import type { Platform } from '@/shared/types'

// UI shapes: camelCase, real Dates. Wire shapes live in @/shared/contracts.
export interface ContentSummary {
  contentId: number
  accountId: number
  platform: Platform
  contentType: string
  title: string | null
  publishedAt: Date | null
  views: number | null
  impressions: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  engagements: number | null
}

export interface ContentItem {
  contentId: number
  url: string | null
  caption: string | null
  deletedObservedAt: Date | null
}

export interface ContentMetric {
  metricKey: string
  label: string
  periodKind: string
  periodStart: string | null // calendar day
  periodEnd: string | null
  value: number
  capturedAt: Date
}

export const CONTENT_SORTS = ['publishedAt', 'engagements', 'views', 'impressions', 'likes', 'comments', 'shares'] as const

export type ContentSort = (typeof CONTENT_SORTS)[number]

export interface ContentSearch {
  accountId?: number
  contentType?: string
  q?: string
  orderBy: ContentSort
  offset: number
}

export function validateContentSearch(s: Record<string, unknown>): ContentSearch {
  const orderBy = CONTENT_SORTS.find((k) => k === s.orderBy) ?? 'publishedAt'
  return {
    accountId: s.accountId ? Number(s.accountId) : undefined,
    contentType: (s.contentType as string) || undefined,
    q: (s.q as string) || undefined,
    orderBy,
    offset: Number(s.offset ?? 0),
  }
}

/** /content/$id/edit?version=: which brief the form edits (a brief_id); 'new' saves a new version. */
export function validatePostEditSearch(s: Record<string, unknown>): { version?: number | 'new' } {
  if (s.version === 'new') return { version: 'new' }
  return { version: s.version ? Number(s.version) : undefined }
}

/** The posts list as the menu opens it. */
export const ALL_POSTS: ContentSearch = { orderBy: 'publishedAt', offset: 0 }

/** /content/new?plan=1&date=YYYY-MM-DD: plan a post before publishing it, optionally on a given day. */
export function validateNewPostSearch(s: Record<string, unknown>): { plan?: boolean; date?: string } {
  const date = typeof s.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.date) ? s.date : undefined
  return { plan: s.plan === true || s.plan === 1 || s.plan === '1' || s.plan === 'true' ? true : undefined, date }
}

/** /content/$id?brief=: which brief version is shown. */
export function validatePostSearch(s: Record<string, unknown>): { brief?: number } {
  return { brief: s.brief ? Number(s.brief) : undefined }
}

/** /calendar?month=YYYY-MM&account= */
export interface CalendarSearch {
  month?: string
  account?: number
}

export function validateCalendarSearch(s: Record<string, unknown>): CalendarSearch {
  return {
    month: typeof s.month === 'string' && /^\d{4}-\d{2}$/.test(s.month) ? s.month : undefined,
    account: s.account ? Number(s.account) : undefined,
  }
}
