import { keepPreviousData, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { accountLabel, accountsOptions } from '@/features/accounts'
import { Options } from '@/shared/components/common/Options'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { Pager } from '@/shared/components/common/Pager'
import { Card } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { NativeSelect } from '@/shared/components/ui/native-select'
import { schemaOptions } from '@/shared/lib/tables'
import { CONTENT_PAGE_SIZE, contentListOptions } from '../api/queries'
import { CONTENT_SORTS } from '../types'
import type { ContentSearch, ContentSort, ContentSummary } from '../types'
import { ContentDetail } from './ContentDetail'
import { ContentTable } from './ContentTable'

const route = getRouteApi('/content')

export function ContentPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data } = useQuery({ ...contentListOptions(search), placeholderData: keepPreviousData })
  const { data: accounts } = useSuspenseQuery(accountsOptions)
  const { data: schema } = useSuspenseQuery(schemaOptions)
  const [selected, setSelected] = useState<ContentSummary | null>(null)
  const go = (patch: Partial<ContentSearch>) => navigate({ search: (s) => ({ ...s, offset: 0, ...patch }) })

  return (
    <>
      <PageHeader title="Content">
        <Input
          className="w-48"
          placeholder="Search titles…"
          defaultValue={search.q}
          onKeyDown={(e) => e.key === 'Enter' && go({ q: e.currentTarget.value || undefined })}
        />
        <NativeSelect
          aria-label="Account"
          value={String(search.accountId ?? '')}
          onChange={(e) => go({ accountId: e.target.value ? Number(e.target.value) : undefined })}
        >
          <Options placeholder="All accounts" options={accounts.rows.map((a) => [String(a.accountId), accountLabel(a)] as const)} />
        </NativeSelect>
        <NativeSelect aria-label="Type" value={search.contentType ?? ''} onChange={(e) => go({ contentType: e.target.value || undefined })}>
          <Options placeholder="All types" options={schema.enums.content_type_t} />
        </NativeSelect>
        <NativeSelect aria-label="Sort" value={search.orderBy} onChange={(e) => go({ orderBy: e.target.value as ContentSort })}>
          <Options options={CONTENT_SORTS} />
        </NativeSelect>
      </PageHeader>

      <Card className="gap-0 py-0">
        <ContentTable rows={data?.rows ?? []} onSelect={setSelected} empty="No content matches." />
        <Pager offset={search.offset} limit={CONTENT_PAGE_SIZE} total={data?.total ?? 0} onChange={(offset) => go({ offset })} />
      </Card>

      {selected && <ContentDetail item={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
