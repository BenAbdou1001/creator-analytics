import { BookOpen, Database, FileUp, LayoutDashboard, PlaySquare, Users } from 'lucide-react'

export const NAV = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Content', to: '/content', icon: PlaySquare },
  { label: 'Accounts', to: '/accounts', icon: Users },
  { label: 'Import', to: '/import', icon: FileUp },
  { label: 'Metric catalogue', to: '/metrics', icon: BookOpen },
  { label: 'Data explorer', to: '/data', icon: Database },
] as const
