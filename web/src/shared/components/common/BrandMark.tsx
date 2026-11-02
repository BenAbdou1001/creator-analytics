/** The product mark: a white rounded tile with rising violet bars. */
export function BrandMark({ className = 'size-11' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#fff" />
      <path d="M8 24v-6M16 24V13M24 24V8" stroke="#6556fb" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  )
}
