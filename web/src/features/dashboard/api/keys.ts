import type { TimeseriesParams } from '../types'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: () => [...dashboardKeys.all, 'overview'] as const,
  expiring: () => [...dashboardKeys.all, 'expiring'] as const,
  timeseries: (p: TimeseriesParams) => [...dashboardKeys.all, 'timeseries', p] as const,
}
