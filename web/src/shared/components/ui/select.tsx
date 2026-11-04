import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import { DropdownMenu, Select as SelectPrimitive } from 'radix-ui'
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

/**
 * Pick several values from one dropdown, kept in the order they were checked. The menu stays open between picks.
 * `min` and `max` bound the selection: the last checked item can't be unchecked, and unchecked items lock at `max`.
 */
export function MultiSelect({ values, onValuesChange, options, min = 0, max = Infinity, className, ...aria }: {
  values: string[]
  onValuesChange: (values: string[]) => void
  options: readonly SelectOption[]
  min?: number
  max?: number
  className?: string
  'aria-label'?: string
}) {
  const pairs = options.map((o) => (typeof o === 'string' ? ([o, o] as const) : o))
  const label = (v: string) => pairs.find(([x]) => x === v)?.[1] ?? v
  const full = values.length >= max
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          'flex h-10 w-fit min-w-48 max-w-full items-center justify-between gap-2 rounded-md border border-input bg-muted px-3 text-left text-base whitespace-nowrap outline-none md:text-sm',
          'hover:border-foreground/25 data-[state=open]:border-link',
          className,
        )}
        {...aria}
      >
        <span className="truncate">{values.map(label).join(' × ')}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className={cn(
            'z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-(--radix-dropdown-menu-trigger-width) overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          )}
        >
          {max !== Infinity && (
            <DropdownMenu.Label className="px-2 py-1.5 text-xs text-muted-foreground tabular-nums">
              {values.length} of {max} picked
            </DropdownMenu.Label>
          )}
          {pairs.map(([v, l]) => {
            const on = values.includes(v)
            return (
              <DropdownMenu.CheckboxItem
                key={v}
                checked={on}
                disabled={on ? values.length <= min : full}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={(c) => onValuesChange(c ? [...values, v] : values.filter((x) => x !== v))}
                className={cn(
                  'relative flex min-h-8 cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none',
                  'data-[highlighted]:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                )}
              >
                <span className={cn('absolute left-2 flex size-4 items-center justify-center rounded-sm border border-input', on && 'border-link bg-link text-background')}>
                  <DropdownMenu.ItemIndicator>
                    <CheckIcon className="size-3" aria-hidden="true" />
                  </DropdownMenu.ItemIndicator>
                </span>
                <span dir="auto">{l}</span>
              </DropdownMenu.CheckboxItem>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
