import { useEffect, useState, type CSSProperties } from 'react'
import { repo } from '../db/repo'
import { useIsDark } from './theme'

type Props = { size?: number; style?: CSSProperties; className?: string; blob?: Blob | null }

/**
 * Logo do app. Padrão: versão escura no tema claro e versão branca no tema escuro.
 * Se o usuário trocou a logo em Config., usa a dele nos dois temas (não dá para recolorir).
 * `blob` força uma logo específica (ex.: pré-visualização antes de salvar); `null` força a padrão.
 */
export function Logo({ size = 56, style, className, blob }: Props) {
  const dark = useIsDark()
  const [custom, setCustom] = useState<Blob | undefined>()
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    if (blob !== undefined) return
    let alive = true
    repo.getSettings().then((s) => alive && setCustom(s.logo)).catch(() => {})
    return () => { alive = false }
  }, [blob])

  const chosen = blob !== undefined ? blob : custom
  useEffect(() => {
    if (!chosen) return setUrl(undefined)
    const u = URL.createObjectURL(chosen)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [chosen])

  const src = chosen && url ? url : dark ? './logo-white.png' : './logo.png'
  return <img className={className ?? 'logo'} style={{ width: size, height: size, flex: 'none', ...style }} src={src} alt="Só Retro" />
}
