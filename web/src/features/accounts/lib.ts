import type { Account } from './types'

/** "linkedin · @handle", the label used in every account picker. */
export const accountLabel = (a: Pick<Account, 'platform' | 'handle'>) => `${a.platform} · @${a.handle}`
