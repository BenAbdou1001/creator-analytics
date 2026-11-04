// Self-check for the experiment helpers in what-worked.ts. Run: node src/features/content/lib/experiments.check.mjs (Node 22.18+ strips the types)
import assert from 'node:assert/strict'
import { median, reviewFrom, typical, untried } from './what-worked.ts'

assert.equal(median([]), null)
assert.equal(median([3, 1, 2]), 2)
assert.equal(median([4, 1, 3, 2]), 2.5)

const post = (content_id, impressions, extra = {}) => ({ content_id, account_id: 1, brief_count: 1, impressions, ...extra })
const rows = [post(1, 100), post(2, 300), post(3, 900), post(4, null), post(5, 5000, { visibility: 'draft' }), { ...post(6, 7), account_id: 2 }]
// other published posts of the same account that have the number: 300 and 900 -> 600
assert.equal(typical(rows, rows[0], 'impressions'), 600)

assert.equal(reviewFrom(post(1, 1)), null) // no hypothesis
assert.equal(reviewFrom(post(1, 1, { hypothesis: 'x', verdict: 'confirmed', published_at: '2026-01-01T00:00:00Z' })), null)
assert.equal(reviewFrom(post(1, 1, { hypothesis: 'x', visibility: 'draft', published_at: '2026-01-01T00:00:00Z' })), null)
assert.equal(reviewFrom(post(1, 1, { hypothesis: 'x', published_at: '2026-01-01T00:00:00Z' })).toISOString().slice(0, 10), '2026-01-08')

const briefs = [
  post(1, 1, { hook_type: 'Question', content_format: 'tutorial' }),
  post(2, 1, { hook_type: 'question', content_format: 'vlog' }),
  post(3, 1, { hook_type: 'story', content_format: 'tutorial' }),
  post(4, 1, { hook_type: null, content_format: 'listicle' }),
]
assert.deepEqual(untried(briefs, ['hook_type']), [])
assert.deepEqual(untried(briefs, ['hook_type', 'content_format']), ['Question · listicle', 'story · vlog', 'story · listicle'])
assert.deepEqual(untried(briefs, ['hook_type', 'content_format'], 1), ['Question · listicle'])
console.log('experiments: all checks passed')
