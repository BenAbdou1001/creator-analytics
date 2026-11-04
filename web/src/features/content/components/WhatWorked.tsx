import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { BarList } from '@/shared/components/common/BarList'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { CheckField } from '@/shared/components/common/Field'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Select } from '@/shared/components/ui/select'
import { humanOptions, humanize } from '@/shared/lib/format'
import { performanceOptions } from '../api/queries'
import { WHAT_WORKED_METRICS, defaultMetric, groupStats, untried } from '../lib/what-worked'
import type { PerformanceRow, WhatWorkedMetric } from '../lib/what-worked'

const FIELDS = ['hook_type', 'content_format', 'content_pillar', 'topic', 'audience_awareness', 'cta_placement', 'editing_style',
  'editing_rhythm', 'narrative_structure', 'voiceover', 'storytelling', 'speed_changes', 'content_type']

/** Up to three combined brief fields at once (hook type × format...). */
const MAX_FIELDS = 3

/** Average of one metric per combination of brief fields: which creative choices did best. */
export function WhatWorked({ accountId }: { accountId?: number }) {
  const { data, error } = useQuery(performanceOptions)
  const [fields, setFields] = useState(['hook_type'])
  const [picked, setMetric] = useState<WhatWorkedMetric>()
  const [singleVersion, setSingleVersion] = useState(true)

  const rows = (data ?? []).filter((r) => accountId === undefined || r.account_id === accountId) as PerformanceRow[]
  const metric = picked ?? defaultMetric(rows)
  const gaps = untried(rows, fields)
  const groups = groupStats(rows, fields, metric, singleVersion)
  const metricLabel = WHAT_WORKED_METRICS.find(([m]) => m === metric)?.[1].replace('Avg ', '')
  const rate = metric === 'engagement_rate'
  const briefed = rows.filter((r) => r.brief_count > 0 && (!singleVersion || r.brief_count === 1))
  const withField = briefed.filter((r) => fields.every((f) => r[f] !== null && r[f] !== undefined && r[f] !== ''))

  return (
    <Card className="mb-6">
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-sm font-semibold">What worked</h2>
          {fields.map((f, i) => (
            <Select
              key={f}
              aria-label={i ? `Then by (${i + 1})` : 'Group by'}
              value={f}
              placeholder={i ? 'Remove' : undefined}
              onValueChange={(v) => setFields(v ? fields.map((x) => (x === f ? v : x)) : fields.filter((x) => x !== f))}
              options={humanOptions(FIELDS.filter((o) => o === f || !fields.includes(o)))}
            />
          ))}
          {fields.length < MAX_FIELDS && (
            <Select
              aria-label="Add a field to group by"
              value=""
              placeholder="+ Add field"
              onValueChange={(v) => v && setFields([...fields, v])}
              options={humanOptions(FIELDS.filter((o) => !fields.includes(o)))}
            />
          )}
          <Select aria-label="Metric" value={metric} onValueChange={(v) => setMetric(v as WhatWorkedMetric)} options={WHAT_WORKED_METRICS} />
          <CheckField label="Single-version posts only" checked={singleVersion} onChange={setSingleVersion} />
        </div>
        <ErrorText error={error} />
        {groups.length ? (
          <BarList
            items={groups.map((g) => ({ label: `${g.label} (${g.posts})`, value: rate ? g.value * 100 : g.value }))}
            suffix={rate ? '%' : undefined}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {!briefed.length
              ? 'Add a brief to a post (open it below) to see which choices did best.'
              : !withField.length
                ? `None of your briefs has ${fields.map((f) => humanize(f).toLowerCase()).join(' and ')} filled in.`
                : `These posts have no ${metricLabel} saved. Pick another metric.`}
          </p>
        )}
        {gaps.length > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Not tried yet:</span> {gaps.join(', ')}.{' '}
            <Link to="/content/new" search={{ plan: true }} className="text-link hover:underline">
              Plan one
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
