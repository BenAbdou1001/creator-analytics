import { queryOptions } from '@tanstack/react-query'
import type { BreakdownFactDto, InferredUnfollowDto } from '@/shared/contracts'
import { rowsOptions } from '@/shared/lib/tables'

export interface Breakdown {
  metricId: number
  dimension: string
  items: { label: string; value: number }[]
}

/** Latest capture of each metric + dimension, largest first. */
export function toBreakdowns(rows: BreakdownFactDto[]): Breakdown[] {
  const groups = new Map<string, BreakdownFactDto[]>()
  for (const r of rows) {
    if (r.content_id !== null) continue
    const key = `${r.metric_id}/${r.dimension}`
    groups.set(key, [...(groups.get(key) ?? []), r])
  }
  return [...groups.values()].map((g) => {
    const latest = g.reduce((max, r) => (r.captured_at > max ? r.captured_at : max), '')
    return {
      metricId: g[0].metric_id,
      dimension: g[0].dimension,
      items: g
        .filter((r) => r.captured_at === latest)
        .map((r) => ({ label: r.dimension_value, value: r.value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    }
  })
}

export const breakdownsOptions = (accountId: number) =>
  queryOptions({
    ...rowsOptions<BreakdownFactDto>('breakdown_facts', { account_id: accountId, order_by: 'captured_at', limit: 1000 }),
    select: (page) => toBreakdowns(page.rows),
  })

export const unfollowsOptions = (accountId: number) =>
  queryOptions({
    ...rowsOptions<InferredUnfollowDto>('v_inferred_unfollows', { account_id: accountId, order_by: 'ended_inferred_at', limit: 50 }),
    select: (page) => page.rows,
  })
