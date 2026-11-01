import { queryOptions } from '@tanstack/react-query'
import type { ImportBatchDto } from '@/shared/contracts'
import { mapPage, rowsOptions } from '@/shared/lib/tables'
import { toImportBatch } from './mappers'

export const importBatchesOptions = queryOptions({
  ...rowsOptions<ImportBatchDto>('import_batches', { order_by: 'imported_at', limit: 20 }),
  select: mapPage(toImportBatch),
})
