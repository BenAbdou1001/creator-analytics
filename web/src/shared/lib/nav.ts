import { BarChart3, CalendarDays, Coins, Database, FileUp, LayoutDashboard, PlaySquare, UserCog, Users } from 'lucide-react'

/** The pages you read. */
export const NAV = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Posts', to: '/content', icon: PlaySquare },
  { label: 'Calendar', to: '/calendar', icon: CalendarDays },
  { label: 'Audience', to: '/audience', icon: Users },
  { label: 'Earnings', to: '/earnings', icon: Coins },
] as const

/** Managing the data behind those pages: bring it in, set up accounts, look up and edit what is stored. */
export const NAV_REFERENCE = [
  { label: 'Import', to: '/import', icon: FileUp },
  { label: 'Accounts', to: '/accounts', icon: UserCog },
  { label: 'Metrics', to: '/metrics', icon: BarChart3 },
  { label: 'Data', to: '/data', icon: Database },
] as const
