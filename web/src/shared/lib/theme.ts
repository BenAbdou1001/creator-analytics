// Runs before paint: follow the OS colour scheme unless the page pins one with data-theme.
export const THEME_INIT_SCRIPT = `(() => {
  const m = matchMedia('(prefers-color-scheme: dark)')
  const apply = () => document.documentElement.classList.toggle('dark', m.matches)
  apply()
  m.addEventListener('change', apply)
})()`
