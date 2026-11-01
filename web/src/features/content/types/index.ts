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

export const CONTENT_SORTS = [
  ['publishedAt', 'Newest'],
  ['engagements', 'Most engagement'],
  ['views', 'Most views'],
  ['impressions', 'Most impressions'],
  ['likes', 'Most likes'],
  ['comments', 'Most comments'],
  ['shares', 'Most shares'],
] as const satisfies readonly (readonly [keyof ContentSummary, string])[]

export type ContentSort = (typeof CONTENT_SORTS)[number][0]

export interface ContentSearch {
  accountId?: number
  contentType?: string
  q?: string
  orderBy: ContentSort
  offset: number
}

export function validateContentSearch(s: Record<string, unknown>): ContentSearch {
  const orderBy = CONTENT_SORTS.find(([k]) => k === s.orderBy)?.[0] ?? 'publishedAt'
  return {
    accountId: s.accountId ? Number(s.accountId) : undefined,
    contentType: (s.contentType as string) || undefined,
    q: (s.q as string) || undefined,
    orderBy,
    offset: Number(s.offset ?? 0),
  }
}
