import { Sounding } from './Sounding'

/** Ranked values as labelled bars. One hue: the bar length is the message. */
export function BarList({ items, suffix }: { items: { label: string; value: number }[]; suffix?: string }) {
  const max = Math.max(...items.map((i) => i.value), 0) || 1
  return (
    <ul className="grid gap-2">
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-sm">
          <span dir="auto" className="truncate" title={i.label}>
            {i.label}
          </span>
          <span className="text-right">
            <Sounding value={i.value} />
            {suffix}
          </span>
          <span className="col-span-2 mt-0.5 h-1 rounded-sm bg-muted">
            <span className="block h-full rounded-sm bg-deep" style={{ width: `${(i.value / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  )
}
