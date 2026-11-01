import type { AccountDto, CreateAccountDto } from '@/shared/contracts'
import { tablesService } from '@/shared/lib/tables'

export const accountsService = {
  create: (dto: CreateAccountDto) => tablesService.create<AccountDto>('accounts', dto),
  update: (id: number, dto: CreateAccountDto) => tablesService.update<AccountDto>('accounts', { account_id: id }, dto),
  remove: (id: number) => tablesService.remove<AccountDto>('accounts', { account_id: id }),
}
