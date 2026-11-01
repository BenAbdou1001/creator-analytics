import { Link, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { env } from '@/shared/lib/env'
import { ApiError } from '@/shared/types'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'

export function RoutePending() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter()
  const unreachable = error instanceof ApiError && error.status === 0
  return (
    <div className="max-w-prose" role="alert">
      <h1 className="text-2xl">{unreachable ? 'The API is not responding' : 'This page could not load'}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {unreachable ? `Nothing answered at ${env.VITE_API_URL}. Start the backend, then try again.` : error instanceof Error ? error.message : String(error)}
      </p>
      <Button className="mt-4" onClick={() => router.invalidate()}>
        Try again
      </Button>
    </div>
  )
}

export function RouteNotFound() {
  return (
    <div className="max-w-prose">
      <h1 className="text-2xl">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">Nothing lives at this address.</p>
      <Button asChild className="mt-4">
        <Link to="/">Back to Today</Link>
      </Button>
    </div>
  )
}
