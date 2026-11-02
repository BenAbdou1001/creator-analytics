// Shared UI-side types. Wire DTOs live in ../contracts.
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message)
  }
}

export type Platform = 'youtube' | 'tiktok' | 'instagram' | 'linkedin'

export interface Page<T> {
  rows: T[]
  total: number
}

/** A raw row of any table, as the data explorer edits it (column names stay as in the database). */
export type Row = Record<string, any>

export type { SchemaDto as Schema, ColumnDto as Column } from '../contracts'
export type TableMeta = import('../contracts').SchemaDto['tables'][string]
