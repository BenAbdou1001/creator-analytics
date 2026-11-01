import type { MetricDefinitionDto } from '@/shared/contracts'
import type { MetricDefinition } from '../types'

export function toMetricDefinition(dto: MetricDefinitionDto): MetricDefinition {
  return {
    metricId: dto.metric_id,
    platform: dto.platform,
    scope: dto.scope,
    metricKey: dto.metric_key,
    label: dto.label,
    definition: dto.definition,
    unit: dto.unit,
    semantics: dto.semantics,
    requires: dto.requires,
    retentionDays: dto.retention_days,
    guiPath: dto.gui_path,
    verification: dto.verification,
  }
}
