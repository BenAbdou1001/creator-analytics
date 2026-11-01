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
}

export interface TimeseriesParams {
  accountId: number
  metricKey: string
  start?: string
  end?: string
}
