import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import type { ColumnDto } from '@/shared/contracts'
import type { FieldKind, FieldValue } from '@/shared/lib/row-form'

/** Kinds that take a whole form row. */
export const WIDE: FieldKind[] = ['json', 'enum-list', 'text-list']

/** The input for one column, picked from its kind. `list` = id of a <datalist> of suggestions for text. */
export function FieldControl({ col, kind, options, value, onChange, list }: {
  col: ColumnDto
  kind: FieldKind
  options: string[]
  value: FieldValue
  onChange: (v: FieldValue) => void
  list?: string
}) {
  const required = col.required && !col.default
  switch (kind) {
    case 'yes-no':
      return (
        <Select className="w-full" value={value as string} onValueChange={(v) => onChange(v)} placeholder="—" options={[['true', 'Yes'], ['false', 'No']]} />
      )
    case 'enum':
      return (
        <Select className="w-full" required={required} value={value as string} onValueChange={(v) => onChange(v)} placeholder={required ? 'Choose…' : '—'} options={options} />
      )
    case 'enum-list': {
      const picked = value as string[]
      return (
        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
          {options.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm font-normal text-foreground">
              <input
                type="checkbox"
                className="size-4 accent-(--primary)"
                checked={picked.includes(o)}
                onChange={(e) => onChange(e.target.checked ? [...picked, o] : picked.filter((p) => p !== o))}
              />
              {o}
            </label>
          ))}
        </div>
      )
    }
    case 'text-list':
      return <Textarea className="min-h-20" dir="auto" placeholder="One per line" value={value as string} onChange={(e) => onChange(e.target.value)} />
    case 'json':
      return <Textarea className="min-h-24 font-mono text-xs" required={required} value={value as string} onChange={(e) => onChange(e.target.value)} />
    default:
      return (
        <Input
          type={kind === 'number' ? 'number' : kind === 'date' ? 'date' : 'text'}
          step={kind === 'number' ? 'any' : undefined}
          dir={kind === 'text' ? 'auto' : undefined}
          placeholder={col.type.startsWith('timestamp') ? '2026-01-31T09:00:00+00:00' : undefined}
          required={required}
          list={list}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }
}
