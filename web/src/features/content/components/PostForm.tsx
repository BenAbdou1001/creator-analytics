import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useRef, useState } from 'react'
import { accountLabel, accountsOptions } from '@/features/accounts'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { CheckField, Field, FormGrid } from '@/shared/components/common/Field'
import { FieldControl, WIDE } from '@/shared/components/common/FieldControl'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Select } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import type { ColumnDto, ContentBriefDto } from '@/shared/contracts'
import { humanize } from '@/shared/lib/format'
import { fieldKind, formValues, rowBody } from '@/shared/lib/row-form'
import type { FieldValue, FormValues } from '@/shared/lib/row-form'
import { schemaOptions, tablesService } from '@/shared/lib/tables'
import { cn } from '@/shared/lib/utils'
import { contentBriefsOptions, contentRowOptions, performanceOptions } from '../api/queries'
import { LONG, POST_FIELDS, SECTIONS, SUGGEST, filled } from '../lib/brief'
import { suggestions } from '../lib/what-worked'
import { ALL_POSTS } from '../types'
import { versionLabel } from './PostPage'

const pick = (cols: ColumnDto[], names: string[]) => names.flatMap((n) => cols.find((c) => c.name === n) ?? [])

/** A planned post isn't on the platform yet: these come from the real post when it's imported and linked. */
const PUBLISH_FIELDS = new Set(['external_id', 'url', 'published_at', 'visibility', 'duration_seconds', 'thumbnail_url'])

/**
 * Add a post, or edit one: its own fields plus one brief. `version` picks the brief to edit; 'new' (or a post with no
 * brief yet) saves a new version, prefilled from the latest so only what changed is typed. `plan` (or editing a draft)
 * is a post not published yet: brief + hypothesis first, platform fields later.
 */
