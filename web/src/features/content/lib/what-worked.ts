/** Rows of v_content_performance, as far as the breakdown needs them. */
export type PerformanceRow = Record<string, unknown> & { brief_count: number }

/** What a group is ranked by. Platforms report different numbers (LinkedIn: impressions, no views). */
export const WHAT_WORKED_METRICS = [
  ['views', 'Avg views'],
  ['impressions', 'Avg impressions'],
  ['engagements', 'Avg engagements'],
  ['engagement_rate', 'Avg engagement rate'],
  ['followers_3d', 'Avg new followers (3 days)'],
] as const
export type WhatWorkedMetric = (typeof WHAT_WORKED_METRICS)[number][0]

/** The first metric any of these posts has, so the breakdown never opens empty for want of a number. */
export const defaultMetric = (rows: PerformanceRow[]): WhatWorkedMetric =>
  WHAT_WORKED_METRICS.find(([m]) => rows.some((r) => r.brief_count > 0 && typeof r[m] === 'number'))?.[0] ?? 'views'

export interface Group {
  label: string
  value: number // average of the metric over the group's posts that have it
  posts: number
}

/** Free-text spellings that should land in one group: "Tech", " tech" and "tech" are the same value. */
export const groupKey = (v: unknown) => String(v).trim().toLowerCase()

/**
 * Average `metric` per combination of `fields` (e.g. hook_type × content_format), best first. Posts missing any of
 * the fields are left out. `singleVersion` keeps only
 * posts with exactly one brief, whose lifetime numbers belong to that brief alone. A group shows its most common
 * spelling. ponytail: client-side over <=1000 posts; move to SQL if posts outgrow that.
 */
export function groupStats(rows: PerformanceRow[], fields: string[], metric: WhatWorkedMetric, singleVersion: boolean): Group[] {
  const groups = new Map<string, { spellings: Map<string, number>; sum: number; n: number; posts: number }>()
  for (const r of rows) {
    if (r.brief_count === 0 || isDraft(r) || (singleVersion && r.brief_count !== 1)) continue
    const raws = fields.map((f) => r[f])
    if (!fields.length || raws.some((v) => v === null || v === undefined || groupKey(v) === '')) continue
    const key = raws.map(groupKey).join('\u0000')
    const g = groups.get(key) ?? { spellings: new Map(), sum: 0, n: 0, posts: 0 }
    const spelling = raws.map((v) => String(v).trim()).join(' · ')
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

// ---- experiments: plan a post with a hypothesis, then judge it against your typical post ----

/** Numbers settle about a week after posting; a hypothesis is reviewed from then. */
export const REVIEW_AFTER_DAYS = 7

export const isDraft = (r: Record<string, unknown>) => r.visibility === 'draft'

export function median(values: number[]): number | null {
  if (!values.length) return null
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** The account's typical post for `metric`: the median over its other published posts that have the number. */
export function typical(rows: PerformanceRow[], post: PerformanceRow, metric: string): number | null {
  return median(
    rows
      .filter((r) => r.account_id === post.account_id && r.content_id !== post.content_id && !isDraft(r))
      .flatMap((r) => (typeof r[metric] === 'number' ? [r[metric] as number] : [])),
  )
}

/** The day a published post's hypothesis can be judged, or null when there is nothing to review. */
export function reviewFrom(r: PerformanceRow): Date | null {
  if (isDraft(r) || !r.hypothesis || r.verdict || typeof r.published_at !== 'string') return null
  const d = new Date(r.published_at)
  d.setDate(d.getDate() + REVIEW_AFTER_DAYS)
  return d
}

/**
 * Combinations of values already used for `fields` that no post has tried together, e.g. a hook type you use and a
 * format you use but never as a pair. Drafts count as tried: they are the plan.
 */
export function untried(rows: PerformanceRow[], fields: string[], limit = 6): string[] {
  if (fields.length < 2) return []
  const briefed = rows.filter((r) => r.brief_count > 0)
  const values = fields.map((f) => {
    const spellings = new Map<string, string>()
    for (const r of briefed) {
      const v = r[f]
      if (v !== null && v !== undefined && groupKey(v) !== '' && !spellings.has(groupKey(v))) spellings.set(groupKey(v), String(v).trim())
    }
    return [...spellings]
  })
  const tried = new Set(briefed.map((r) => fields.map((f) => (r[f] === null || r[f] === undefined ? '' : groupKey(r[f]))).join('\u0000')))
  let combos: [string, string][][] = [[]]
  for (const vs of values) combos = combos.flatMap((c) => vs.map((v) => [...c, v]))
  return combos
    .filter((c) => !tried.has(c.map(([k]) => k).join('\u0000')))
    .slice(0, limit)
    .map((c) => c.map(([, label]) => label).join(' · '))
}
