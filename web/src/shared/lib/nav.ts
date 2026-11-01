import { BookOpen, CalendarDays, Coins, Database, FileUp, PlaySquare, UserCog, Users } from 'lucide-react'

export const NAV = [
  { label: 'Today', to: '/', icon: CalendarDays },
  { label: 'Posts', to: '/content', icon: PlaySquare },
  { label: 'Audience', to: '/audience', icon: Users },
  { label: 'Earnings', to: '/earnings', icon: Coins },
  { label: 'Bring in data', to: '/import', icon: FileUp },
] as const

export const NAV_REFERENCE = [
  { label: 'Metrics', to: '/metrics', icon: BookOpen },
  { label: 'Accounts', to: '/accounts', icon: UserCog },
  { label: 'Raw tables', to: '/data', icon: Database },
] as const
