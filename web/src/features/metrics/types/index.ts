import type { Platform } from '@/shared/types'

// UI shape: camelCase. The wire shape (MetricDefinitionDto) lives in @/shared/contracts.
export interface MetricDefinition {
  metricId: number
  platform: Platform
  scope: string
  metricKey: string
  label: string
  definition: string | null
  unit: string
  semantics: string
  requires: string | null
  retentionDays: number | null
  guiPath: string | null
  verification: string
}

export interface MetricSearch {
  platform?: string
  scope?: string
}

export function validateMetricSearch(s: Record<string, unknown>): MetricSearch {
  return { platform: (s.platform as string) || undefined, scope: (s.scope as string) || undefined }
}
