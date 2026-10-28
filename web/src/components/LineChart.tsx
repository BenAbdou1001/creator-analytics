import { useEffect, useRef, useState } from 'react'
import type { Point } from '../lib/api'

const H = 240
const PAD = { top: 12, right: 12, bottom: 24, left: 48 }
const fmt = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0, 1]
  const raw = max / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step)
}

/** Single-series line chart with crosshair + tooltip. */
export function LineChart({ points, label }: { points: Point[]; label: string }) {
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
  const innerW = Math.max(0, width - PAD.left - PAD.right)
  const innerH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (points.length < 2 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join('')
  const xLabels = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])].filter((i) => i >= 0)

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left
    const i = points.length < 2 ? 0 : Math.round((px / innerW) * (points.length - 1))
    setHover(Math.min(points.length - 1, Math.max(0, i)))
  }

  const h = hover !== null ? points[hover] : null
  return (
    <div ref={ref} className="relative w-full" style={{ height: H }}>
      {width > 0 && (
        <svg width={width} height={H} role="img" aria-label={`${label} over time`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line)" />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--ink-3)">
                {fmt.format(t)}
              </text>
            </g>
          ))}
          {xLabels.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={H - 6}
              fontSize={11}
              fill="var(--ink-3)"
              textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
            >
              {points[i].period_start}
            </text>
          ))}
          <path d={`${path}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill="var(--accent)" opacity={0.08} />
          <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />
          {h && (
            <g pointerEvents="none">
              <line x1={x(hover!)} x2={x(hover!)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--ink-3)" />
              <circle cx={x(hover!)} cy={y(h.value)} r={4} fill="var(--accent)" stroke="var(--panel)" strokeWidth={2} />
            </g>
          )}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}
      {h && (
        <div
          className="pointer-events-none absolute top-0 rounded-md border border-line bg-panel px-2.5 py-1.5 text-xs shadow-sm"
          style={{ left: Math.min(x(hover!) + 10, width - 140) }}
        >
          <div className="text-sm font-semibold tabular-nums">{h.value.toLocaleString('en')}</div>
          <div className="text-ink-3">
            {label} · {h.period_start}
            {h.period_end !== h.period_start && ` → ${h.period_end}`}
          </div>
        </div>
      )}
    </div>
  )
}
