import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { DataTable } from '@/shared/components/common/DataTable'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { PlatformBadge } from '@/shared/components/common/PlatformBadge'
import { Provenance } from '@/shared/components/common/Provenance'
import { Sounding } from '@/shared/components/common/Sounding'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Select } from '@/shared/components/ui/select'
import type { ContentBriefDto } from '@/shared/contracts'
import { PLATFORM_LABEL, humanize, prettyDay } from '@/shared/lib/format'
import { schemaOptions } from '@/shared/lib/tables'
import { contentBatchOptions, contentBriefsOptions, contentItemOptions, contentMetricsOptions, contentSummaryOptions } from '../api/queries'
import { ALL_POSTS } from '../types'
import { BriefView } from './BriefView'

/** "v3 · A - question hook · 3 Nov 2026"; versions are numbered by age, `list` is newest first. */
export const versionLabel = (list: ContentBriefDto[], b: ContentBriefDto) =>
  `v${list.length - list.indexOf(b)}${b.label ? ` · ${b.label}` : ''} · ${prettyDay(b.active_from)}`

/** One post on its own page: numbers, caption, and its brief (any version). */
export function PostPage({ id, briefId }: { id: number; briefId?: number }) {
  const navigate = useNavigate()
  const { data: s } = useSuspenseQuery(contentSummaryOptions(id))
  const { data: c } = useSuspenseQuery(contentItemOptions(id))
  const { data: briefs } = useSuspenseQuery(contentBriefsOptions(id))
  const { data: schema } = useSuspenseQuery(schemaOptions)
  const metrics = useQuery(contentMetricsOptions(id))
  const batch = useQuery(contentBatchOptions(id))

  if (!s) {
    return (
      <>
        <PageHeader title="Post not found" description="This post is not in your archive." />
        <Button asChild variant="outline">
          <Link to="/content" search={ALL_POSTS}>Back to posts</Link>
        </Button>
      </>
    )
  }
  const brief = briefs.find((b) => b.brief_id === briefId) ?? briefs[0]

  return (
    <>
      <Link to="/content" search={ALL_POSTS} className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" aria-hidden="true" /> Posts
      </Link>
      <PageHeader
        title={s.title ?? 'Untitled'}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <PlatformBadge platform={s.platform} />
            <span>{humanize(s.contentType)}</span>
            {s.publishedAt && <span>Published {prettyDay(s.publishedAt)}</span>}
            {c?.url && (
              <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-link hover:underline">
                Open on {PLATFORM_LABEL[s.platform]}
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>
            )}
          </span>
        }
      >
        <Button asChild variant="outline">
          <Link to="/content/$id/edit" params={{ id: String(id) }}>
            Edit post
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6">
        {(c?.deletedObservedAt || batch.data) && (
          <div className="grid gap-1 text-sm text-muted-foreground">
            {c?.deletedObservedAt && (
              <span className="text-warning">
                Removed from {PLATFORM_LABEL[s.platform]} around {prettyDay(c.deletedObservedAt)}. Your copy is safe.
              </span>
            )}
            <Provenance batchId={batch.data} />
          </div>
        )}

        {c?.caption && (
          <Card>
            <CardContent>
              <div className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Caption</div>
              <p dir="auto" className="text-sm whitespace-pre-wrap">
                {c.caption}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="gap-0 py-0">
          <ErrorText error={metrics.error} />
          <DataTable
            rows={metrics.data?.rows ?? []}
            empty="No numbers saved for this post."
            columns={[
              { key: 'label', label: 'Metric' },
              { key: 'periodKind', label: 'Period', render: (r) => humanize(r.periodKind) },
              { key: 'value', label: 'Value', align: 'right', render: (r) => <Sounding value={r.value} full /> },
              { key: 'capturedAt', label: 'Saved', render: (r) => <span className="tabular-nums">{prettyDay(r.capturedAt)}</span> },
            ]}
          />
        </Card>

        <Card>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mr-auto text-base font-semibold">Brief</h2>
              {briefs.length > 1 && (
                <Select
                  aria-label="Version"
                  value={String(brief.brief_id)}
                  onValueChange={(v) => navigate({ to: '/content/$id', params: { id: String(id) }, search: { brief: Number(v) }, replace: true })} options={briefs.map((b) => [String(b.brief_id), versionLabel(briefs, b)] as const)} />
              )}
              {brief && (
                <Button asChild size="sm" variant="outline">
                  <Link to="/content/$id/edit" params={{ id: String(id) }} search={{ version: brief.brief_id }}>
                    Edit this version
                  </Link>
                </Button>
              )}
              <Button asChild size="sm">
                <Link to="/content/$id/edit" params={{ id: String(id) }} search={{ version: 'new' }}>
                  {brief ? 'New version' : 'Add brief'}
                </Link>
              </Button>
            </div>
            {brief ? (
              <BriefView brief={brief} columns={schema.tables.content_briefs?.columns ?? []} enums={schema.enums} />
            ) : (
              <p className="text-sm text-muted-foreground">No brief yet: record the hook, script and editing choices to compare posts later.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
