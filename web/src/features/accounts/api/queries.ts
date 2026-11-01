import { queryOptions } from '@tanstack/react-query'
import type { AccountDto } from '@/shared/contracts'
import { mapPage, rowsOptions } from '@/shared/lib/tables'
import { toAccount } from './mappers'

export const accountsOptions = queryOptions({
  ...rowsOptions<AccountDto>('accounts', { order_by: 'platform', desc: false, limit: 1000 }),
  select: mapPage(toAccount),
})
