/** The product mark: one white stroke writing C then A, on a violet tile. Shape matches assets/logo/symbol.svg */
export function BrandMark({ className = 'size-11' }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden="true">
      <rect width="256" height="256" rx="72" fill="#6556fb" />
      <path
        transform="translate(32 32) scale(.75)"
        fill="#fff"
        d="M118.80 80.55A68.54 68.54 0 1 0 143.89 174.17L184.96 103.04L209.62 195.09A15.45 15.45 0 0 0 239.47 187.10L205.15 59.01A15.45 15.45 0 0 0 176.85 55.28L117.13 158.72A37.63 37.63 0 1 1 103.35 107.31A15.45 15.45 0 0 0 118.80 80.55Z"
      />
    </svg>
  )
}
