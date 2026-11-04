import { Link, useLocation } from '@tanstack/react-router'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BRAND } from '@/shared/lib/brand'
import { NAV, NAV_REFERENCE } from '@/shared/lib/nav'
import { readTheme, setTheme } from '@/shared/lib/theme'
import type { Theme } from '@/shared/lib/theme'
import { cn } from '@/shared/lib/utils'
import { BrandMark } from './BrandMark'

const ITEM = 'flex w-[72px] shrink-0 flex-col items-center gap-1 rounded-md py-2 text-xs font-medium transition-colors'

function RailLink({ item, active }: { item: (typeof NAV | typeof NAV_REFERENCE)[number]; active: boolean }) {
  return (
    <Link
      to={item.to}
      aria-current={active ? 'page' : undefined}
      className={cn(ITEM, active ? 'bg-muted text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
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
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:mt-2"
      onClick={() => {
        setTheme(next)
        set(next)
      }}
    >
      <Icon className="size-4" aria-hidden="true" />
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
      <div className="flex gap-1 md:mt-2 md:flex-col">
        {NAV.map((item) => (
          <RailLink key={item.to} item={item} active={active(item.to)} />
        ))}
      </div>
      <div className="flex gap-1 border-l pl-1 md:mt-auto md:flex-col md:border-t md:border-l-0 md:pt-2 md:pl-0">
        {NAV_REFERENCE.map((item) => (
          <RailLink key={item.to} item={item} active={active(item.to)} />
        ))}
      </div>
      <ThemeButton />
    </nav>
  )
}
