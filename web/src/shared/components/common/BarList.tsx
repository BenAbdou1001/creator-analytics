import { Sounding } from './Sounding'

/** Ranked values as labelled bars. Neutral bars, the accent marks the leader: the bar length is the message. */
export function BarList({ items, suffix }: { items: { label: string; value: number; note?: string }[]; suffix?: string }) {
  const max = Math.max(...items.map((i) => i.value), 0) || 1
  return (
    <ul className="grid gap-2">
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-sm">
          <span className="truncate" title={i.label}>
            <span dir="auto">{i.label}</span>
            {i.note && <span className="ml-2 text-muted-foreground">{i.note}</span>}
          </span>
          <span className="text-right">
            <Sounding value={i.value} />
            {suffix}
          </span>
          <span className="col-span-2 mt-0.5 h-1.5 rounded-full bg-muted">
            <span className={`block h-full rounded-full ${i.value === max ? 'bg-primary' : 'bg-foreground/25'}`} style={{ width: `${(i.value / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  )
}
