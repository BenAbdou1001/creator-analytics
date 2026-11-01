import type { ImportBatchDto, ImportPreviewDto, ImportResultDto } from '@/shared/contracts'
import { toDate } from '@/shared/lib/tables'
import type { ImportBatch, ImportInput, ImportPreview, ImportResult } from '../types'

export function toImportBatch(dto: ImportBatchDto): ImportBatch {
  return {
    batchId: dto.batch_id,
    accountId: dto.account_id,
    sourceKind: dto.source_kind,
    sourceLabel: dto.source_label,
    fileName: dto.file_name,
    rowCount: dto.row_count,
    importedAt: new Date(dto.imported_at),
  }
}

export function toImportResult(dto: ImportResultDto): ImportResult {
  return {
    batchId: dto.batch_id,
    contentUpserted: dto.content_upserted,
    factsInserted: dto.facts_inserted,
    unknownMetrics: dto.unknown_metrics,
    rangeStart: dto.range_start,
    rangeEnd: dto.range_end,
    accountMetrics: dto.account_metrics && toImportResult(dto.account_metrics),
    content: dto.content && toImportResult(dto.content),
    demographicRows: dto.demographic_rows,
  }
}

export function toImportPreview(dto: ImportPreviewDto): ImportPreview {
  return { kind: dto.kind, alreadyImportedAt: toDate(dto.already_imported_at), result: toImportResult(dto.result) }
}

/** The multipart body the import endpoint expects (snake_case form fields). */
export function toImportFormData(input: ImportInput): FormData {
  const form = new FormData()
  form.set('file', input.file)
  form.set('account_id', String(input.accountId))
  form.set('kind', input.kind)
  if (input.defaultContentType) form.set('default_content_type', input.defaultContentType)
  if (input.periodKind) form.set('period_kind', input.periodKind)
  return form
}
