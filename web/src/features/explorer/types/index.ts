import type { Row } from '@/shared/types'

export interface ExplorerSearch {
  table: string
  offset: number
  filter_col?: string
  filter_val?: string
}

/** Row being edited as JSON; `key` is null for a new row. */
export interface RowDraft {
  key: Row | null
  text: string
}

export function validateExplorerSearch(s: Record<string, unknown>): ExplorerSearch {
  return {
    table: (s.table as string) || 'accounts',
    offset: Number(s.offset ?? 0),
    filter_col: (s.filter_col as string) || undefined,
    filter_val: (s.filter_val as string) || undefined,
  }
}
