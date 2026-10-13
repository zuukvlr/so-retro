import { useEffect, useState } from 'react'
import type { Settings } from '../domain/types'

/** "auto" segue o aparelho (sem atributo); claro/escuro forçam o tema. Avisa quem usa o tema (ex.: logo). */
export function applyTheme(theme: Settings['theme']): void {
  const el = document.documentElement
  if (theme === 'auto') el.removeAttribute('data-theme')
  else el.setAttribute('data-theme', theme)
  window.dispatchEvent(new Event('themechange'))
}

export function isDarkNow(): boolean {
  const t = document.documentElement.getAttribute('data-theme')
  if (t === 'dark') return true
  if (t === 'light') return false
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches === true
}

/** true quando o tema efetivo é escuro (manual ou seguindo o aparelho); reage a mudanças. */
export function useIsDark(): boolean {
  const [dark, setDark] = useState(isDarkNow)
  useEffect(() => {
    const update = () => setDark(isDarkNow())
    window.addEventListener('themechange', update)
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    mq?.addEventListener?.('change', update)
    update()
    return () => {
      window.removeEventListener('themechange', update)
      mq?.removeEventListener?.('change', update)
    }
  }, [])
  return dark
}
