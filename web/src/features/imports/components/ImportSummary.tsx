import type { ImportResult } from '../types'

/** One sentence in the person's terms; the same wording for the dry run and the real thing. */
const count = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`
const list = new Intl.ListFormat('en', { type: 'conjunction' })

export function resultLine(r: ImportResult, verb: string) {
  const posts = r.accountMetrics ? r.content?.contentUpserted : r.contentUpserted
  const parts = [
    posts ? count(posts, 'post', 'posts') : '',
    count((r.accountMetrics ?? r).factsInserted ?? 0, r.accountMetrics ? 'account value' : 'value', r.accountMetrics ? 'account values' : 'values'),
    r.demographicRows ? count(r.demographicRows, 'audience row', 'audience rows') : '',
  ].filter(Boolean)
  return `${list.format(parts)} ${verb}`
}

export function ImportSummary({ result, fileName }: { result: ImportResult; fileName: string }) {
  return (
    <p role="status" className="text-sm">
      {fileName}: {resultLine(result, 'saved')}
    </p>
  )
}
