import { NativeSelectOption } from '@/shared/components/ui/native-select'

/** `<option>`s from plain values or [value, label] pairs, with an optional empty "all" entry. */
export function Options({ options, placeholder }: { options: readonly (string | readonly [string, string])[]; placeholder?: string }) {
  return (
    <>
      {placeholder !== undefined && <NativeSelectOption value="">{placeholder}</NativeSelectOption>}
      {options.map((o) => {
        const [v, l] = typeof o === 'string' ? [o, o] : o
        return (
          <NativeSelectOption key={v} value={v}>
            {l}
          </NativeSelectOption>
        )
      })}
    </>
  )
}
