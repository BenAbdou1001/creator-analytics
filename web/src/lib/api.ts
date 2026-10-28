import { queryOptions } from '@tanstack/react-query'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type Row = Record<string, any>
export type Page = { rows: Row[]; total: number }
export type Column = { name: string; type: string; required: boolean; default: string | null }
export type Schema = {
  tables: Record<string, { view: boolean; columns: Column[]; pk: string[] }>
  enums: Record<string, string[]>
}
type Params = Record<string, string | number | boolean | null | undefined>

function qs(params: Params = {}) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_URL + path, {
    ...init,
    headers: init?.body instanceof FormData ? init.headers : { 'Content-Type': 'application/json', ...init?.headers },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.detail ? String(typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)) : res.statusText)
  return body as T
}

// --- queries -------------------------------------------------------------
export const schemaQuery = queryOptions({
  queryKey: ['schema'],
  queryFn: () => api<Schema>('/api/schema'),
  staleTime: Infinity,
})

export const rowsQuery = (table: string, params: Params = {}) =>
  queryOptions({
    queryKey: ['rows', table, params],
    queryFn: () => api<Page>(`/api/tables/${table}${qs(params)}`),
  })

export type Overview = {
  account_id: number
  platform: Platform
  handle: string
  display_name: string | null
  account_type: string
  followers: number | null
  content_count: number
  total_views: number | null
  total_engagements: number | null
  last_import: string | null
}
export const overviewQuery = queryOptions({
  queryKey: ['overview'],
  queryFn: () => api<Overview[]>('/api/dashboard/overview'),
})

export type Point = { period_start: string; period_end: string; value: number }
export const timeseriesQuery = (p: { account_id: number; metric_key: string; start?: string; end?: string }) =>
  queryOptions({
    queryKey: ['timeseries', p],
    queryFn: () => api<Point[]>(`/api/dashboard/timeseries${qs(p)}`),
  })

// --- mutations -----------------------------------------------------------
export const createRow = (table: string, data: Row) =>
  api<Row>(`/api/tables/${table}`, { method: 'POST', body: JSON.stringify(data) })
export const updateRow = (table: string, key: Row, data: Row) =>
  api<Row>(`/api/tables/${table}${qs(key)}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteRow = (table: string, key: Row) =>
  api<Row>(`/api/tables/${table}${qs(key)}`, { method: 'DELETE' })
export const importCsv = (form: FormData) => api<Row>('/api/import/csv', { method: 'POST', body: form })

// --- formatting ----------------------------------------------------------
export type Platform = 'youtube' | 'tiktok' | 'instagram' | 'linkedin'
export const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
}

const nf = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
export const num = (v: unknown) => (v === null || v === undefined ? '—' : nf.format(Number(v)))

export function cell(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 16).replace('T', ' ')
  return String(v)
}
