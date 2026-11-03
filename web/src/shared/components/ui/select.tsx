import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import { Select as SelectPrimitive } from 'radix-ui'
import { cn } from '@/shared/lib/utils'

export type SelectOption = string | readonly [value: string, label: string]

// Radix reserves '' for "nothing picked"; a placeholder the user can pick back ("All platforms") needs a real value
const NONE = '__none__'

/**
 * The app's dropdown. `options` are plain values or [value, label] pairs. `placeholder` adds an empty choice that
 * maps to '' (filters: "All …"); with `required` it is only the prompt, so the form can't submit without a pick.
 */
export function Select({ value, onValueChange, options, placeholder, required, disabled, className, size = 'default', ...aria }: {
  value: string
  onValueChange: (value: string) => void
  options: readonly SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  size?: 'sm' | 'default'
  'aria-label'?: string
}) {
  const clearable = placeholder !== undefined && !required
  return (
    <SelectPrimitive.Root
      value={value === '' && clearable ? NONE : value}
      onValueChange={(v) => onValueChange(v === NONE ? '' : v)}
      required={required}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        data-size={size}
        className={cn(
          // filter bars share one minimum width; forms pass w-full
          'flex h-10 w-fit min-w-48 items-center justify-between gap-2 rounded-md border border-input bg-muted px-3 text-left text-base whitespace-nowrap outline-none data-[size=sm]:h-9 md:text-sm',
          'hover:border-foreground/25 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground data-[state=open]:border-link',
          'aria-invalid:border-destructive [&>span]:truncate',
          className,
        )}
        {...aria}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            'relative z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          )}
        >
          <SelectPrimitive.Viewport className="max-h-80 p-1">
            {clearable && <Item value={NONE} label={placeholder} muted />}
            {options.map((o) => {
              const [v, l] = typeof o === 'string' ? [o, o] : o
              return <Item key={v} value={v} label={l} />
            })}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

function Item({ value, label, muted }: { value: string; label: string; muted?: boolean }) {
  return (
    <SelectPrimitive.Item
      value={value}
      className={cn(
        'relative flex min-h-8 cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none',
        'data-[highlighted]:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        muted && 'text-muted-foreground',
      )}
    >
      <SelectPrimitive.ItemText>
        <span dir="auto">{label}</span>
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center">
        <CheckIcon className="size-4 text-link" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}
