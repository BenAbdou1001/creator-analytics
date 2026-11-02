import { useQuery } from '@tanstack/react-query'
import type { ImportBatchDto } from '@/shared/contracts'
import { prettyDay } from '@/shared/lib/format'
import { rowsOptions } from '@/shared/lib/tables'

/** Where a number came from: file, date and checksum of the import that stored it. */
export function Provenance({ batchId }: { batchId: number | null | undefined }) {
  const { data } = useQuery({
    ...rowsOptions<ImportBatchDto>('import_batches', { batch_id: batchId }),
    enabled: !!batchId,
    select: (page) => page.rows[0],
  })
  if (!data) return null
  return (
    <p className="text-xs text-muted-foreground">
      Saved from {data.file_name ?? data.source_label} on {prettyDay(new Date(data.imported_at))}
      {data.file_sha256 && (
        <>
          {' · '}
          <span className="tabular-nums" title={`SHA-256 ${data.file_sha256}`}>
            {data.file_sha256.slice(0, 8)}
          </span>
        </>
      )}
    </p>
  )
}
