import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ArrowUpRight, FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { DataTable } from '@/shared/components/common/DataTable'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { PlatformBadge } from '@/shared/components/common/PlatformBadge'
import { Provenance } from '@/shared/components/common/Provenance'
import { Sounding } from '@/shared/components/common/Sounding'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Select } from '@/shared/components/ui/select'
import type { ContentBriefDto, ContentPerformanceDto } from '@/shared/contracts'
import { PLATFORM_LABEL, humanize, prettyDay } from '@/shared/lib/format'
import { schemaOptions, tablesService } from '@/shared/lib/tables'
import { cn } from '@/shared/lib/utils'
import { contentBatchOptions, contentBriefsOptions, contentItemOptions, contentMetricsOptions, contentSummaryOptions, performanceOptions } from '../api/queries'
import { isDraft, reviewFrom, typical } from '../lib/what-worked'
import type { PerformanceRow } from '../lib/what-worked'
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
  const all = useQuery({ ...performanceOptions, select: (page) => page.rows })
  const perf = { data: all.data?.find((r) => r.content_id === id) }
  const draft = perf.data ? isDraft(perf.data) : false

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

        {draft && perf.data && <LinkDraft draft={perf.data} posts={all.data ?? []} briefs={briefs} />}
        {!draft && perf.data && !!brief?.hypothesis && <Experiment post={perf.data} brief={brief} rows={all.data ?? []} />}
        {!draft && perf.data && s.publishedAt && <FollowerLift followers={perf.data.followers_3d} posts={perf.data.followers_3d_posts} />}

        {!draft && <Card className="gap-0 py-0">
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
        </Card>}

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

/** Followers gained on the publish day and the 2 days after, this post's share when others went out the same days. */
function FollowerLift({ followers, posts }: { followers: number | null; posts: number }) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-2xl font-semibold tabular-nums">
          {followers === null ? '—' : `+${Number.isInteger(followers) ? followers : followers.toFixed(1)}`}
        </span>
        <span className="text-sm text-muted-foreground">
          {followers === null
            ? 'New followers after posting: no daily follower numbers saved for these days.'
            : `new followers in the 3 days after posting${posts > 1 ? `, split with ${posts - 1} other ${posts === 2 ? 'post' : 'posts'} published the same days` : ''}.`}
        </span>
      </CardContent>
    </Card>
  )
}

const VERDICTS = [
  ['confirmed', 'Confirmed'],
  ['refuted', 'Not confirmed'],
  ['inconclusive', 'Unclear'],
] as const

/** This post next to the account's typical (median) post, and a verdict on the brief's hypothesis. */
function Experiment({ post, brief, rows }: { post: ContentPerformanceDto; brief: ContentBriefDto; rows: ContentPerformanceDto[] }) {
  const queryClient = useQueryClient()
  const setVerdict = useMutation({
    mutationFn: (verdict: string | null) => tablesService.update('content_briefs', { brief_id: brief.brief_id }, { verdict }),
    onSuccess: () => queryClient.invalidateQueries(),
  })
  const p = post as PerformanceRow
  const reach = typeof post.views === 'number' ? 'views' : 'impressions'
  const lines = ([[reach, humanize(reach)], ['engagement_rate', 'Engagement rate'], ['followers_3d', 'New followers (3 days)']] as const)
    .map(([key, label]) => ({ label, rate: key === 'engagement_rate', mine: p[key] as number | null, usual: typical(rows as PerformanceRow[], p, key) }))
    .filter((l) => typeof l.mine === 'number' && l.usual !== null)
  const due = reviewFrom(p)
  const early = due !== null && due > new Date()
  const show = (v: number, rate: boolean) => (rate ? `${(v * 100).toFixed(1)}%` : Math.round(v).toLocaleString('en'))

  return (
    <Card>
      <CardContent className="grid gap-4">
        <div className="flex items-start gap-3">
          <FlaskConical className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Experiment</h2>
            <p dir="auto" className="text-sm whitespace-pre-wrap">{brief.hypothesis as string}</p>
          </div>
        </div>
        {lines.length > 0 && (
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            {lines.map((l) => {
              const diff = l.usual ? (l.mine! - l.usual) / l.usual : 0
              return (
                <div key={l.label}>
                  <dt className="text-xs text-muted-foreground">{l.label}</dt>
                  <dd className="tabular-nums">
                    <span className="font-semibold">{show(l.mine!, l.rate)}</span>{' '}
                    <span className={cn('text-xs', diff > 0.05 ? 'text-success' : diff < -0.05 ? 'text-warning' : 'text-muted-foreground')}>
                      {diff >= 0 ? '+' : ''}{Math.round(diff * 100)}% vs your typical {show(l.usual!, l.rate)}
                    </span>
                  </dd>
                </div>
              )
            })}
          </dl>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-muted-foreground">
            {brief.verdict ? 'Verdict' : early ? `Numbers settle after a week: judge it from ${prettyDay(due)}.` : 'Did it hold?'}
          </span>
          {VERDICTS.map(([v, label]) => (
            <Button
              key={v}
              size="sm"
              variant={brief.verdict === v ? 'default' : 'outline'}
              aria-pressed={brief.verdict === v}
              disabled={setVerdict.isPending}
              onClick={() => setVerdict.mutate(brief.verdict === v ? null : v)}
            >
              {label}
            </Button>
          ))}
          <ErrorText error={setVerdict.error} />
        </div>
      </CardContent>
    </Card>
  )
}

/** A planned post, once published and imported: move its brief onto the real post and drop the placeholder. */
function LinkDraft({ draft, posts, briefs }: { draft: ContentPerformanceDto; posts: ContentPerformanceDto[]; briefs: ContentBriefDto[] }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const candidates = posts
    .filter((r) => r.account_id === draft.account_id && !isDraft(r))
    .sort((a, b) => String(b.published_at ?? '').localeCompare(String(a.published_at ?? '')))
  const [target, setTarget] = useState('')
  const link = useMutation({
    mutationFn: async () => {
      const real = candidates.find((r) => String(r.content_id) === target)
      if (!real) throw new Error('Choose the published post')
      for (const b of briefs)
        await tablesService.update('content_briefs', { brief_id: b.brief_id }, { content_id: real.content_id, ...(real.published_at ? { active_from: real.published_at } : {}) })
      await tablesService.remove('content_items', { content_id: draft.content_id })
      return real.content_id
    },
    onSuccess: async (cid) => {
      await queryClient.invalidateQueries()
      navigate({ to: '/content/$id', params: { id: String(cid) }, replace: true })
    },
  })
  return (
    <Card className="border border-primary/30">
      <CardContent className="grid gap-3">
        <div>
          <h2 className="text-base font-semibold">Planned post</h2>
          <p className="text-sm text-muted-foreground">
            Not published yet. After you post it and import your next export, pick it here: this brief moves onto it and the plan is removed.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            className="min-w-0 flex-1"
            aria-label="Published post"
            value={target}
            placeholder="Choose the published post…"
            onValueChange={setTarget}
            options={candidates.map((r) => [String(r.content_id), `${r.title ?? 'Untitled'}${r.published_at ? ` · ${prettyDay(r.published_at)}` : ''}`] as const)}
          />
          <Button disabled={!target || link.isPending} onClick={() => link.mutate()}>
            Link
          </Button>
        </div>
        <ErrorText error={link.error} />
      </CardContent>
    </Card>
  )
}
