/// <reference types="vite/client" />
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useLocation } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { Rail } from '@/shared/components/common/Rail'
import { BRAND } from '@/shared/lib/brand'
import { THEME_INIT_SCRIPT } from '@/shared/lib/theme'
import appCss from '@/shared/styles/globals.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: BRAND },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
  }),
  shellComponent: RootDocument,
  component: AppLayout,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function AppLayout() {
  const { pathname } = useLocation()
  const main = useRef<HTMLElement>(null)
  const shown = useRef(pathname)
  // the panel scrolls, not the window: start each page at the top, and move keyboards and screen readers to it
  useEffect(() => {
    if (shown.current === pathname) return
    shown.current = pathname
    main.current?.scrollTo(0, 0)
    main.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <>
      <a
        href="#main"
        className="fixed top-2 left-2 z-50 -translate-y-14 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:translate-y-0"
      >
        Skip to content
      </a>
      <div className="flex h-dvh flex-col-reverse gap-2 bg-linear-to-br from-background to-[#080e2f] p-2 not-dark:to-background md:flex-row">
        <Rail />
        <main ref={main} id="main" tabIndex={-1} className="min-h-0 min-w-0 flex-1 overflow-y-auto rounded-lg bg-panel px-4 pb-8 outline-none md:px-8">
          <Outlet />
        </main>
      </div>
    </>
  )
}
