import type { Platform } from '@/shared/types'

// UI shapes: camelCase, real Dates. Wire shapes live in @/shared/contracts.
export interface AccountOverview {
  accountId: number
  platform: Platform
  handle: string
  displayName: string | null
  accountType: string
  followers: number | null
  contentCount: number
  totalViews: number | null
  totalImpressions: number | null
  totalEngagements: number | null
  lastImport: Date | null
}

export interface Point {
  periodStart: string // calendar day, 'YYYY-MM-DD'
  periodEnd: string
  value: number
  batchId: number | null
}

export interface ExpiringMetric {
  accountId: number
  platform: Platform
  handle: string
  metricKey: string
  label: string
  guiPath: string | null
  retentionDays: number
  firstDay: string | null
  lastDay: string | null
  daysSaved: number
  savedAs: 'days' | 'totals' | 'nothing'
  daysLeft: number | null
}

export interface TimeseriesParams {
  accountId: number
  metricKey: string
  start?: string
  end?: string
}

/** Today's chart selection lives in the URL, so a view can be linked and survives back. */
export interface TodaySearch {
  account?: number
  metric?: string
  from?: string
  to?: string
}

export function validateTodaySearch(s: Record<string, unknown>): TodaySearch {
  return {
    account: s.account ? Number(s.account) : undefined,
    metric: (s.metric as string) || undefined,
    from: (s.from as string) || undefined,
    to: (s.to as string) || undefined,
  }
}
