import { PLATFORM_LABEL } from '@/shared/lib/format'
import type { Platform } from '@/shared/types'

export function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <span className="size-2 rounded-full" style={{ background: `var(--${platform})` }} />
      {PLATFORM_LABEL[platform] ?? platform}
    </span>
  )
}
