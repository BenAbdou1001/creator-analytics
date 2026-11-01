import type { ImportResult } from '../types'

export function ImportSummary({ result }: { result: ImportResult }) {
  if (result.accountMetrics)
    return (
      <p>
        LinkedIn export: {result.accountMetrics.factsInserted} account values, {result.content?.contentUpserted ?? 0} posts,{' '}
        {result.demographicRows} demographic rows.
      </p>
    )
  return (
    <p>
      Batch #{result.batchId}: {result.contentUpserted !== undefined && `${result.contentUpserted} items upserted, `}
      {result.factsInserted} metric values stored.
      {!!result.unknownMetrics?.length && (
        <span className="text-muted-foreground"> Ignored columns: {result.unknownMetrics.join(', ')}.</span>
      )}
    </p>
  )
}
