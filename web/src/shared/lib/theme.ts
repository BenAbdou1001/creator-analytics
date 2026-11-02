export type Theme = 'light' | 'dark'
const KEY = 'theme'

// Runs before paint. Dark is the product default; light is an explicit choice.
export const THEME_INIT_SCRIPT = `document.documentElement.classList.toggle('dark', localStorage.getItem('${KEY}') !== 'light')`

export const readTheme = (): Theme => (localStorage.getItem(KEY) === 'light' ? 'light' : 'dark')

export function setTheme(theme: Theme) {
  localStorage.setItem(KEY, theme)
  document.documentElement.classList.toggle('dark', theme === 'dark')
}