export function PostForm({ id, version: briefParam, plan: planParam }: { id?: number; version?: number | 'new'; plan?: boolean }) {
  const editing = id !== undefined
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: schema } = useSuspenseQuery(schemaOptions)
  const { data: accounts } = useSuspenseQuery(accountsOptions)
  const { data: row } = useSuspenseQuery(contentRowOptions(id ?? 0))
  const { data: briefs } = useSuspenseQuery(contentBriefsOptions(id ?? 0))
  const perf = useQuery(performanceOptions)
  const enums = schema.enums

  const plan = planParam || row?.visibility === 'draft'
  const postCols = pick(schema.tables.content_items.columns, POST_FIELDS.filter((n) => !(editing && n === 'account_id') && !(plan && PUBLISH_FIELDS.has(n))))
  const briefCols = pick(schema.tables.content_briefs.columns, SECTIONS.flatMap(([, n]) => n))
  const list = editing ? briefs : []
  const target = briefParam === 'new' ? undefined : (list.find((b) => b.brief_id === briefParam) ?? list[0])

  const [post, setPost] = useState<FormValues>(() => formValues(postCols, enums, ['content_id'], editing ? row : null))
  const [postInitial] = useState(() => (editing ? post : null))
  const [brief, setBrief] = useState<FormValues>(() =>
    target
      ? formValues(briefCols, enums, ['brief_id'], target)
      : // a new version is a new experiment: its hypothesis and verdict start empty
        { ...formValues(briefCols, enums, ['brief_id'], list[0] ?? null), label: '', active_from: '', hypothesis: '', verdict: '', verdict_notes: '' },
  )
  const [briefInitial] = useState(() => (target ? brief : null))
  const created = useRef<number>(undefined) // a new post saved before its brief failed: retry only the brief

  const save = useMutation({
    mutationFn: async () => {
      const postBody = rowBody(postCols, enums, post, postInitial)
      let cid = id ?? created.current
      if (cid === undefined) {
        const account = accounts.rows.find((a) => a.accountId === Number(post.account_id))
        if (!account) throw new Error('Choose an account')
        // a plan has no platform id yet: a placeholder keeps (platform, external_id) unique until it's linked
        const draft = plan ? { external_id: `draft-${crypto.randomUUID()}`, visibility: 'draft' } : {}
        cid = (await tablesService.create<{ content_id: number }>('content_items', { ...postBody, ...draft, platform: account.platform })).content_id
        created.current = cid
      } else if (editing && Object.keys(postBody).length) {
        await tablesService.update('content_items', { content_id: cid }, postBody)
      }
      const briefBody = rowBody(briefCols, enums, brief, briefInitial)
      if (Object.keys(briefBody).length) {
        if (target) await tablesService.update('content_briefs', { brief_id: target.brief_id }, briefBody)
        else await tablesService.create<ContentBriefDto>('content_briefs', { ...briefBody, content_id: cid })
      }
      return cid
    },
    onSuccess: async (cid) => {
      await queryClient.invalidateQueries()
      navigate({ to: '/content/$id', params: { id: String(cid) } })
    },
  })


  if (editing && !row) return <PageHeader title="Post not found" description="This post is not in your archive." />
  const back = editing ? ({ to: '/content/$id', params: { id: String(id) } } as const) : ({ to: '/content', search: ALL_POSTS } as const)
  const title = editing ? `Edit ${String(row?.title ?? 'post')}` : plan ? 'Plan a post' : 'New post'
  const subtitle = plan
    ? 'Write the brief and what you expect before posting. Link it to the real post after the next import.'
    : editing
      ? 'Changes here may be overwritten by the next sync or import of this post.'
      : 'For a post the platform export missed.'

  const groups: { name: string; sections: SectionDef[] }[] = [
    {
      name: 'Post',
      sections: [{
        title: 'Details',
        cols: postCols,
        values: post,
        fields: postCols.map((col) =>
          col.name === 'account_id' ? (
            <Field key={col.name} label="Account *">
              <Select
                className="w-full"
                required
                value={post.account_id as string}
                onValueChange={(v) => setPost({ ...post, account_id: v })}
                placeholder="Choose…"
                options={accounts.rows.map((a) => [String(a.accountId), accountLabel(a)] as const)}
              />
            </Field>
          ) : (
            <ColumnField key={col.name} col={col} enums={enums} value={post[col.name]} onChange={(v) => setPost({ ...post, [col.name]: v })} />
          ),
        ),
      }],
    },
    {
      name: 'Brief',
      sections: SECTIONS.map(([title, names]) => {
        const cols = pick(briefCols, names)
        return {
          title,
          cols,
          values: brief,
          fields: cols.map((col) => (
            <ColumnField
              key={col.name}
              col={col}
              enums={enums}
              value={brief[col.name]}
              onChange={(v) => setBrief({ ...brief, [col.name]: v })}
              list={SUGGEST.includes(col.name) ? `brief-${col.name}` : undefined}
            />
          )),
        }
      }),
    },
  ]
  const anchor = (group: string, section: string) => `edit-${group}-${section}`.toLowerCase().replace(/\W+/g, '-')

  // full screen: a brief has ~50 fields, so the editor takes the whole window instead of a column inside the panel
  return (
    <form
      className="fixed inset-0 z-40 flex flex-col bg-panel"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate()
      }}
    >
      {SUGGEST.map((f) => (
        <datalist key={f} id={`brief-${f}`}>
          {suggestions(perf.data ?? [], f).map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      ))}

      <header className="flex min-h-16 shrink-0 flex-wrap items-center gap-3 border-b px-4 py-3 md:px-6">
        <Button asChild type="button" variant="ghost" size="icon" aria-label="Close">
          <Link {...back}>
            <X />
          </Link>
        </Button>
        <div className="mr-auto min-w-0">
          <h1 className="truncate text-lg font-semibold">{title}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {subtitle}
          </p>
        </div>
        {list.length > 0 && (
          <Select
            aria-label="Brief version"
            value={target ? String(target.brief_id) : 'new'}
            onValueChange={(v) =>
              navigate({ to: '/content/$id/edit', params: { id: String(id) }, search: { version: v === 'new' ? 'new' : Number(v) }, replace: true })
            }
            options={[['new', 'New version (copy of latest)'], ...list.map((b) => [String(b.brief_id), `Edit ${versionLabel(list, b)}`] as const)]}
          />
        )}
        <Button asChild type="button" variant="ghost">
          <Link {...back}>Cancel</Link>
        </Button>
        <Button disabled={save.isPending}>
          {save.isPending ? 'Saving…' : editing ? (target ? 'Save changes' : 'Save as new version') : plan ? 'Save plan' : 'Add post'}
        </Button>
      </header>
      {save.error != null && (
        <div className="shrink-0 border-b bg-destructive/10 px-4 py-2 md:px-6">
          <ErrorText error={save.error} />
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <nav aria-label="Sections" className="hidden w-60 shrink-0 overflow-y-auto border-r p-4 lg:block">
          {groups.map((g) => (
            <div key={g.name} className="mb-5">
              <div className="mb-1 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{g.name}</div>
              {g.sections.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => document.getElementById(anchor(g.name, s.title))?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  {s.title}
                  <Count section={s} />
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto grid max-w-5xl gap-8 p-4 md:p-8">
            {groups.map((g) => (
              <div key={g.name} className="grid gap-4">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{g.name}</h2>
                {g.sections.map((s) => (
                  <Card key={s.title} id={anchor(g.name, s.title)} className="scroll-mt-4 gap-4 border">
                    <CardHeader className="flex items-center justify-between">
                      <CardTitle>{s.title}</CardTitle>
                      <Count section={s} />
                    </CardHeader>
                    <CardContent>
                      <FormGrid>{s.fields}</FormGrid>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  )
}

type SectionDef = { title: string; cols: ColumnDto[]; values: FormValues; fields: React.ReactNode }

/** "3/8": how much of a section is filled in. */
function Count({ section: { cols, values } }: { section: SectionDef }) {
  const n = cols.filter((c) => values[c.name] !== false && filled(values[c.name])).length // an unticked box is not an answer
  return (
    <span className={cn('text-xs tabular-nums', n === cols.length ? 'text-success' : 'text-muted-foreground')}>
      {n}/{cols.length}
    </span>
  )
}

function ColumnField({ col, enums, value, onChange, list }: {
  col: ColumnDto
  enums: Record<string, string[]>
  value: FieldValue
  onChange: (v: FieldValue) => void
  list?: string
}) {
  const kind = fieldKind(col, enums)
  const label = `${humanize(col.name)}${col.required && !col.default ? ' *' : ''}`
  if (kind === 'flag') return <CheckField label={label} checked={value as boolean} onChange={onChange} />
  const long = LONG.has(col.name)
  return (
    <Field label={label} className={long || WIDE.includes(kind) ? 'sm:col-span-2 lg:col-span-3' : undefined}>
      {long ? (
        <Textarea className="min-h-24" dir="auto" value={value as string} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <FieldControl col={col} kind={kind} options={enums[col.type.replace('[]', '')] ?? []} value={value} onChange={onChange} list={list} />
      )}
    </Field>
  )
}
