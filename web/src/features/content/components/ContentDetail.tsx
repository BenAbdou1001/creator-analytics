import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
import { DataTable } from '@/shared/components/common/DataTable'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { PlatformBadge } from '@/shared/components/common/PlatformBadge'
import { Provenance } from '@/shared/components/common/Provenance'
import { Sounding } from '@/shared/components/common/Sounding'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { PLATFORM_LABEL, humanize, prettyDay } from '@/shared/lib/format'
import { contentBatchOptions, contentItemOptions, contentMetricsOptions, contentSummaryOptions } from '../api/queries'

export function ContentDetail({ id, onClose }: { id: number | undefined; onClose: () => void }) {
  const enabled = id !== undefined
  const summary = useQuery({ ...contentSummaryOptions(id ?? 0), enabled })
  const item = useQuery({ ...contentItemOptions(id ?? 0), enabled })
  const metrics = useQuery({ ...contentMetricsOptions(id ?? 0), enabled })
  const batch = useQuery({ ...contentBatchOptions(id ?? 0), enabled })
  const s = summary.data
  const c = item.data

  return (
    <Sheet open={enabled} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          {s && <PlatformBadge platform={s.platform} />}
          <SheetTitle dir="auto" className="pr-6 leading-snug font-medium">
            {summary.isSuccess && !s ? 'Post not found' : (s?.title ?? 'Untitled')}
          </SheetTitle>
          <SheetDescription asChild>
            <div className="grid gap-1">
              {s?.publishedAt && <span>Published {prettyDay(s.publishedAt)}</span>}
              {c?.url && (
                <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1 text-deep hover:underline">
                  Open on {s ? PLATFORM_LABEL[s.platform] : 'platform'}
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              )}
              {c?.deletedObservedAt && s && (
                <span className="text-overprint">
                  Removed from {PLATFORM_LABEL[s.platform]} around {prettyDay(c.deletedObservedAt)}. Your copy is safe.
                </span>
              )}
              <Provenance batchId={batch.data} />
            </div>
          </SheetDescription>
        </SheetHeader>
        <div className="px-1 pb-6">
          <ErrorText error={metrics.error} />
          <DataTable
            rows={metrics.data?.rows ?? []}
            empty={s ? 'No numbers saved for this post.' : 'This post is not in your archive.'}
            columns={[
              { key: 'label', label: 'Metric' },
              { key: 'periodKind', label: 'Period', render: (r) => humanize(r.periodKind) },
              { key: 'value', label: 'Value', align: 'right', render: (r) => <Sounding value={r.value} full /> },
              { key: 'capturedAt', label: 'Saved', render: (r) => <span className="font-mono">{prettyDay(r.capturedAt)}</span> },
            ]}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
