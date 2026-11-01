import type { AccountDto, CreateAccountDto } from '@/shared/contracts'
import type { Account, AccountInput } from '../types'

export function toAccount(dto: AccountDto): Account {
  return {
    accountId: dto.account_id,
    platform: dto.platform,
    accountType: dto.account_type,
    handle: dto.handle,
    displayName: dto.display_name,
    profileUrl: dto.profile_url,
    externalId: dto.external_id,
    isMonetized: dto.is_monetized,
  }
}

export function toAccountInput(a: Account): AccountInput {
  return {
    platform: a.platform,
    accountType: a.accountType,
    handle: a.handle,
    displayName: a.displayName ?? '',
    profileUrl: a.profileUrl ?? '',
    externalId: a.externalId ?? '',
    isMonetized: a.isMonetized,
  }
}

export function toCreateAccountDto(input: AccountInput): CreateAccountDto {
  return {
    platform: input.platform,
    account_type: input.accountType,
    handle: input.handle,
    display_name: input.displayName || null,
    profile_url: input.profileUrl || null,
    external_id: input.externalId || null,
    is_monetized: input.isMonetized,
  }
}
