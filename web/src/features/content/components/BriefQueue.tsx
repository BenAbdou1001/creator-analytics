import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { PenLine } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { performanceOptions } from '../api/queries'
import { isDraft } from '../lib/what-worked'

/** The MCP prompt as Claude Code lists it. */
const PROMPT = '/mcp__creator-analytics__draft_briefs'
const SHOWN = 5

/** Posts still missing a brief, and agent drafts waiting for a look. Hidden when there's nothing to do. */
export function BriefQueue({ accountId, className }: { accountId?: number; className?: string }) {
  const { data } = useQuery(performanceOptions)
  const rows = (data ?? []).filter((r) => (accountId === undefined || r.account_id === accountId) && !isDraft(r))
  const missing = rows.filter((r) => r.brief_count === 0)
  const review = rows.filter((r) => r.needs_review === true)
  if (!missing.length && !review.length) return null

  return (
    <Card className={className}>
      <CardContent className="grid gap-3">
        <div className="flex items-start gap-3">
          <PenLine className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 text-sm">
            <h2 className="text-base font-medium">Briefs</h2>
            {missing.length > 0 && (
              <p>
                {missing.length} {missing.length === 1 ? 'post has' : 'posts have'} no brief. Let your agent draft them from the post text: run{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">{PROMPT}</code> in Claude Code, or ask it to "draft briefs for my new posts".
              </p>
            )}
            {review.length > 0 && (
              <p className="mt-1">
                {review.length} {review.length === 1 ? 'draft is' : 'drafts are'} waiting for you to check:
              </p>
            )}
          </div>
        </div>
        {review.length > 0 && (
          <ul className="grid gap-1 pl-7 text-sm">
            {review.slice(0, SHOWN).map((r) => (
              <li key={r.content_id} className="min-w-0">
                <Link to="/content/$id" params={{ id: String(r.content_id) }} dir="auto" className="block truncate text-link hover:underline">
                  {r.title ?? 'Untitled'}
                </Link>
              </li>
            ))}
            {review.length > SHOWN && <li className="text-muted-foreground">and {review.length - SHOWN} more</li>}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
