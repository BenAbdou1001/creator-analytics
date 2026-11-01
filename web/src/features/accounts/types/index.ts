import type { Platform } from '@/shared/types'

// UI shape: camelCase. The wire shape (AccountDto) lives in @/shared/contracts.
export interface Account {
  accountId: number
  platform: Platform
  accountType: string
  handle: string
  displayName: string | null
  profileUrl: string | null
  externalId: string | null
  isMonetized: boolean
}

/** Form state for creating/editing an account; empty strings mean "not set". */
export interface AccountInput {
  platform: Platform
  accountType: string
  handle: string
  displayName: string
  profileUrl: string
  externalId: string
  isMonetized: boolean
}
