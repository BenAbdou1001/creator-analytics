import { useEffect, useState } from 'react'
import { readTheme, setTheme } from '@/shared/lib/theme'
import type { ThemeChoice } from '@/shared/lib/theme'
import { Options } from './Options'
import { NativeSelect } from '@/shared/components/ui/native-select'

export function ThemeSelect() {
  const [choice, setChoice] = useState<ThemeChoice>('system')
  useEffect(() => setChoice(readTheme()), [])
  return (
    <NativeSelect
      size="sm"
      aria-label="Theme"
      className="w-full"
      value={choice}
      onChange={(e) => {
        const next = e.target.value as ThemeChoice
        setChoice(next)
        setTheme(next)
      }}
    >
      <Options options={[['system', 'Match system'], ['light', 'Light'], ['dark', 'Dark']]} />
    </NativeSelect>
  )
}
