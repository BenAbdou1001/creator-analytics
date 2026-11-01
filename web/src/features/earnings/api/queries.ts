import { queryOptions } from '@tanstack/react-query'
import type { RevenueFactDto } from '@/shared/contracts'
import { rowsOptions } from '@/shared/lib/tables'

export const revenueOptions = queryOptions({
  ...rowsOptions<RevenueFactDto>('revenue_facts', { order_by: 'period_start', limit: 1000 }),
  select: (page) => page.rows,
})

/** Totals by source, one list per currency: different currencies never add up. */
export function totalsByCurrency(rows: RevenueFactDto[]) {
  const out = new Map<string, Map<string, number>>()
  for (const r of rows) {
    const currency = r.currency ?? 'Unknown currency'
    const sources = out.get(currency) ?? new Map<string, number>()
    sources.set(r.revenue_source, (sources.get(r.revenue_source) ?? 0) + r.value)
    out.set(currency, sources)
  }
  return [...out].map(([currency, sources]) => ({
    currency,
    items: [...sources].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
  }))
}
