import { useEffect, useRef, useState } from 'react'
import { prettyDay } from '@/shared/lib/format'
import { Sounding } from '@/shared/components/common/Sounding'
import type { Point } from '../types'

const H = 260
const PAD = { top: 24, right: 12, bottom: 24, left: 48 }
const DAY = 86_400_000
const fmt = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const ms = (d: string) => Date.parse(`${d}T00:00:00Z`)
const AXIS = { fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }

function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0, 1]
  const raw = max / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step)
}

export interface ChartPost {
  date: string
  title: string | null
}

/** One metric over real calendar time, with the tide line: where the platform's own memory ends. */
export function LineChart({ points, label, color, platform, retentionDays, posts = [] }: {
  points: Point[]
  label: string
  color: string
  platform: string
  retentionDays?: number | null
  posts?: ChartPost[]
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current!
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const values = points.map((p) => p.value)
  const ticks = niceTicks(Math.max(0, ...values))
  const yMax = ticks[ticks.length - 1]
  const yMin = Math.min(0, ...values) // platforms do report negative days, such as removed engagements
  const innerW = Math.max(0, width - PAD.left - PAD.right)
  const innerH = H - PAD.top - PAD.bottom
  const t0 = ms(points[0].periodStart)
  const t1 = ms(points[points.length - 1].periodStart)
  const x = (t: number) => PAD.left + (t1 === t0 ? innerW / 2 : ((t - t0) / (t1 - t0)) * innerW)
  const y = (v: number) => PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH
  // a missing stretch stays a gap: the chart never draws a line through days nobody saved
  const path = points
    .map((p, i) => {
      const gap = i > 0 && ms(p.periodStart) - ms(points[i - 1].periodEnd) > DAY
      return `${i === 0 || gap ? 'M' : 'L'}${x(ms(p.periodStart))},${y(p.value)}`
    })
    .join('')

  const now = new Date()
  const tide = retentionDays ? Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - retentionDays * DAY : null
  const lineShown = tide !== null && tide > t0 && tide <= t1
  const bandEnd = tide === null ? null : tide > t1 ? x(t1) : lineShown ? x(tide) : null
  const bandW = bandEnd === null ? 0 : bandEnd - PAD.left
  const onlyHere = tide === null ? 0 : points.filter((p) => ms(p.periodStart) < tide).length
  const tideLabelRight = lineShown && x(tide) + 170 < width
  const inRange = posts.filter((p) => ms(p.date) >= t0 && ms(p.date) <= t1)

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const t = t0 + ((e.clientX - e.currentTarget.getBoundingClientRect().left) / innerW) * (t1 - t0)
    let best = 0
    points.forEach((p, i) => {
      if (Math.abs(ms(p.periodStart) - t) < Math.abs(ms(points[best].periodStart) - t)) best = i
    })
    setHover(best)
  }

  function onKey(e: React.KeyboardEvent) {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key]
    if (!step) return
    e.preventDefault()
    setHover((h) => Math.min(points.length - 1, Math.max(0, (h ?? points.length - 1) + step)))
  }

  const h = hover !== null ? points[hover] : null
  const hx = h ? x(ms(h.periodStart)) : 0
  const posted = h ? posts.find((p) => p.date === h.periodStart) : undefined
  const peak = points.reduce((a, b) => (b.value > a.value ? b : a))
  const summary = `${label}, ${points.length} values from ${prettyDay(points[0].periodStart)} to ${prettyDay(points[points.length - 1].periodStart)}. Highest ${peak.value.toLocaleString('en')} on ${prettyDay(peak.periodStart)}. Use the arrow keys to read each day.`

  return (
    <>
      <div ref={ref} className="relative w-full" style={{ height: H }}>
        {width > 0 && (
          <svg
            width={width}
            height={H}
            role="img"
            aria-label={summary}
            tabIndex={0}
            onKeyDown={onKey}
            onBlur={() => setHover(null)}
            className="rounded-sm"
          >
            {bandW > 0 && <rect x={PAD.left} y={PAD.top} width={bandW} height={innerH} fill="var(--shoal)" />}
            {bandW > 140 && (
              <text x={PAD.left + bandW / 2} y={PAD.top + 16} textAnchor="middle" {...AXIS} fill="var(--ink-2)">
                Only you have this
              </text>
            )}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" {...AXIS}>
                  {fmt.format(t)}
                </text>
              </g>
            ))}
            {[t0, (t0 + t1) / 2, t1].map((t, i) => (
              <text key={i} x={x(t)} y={H - 6} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} {...AXIS}>
                {prettyDay(new Date(t))}
              </text>
            ))}
            {inRange.map((p, i) => (
              <rect key={i} x={x(ms(p.date)) - 1} y={PAD.top + innerH + 1} width={2} height={5} fill="var(--ink-3)" />
            ))}
            <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
            {lineShown && (
              <g>
                <line className="tide-line" x1={x(tide)} x2={x(tide)} y1={PAD.top - 8} y2={PAD.top + innerH} stroke="var(--overprint)" strokeWidth={1.5} />
                <text x={x(tide) + (tideLabelRight ? 6 : -6)} y={PAD.top - 10} textAnchor={tideLabelRight ? 'start' : 'end'} {...AXIS} fill="var(--overprint)">
                  {platform} keeps from here
                </text>
              </g>
            )}
            {h && (
              <g pointerEvents="none">
                <line x1={hx} x2={hx} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--muted-foreground)" />
                <circle cx={hx} cy={y(h.value)} r={4} fill={color} stroke="var(--card)" strokeWidth={2} />
              </g>
            )}
            <rect
              x={PAD.left}
              y={PAD.top}
              width={innerW}
              height={innerH + 8}
              fill="transparent"
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
            />
          </svg>
        )}
        {h && (
          <div
            className="pointer-events-none absolute top-6 max-w-60 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-sm"
            style={{ left: Math.min(hx + 10, width - 240) }}
          >
            <Sounding value={h.value} full className="text-sm" />
            <div className="text-muted-foreground">
              {prettyDay(h.periodStart)}
              {h.periodEnd !== h.periodStart && ` to ${prettyDay(h.periodEnd)}`}
            </div>
            {posted && (
              <div dir="auto" className="mt-1 truncate">
                Posted: {posted.title ?? 'untitled'}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        {tide !== null && (
          <span>
            {platform} keeps this {retentionDays} days.{' '}
            {onlyHere > 0 ? `${onlyHere} ${onlyHere === 1 ? 'day' : 'days'} here exist only in your copy.` : 'All of this is still on the platform.'}
          </span>
        )}
        {inRange.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-0.5 bg-(--ink-3)" aria-hidden="true" />
            Post published
          </span>
        )}
      </div>
    </>
  )
}
