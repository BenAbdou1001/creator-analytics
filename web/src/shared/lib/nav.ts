import { BarChart3, Coins, Database, FileUp, LayoutDashboard, PlaySquare, UserCog, Users } from 'lucide-react'

export const NAV = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Posts', to: '/content', icon: PlaySquare },
  { label: 'Audience', to: '/audience', icon: Users },
  { label: 'Earnings', to: '/earnings', icon: Coins },
  { label: 'Import', to: '/import', icon: FileUp },
] as const

export const NAV_REFERENCE = [
  { label: 'Metrics', to: '/metrics', icon: BarChart3 },
  { label: 'Accounts', to: '/accounts', icon: UserCog },
  { label: 'Data', to: '/data', icon: Database },
] as const
