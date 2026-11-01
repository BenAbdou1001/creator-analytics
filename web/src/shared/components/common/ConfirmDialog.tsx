import { AlertDialog } from 'radix-ui'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

/** Destructive confirmation. With `typeToConfirm` the action stays disabled until that text is typed. */
export function ConfirmDialog({ open, title, children, action, typeToConfirm, onConfirm, onCancel }: {
  open: boolean
  title: string
  children: ReactNode
  action: string
  typeToConfirm?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const [typed, setTyped] = useState('')
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) (setTyped(''), onCancel())
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-lg">
          <AlertDialog.Title className="font-medium">{title}</AlertDialog.Title>
          <AlertDialog.Description asChild>
            <div className="mt-2 text-sm text-muted-foreground">{children}</div>
          </AlertDialog.Description>
          {typeToConfirm && (
            <label className="mt-4 grid gap-1.5 text-sm">
              <span>
                Type <span className="font-mono">{typeToConfirm}</span> to confirm
              </span>
              <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
            </label>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="ghost">Cancel</Button>
            </AlertDialog.Cancel>
            <Button
              variant="destructive"
              disabled={!!typeToConfirm && typed !== typeToConfirm}
              onClick={() => (setTyped(''), onConfirm())}
            >
              {action}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
