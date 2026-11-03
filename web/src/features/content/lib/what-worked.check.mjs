// Self-check for what-worked.ts. Run: node src/features/content/lib/what-worked.check.mjs (Node 22.18+ strips the types)
import assert from 'node:assert/strict'
import { groupStats, suggestions } from './what-worked.ts'

const row = (hook_type, views, brief_count = 1, engagement_rate = null) => ({ hook_type, views, brief_count, engagement_rate })
const rows = [
  row('Question', 100), row('question ', 300), row('question', 200), // one group, spelling drift
  row('bold claim', 50), row('bold claim', 1000, 2), // second one has two versions
  row(null, 999), row('story', 5000, 0), // no value / no brief
  row('story', null), // metric missing: counted as a post, not in the average
]

assert.deepEqual(groupStats(rows, 'hook_type', 'views', true), [
  { label: 'question', value: 200, posts: 3 },
  { label: 'bold claim', value: 50, posts: 1 },
])
assert.deepEqual(groupStats(rows, 'hook_type', 'views', false).map((g) => [g.label, g.value]), [['bold claim', 525], ['question', 200]])
assert.deepEqual(groupStats([row('x', 1, 1, 0.1), row('x', 1, 1, 0.3)], 'hook_type', 'engagement_rate', true)[0].value, 0.2)
assert.deepEqual(groupStats([{ voiceover: false, views: 10, brief_count: 1 }], 'voiceover', 'views', true)[0].label, 'false')
assert.deepEqual(suggestions(rows, 'hook_type'), ['question', 'bold claim', 'story', 'Question'])
console.log('what-worked: all checks passed')
