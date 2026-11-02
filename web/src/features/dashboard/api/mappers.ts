import type { AccountOverviewDto, ExpiringMetricDto, MetricPointDto } from '@/shared/contracts'
import { toDate } from '@/shared/lib/tables'
import type { AccountOverview, ExpiringMetric, Point } from '../types'

export function toAccountOverview(dto: AccountOverviewDto): AccountOverview {
  return {
    accountId: dto.account_id,
    platform: dto.platform,
    handle: dto.handle,
    displayName: dto.display_name,
    accountType: dto.account_type,
    followers: dto.followers,
    contentCount: dto.content_count,
    totalViews: dto.total_views,
    totalImpressions: dto.total_impressions,
    totalEngagements: dto.total_engagements,
    lastImport: toDate(dto.last_import),
  }
}

export function toPoint(dto: MetricPointDto): Point {
  return { periodStart: dto.period_start, periodEnd: dto.period_end, value: dto.value, batchId: dto.batch_id }
}

export function toExpiringMetric(dto: ExpiringMetricDto): ExpiringMetric {
  return {
    accountId: dto.account_id,
    platform: dto.platform,
    handle: dto.handle,
    metricKey: dto.metric_key,
    label: dto.label,
    guiPath: dto.gui_path,
    retentionDays: dto.retention_days,
    firstDay: dto.first_day,
    lastDay: dto.last_day,
    daysSaved: dto.days_saved,
    savedAs: dto.saved_as,
    daysLeft: dto.days_left,
  }
}
