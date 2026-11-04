import type { ColumnDto, ContentBriefDto } from '@/shared/contracts'
import { humanize, prettyDay } from '@/shared/lib/format'
import { SECTIONS, filled } from '../lib/brief'

function show(v: unknown, enumCol: boolean): string {
  if (Array.isArray(v)) return v.join(' · ')
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return enumCol ? humanize(String(v)) : String(v)
}

/** A brief, read-only: only the filled fields, grouped like the form. */
export function BriefView({ brief, columns, enums }: { brief: ContentBriefDto; columns: ColumnDto[]; enums: Record<string, string[]> }) {
  const type = new Map(columns.map((c) => [c.name, c.type]))
  const sections = SECTIONS.map(([title, names]) => [title, names.filter((n) => n !== 'active_from' && filled(brief[n]))] as const).filter(
    ([, names]) => names.length,
  )
  return (
    <div className="grid gap-4">
      <p className="text-xs text-muted-foreground">Live since {prettyDay(brief.active_from)}</p>
      {sections.map(([title, names]) => (
        <section key={title} className="border-t pt-4">
          <h3 className="mb-2 text-sm font-medium">{title}</h3>
          <dl className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
            {names.map((n) => (
              <div key={n} className="contents">
                <dt className="text-muted-foreground">{humanize(n)}</dt>
                <dd dir="auto" className="whitespace-pre-wrap">
                  {show(brief[n], Boolean(enums[type.get(n) ?? '']))}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
