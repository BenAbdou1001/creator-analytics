// Self-check for row-form.ts. Run: node src/shared/lib/row-form.check.mjs (Node 22.18+ strips the types)
import assert from 'node:assert/strict'
import { fieldKind, fromFieldValue, rowBody, toFieldValue } from './row-form.ts'

const enums = { platform_t: ['youtube', 'linkedin'], content_type_t: ['video', 'post'] }
const col = (name, type, required = false, def = null) => ({ name, type, required, default: def })
const cols = [
  col('account_id', 'bigint', true, 'autoincrement'),
  col('platform', 'platform_t', true),
  col('handle', 'text', true),
  col('is_monetized', 'boolean', true, 'false'),
  col('verified', 'boolean'),
  col('followers', 'integer'),
  col('created_on', 'date'),
  col('types', 'content_type_t[]'),
  col('extra', 'jsonb'),
  col('points', 'text[]'),
  col('captured_at', 'timestamp with time zone'),
]
const kinds = Object.fromEntries(cols.map((c) => [c.name, fieldKind(c, enums)]))
assert.deepEqual(kinds, {
  account_id: 'number', platform: 'enum', handle: 'text', is_monetized: 'flag', verified: 'yes-no',
  followers: 'number', created_on: 'date', types: 'enum-list', extra: 'json', points: 'text-list', captured_at: 'text',
})

const row = { platform: 'linkedin', handle: 'nadia', is_monetized: false, verified: null, followers: 12,
  created_on: '2026-01-05', types: ['post'], extra: { a: 1 }, captured_at: '2026-10-28T09:00:00+00:00' }
const values = Object.fromEntries(cols.slice(1).map((c) => [c.name, toFieldValue(c, kinds[c.name], row[c.name])]))
assert.equal(values.verified, '')
assert.equal(values.followers, '12')
assert.equal(values.captured_at, row.captured_at)

// text arrays: one item per line, blank lines dropped, empty -> null
assert.equal(toFieldValue(cols[9], 'text-list', ['a', 'b']), 'a\nb')
assert.deepEqual(fromFieldValue(cols[9], 'text-list', ' a \n\nb\n'), ['a', 'b'])
assert.equal(fromFieldValue(cols[9], 'text-list', ' \n'), null)

// an edit sends only what changed, with types restored
assert.deepEqual(rowBody(cols, enums, values, values), {})
const edited = { ...values, followers: '40', verified: 'true', types: [], handle: '' , extra: '{"b":2}' }
assert.deepEqual(rowBody(cols, enums, edited, values), { handle: null, verified: true, followers: 40, types: null, extra: { b: 2 } })

// a new row skips blanks so defaults apply, and keeps flags
const fresh = Object.fromEntries(cols.slice(1).map((c) => [c.name, toFieldValue(c, kinds[c.name], undefined)]))
assert.equal(fresh.is_monetized, false)
assert.deepEqual(rowBody(cols, enums, { ...fresh, platform: 'youtube', handle: 'x' }, null), { platform: 'youtube', handle: 'x', is_monetized: false })

assert.throws(() => fromFieldValue(cols[5], 'number', 'abc'), /followers must be a number/)
assert.throws(() => fromFieldValue(cols[8], 'json', '{'), /extra is not valid JSON/)
console.log('row-form: all checks passed')
