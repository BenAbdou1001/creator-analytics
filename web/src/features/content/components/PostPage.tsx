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
import type { ContentMetric } from '../types'
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
        <PageHeader title="Post not found" description="This post is not in your archive" />
        <Button asChild variant="outline">
          <Link to="/content" search={ALL_POSTS}>Back to posts</Link>
        </Button>
      </>
    )
  }
  const brief = briefs.find((b) => b.brief_id === briefId) ?? briefs[0]

  return (
    <>
      <Link to="/content" search={ALL_POSTS} className="mt-4 -mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
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
        {c?.deletedObservedAt && (
          <p className="text-sm text-warning">
            Removed from {PLATFORM_LABEL[s.platform]} around {prettyDay(c.deletedObservedAt)}. Your copy is safe.
          </p>
        )}

        {!draft && perf.data && (
          <div className="grid gap-2">
            <Results post={perf.data} rows={all.data ?? []} />
            <Provenance batchId={batch.data} />
          </div>
        )}
        {draft && <Provenance batchId={batch.data} />}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="grid min-w-0 gap-6">
            {c?.caption && (
              <Card>
                <CardContent>
                  <h2 className="mb-2 text-sm font-medium">Caption</h2>
                  <p dir="auto" className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {c.caption}
                  </p>
                </CardContent>
              </Card>
            )}

            {draft && perf.data && <LinkDraft draft={perf.data} posts={all.data ?? []} briefs={briefs} />}
            {!draft && perf.data && !!brief?.hypothesis && <Experiment post={perf.data} brief={brief} />}

            <Card>
              <CardContent className="grid gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="mr-auto text-base font-medium">Brief</h2>
                  {briefs.length > 1 && (
                    <Select
                      size="sm"
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
                  <Button asChild size="sm" variant={brief ? 'outline' : 'default'}>
                    <Link to="/content/$id/edit" params={{ id: String(id) }} search={{ version: 'new' }}>
                      {brief ? 'New version' : 'Add brief'}
                    </Link>
                  </Button>
                </div>
                {brief?.needs_review === true && <ReviewDraft brief={brief} postId={id} />}
                {brief ? (
                  <BriefView brief={brief} columns={schema.tables.content_briefs?.columns ?? []} enums={schema.enums} />
                ) : (
                  <p className="text-sm text-muted-foreground">No brief yet: record the hook, script and editing choices to compare posts later</p>
                )}
              </CardContent>
            </Card>
          </div>

          {!draft && <AllNumbers rows={metrics.data?.rows ?? []} error={metrics.error} />}
        </div>
      </div>
    </>
  )
}

const ratio = (v: number) => `${(v * 100).toFixed(1)}%`
const whole = (v: number) => (Number.isInteger(v) ? v.toLocaleString('en') : v.toFixed(1))

/** The post's headline figures, each against the account's typical (median) post. The one that beat it most gets the accent. */
function Results({ post, rows }: { post: ContentPerformanceDto; rows: ContentPerformanceDto[] }) {
  const p = post as PerformanceRow
  const reach = typeof post.views === 'number' ? 'views' : 'impressions'
  const lift = post.followers_3d_posts > 1 ? `Split with ${post.followers_3d_posts - 1} other ${post.followers_3d_posts === 2 ? 'post' : 'posts'}` : 'In the 3 days after posting'
  const figures = (
    [
      [reach, humanize(reach), whole],
      ['engagement_rate', 'Engagement rate', ratio],
      ['likes', post.platform === 'linkedin' ? 'Reactions' : 'Likes', whole],
      ['comments', 'Comments', whole],
      ['followers_3d', 'New followers', (v: number) => `+${whole(v)}`],
    ] as const
  ).map(([key, label, show]) => {
    const mine = typeof p[key] === 'number' ? (p[key] as number) : null
    const usual = mine === null ? null : typical(rows as PerformanceRow[], p, key)
    return { key, label, show, mine, usual, diff: mine !== null && usual ? (mine - usual) / usual : null }
  })
  const best = figures.reduce<string | null>((top, f) => (f.diff !== null && f.diff > 0.05 && (!top || f.diff > figures.find((g) => g.key === top)!.diff!) ? f.key : top), null)

  return (
    <Card>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          {figures.map((f) => (
            <div key={f.key} className="min-w-0">
              <dt className="text-sm text-muted-foreground">{f.label}</dt>
              <dd className={cn('mt-1 text-3xl font-medium tabular-nums', f.key === best && 'text-link', f.mine === null && 'text-muted-foreground')}>
                {f.mine === null ? '—' : f.show(f.mine)}
              </dd>
              <dd className="mt-1 text-xs text-muted-foreground tabular-nums">
                {f.key === 'followers_3d' ? (
                  f.mine === null ? 'No daily follower numbers' : lift
                ) : f.diff !== null ? (
                  <>
                    <span className={cn(f.diff > 0.05 ? 'text-success' : f.diff < -0.05 && 'text-warning')}>
                      {f.diff >= 0 ? '+' : ''}
                      {Math.round(f.diff * 100)}%
                    </span>{' '}
                    vs your typical {f.show(f.usual!)}
                  </>
                ) : (
                  'No typical post to compare'
                )}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

/** Every number saved for the post, biggest first. Period and date only show when they differ between rows. */
function AllNumbers({ rows, error }: { rows: ContentMetric[]; error: unknown }) {
  const sorted = [...rows].sort((a, b) => b.value - a.value)
  const periods = new Set(rows.map((r) => r.periodKind))
  const days = new Set(rows.map((r) => prettyDay(r.capturedAt)))
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-baseline justify-between gap-3 px-4 pt-5 pb-2">
        <h2 className="text-sm font-medium">All numbers</h2>
        {rows.length > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {periods.size === 1 && `${humanize(rows[0].periodKind)} · `}
            {days.size === 1 && `Saved ${[...days][0]}`}
          </span>
        )}
      </div>
      <ErrorText error={error} />
      <DataTable
        rows={sorted}
        empty="No numbers saved for this post"
        columns={[
          { key: 'label', label: 'Metric' },
          ...(periods.size > 1 ? [{ key: 'periodKind', label: 'Period', render: (r: (typeof rows)[number]) => humanize(r.periodKind) }] : []),
          { key: 'value', label: 'Value', align: 'right' as const, render: (r: (typeof rows)[number]) => <Sounding value={r.value} full /> },
          ...(days.size > 1 ? [{ key: 'capturedAt', label: 'Saved', render: (r: (typeof rows)[number]) => <span className="tabular-nums">{prettyDay(r.capturedAt)}</span> }] : []),
        ]}
      />
    </Card>
  )
}

const VERDICTS = [
  ['confirmed', 'Confirmed'],
  ['refuted', 'Not confirmed'],
  ['inconclusive', 'Unclear'],
] as const

/** The brief's hypothesis and a verdict on it. The numbers it is judged by are in Results above. */
function Experiment({ post, brief }: { post: ContentPerformanceDto; brief: ContentBriefDto }) {
  const queryClient = useQueryClient()
  const setVerdict = useMutation({
    mutationFn: (verdict: string | null) => tablesService.update('content_briefs', { brief_id: brief.brief_id }, { verdict }),
    onSuccess: () => queryClient.invalidateQueries(),
  })
  const p = post as PerformanceRow
  const due = reviewFrom(p)
  const early = due !== null && due > new Date()

  return (
    <Card>
      <CardContent className="grid gap-4">
        <div className="flex items-start gap-3">
          <FlaskConical className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-base font-medium">Experiment</h2>
            <p dir="auto" className="text-sm whitespace-pre-wrap">{brief.hypothesis as string}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-muted-foreground">
            {brief.verdict ? 'Verdict' : early ? `Numbers settle after a week: judge it from ${prettyDay(due)}` : 'Did it hold?'}
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
    <Card className="border">
      <CardContent className="grid gap-3">
        <div>
          <h2 className="text-base font-medium">Planned post</h2>
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

/** An agent wrote this brief from the post's text: confirm it, or fix it in the editor (saving there confirms too). */
function ReviewDraft({ brief, postId }: { brief: ContentBriefDto; postId: number }) {
  const queryClient = useQueryClient()
  const confirm = useMutation({
    mutationFn: () => tablesService.update('content_briefs', { brief_id: brief.brief_id }, { needs_review: false }),
    onSuccess: () => queryClient.invalidateQueries(),
  })
  return (
    <div role="status" className="flex flex-wrap items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm">
      <span className="mr-auto">Drafted by your agent from the post's text. Check it before it counts as yours.</span>
      <Button asChild size="sm" variant="outline">
        <Link to="/content/$id/edit" params={{ id: String(postId) }} search={{ version: brief.brief_id }}>
          Fix something
        </Link>
      </Button>
      <Button size="sm" disabled={confirm.isPending} onClick={() => confirm.mutate()}>
        Looks right
      </Button>
      <ErrorText error={confirm.error} />
    </div>
  )
}
