import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { BarList } from '@/shared/components/common/BarList'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { CheckField } from '@/shared/components/common/Field'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Select } from '@/shared/components/ui/select'
import { humanOptions } from '@/shared/lib/format'
import { performanceOptions } from '../api/queries'
import { groupStats } from '../lib/what-worked'
import type { PerformanceRow, WhatWorkedMetric } from '../lib/what-worked'

const FIELDS = ['hook_type', 'content_format', 'content_pillar', 'topic', 'audience_awareness', 'cta_placement', 'editing_style',
  'editing_rhythm', 'narrative_structure', 'voiceover', 'storytelling', 'speed_changes', 'content_type']

/** Average views / engagement rate per value of one brief field: which creative choices did best. */
export function WhatWorked({ accountId }: { accountId?: number }) {
  const { data, error } = useQuery(performanceOptions)
  const [field, setField] = useState('hook_type')
  const [metric, setMetric] = useState<WhatWorkedMetric>('views')
  const [singleVersion, setSingleVersion] = useState(true)

  const rows = (data ?? []).filter((r) => accountId === undefined || r.account_id === accountId) as PerformanceRow[]
  const groups = groupStats(rows, field, metric, singleVersion)
  const rate = metric === 'engagement_rate'
  const briefed = rows.filter((r) => r.brief_count > 0).length

  return (
    <Card className="mb-6">
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-sm font-semibold">What worked</h2>
          <Select aria-label="Group by" value={field} onValueChange={(v) => setField(v)} options={humanOptions(FIELDS)} />
          <Select aria-label="Metric" value={metric} onValueChange={(v) => setMetric(v as WhatWorkedMetric)} options={[['views', 'Avg views'], ['engagement_rate', 'Avg engagement rate']]} />
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
            {briefed ? 'No post with this field filled in yet.' : 'Add a brief to a post (open it below) to see which choices did best.'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
