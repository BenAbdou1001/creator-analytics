import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { BarList } from '@/shared/components/common/BarList'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { CheckField } from '@/shared/components/common/Field'
import { Card, CardContent } from '@/shared/components/ui/card'
import { MultiSelect, Select } from '@/shared/components/ui/select'
import { humanOptions, humanize } from '@/shared/lib/format'
import { performanceOptions } from '../api/queries'
import { WHAT_WORKED_METRICS, defaultMetric, groupStats, untried, withTiming } from '../lib/what-worked'
import type { PerformanceRow, WhatWorkedMetric } from '../lib/what-worked'

const FIELDS = ['hook_type', 'content_format', 'content_pillar', 'topic', 'audience_awareness', 'cta_placement', 'editing_style',
  'editing_rhythm', 'narrative_structure', 'voiceover', 'storytelling', 'speed_changes', 'content_type', 'weekday', 'time_of_day']

/** Up to three combined brief fields at once (hook type × format...). */
const MAX_FIELDS = 3

/** Average of one metric per combination of brief fields: which creative choices did best. */
export function WhatWorked({ accountId }: { accountId?: number }) {
  const { data, error } = useQuery(performanceOptions)
  const [fields, setFields] = useState(['hook_type'])
  const [picked, setMetric] = useState<WhatWorkedMetric>()
  const [singleVersion, setSingleVersion] = useState(true)

  // weekday / time_of_day come from the post time (calendar), not the brief
  const rows = withTiming((data ?? []).filter((r) => accountId === undefined || r.account_id === accountId)) as PerformanceRow[]
  const metric = picked ?? defaultMetric(rows)
  const gaps = untried(rows, fields)
  const groups = groupStats(rows, fields, metric, singleVersion)
  const metricLabel = WHAT_WORKED_METRICS.find(([m]) => m === metric)?.[1].replace('Average ', '')
  const rate = metric === 'engagement_rate'
  const briefed = rows.filter((r) => r.brief_count > 0 && (!singleVersion || r.brief_count === 1))
  const withField = briefed.filter((r) => fields.every((f) => r[f] !== null && r[f] !== undefined && r[f] !== ''))

  return (
    <Card className="mb-6">
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-base font-medium">What worked</h2>
          <MultiSelect
            aria-label="Group by"
            values={fields}
            onValuesChange={setFields}
            options={humanOptions(FIELDS)}
            min={1}
            max={MAX_FIELDS}
          />
          <Select aria-label="Metric" value={metric} onValueChange={(v) => setMetric(v as WhatWorkedMetric)} options={WHAT_WORKED_METRICS} />
          <CheckField label="Single-version posts only" checked={singleVersion} onChange={setSingleVersion} />
        </div>
        <ErrorText error={error} />
        {groups.length ? (
          <BarList
            items={groups.map((g) => ({ label: humanize(g.label), note: `${g.posts} ${g.posts === 1 ? 'post' : 'posts'}`, value: rate ? g.value * 100 : g.value }))}
            suffix={rate ? '%' : undefined}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {!briefed.length
              ? 'Add a brief to a post (open it below) to see which choices did best'
              : !withField.length
                ? fields.includes('time_of_day')
                  ? 'No post has a publish time saved yet (exports only give the day). Set one on a post or from the Calendar.'
                  : `None of your briefs has ${fields.map((f) => humanize(f).toLowerCase()).join(' and ')} filled in.`
                : `These posts have no ${metricLabel} saved. Pick another metric.`}
          </p>
        )}
        {gaps.length > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Not tried yet:</span> {gaps.join(', ').replaceAll('_', ' ')}.{' '}
            <Link to="/content/new" search={{ plan: true }} className="text-link hover:underline">
              Plan one
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
