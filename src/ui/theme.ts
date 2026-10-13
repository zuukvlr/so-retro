import type { Settings } from '../domain/types'

/** "auto" segue o aparelho (sem atributo); claro/escuro forçam o tema. */
export function applyTheme(theme: Settings['theme']): void {
  const el = document.documentElement
  if (theme === 'auto') el.removeAttribute('data-theme')
  else el.setAttribute('data-theme', theme)
}
