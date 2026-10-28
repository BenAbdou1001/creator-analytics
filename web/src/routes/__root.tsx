/// <reference types="vite/client" />
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Link, Outlet, Scripts } from '@tanstack/react-router'
import appCss from '../styles.css?url'

const NAV = [
  ['/', 'Dashboard'],
  ['/content', 'Content'],
  ['/accounts', 'Accounts'],
  ['/import', 'Import'],
  ['/metrics', 'Metric catalogue'],
  ['/data', 'Data explorer'],
] as const

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Creator Analytics' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: Shell,
  component: Layout,
  notFoundComponent: () => <p className="text-ink-3">Page not found.</p>,
})

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function Layout() {
  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-line bg-panel md:sticky md:top-0 md:h-screen md:w-56 md:shrink-0 md:border-r md:border-b-0">
        <div className="px-5 py-4 text-sm font-semibold tracking-tight">Creator Analytics</div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
          {NAV.map(([to, label]) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === '/' }}
              className="rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap text-ink-2 hover:bg-line/50"
              activeProps={{ className: 'bg-line/60 font-medium !text-ink' }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="mx-auto w-full max-w-6xl min-w-0 px-4 py-8 md:px-8">
        <Outlet />
      </main>
    </div>
  )
}
