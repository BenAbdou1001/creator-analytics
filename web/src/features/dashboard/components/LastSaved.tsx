import { useQuery } from '@tanstack/react-query'
import { ago } from '@/shared/lib/format'
import { overviewOptions } from '../api/queries'

export function LastSaved() {
  const { data } = useQuery(overviewOptions)
  const times = data?.flatMap((a) => (a.lastImport ? [a.lastImport.getTime()] : [])) ?? []
  if (!times.length) return null
  return <span className="text-sm text-muted-foreground">Last saved {ago(new Date(Math.max(...times)))}</span>
}
