export function ErrorText({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <p role="alert" className="text-sm text-destructive">
      {error instanceof Error ? error.message : String(error)}
    </p>
  )
}
