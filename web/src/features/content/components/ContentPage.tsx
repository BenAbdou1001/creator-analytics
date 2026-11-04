import { keepPreviousData, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { accountLabel, accountsOptions } from '@/features/accounts'
import { ErrorText } from '@/shared/components/common/ErrorText'
import { PageHeader } from '@/shared/components/common/PageHeader'
import { Pager } from '@/shared/components/common/Pager'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { FILTER_WIDTH } from '@/shared/components/common/Field'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { humanOptions } from '@/shared/lib/format'
import { schemaOptions } from '@/shared/lib/tables'
import { CONTENT_PAGE_SIZE, contentListOptions } from '../api/queries'
import type { ContentSearch } from '../types'
import { ContentTable } from './ContentTable'
import { BriefQueue } from './BriefQueue'
import { Experiments } from './Experiments'
import { WhatWorked } from './WhatWorked'

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
        <Select
          aria-label="Account"
          value={String(search.accountId ?? '')}
          onValueChange={(v) => go({ accountId: v ? Number(v) : undefined })} placeholder="All accounts" options={accounts.rows.map((a) => [String(a.accountId), accountLabel(a)] as const)} />
        <Button asChild variant="outline">
          <Link to="/content/new">Add published post</Link>
        </Button>
        <Button asChild>
          <Link to="/content/new" search={{ plan: true }}>
            Plan a post
          </Link>
        </Button>
      </PageHeader>

      <BriefQueue accountId={search.accountId} className="mb-6" />
      <Experiments accountId={search.accountId} />
      <WhatWorked accountId={search.accountId} />
      <ErrorText error={error} />
      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <h2 className="mr-auto text-base font-medium">All posts</h2>
          <Input type="search" aria-label="Search posts" className={FILTER_WIDTH} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select aria-label="Type" value={search.contentType ?? ''} onValueChange={(v) => go({ contentType: v || undefined })} placeholder="All types" options={humanOptions(schema.enums.content_type_t)} />
        </div>
        <ContentTable rows={data?.rows ?? []} search={search} onSort={(orderBy) => go({ orderBy })} empty="No posts match" />
        <Pager offset={search.offset} limit={CONTENT_PAGE_SIZE} total={data?.total ?? 0} onChange={(offset) => go({ offset })} />
      </Card>
    </>
  )
}
