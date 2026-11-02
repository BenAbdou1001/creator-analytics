import { keepPreviousData, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { accountLabel, accountsOptions } from '@/features/accounts'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { Options } from '@/shared/components/common/Options'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { Pager } from '@/shared/components/common/Pager'
import { Card } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { NativeSelect } from '@/shared/components/ui/native-select'
import { humanOptions } from '@/shared/lib/format'
import { schemaOptions } from '@/shared/lib/tables'
import { CONTENT_PAGE_SIZE, contentListOptions } from '../api/queries'
import type { ContentSearch } from '../types'
import { ContentDetail } from './ContentDetail'
import { ContentTable } from './ContentTable'

const route = getRouteApi('/content')

export function ContentPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data, error } = useQuery({ ...contentListOptions(search), placeholderData: keepPreviousData })
  const { data: accounts } = useSuspenseQuery(accountsOptions)
  const { data: schema } = useSuspenseQuery(schemaOptions)
  const go = (patch: Partial<ContentSearch>) => navigate({ search: (s) => ({ ...s, offset: 0, ...patch }) })

  const [q, setQ] = useState(search.q ?? '')
  useEffect(() => {
    if (q === (search.q ?? '')) return
    const t = setTimeout(() => navigate({ search: (s) => ({ ...s, offset: 0, q: q || undefined }), replace: true }), 300)
    return () => clearTimeout(t)
  }, [q, search.q, navigate])

  return (
    <>
      <PageHeader title="Posts">
        <Input type="search" aria-label="Search posts" className="w-48" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <NativeSelect
          aria-label="Account"
          value={String(search.accountId ?? '')}
          onChange={(e) => go({ accountId: e.target.value ? Number(e.target.value) : undefined })}
        >
          <Options placeholder="All accounts" options={accounts.rows.map((a) => [String(a.accountId), accountLabel(a)] as const)} />
        </NativeSelect>
        <NativeSelect aria-label="Type" value={search.contentType ?? ''} onChange={(e) => go({ contentType: e.target.value || undefined })}>
          <Options placeholder="All types" options={humanOptions(schema.enums.content_type_t)} />
        </NativeSelect>
      </PageHeader>

      <ErrorText error={error} />
      <Card className="gap-0 py-0">
        <ContentTable rows={data?.rows ?? []} search={search} onSort={(orderBy) => go({ orderBy })} empty="No posts match." />
        <Pager offset={search.offset} limit={CONTENT_PAGE_SIZE} total={data?.total ?? 0} onChange={(offset) => go({ offset })} />
      </Card>

      <ContentDetail id={search.post} onClose={() => navigate({ search: (s) => ({ ...s, post: undefined }), resetScroll: false })} />
    </>
  )
}
