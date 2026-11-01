import { queryOptions } from '@tanstack/react-query'
import { apiClient } from './api-client'
import type { Params } from './api-client'
import type { ApiResponse, PageDto, RowDto, SchemaDto } from '../contracts'
import type { Page } from '../types'

// Generic, catalog-driven access to every table/view of the `creator` schema.
// Features add `select: mapPage(toX)` to turn the snake_case rows into their camelCase types.
export const tableKeys = {
  all: ['tables'] as const,
  schema: () => [...tableKeys.all, 'schema'] as const,
  rows: (table: string, params: Params) => [...tableKeys.all, table, params] as const,
}

export const tablesService = {
  schema: () => apiClient.get<ApiResponse<SchemaDto>>('/schema').then((res) => res.data.data),
  list: <T = RowDto>(table: string, params: Params) =>
    apiClient.get<ApiResponse<PageDto<T>>>(`/tables/${table}`, { params }).then((res) => res.data.data),
  create: <T = RowDto>(table: string, data: object) =>
    apiClient.post<ApiResponse<T>>(`/tables/${table}`, data).then((res) => res.data.data),
  update: <T = RowDto>(table: string, key: Params, data: object) =>
    apiClient.patch<ApiResponse<T>>(`/tables/${table}`, data, { params: key }).then((res) => res.data.data),
  remove: <T = RowDto>(table: string, key: Params) =>
    apiClient.delete<ApiResponse<T>>(`/tables/${table}`, { params: key }).then((res) => res.data.data),
}

export const schemaOptions = queryOptions({
  queryKey: tableKeys.schema(),
  queryFn: tablesService.schema,
  staleTime: Infinity,
})

export const rowsOptions = <T = RowDto>(table: string, params: Params = {}) =>
  queryOptions({
    queryKey: tableKeys.rows(table, params),
    queryFn: () => tablesService.list<T>(table, params),
  })

export const mapPage =
  <T, U>(map: (dto: T) => U) =>
  (page: PageDto<T>): Page<U> => ({ rows: page.rows.map(map), total: page.total })

/** ISO timestamp from the API -> Date (null stays null). Calendar days ('YYYY-MM-DD') are left as strings. */
export const toDate = (iso: string | null) => (iso ? new Date(iso) : null)
