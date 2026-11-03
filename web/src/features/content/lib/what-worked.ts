/** Rows of v_content_performance, as far as the breakdown needs them. */
export type PerformanceRow = Record<string, unknown> & { brief_count: number; views: number | null; engagement_rate: number | null }

export type WhatWorkedMetric = 'views' | 'engagement_rate'

export interface Group {
  label: string
  value: number // average of the metric over the group's posts that have it
  posts: number
}

/** Free-text spellings that should land in one group: "Tech", " tech" and "tech" are the same value. */
export const groupKey = (v: unknown) => String(v).trim().toLowerCase()

/**
 * Average `metric` per value of `field`, best first. Posts without a value are left out. `singleVersion` keeps only
 * posts with exactly one brief, whose lifetime numbers belong to that brief alone. A group shows its most common
 * spelling. ponytail: client-side over <=1000 posts; move to SQL if posts outgrow that.
 */
export function groupStats(rows: PerformanceRow[], field: string, metric: WhatWorkedMetric, singleVersion: boolean): Group[] {
  const groups = new Map<string, { spellings: Map<string, number>; sum: number; n: number; posts: number }>()
  for (const r of rows) {
    const raw = r[field]
    if (r.brief_count === 0 || (singleVersion && r.brief_count !== 1)) continue
    if (raw === null || raw === undefined || groupKey(raw) === '') continue
    const key = groupKey(raw)
    const g = groups.get(key) ?? { spellings: new Map(), sum: 0, n: 0, posts: 0 }
    const spelling = String(raw).trim()
    g.spellings.set(spelling, (g.spellings.get(spelling) ?? 0) + 1)
    g.posts++
    const m = r[metric]
    if (typeof m === 'number') {
      g.sum += m
      g.n++
    }
    groups.set(key, g)
  }
  return [...groups.values()]
    .filter((g) => g.n > 0)
    .map((g) => ({
      label: [...g.spellings].sort((a, b) => b[1] - a[1])[0][0],
      value: g.sum / g.n,
      posts: g.posts,
    }))
    .sort((a, b) => b.value - a.value)
}

/** Distinct existing spellings of a text field, most used first: suggestions so new briefs reuse them. */
export function suggestions(rows: Record<string, unknown>[], field: string): string[] {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const v = r[field]
    if (typeof v === 'string' && v.trim()) counts.set(v.trim(), (counts.get(v.trim()) ?? 0) + 1)
  }
  return [...counts].sort((a, b) => b[1] - a[1]).map(([v]) => v)
}
