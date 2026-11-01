/** The tide staff: a gauge with ticks, one long magenta tick at the mark. */
export function BrandMark({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden="true">
      <path d="M3 1v14M3 2.75h3M3 5.75h3M3 12.75h3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 9h11" stroke="var(--overprint)" strokeWidth="2" />
    </svg>
  )
}
