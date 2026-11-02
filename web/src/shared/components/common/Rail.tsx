import { Link, useLocation } from '@tanstack/react-router'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BRAND } from '@/shared/lib/brand'
import { NAV, NAV_REFERENCE } from '@/shared/lib/nav'
import { readTheme, setTheme } from '@/shared/lib/theme'
import type { Theme } from '@/shared/lib/theme'
import { cn } from '@/shared/lib/utils'
import { BrandMark } from './BrandMark'

const ITEM = 'flex w-[72px] shrink-0 flex-col items-center gap-1 rounded-md py-2 text-[11px] font-medium transition-colors'

function RailLink({ item, active }: { item: (typeof NAV | typeof NAV_REFERENCE)[number]; active: boolean }) {
  return (
    <Link
      to={item.to}
      aria-current={active ? 'page' : undefined}
      className={cn(ITEM, active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
    >
      <item.icon className="size-5" aria-hidden="true" />
      {item.label}
    </Link>
  )
}

function ThemeButton() {
  const [theme, set] = useState<Theme>('dark')
  useEffect(() => set(readTheme()), [])
  const next = theme === 'dark' ? 'light' : 'dark'
  const Icon = theme === 'dark' ? Sun : Moon
  return (
    <button
      type="button"
      className={cn(ITEM, 'text-muted-foreground hover:bg-muted hover:text-foreground')}
      onClick={() => {
        setTheme(next)
        set(next)
      }}
    >
      <Icon className="size-5" aria-hidden="true" />
      {next === 'light' ? 'Light' : 'Dark'}
    </button>
  )
}

/** Icon-over-label navigation: a left rail on desktop, a scrolling bottom bar on phones. */
export function Rail() {
  const { pathname } = useLocation()
  const active = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))
  return (
    <nav
      aria-label="Main"
      className="flex shrink-0 items-center gap-1 overflow-auto rounded-lg bg-panel p-2 md:w-[88px] md:flex-col"
    >
      <Link to="/" aria-label={BRAND} className="hidden shrink-0 py-2 md:block">
        <BrandMark />
      </Link>
      <div className="flex gap-1 md:mt-3 md:flex-col">
        {NAV.map((item) => (
          <RailLink key={item.to} item={item} active={active(item.to)} />
        ))}
      </div>
      <div className="flex gap-1 md:mt-auto md:flex-col">
        {NAV_REFERENCE.map((item) => (
          <RailLink key={item.to} item={item} active={active(item.to)} />
        ))}
        <ThemeButton />
      </div>
    </nav>
  )
}
