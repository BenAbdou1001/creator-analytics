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
  // LinkedIn .xlsx imports return one result per part
  accountMetrics?: ImportResult
  content?: ImportResult | null
  demographicRows?: number
}

export type ImportKind = 'content' | 'account_metrics'

export interface ImportInput {
  accountId: number
  kind: ImportKind
  defaultContentType?: string
  periodKind?: string
  file: File
}
