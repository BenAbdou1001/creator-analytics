import { queryOptions } from '@tanstack/react-query'
import type { MetricDefinitionDto } from '@/shared/contracts'
import { mapPage, rowsOptions } from '@/shared/lib/tables'
import type { MetricSearch } from '../types'
import { toMetricDefinition } from './mappers'

export const metricDefinitionsOptions = (s: MetricSearch) =>
  queryOptions({
    ...rowsOptions<MetricDefinitionDto>('metric_definitions', { ...s, order_by: 'metric_id', desc: false, limit: 500 }),
    select: mapPage(toMetricDefinition),
  })
