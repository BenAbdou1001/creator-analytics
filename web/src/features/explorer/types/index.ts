import type { Row } from '@/shared/types'
import type { FormValues } from '@/shared/lib/row-form'

export interface ExplorerSearch {
  table: string
  offset: number
  filter_col?: string
  filter_val?: string
}

/** Row being edited in the form; `key` and `initial` are null for a new row. */
export interface RowDraft {
  key: Row | null
  values: FormValues
  initial: FormValues | null
}

export function validateExplorerSearch(s: Record<string, unknown>): ExplorerSearch {
  return {
    table: (s.table as string) || 'accounts',
    offset: Number(s.offset ?? 0),
    filter_col: (s.filter_col as string) || undefined,
    filter_val: (s.filter_val as string) || undefined,
  }
}
