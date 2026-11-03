import type { ColumnDto } from '@/shared/contracts'

/** One form control's value: text for most columns (text arrays: one item per line), a flag for required booleans, a list for enum arrays. */
export type FieldValue = string | boolean | string[]
export type FormValues = Record<string, FieldValue>

export type FieldKind = 'enum' | 'enum-list' | 'text-list' | 'flag' | 'yes-no' | 'number' | 'date' | 'json' | 'text'

const NUMBER = new Set(['integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision'])

export function fieldKind(col: ColumnDto, enums: Record<string, string[]>): FieldKind {
  if (col.type.endsWith('[]') && enums[col.type.slice(0, -2)]) return 'enum-list'
  if (col.type === 'text[]') return 'text-list'
  if (enums[col.type]) return 'enum'
  if (col.type === 'boolean') return col.required ? 'flag' : 'yes-no'
  if (NUMBER.has(col.type)) return 'number'
  if (col.type === 'date') return 'date'
  if (col.type === 'jsonb' || col.type === 'json') return 'json'
  // timestamps stay text so editing never shifts their time zone
  return 'text'
}


export function toFieldValue(col: ColumnDto, kind: FieldKind, value: unknown): FieldValue {
  if (kind === 'flag') return value === null || value === undefined ? col.default === 'true' : Boolean(value)
  if (kind === 'enum-list') return Array.isArray(value) ? value.map(String) : []
  if (value === null || value === undefined) return ''
  if (kind === 'yes-no') return value ? 'true' : 'false'
  if (kind === 'json') return JSON.stringify(value, null, 2)
  if (kind === 'text-list') return Array.isArray(value) ? value.join('\n') : String(value)
  if (kind === 'date') return String(value).slice(0, 10)
  return String(value)
}

/** Form value back to what the API stores. Throws a readable message for input it cannot convert. */
export function fromFieldValue(col: ColumnDto, kind: FieldKind, value: FieldValue): unknown {
  if (kind === 'flag') return Boolean(value)
  if (kind === 'enum-list') return (value as string[]).length || col.required ? value : null
  const text = String(value)
  if (text.trim() === '') return null
  if (kind === 'yes-no') return text === 'true'
  if (kind === 'text-list') return text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (kind === 'number') {
    const n = Number(text)
    if (!Number.isFinite(n)) throw new Error(`${col.name} must be a number`)
    return n
  }
  if (kind === 'json') {
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(`${col.name} is not valid JSON`)
    }
  }
  return text
}

const same = (a: FieldValue, b: FieldValue) => JSON.stringify(a) === JSON.stringify(b)
const blank = (v: FieldValue) => v === '' || (Array.isArray(v) && v.length === 0)

/**
 * The request body for a save. A new row sends only filled-in fields, so column defaults apply; an edit sends only
 * the fields that changed, so untouched values are never rewritten.
 */
export function rowBody(columns: ColumnDto[], enums: Record<string, string[]>, values: FormValues, initial: FormValues | null) {
  const body: Record<string, unknown> = {}
  for (const col of columns) {
    if (!(col.name in values)) continue
    if (initial ? same(values[col.name], initial[col.name]) : blank(values[col.name])) continue
    body[col.name] = fromFieldValue(col, fieldKind(col, enums), values[col.name])
  }
  return body
}

/** Form values for a row. Keys are never edited, and a new row leaves out columns the database numbers itself. */
export function formValues(columns: ColumnDto[], enums: Record<string, string[]>, pk: string[], row: Record<string, unknown> | null): FormValues {
  const editable = columns.filter((c) => (row ? !pk.includes(c.name) : c.default !== 'autoincrement'))
  return Object.fromEntries(editable.map((c) => [c.name, toFieldValue(c, fieldKind(c, enums), row?.[c.name])]))
}
