import type { AccountOverviewDto, ApiResponse, ExpiringMetricDto, MetricPointDto } from '@/shared/contracts'
import { apiClient } from '@/shared/lib/api-client'
import type { TimeseriesParams } from '../types'

export const dashboardService = {
  overview: () => apiClient.get<ApiResponse<AccountOverviewDto[]>>('/dashboard/overview').then((res) => res.data.data),

  expiring: () => apiClient.get<ApiResponse<ExpiringMetricDto[]>>('/dashboard/expiring').then((res) => res.data.data),

  timeseries: (p: TimeseriesParams) =>
    apiClient
      .get<ApiResponse<MetricPointDto[]>>('/dashboard/timeseries', {
        params: { account_id: p.accountId, metric_key: p.metricKey, start: p.start, end: p.end },
      })
      .then((res) => res.data.data),
}
