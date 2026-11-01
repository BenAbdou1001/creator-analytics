import { PLATFORM_LABEL } from '@/shared/lib/format'
import type { Account } from './types'

/** "LinkedIn · @handle", the label used in every account picker. */
export const accountLabel = (a: Pick<Account, 'platform' | 'handle'>) => `${PLATFORM_LABEL[a.platform]} · @${a.handle}`
