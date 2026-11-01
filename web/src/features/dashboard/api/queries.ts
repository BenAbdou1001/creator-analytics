import { queryOptions } from '@tanstack/react-query'
import type { TimeseriesParams } from '../types'
import { dashboardKeys } from './keys'
import { toAccountOverview, toPoint } from './mappers'
import { dashboardService } from './service'

export const overviewOptions = queryOptions({
  queryKey: dashboardKeys.overview(),
  queryFn: dashboardService.overview,
  select: (rows) => rows.map(toAccountOverview),
})

export const timeseriesOptions = (p: TimeseriesParams) =>
  queryOptions({
    queryKey: dashboardKeys.timeseries(p),
    queryFn: () => dashboardService.timeseries(p),
    select: (rows) => rows.map(toPoint),
  })
