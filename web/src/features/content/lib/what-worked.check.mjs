// Self-check for what-worked.ts. Run: node src/features/content/lib/what-worked.check.mjs (Node 22.18+ strips the types)
import assert from 'node:assert/strict'
import { defaultMetric, groupStats, hasTime, postDay, shiftMonth, suggestions, weeksOf, withTiming } from './what-worked.ts'

const row = (hook_type, views, brief_count = 1, engagement_rate = null) => ({ hook_type, views, brief_count, engagement_rate })
const rows = [
  row('Question', 100), row('question ', 300), row('question', 200), // one group, spelling drift
  row('bold claim', 50), row('bold claim', 1000, 2), // second one has two versions
  row(null, 999), row('story', 5000, 0), // no value / no brief
  row('story', null), // metric missing: counted as a post, not in the average
]

assert.deepEqual(groupStats(rows, ['hook_type'], 'views', true), [
  { label: 'question', value: 200, posts: 3 },
  { label: 'bold claim', value: 50, posts: 1 },
])
assert.deepEqual(groupStats(rows, ['hook_type'], 'views', false).map((g) => [g.label, g.value]), [['bold claim', 525], ['question', 200]])
assert.deepEqual(groupStats([row('x', 1, 1, 0.1), row('x', 1, 1, 0.3)], ['hook_type'], 'engagement_rate', true)[0].value, 0.2)
assert.deepEqual(groupStats([{ voiceover: false, views: 10, brief_count: 1 }], ['voiceover'], 'views', true)[0].label, 'false')
assert.deepEqual(suggestions(rows, 'hook_type'), ['question', 'bold claim', 'story', 'Question'])
// combinations: one group per pair, posts missing either field left out
const pair = (hook_type, content_format, views) => ({ hook_type, content_format, views, brief_count: 1 })
assert.deepEqual(groupStats([pair('Question', 'tutorial', 10), pair('question', 'tutorial', 30), pair('question', 'vlog', 5), pair('question', null, 99)],
  ['hook_type', 'content_format'], 'views', true), [
  { label: 'Question · tutorial', value: 20, posts: 2 },
  { label: 'question · vlog', value: 5, posts: 1 },
])

// LinkedIn-like rows: no views, so the default falls through to impressions
assert.equal(defaultMetric([{ brief_count: 1, views: null, impressions: 5 }]), 'impressions')
assert.equal(defaultMetric(rows), 'views')
// timing: 00:00 UTC is a date-only export; weekday comes from the date, time of day only from a real time
assert.equal(hasTime('2026-06-20T00:00:00Z'), false)
assert.equal(hasTime('2026-06-20T00:00:00+00:00'), false)
assert.equal(hasTime('2026-06-20T09:30:00Z'), true)
assert.equal(postDay('2026-06-20T00:00:00Z'), '2026-06-20')
const [dateOnly, timed] = withTiming([{ published_at: '2026-06-20T00:00:00Z' }, { published_at: '2026-06-22T09:30:00Z' }, { published_at: null }])
assert.deepEqual([dateOnly.weekday, dateOnly.time_of_day], ['saturday', null])
assert.equal(typeof timed.time_of_day, 'string')
// calendar weeks: Monday first, whole weeks, covering the month
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const june = weeksOf('2026-06') // 1 June 2026 is a Monday
assert.deepEqual([june.length, ymd(june[0][0]), ymd(june.at(-1)[6])], [5, '2026-06-01', '2026-07-05'])
const nov = weeksOf('2026-11') // 1 Nov 2026 is a Sunday: six leading days from October
assert.deepEqual([nov.length, ymd(nov[0][0]), ymd(nov.at(-1)[6])], [6, '2026-10-26', '2026-12-06'])
assert.ok(nov.every((w) => w.length === 7 && w[0].getDay() === 1))
assert.deepEqual([shiftMonth('2026-01', -1), shiftMonth('2026-12', 1)], ['2025-12', '2027-01'])
console.log('what-worked: all checks passed')
