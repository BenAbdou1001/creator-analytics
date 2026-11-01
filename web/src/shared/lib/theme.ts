export type ThemeChoice = 'system' | 'light' | 'dark'
const KEY = 'theme'

// Runs before paint: an explicit choice wins, otherwise follow the OS colour scheme.
export const THEME_INIT_SCRIPT = `(() => {
  const m = matchMedia('(prefers-color-scheme: dark)')
  const apply = () => {
    const t = localStorage.getItem('${KEY}')
    document.documentElement.classList.toggle('dark', t ? t === 'dark' : m.matches)
  }
  window.__applyTheme = apply
  apply()
  m.addEventListener('change', apply)
})()`

export const readTheme = () => (localStorage.getItem(KEY) as ThemeChoice | null) ?? 'system'

export function setTheme(choice: ThemeChoice) {
  if (choice === 'system') localStorage.removeItem(KEY)
  else localStorage.setItem(KEY, choice)
  ;(window as unknown as { __applyTheme: () => void }).__applyTheme()
}
