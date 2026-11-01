/// <reference types="vite/client" />
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useLocation } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { LastSaved } from '@/features/dashboard'
import { AppSidebar } from '@/shared/components/common/AppSidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/shared/components/ui/sidebar'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
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
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
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
  const main = useRef<HTMLDivElement>(null)
  const shown = useRef(pathname)
  // after a route change, screen readers and keyboards continue from the new page
  useEffect(() => {
    if (shown.current === pathname) return
    shown.current = pathname
    main.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <TooltipProvider>
      <a
        href="#main"
        className="fixed top-2 left-2 z-50 -translate-y-12 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:translate-y-0"
      >
        Skip to content
      </a>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 items-center justify-between gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <LastSaved />
          </header>
          <div ref={main} id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 outline-none md:px-8">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
