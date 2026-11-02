import type { ImportResult } from '../types'

/** One sentence in the person's terms; the same wording for the dry run and the real thing. */
export function resultLine(r: ImportResult, verb: string) {
  if (r.accountMetrics) {
    const parts = [`${r.accountMetrics.factsInserted ?? 0} account values`, `${r.content?.contentUpserted ?? 0} posts`, `${r.demographicRows ?? 0} audience rows`]
    return `${parts.join(', ')} ${verb}.`
  }
  const posts = r.contentUpserted !== undefined ? `${r.contentUpserted} ${r.contentUpserted === 1 ? 'post' : 'posts'} and ` : ''
  return `${posts}${r.factsInserted ?? 0} values ${verb}.`
}

export function ImportSummary({ result, fileName }: { result: ImportResult; fileName: string }) {
  return (
    <p role="status" className="text-sm">
      {fileName}: {resultLine(result, 'saved')}
    </p>
  )
}
