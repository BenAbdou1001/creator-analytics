import { rowsOptions } from '@/shared/lib/tables'

// Rows stay exactly as stored (snake_case column names): the explorer edits them as raw JSON,
// so they are not mapped to camelCase like the other features' data.
import type { ExplorerSearch } from '../types'

export const EXPLORER_PAGE_SIZE = 50

export const explorerRowsOptions = (s: ExplorerSearch) =>
  rowsOptions(s.table, {
    limit: EXPLORER_PAGE_SIZE,
    offset: s.offset,
    ...(s.filter_col ? { [`${s.filter_col}__like`]: s.filter_val } : {}),
  })
