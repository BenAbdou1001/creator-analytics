// UI shapes: camelCase, real Dates. Wire shapes live in @/shared/contracts.
export interface ImportBatch {
  batchId: number
  accountId: number | null
  sourceKind: string
  sourceLabel: string
  fileName: string | null
  rowCount: number | null
  importedAt: Date
}

export interface ImportResult {
  batchId?: number
  contentUpserted?: number
  factsInserted?: number
  unknownMetrics?: string[]
  rangeStart?: string | null
  rangeEnd?: string | null
  // LinkedIn .xlsx imports return one result per part
  accountMetrics?: ImportResult
  content?: ImportResult | null
  demographicRows?: number
}

export type ImportKind = 'auto' | 'content' | 'account_metrics'

export interface ImportPreview {
  kind: 'content' | 'account_metrics' | 'linkedin_xlsx'
  alreadyImportedAt: Date | null
  result: ImportResult
}

export interface ImportInput {
  accountId: number
  kind: ImportKind
  defaultContentType?: string
  periodKind?: string
  file: File
}
