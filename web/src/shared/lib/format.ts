import type { Platform } from '../types'

export const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
}

/** Enum values for people: 'text_post' -> 'Text post'. */
export const humanize = (v: string) => (v.charAt(0).toUpperCase() + v.slice(1)).replaceAll('_', ' ').replace(/\bcta\b/i, 'CTA')

/** [value, label] pairs for <Select>. */
export const humanOptions = (values: readonly string[]) => values.map((v) => [v, humanize(v)] as const)

export const platformOptions = (values: readonly string[]) =>
  values.map((v) => [v, PLATFORM_LABEL[v as Platform] ?? v] as const)

const SOURCE: Record<string, string> = { gui_manual: 'Manual entry', csv_export: 'CSV export', xlsx_export: 'XLSX export' }
export const sourceLabel = (kind: string) => SOURCE[kind] ?? humanize(kind)

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
export const num = (v: unknown) => (v === null || v === undefined ? '—' : compact.format(Number(v)))

export function cell(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (v instanceof Date) return dateTime(v)
  if (typeof v === 'object') return JSON.stringify(v)
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 16).replace('T', ' ')
  return String(v)
}

const longDay = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
/** '2026-06-20' or a Date -> '20 Jun 2026'. */
export function prettyDay(d: Date | string | null) {
  if (!d) return '—'
  return longDay.format(typeof d === 'string' ? new Date(`${d.slice(0, 10)}T00:00:00Z`) : d)
}

/** 4 -> 'today', 'yesterday', '4 days ago'. */
export function ago(d: Date) {
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`
}

/** 2026-06-20 13:27 (local time) */
export function dateTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 2026-06-20 (local date) */
export const day = (d: Date | null) => (d ? dateTime(d).slice(0, 10) : '—')
