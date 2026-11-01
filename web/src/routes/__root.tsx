/// <reference types="vite/client" />
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { AppSidebar } from '@/shared/components/common/AppSidebar'
import { Separator } from '@/shared/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/shared/components/ui/sidebar'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { THEME_INIT_SCRIPT } from '@/shared/lib/theme'
import appCss from '@/shared/styles/globals.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Creator Analytics' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
  component: AppLayout,
  notFoundComponent: () => <p className="text-muted-foreground">Page not found.</p>,
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
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm text-muted-foreground">Creator Analytics</span>
          </header>
          <main className="mx-auto w-full max-w-6xl min-w-0 px-4 py-8 md:px-8">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
