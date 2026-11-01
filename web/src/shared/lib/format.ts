import type { Platform } from '../types'

export const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
export const num = (v: unknown) => (v === null || v === undefined ? '—' : compact.format(Number(v)))

export function cell(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (v instanceof Date) return dateTime(v)
  if (typeof v === 'object') return JSON.stringify(v)
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 16).replace('T', ' ')
  return String(v)
}

/** 2026-06-20 13:27 (local time) */
export function dateTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 2026-06-20 (local date) */
export const day = (d: Date | null) => (d ? dateTime(d).slice(0, 10) : '—')
